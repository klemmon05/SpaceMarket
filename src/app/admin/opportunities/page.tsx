import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export default async function AdminOpportunitiesPage() {
  await requireRole(["ADMIN"]);

  const opportunities = await prisma.launchOpportunity.findMany({
    include: {
      providerOrg: true,
      _count: { select: { requests: true } },
    },
    orderBy: { launchWindowStart: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">All Opportunities</h1>
          <p className="mt-1 text-sm text-[#A0A6B0]">{opportunities.length} total.</p>
        </div>
        <Link href="/admin/import">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 text-xs">
            JSON Import
          </Button>
        </Link>
      </div>

      <div className="rounded border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-[#161A22]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Mission</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Vehicle</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Provider</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Window</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Orbit</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Requests</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#A0A6B0]">No opportunities.</td></tr>
            ) : (
              opportunities.map((o) => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{o.missionName}</td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{o.vehicle}</td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{o.providerOrg.name}</td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{o.launchWindowStart.toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{o.orbitRegime}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{o._count.requests}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
