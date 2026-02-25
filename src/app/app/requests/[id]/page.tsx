import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { revalidatePath } from "next/cache";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["BUYER", "ADMIN"]);
  const org = await getUserOrg(user.id);
  const { id } = await params;

  const request = await prisma.reservationRequest.findUnique({
    where: { id },
    include: {
      payload: true,
      opportunity: true,
      buyerOrg: true,
      match: { include: { opportunity: true } },
      thread: { include: { messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } } },
      adminNotes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      payment: true,
    },
  });

  if (!request) notFound();
  if (user.role === "BUYER" && org && request.buyerOrgId !== org.id) notFound();

  async function sendMessage(formData: FormData) {
    "use server";
    const u = await requireRole(["BUYER", "ADMIN"]);
    const body = String(formData.get("body"));
    if (!body.trim()) return;

    let thread = await prisma.messageThread.findUnique({ where: { requestId: id } });
    if (!thread) {
      thread = await prisma.messageThread.create({ data: { requestId: id } });
    }
    await prisma.message.create({
      data: { threadId: thread.id, senderUserId: u.id, body, visibility: "ALL" },
    });
    revalidatePath(`/app/requests/${id}`);
  }

  const statusSteps = [
    "DRAFT", "SUBMITTED", "UNDER_REVIEW", "MATCHED",
    "READY_FOR_DEPOSIT", "DEPOSIT_AUTHORIZED", "RESERVED", "COMPLETED"
  ];
  const currentStep = statusSteps.indexOf(request.status);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/app/requests" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">
          ← Requests
        </Link>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="text-xl font-medium text-white">
              {request.payload.name}
            </h1>
            <p className="text-sm text-[#A0A6B0] mt-0.5">
              {request.opportunity?.missionName ?? "No opportunity assigned yet"}
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* Status timeline */}
      {request.status !== "CANCELLED" && (
        <div className="flex items-center gap-1">
          {statusSteps.map((step, i) => (
            <div key={step} className="flex items-center gap-1 flex-1">
              <div className={`h-0.5 flex-1 ${i === 0 ? "hidden" : i <= currentStep ? "bg-white" : "bg-white/20"}`} />
              <div className={`w-2 h-2 rounded-full shrink-0 ${i <= currentStep ? "bg-white" : "bg-white/20"}`} />
            </div>
          ))}
        </div>
      )}

      {/* Deposit step */}
      {request.status === "READY_FOR_DEPOSIT" && !request.payment && (
        <div className="rounded border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-sm font-medium text-amber-300 mb-1">Deposit Authorization Required</p>
          <p className="text-sm text-[#A0A6B0] mb-4">
            Your slot has been reserved pending a refundable deposit authorization.
            This authorizes but does not charge your card.
          </p>
          <Link href={`/app/requests/${id}/authorize-deposit`}>
            <Button className="bg-white text-black hover:bg-white/90 text-sm">
              Authorize Deposit →
            </Button>
          </Link>
        </div>
      )}

      {request.payment && (
        <div className="rounded border border-white/10 bg-[#161A22] p-4">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest mb-2">Payment</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">
              ${(request.payment.amount / 100).toLocaleString()} {request.payment.currency.toUpperCase()}
            </span>
            <StatusBadge status={request.payment.status} />
          </div>
        </div>
      )}

      {/* Payload spec */}
      <div className="rounded border border-white/10 overflow-hidden">
        <div className="bg-[#161A22] px-4 py-2 border-b border-white/10">
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Payload Specification</p>
        </div>
        <div className="divide-y divide-white/5">
          {[
            ["Name", request.payload.name],
            ["Mass", `${request.payload.massKg} kg`],
            ["Volume", request.payload.volumeU ? `${request.payload.volumeU} U` : "—"],
            ["Dimensions", request.payload.dimsCm ?? "—"],
            ["Power", request.payload.powerW ? `${request.payload.powerW} W` : "—"],
            ["Desired Orbit", request.payload.desiredOrbit ?? "—"],
            ["Target Window", request.payload.targetLaunchWindow ?? "—"],
            ["Constraints", request.payload.specialConstraints ?? "—"],
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
          <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest mb-2">Notes</p>
          <p className="text-sm text-white">{request.notes}</p>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-white">Messages</h2>
        <div className="space-y-2">
          {(request.thread?.messages ?? []).length === 0 ? (
            <p className="text-sm text-[#A0A6B0]">No messages yet.</p>
          ) : (
            request.thread!.messages
              .filter(m => m.visibility === "ALL" || user.role === "ADMIN")
              .map((m) => (
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
            placeholder="Write a message..."
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
