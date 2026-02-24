import Link from "next/link";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default async function ProviderOpportunitiesPage() {
  const user = await requireRole(["PROVIDER", "ADMIN"]);
  const org = await getUserOrg(user.id);

  const opportunities = org ? await prisma.launchOpportunity.findMany({
    where: user.role === "ADMIN" ? {} : { providerOrgId: org.id },
    include: {
      providerOrg: true,
      _count: { select: { requests: true } },
    },
    orderBy: { launchWindowStart: "asc" },
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Launch Opportunities</h1>
          <p className="mt-1 text-sm text-[#A0A6B0]">{opportunities.length} total.</p>
        </div>
        <Link href="/provider/opportunities/new">
          <Button className="bg-white text-black hover:bg-white/90 text-xs">Add Opportunity</Button>
        </Link>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState message="No opportunities yet." />
      ) : (
        <div className="rounded border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#161A22]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Mission</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Launch Site</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Window Start</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Orbit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Requests</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">
                    <Link href={`/provider/opportunities/${o.id}`} className="hover:underline">{o.missionName}</Link>
                  </td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{o.vehicle}</td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{o.launchSite}</td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{o.launchWindowStart.toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{o.orbitRegime}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{o._count.requests}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/provider/opportunities/${o.id}`} className="text-xs text-[#A0A6B0] hover:text-white">Edit →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
