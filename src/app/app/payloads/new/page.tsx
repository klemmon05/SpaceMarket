import { redirect } from "next/navigation";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

async function createPayload(formData: FormData) {
  "use server";
  const user = await requireRole(["BUYER", "ADMIN"]);
  const org = await getUserOrg(user.id);
  if (!org) throw new Error("No organization found");

  await prisma.payload.create({
    data: {
      orgId: org.id,
      name: String(formData.get("name")),
      massKg: parseFloat(String(formData.get("massKg"))),
      volumeU: formData.get("volumeU") ? parseFloat(String(formData.get("volumeU"))) : null,
      dimsCm: formData.get("dimsCm") ? String(formData.get("dimsCm")) : null,
      powerW: formData.get("powerW") ? parseFloat(String(formData.get("powerW"))) : null,
      dataHandling: formData.get("dataHandling") ? String(formData.get("dataHandling")) : null,
      desiredOrbit: formData.get("desiredOrbit") ? String(formData.get("desiredOrbit")) : null,
      targetLaunchWindow: formData.get("targetLaunchWindow") ? String(formData.get("targetLaunchWindow")) : null,
      specialConstraints: formData.get("specialConstraints") ? String(formData.get("specialConstraints")) : null,
      notes: formData.get("notes") ? String(formData.get("notes")) : null,
    },
  });
  revalidatePath("/app/payloads");
  redirect("/app/payloads");
}

export default async function NewPayloadPage() {
  await requireRole(["BUYER", "ADMIN"]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <a href="/app/payloads" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">
          ← Payloads
        </a>
        <h1 className="mt-3 text-xl font-medium text-white">New Payload</h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">Define your payload specifications.</p>
      </div>

      <form action={createPayload} className="space-y-5">
        <div className="rounded border border-white/10 bg-[#161A22] p-6 space-y-5">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Basic Information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name" className="text-xs text-[#A0A6B0]">Payload Name *</Label>
              <Input id="name" name="name" required className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="massKg" className="text-xs text-[#A0A6B0]">Mass (kg) *</Label>
              <Input id="massKg" name="massKg" type="number" step="0.1" required className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="volumeU" className="text-xs text-[#A0A6B0]">Volume (U)</Label>
              <Input id="volumeU" name="volumeU" type="number" step="0.5" className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dimsCm" className="text-xs text-[#A0A6B0]">Dimensions (cm)</Label>
              <Input id="dimsCm" name="dimsCm" placeholder="10x10x20" className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="powerW" className="text-xs text-[#A0A6B0]">Power (W)</Label>
              <Input id="powerW" name="powerW" type="number" step="0.1" className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desiredOrbit" className="text-xs text-[#A0A6B0]">Desired Orbit</Label>
              <Input id="desiredOrbit" name="desiredOrbit" placeholder="LEO, SSO, GTO..." className="bg-[#12151B] border-white/10 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetLaunchWindow" className="text-xs text-[#A0A6B0]">Target Launch Window</Label>
              <Input id="targetLaunchWindow" name="targetLaunchWindow" placeholder="Q3 2025" className="bg-[#12151B] border-white/10 text-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataHandling" className="text-xs text-[#A0A6B0]">Data Handling Notes</Label>
            <Input id="dataHandling" name="dataHandling" className="bg-[#12151B] border-white/10 text-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="specialConstraints" className="text-xs text-[#A0A6B0]">Special Constraints</Label>
            <Textarea id="specialConstraints" name="specialConstraints" rows={3} className="bg-[#12151B] border-white/10 text-white resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs text-[#A0A6B0]">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} className="bg-[#12151B] border-white/10 text-white resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="bg-white text-black hover:bg-white/90 text-sm font-medium">
            Save Payload
          </Button>
          <a href="/app/payloads">
            <Button type="button" variant="outline" className="border-white/10 text-white hover:bg-white/5 text-sm">
              Cancel
            </Button>
          </a>
        </div>
      </form>
    </div>
  );
}
