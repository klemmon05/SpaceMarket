import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { revalidatePath } from "next/cache";

export default async function ProviderRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["PROVIDER", "ADMIN"]);
  const org = await getUserOrg(user.id);
  const { id } = await params;

  const request = await prisma.reservationRequest.findUnique({
    where: { id },
    include: {
      payload: true,
      opportunity: true,
      buyerOrg: true,
      thread: {
        include: {
          messages: {
            include: { sender: true },
            orderBy: { createdAt: "asc" },
            where: { visibility: { in: ["ALL", "ADMIN_PROVIDER"] } },
          },
        },
      },
    },
  });

  if (!request) notFound();
  if (user.role === "PROVIDER" && org && request.opportunity && request.opportunity.providerOrgId !== org.id) notFound();

  async function sendMessage(formData: FormData) {
    "use server";
    const u = await requireRole(["PROVIDER", "ADMIN"]);
    const body = String(formData.get("body"));
    if (!body.trim()) return;
    let thread = await prisma.messageThread.findUnique({ where: { requestId: id } });
    if (!thread) {
      thread = await prisma.messageThread.create({ data: { requestId: id } });
    }
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderUserId: u.id,
        body,
        visibility: "ADMIN_PROVIDER",
      },
    });
    revalidatePath(`/provider/requests/${id}`);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/provider/requests" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">← Requests</Link>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="text-xl font-medium text-white">{request.payload.name}</h1>
            <p className="text-sm text-[#A0A6B0] mt-0.5">{request.buyerOrg.name}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="rounded border border-white/10 overflow-hidden">
        <div className="bg-[#161A22] px-4 py-2 border-b border-white/10">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Payload Specification</p>
        </div>
        <div className="divide-y divide-white/5">
          {[
            ["Payload Name", request.payload.name],
            ["Mass (kg)", String(request.payload.massKg)],
            ["Volume (U)", request.payload.volumeU ? String(request.payload.volumeU) : "—"],
            ["Dimensions", request.payload.dimsCm ?? "—"],
            ["Power (W)", request.payload.powerW ? String(request.payload.powerW) : "—"],
            ["Desired Orbit", request.payload.desiredOrbit ?? "—"],
            ["Target Window", request.payload.targetLaunchWindow ?? "—"],
            ["Constraints", request.payload.specialConstraints ?? "—"],
            ["Opportunity", request.opportunity?.missionName ?? "TBD"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center px-4 py-2.5 bg-[#0B0D10]">
              <span className="w-40 text-xs text-[#A0A6B0] shrink-0">{label}</span>
              <span className="text-sm text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {request.notes && (
        <div className="rounded border border-white/10 bg-[#161A22] p-4">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest mb-2">Notes from Buyer</p>
          <p className="text-sm text-white">{request.notes}</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-white">Internal Messages (Provider ↔ Admin)</h2>
        <div className="space-y-2">
          {(request.thread?.messages ?? []).length === 0 ? (
            <p className="text-sm text-[#A0A6B0]">No messages yet.</p>
          ) : (
            request.thread!.messages.map((m) => (
              <div key={m.id} className="rounded border border-white/10 bg-[#161A22] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-white">{m.sender.name ?? m.sender.email}</span>
                  <span className="text-xs text-[#A0A6B0]">{m.createdAt.toLocaleString()}</span>
                </div>
                <p className="text-sm text-[#A0A6B0]">{m.body}</p>
              </div>
            ))
          )}
        </div>
        <form action={sendMessage} className="space-y-2">
          <Textarea
            name="body"
            placeholder="Message to admin..."
            rows={3}
            className="bg-[#12151B] border-white/10 text-white resize-none placeholder:text-[#A0A6B0]"
          />
          <Button type="submit" variant="outline" className="border-white/10 text-white hover:bg-white/5 text-xs">
            Send Message
          </Button>
        </form>
      </div>
    </div>
  );
}
