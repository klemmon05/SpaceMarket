import Link from "next/link";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default async function RequestsPage() {
  const user = await requireRole(["BUYER", "ADMIN"]);
  const org = await getUserOrg(user.id);

  const requests = org ? await prisma.reservationRequest.findMany({
    where: user.role === "ADMIN" ? {} : { buyerOrgId: org.id },
    include: {
      payload: true,
      opportunity: true,
      buyerOrg: true,
    },
    orderBy: { updatedAt: "desc" },
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Reservation Requests</h1>
          <p className="mt-1 text-sm text-[#A0A6B0]">{requests.length} request{requests.length !== 1 ? "s" : ""}.</p>
        </div>
        <Link href="/app/requests/new">
          <Button className="bg-white text-black hover:bg-white/90 text-xs">New Request</Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState message="No reservation requests." />
      ) : (
        <div className="rounded border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#161A22]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Payload</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Opportunity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Updated</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/app/requests/${r.id}`} className="text-white hover:underline">
                      {r.payload.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{r.opportunity?.missionName ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{r.priority}</td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{r.updatedAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
