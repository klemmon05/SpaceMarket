import { redirect } from "next/navigation";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

async function createOpportunity(formData: FormData) {
  "use server";
  const user = await requireRole(["PROVIDER", "ADMIN"]);
  const org = await getUserOrg(user.id);
  if (!org) throw new Error("No org");

  const status = formData.get("action") === "publish" ? "PUBLISHED" : "DRAFT";

  await prisma.launchOpportunity.create({
    data: {
      providerOrgId: org.id,
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
      capacityRemaining: formData.get("capacityRemaining") ? parseInt(String(formData.get("capacityRemaining"))) : 1,
      itarNotes: formData.get("itarNotes") ? String(formData.get("itarNotes")) : null,
      status,
    },
  });
  revalidatePath("/provider/opportunities");
  redirect("/provider/opportunities");
}

export default async function NewOpportunityPage() {
  await requireRole(["PROVIDER", "ADMIN"]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <a href="/provider/opportunities" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">← Opportunities</a>
        <h1 className="mt-3 text-xl font-medium text-white">New Launch Opportunity</h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">Configure a launch slot for rideshare customers.</p>
      </div>

      <form action={createOpportunity} className="space-y-5">
        <div className="rounded border border-white/10 bg-[#161A22] p-6 space-y-5">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Mission Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="missionName" className="text-xs text-[#A0A6B0]">Mission Name *</Label>
              <Input id="missionName" name="missionName" required className="bg-[#12151B] border-white/10 text-white" placeholder="Transporter-15" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle" className="text-xs text-[#A0A6B0]">Vehicle *</Label>
              <Input id="vehicle" name="vehicle" required className="bg-[#12151B] border-white/10 text-white" placeholder="Falcon 9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="launchSite" className="text-xs text-[#A0A6B0]">Launch Site *</Label>
              <Input id="launchSite" name="launchSite" required className="bg-[#12151B] border-white/10 text-white" placeholder="SLC-40, Cape Canaveral" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orbitRegime" className="text-xs text-[#A0A6B0]">Orbit Regime *</Label>
              <Input id="orbitRegime" name="orbitRegime" required className="bg-[#12151B] border-white/10 text-white" placeholder="LEO, SSO, GTO..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="launchWindowStart" className="text-xs text-[#A0A6B0]">Window Start *</Label>
              <Input id="launchWindowStart" name="launchWindowStart" type="date" required className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="launchWindowEnd" className="text-xs text-[#A0A6B0]">Window End *</Label>
              <Input id="launchWindowEnd" name="launchWindowEnd" type="date" required className="bg-[#12151B] border-white/10 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded border border-white/10 bg-[#161A22] p-6 space-y-5">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Orbit Parameters</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="altitudeKm" className="text-xs text-[#A0A6B0]">Altitude (km)</Label>
              <Input id="altitudeKm" name="altitudeKm" type="number" step="1" className="bg-[#12151B] border-white/10 text-white" placeholder="550" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inclinationDeg" className="text-xs text-[#A0A6B0]">Inclination (°)</Label>
              <Input id="inclinationDeg" name="inclinationDeg" type="number" step="0.1" className="bg-[#12151B] border-white/10 text-white" placeholder="97.6" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dispenserType" className="text-xs text-[#A0A6B0]">Dispenser Type</Label>
              <Input id="dispenserType" name="dispenserType" className="bg-[#12151B] border-white/10 text-white" placeholder="ESPA, 6U, 12U..." />
            </div>
          </div>
        </div>

        <div className="rounded border border-white/10 bg-[#161A22] p-6 space-y-5">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Payload Capacity</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="maxMassKg" className="text-xs text-[#A0A6B0]">Max Mass (kg)</Label>
              <Input id="maxMassKg" name="maxMassKg" type="number" step="0.1" className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxVolume" className="text-xs text-[#A0A6B0]">Max Volume (U)</Label>
              <Input id="maxVolume" name="maxVolume" type="number" step="0.5" className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacityRemaining" className="text-xs text-[#A0A6B0]">Slots Available</Label>
              <Input id="capacityRemaining" name="capacityRemaining" type="number" defaultValue="1" className="bg-[#12151B] border-white/10 text-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priceGuidanceUsd" className="text-xs text-[#A0A6B0]">Price Guidance (USD)</Label>
            <Input id="priceGuidanceUsd" name="priceGuidanceUsd" type="number" step="100" className="bg-[#12151B] border-white/10 text-white" placeholder="Leave blank to contact for pricing" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="itarNotes" className="text-xs text-[#A0A6B0]">ITAR / Export Notes</Label>
            <Textarea id="itarNotes" name="itarNotes" rows={3} className="bg-[#12151B] border-white/10 text-white resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            name="action"
            value="publish"
            className="bg-white text-black rounded px-4 py-2 text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Publish
          </button>
          <button
            type="submit"
            name="action"
            value="draft"
            className="border border-white/10 text-white rounded px-4 py-2 text-sm hover:bg-white/5 transition-colors"
          >
            Save Draft
          </button>
          <a href="/provider/opportunities">
            <button type="button" className="text-[#A0A6B0] px-4 py-2 text-sm hover:text-white transition-colors">
              Cancel
            </button>
          </a>
        </div>
      </form>
    </div>
  );
}
