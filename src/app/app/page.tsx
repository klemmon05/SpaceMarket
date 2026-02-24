import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserOrg } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function BuyerHomePage() {
  const user = await requireRole(["BUYER", "ADMIN"]);
  const org = await getUserOrg(user.id);

  const requests = org ? await prisma.reservationRequest.findMany({
    where: { buyerOrgId: org.id },
    include: { payload: true, opportunity: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  }) : [];

  const opportunities = await prisma.launchOpportunity.count({
    where: { status: "PUBLISHED" }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-white">
          Welcome back{user.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">
          {org ? org.name : "Set up your organization to get started."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Requests", value: requests.filter(r => !["DRAFT","COMPLETED","CANCELLED"].includes(r.status)).length },
          { label: "Open Opportunities", value: opportunities },
          { label: "Payloads", value: org ? "—" : 0 },
          { label: "Reserved Slots", value: requests.filter(r => r.status === "RESERVED").length },
        ].map((stat) => (
          <div key={stat.label} className="rounded border border-white/10 bg-[#161A22] p-4">
            <p className="text-xs text-[#A0A6B0] mb-1">{stat.label}</p>
            <p className="text-2xl font-medium text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/app/opportunities">
          <Button className="bg-white text-black hover:bg-white/90 text-xs">
            Browse Opportunities
          </Button>
        </Link>
        <Link href="/app/payloads/new">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 text-xs">
            Add Payload
          </Button>
        </Link>
      </div>

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white">Recent Requests</h2>
          <Link href="/app/requests" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">
            View all →
          </Link>
        </div>
        {requests.length === 0 ? (
          <EmptyState message="No reservation requests yet." />
        ) : (
          <div className="rounded border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Payload</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Opportunity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Updated</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white">
                      <Link href={`/app/requests/${r.id}`} className="hover:underline">{r.payload.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-[#A0A6B0]">{r.opportunity?.missionName ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-[#A0A6B0] text-xs">{r.updatedAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
