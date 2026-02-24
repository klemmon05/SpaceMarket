import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(["BUYER", "ADMIN"]);
  const params = await searchParams;

  const where = {
    status: "PUBLISHED" as const,
    ...(params.orbit ? { orbitRegime: { contains: String(params.orbit), mode: "insensitive" as const } } : {}),
    ...(params.vehicle ? { vehicle: { contains: String(params.vehicle), mode: "insensitive" as const } } : {}),
    ...(params.maxMass ? { maxMassKg: { gte: parseFloat(String(params.maxMass)) } } : {}),
  };

  const opportunities = await prisma.launchOpportunity.findMany({
    where,
    include: { providerOrg: true },
    orderBy: { launchWindowStart: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-white">Launch Opportunities</h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">
          {opportunities.length} published slot{opportunities.length !== 1 ? "s" : ""} available.
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="vehicle"
          defaultValue={params.vehicle as string ?? ""}
          placeholder="Vehicle (e.g. Falcon 9)"
          className="bg-[#12151B] border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder:text-[#A0A6B0] focus:outline-none focus:border-white/30 w-48"
        />
        <input
          name="orbit"
          defaultValue={params.orbit as string ?? ""}
          placeholder="Orbit regime (LEO, SSO…)"
          className="bg-[#12151B] border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder:text-[#A0A6B0] focus:outline-none focus:border-white/30 w-48"
        />
        <input
          name="maxMass"
          type="number"
          defaultValue={params.maxMass as string ?? ""}
          placeholder="Min capacity (kg)"
          className="bg-[#12151B] border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder:text-[#A0A6B0] focus:outline-none focus:border-white/30 w-40"
        />
        <button
          type="submit"
          className="bg-white text-black rounded px-4 py-1.5 text-xs font-medium hover:bg-white/90 transition-colors"
        >
          Filter
        </button>
        {(params.vehicle || params.orbit || params.maxMass) && (
          <Link href="/app/opportunities" className="text-xs text-[#A0A6B0] hover:text-white self-center">
            Clear
          </Link>
        )}
      </form>

      {/* Results */}
      {opportunities.length === 0 ? (
        <EmptyState message="No launch opportunities match your filters." />
      ) : (
        <div className="space-y-2">
          {opportunities.map((opp) => (
            <Link
              key={opp.id}
              href={`/app/opportunities/${opp.id}`}
              className="block rounded border border-white/10 bg-[#161A22] p-5 hover:bg-[#1a1f2a] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-white">{opp.missionName}</span>
                    <StatusBadge status={opp.status} />
                  </div>
                  <p className="text-xs text-[#A0A6B0]">
                    {opp.vehicle} · {opp.launchSite} · {opp.orbitRegime}
                    {opp.altitudeKm ? ` ${opp.altitudeKm}km` : ""}
                    {opp.inclinationDeg ? ` ${opp.inclinationDeg}°` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#A0A6B0]">
                    {opp.launchWindowStart.toLocaleDateString()} – {opp.launchWindowEnd.toLocaleDateString()}
                  </p>
                  {opp.priceGuidanceUsd && (
                    <p className="text-xs text-white mt-0.5">
                      From ${opp.priceGuidanceUsd.toLocaleString()}
                    </p>
                  )}
                  {opp.maxMassKg && (
                    <p className="text-xs text-[#A0A6B0]">Max {opp.maxMassKg}kg</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
