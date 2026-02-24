import Link from "next/link";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default async function ProviderHomePage() {
  const user = await requireRole(["PROVIDER", "ADMIN"]);
  const org = await getUserOrg(user.id);

  const opportunities = org ? await prisma.launchOpportunity.findMany({
    where: { providerOrgId: org.id },
    include: { _count: { select: { requests: true } } },
    orderBy: { launchWindowStart: "asc" },
    take: 5,
  }) : [];

  const stats = org ? await Promise.all([
    prisma.launchOpportunity.count({ where: { providerOrgId: org.id, status: "PUBLISHED" } }),
    prisma.launchOpportunity.count({ where: { providerOrgId: org.id } }),
    prisma.reservationRequest.count({ where: { opportunity: { providerOrgId: org.id } } }),
    prisma.reservationRequest.count({ where: { opportunity: { providerOrgId: org.id }, status: "RESERVED" } }),
  ]) : [0, 0, 0, 0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-white">
          Provider Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">
          {org ? org.name : "Set up your provider profile."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Published Slots", value: stats[0] },
          { label: "Total Opportunities", value: stats[1] },
          { label: "Inbound Requests", value: stats[2] },
          { label: "Reserved", value: stats[3] },
        ].map((s) => (
          <div key={s.label} className="rounded border border-white/10 bg-[#161A22] p-4">
            <p className="text-xs text-[#A0A6B0] mb-1">{s.label}</p>
            <p className="text-2xl font-medium text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/provider/opportunities/new">
          <Button className="bg-white text-black hover:bg-white/90 text-xs">
            Add Opportunity
          </Button>
        </Link>
        <Link href="/provider/requests">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 text-xs">
            View Requests
          </Button>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white">Your Opportunities</h2>
          <Link href="/provider/opportunities" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">
            View all →
          </Link>
        </div>
        {opportunities.length === 0 ? (
          <EmptyState message="No opportunities yet. Create your first launch slot." />
        ) : (
          <div className="rounded border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#161A22]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Mission</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Window</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Requests</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white">
                      <Link href={`/provider/opportunities/${o.id}`} className="hover:underline">
                        {o.missionName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#A0A6B0]">{o.vehicle}</td>
                    <td className="px-4 py-3 text-[#A0A6B0] text-xs">{o.launchWindowStart.toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-[#A0A6B0]">{o._count.requests}</td>
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
