import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["PROVIDER", "ADMIN"]);
  const org = await getUserOrg(user.id);
  const { id } = await params;

  const opp = await prisma.launchOpportunity.findUnique({
    where: { id },
    include: { providerOrg: true, _count: { select: { requests: true } } },
  });

  if (!opp) notFound();
  if (user.role === "PROVIDER" && org && opp.providerOrgId !== org.id) notFound();

  async function updateOpportunity(formData: FormData) {
    "use server";
    const u = await requireRole(["PROVIDER", "ADMIN"]);
    const o = await getUserOrg(u.id);
    const current = await prisma.launchOpportunity.findUnique({ where: { id } });
    if (!current) return;
    if (u.role === "PROVIDER" && o && current.providerOrgId !== o.id) return;

    const action = formData.get("action") as string;
    let status = current.status;
    if (action === "publish") status = "PUBLISHED";
    else if (action === "pause") status = "PAUSED";
    else if (action === "draft") status = "DRAFT";

    await prisma.launchOpportunity.update({
      where: { id },
      data: {
        vehicle: String(formData.get("vehicle")),
        missionName: String(formData.get("missionName")),
        launchSite: String(formData.get("launchSite")),
        launchWindowStart: new Date(String(formData.get("launchWindowStart"))),
        launchWindowEnd: new Date(String(formData.get("launchWindowEnd"))),
        orbitRegime: String(formData.get("orbitRegime")),
        altitudeKm: formData.get("altitudeKm") ? parseFloat(String(formData.get("altitudeKm"))) : null,
        inclinationDeg: formData.get("inclinationDeg") ? parseFloat(String(formData.get("inclinationDeg"))) : null,
        dispenserType: formData.get("dispenserType") ? String(formData.get("dispenserType")) : null,
        maxMassKg: formData.get("maxMassKg") ? parseFloat(String(formData.get("maxMassKg"))) : null,
        maxVolume: formData.get("maxVolume") ? parseFloat(String(formData.get("maxVolume"))) : null,
        priceGuidanceUsd: formData.get("priceGuidanceUsd") ? parseFloat(String(formData.get("priceGuidanceUsd"))) : null,
        capacityRemaining: Math.max(1, parseInt(String(formData.get("capacityRemaining") || "1")) || 1),
        itarNotes: formData.get("itarNotes") ? String(formData.get("itarNotes")) : null,
        status,
      },
    });
    revalidatePath("/provider/opportunities");
    redirect("/provider/opportunities");
  }

  const windowStart = opp.launchWindowStart.toISOString().slice(0, 10);
  const windowEnd = opp.launchWindowEnd.toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/provider/opportunities" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">← Opportunities</Link>
        <div className="flex items-center justify-between mt-3">
          <h1 className="text-xl font-medium text-white">{opp.missionName}</h1>
          <StatusBadge status={opp.status} />
        </div>
        <p className="text-sm text-[#A0A6B0] mt-0.5">{opp._count.requests} inbound request{opp._count.requests !== 1 ? "s" : ""}</p>
      </div>

      <form action={updateOpportunity} className="space-y-5">
        <div className="rounded border border-white/10 bg-[#161A22] p-6 space-y-5">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Mission Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="missionName" className="text-xs text-[#A0A6B0]">Mission Name *</Label>
              <Input id="missionName" name="missionName" defaultValue={opp.missionName} required className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle" className="text-xs text-[#A0A6B0]">Vehicle *</Label>
              <Input id="vehicle" name="vehicle" defaultValue={opp.vehicle} required className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="launchSite" className="text-xs text-[#A0A6B0]">Launch Site *</Label>
              <Input id="launchSite" name="launchSite" defaultValue={opp.launchSite} required className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orbitRegime" className="text-xs text-[#A0A6B0]">Orbit Regime *</Label>
              <Input id="orbitRegime" name="orbitRegime" defaultValue={opp.orbitRegime} required className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="launchWindowStart" className="text-xs text-[#A0A6B0]">Window Start *</Label>
              <Input id="launchWindowStart" name="launchWindowStart" type="date" defaultValue={windowStart} required className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="launchWindowEnd" className="text-xs text-[#A0A6B0]">Window End *</Label>
              <Input id="launchWindowEnd" name="launchWindowEnd" type="date" defaultValue={windowEnd} required className="bg-[#12151B] border-white/10 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded border border-white/10 bg-[#161A22] p-6 space-y-5">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Orbit & Capacity</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="altitudeKm" className="text-xs text-[#A0A6B0]">Altitude (km)</Label>
              <Input id="altitudeKm" name="altitudeKm" type="number" defaultValue={opp.altitudeKm ?? ""} className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inclinationDeg" className="text-xs text-[#A0A6B0]">Inclination (°)</Label>
              <Input id="inclinationDeg" name="inclinationDeg" type="number" step="0.1" defaultValue={opp.inclinationDeg ?? ""} className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dispenserType" className="text-xs text-[#A0A6B0]">Dispenser Type</Label>
              <Input id="dispenserType" name="dispenserType" defaultValue={opp.dispenserType ?? ""} className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxMassKg" className="text-xs text-[#A0A6B0]">Max Mass (kg)</Label>
              <Input id="maxMassKg" name="maxMassKg" type="number" step="0.1" defaultValue={opp.maxMassKg ?? ""} className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxVolume" className="text-xs text-[#A0A6B0]">Max Volume (U)</Label>
              <Input id="maxVolume" name="maxVolume" type="number" step="0.5" defaultValue={opp.maxVolume ?? ""} className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacityRemaining" className="text-xs text-[#A0A6B0]">Slots Available</Label>
              <Input id="capacityRemaining" name="capacityRemaining" type="number" defaultValue={opp.capacityRemaining} className="bg-[#12151B] border-white/10 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="priceGuidanceUsd" className="text-xs text-[#A0A6B0]">Price Guidance (USD)</Label>
              <Input id="priceGuidanceUsd" name="priceGuidanceUsd" type="number" step="100" defaultValue={opp.priceGuidanceUsd ?? ""} className="bg-[#12151B] border-white/10 text-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="itarNotes" className="text-xs text-[#A0A6B0]">ITAR / Export Notes</Label>
            <Textarea id="itarNotes" name="itarNotes" defaultValue={opp.itarNotes ?? ""} rows={3} className="bg-[#12151B] border-white/10 text-white resize-none" />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {opp.status !== "PUBLISHED" && (
            <button type="submit" name="action" value="publish"
              className="bg-white text-black rounded px-4 py-2 text-sm font-medium hover:bg-white/90 transition-colors">
              Save &amp; Publish
            </button>
          )}
          {opp.status === "PUBLISHED" && (
            <button type="submit" name="action" value="pause"
              className="bg-white text-black rounded px-4 py-2 text-sm font-medium hover:bg-white/90 transition-colors">
              Save &amp; Pause
            </button>
          )}
          <button type="submit" name="action" value="draft"
            className="border border-white/10 text-white rounded px-4 py-2 text-sm hover:bg-white/5 transition-colors">
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}
