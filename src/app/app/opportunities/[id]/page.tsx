import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["BUYER", "ADMIN"]);
  const { id } = await params;

  const opp = await prisma.launchOpportunity.findUnique({
    where: { id },
    include: { providerOrg: true },
  });

  if (!opp) notFound();

  const specs = [
    { label: "Vehicle", value: opp.vehicle },
    { label: "Mission Name", value: opp.missionName },
    { label: "Launch Site", value: opp.launchSite },
    { label: "Launch Window", value: `${opp.launchWindowStart.toLocaleDateString()} – ${opp.launchWindowEnd.toLocaleDateString()}` },
    { label: "Orbit Regime", value: opp.orbitRegime },
    { label: "Target Altitude", value: opp.altitudeKm ? `${opp.altitudeKm} km` : "—" },
    { label: "Inclination", value: opp.inclinationDeg ? `${opp.inclinationDeg}°` : "—" },
    { label: "Dispenser Type", value: opp.dispenserType ?? "—" },
    { label: "Max Payload Mass", value: opp.maxMassKg ? `${opp.maxMassKg} kg` : "—" },
    { label: "Max Volume", value: opp.maxVolume ? `${opp.maxVolume} U` : "—" },
    { label: "Price Guidance", value: opp.priceGuidanceUsd ? `$${opp.priceGuidanceUsd.toLocaleString()}` : "Contact for pricing" },
    { label: "Capacity Remaining", value: String(opp.capacityRemaining) },
    { label: "Provider", value: opp.providerOrg.name },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/app/opportunities" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">
          ← Opportunities
        </Link>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="text-xl font-medium text-white">{opp.missionName}</h1>
            <p className="text-sm text-[#A0A6B0] mt-0.5">{opp.vehicle} · {opp.launchSite}</p>
          </div>
          <StatusBadge status={opp.status} />
        </div>
      </div>

      {/* Spec sheet */}
      <div className="rounded border border-white/10 overflow-hidden">
        <div className="bg-[#161A22] px-4 py-2 border-b border-white/10">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Mission Specifications</p>
        </div>
        <div className="divide-y divide-white/5">
          {specs.map(({ label, value }) => (
            <div key={label} className="flex items-center px-4 py-3 bg-[#0B0D10]">
              <span className="w-48 text-xs text-[#A0A6B0] shrink-0">{label}</span>
              <span className="text-sm text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {opp.itarNotes && (
        <div className="rounded border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">ITAR / Export Notes</p>
          <p className="text-sm text-[#A0A6B0]">{opp.itarNotes}</p>
        </div>
      )}

      {opp.status === "PUBLISHED" && opp.capacityRemaining > 0 && (
        <div className="flex gap-3">
          <Link href={`/app/requests/new?opportunityId=${opp.id}`}>
            <Button className="bg-white text-black hover:bg-white/90 text-sm font-medium">
              Submit Reservation Request
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
