import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { revalidatePath } from "next/cache";
import { notifyOrgMembers } from "@/lib/notifications";

const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["MATCHED", "READY_FOR_DEPOSIT", "CANCELLED"],
  MATCHED: ["READY_FOR_DEPOSIT", "UNDER_REVIEW", "CANCELLED"],
  READY_FOR_DEPOSIT: ["DEPOSIT_AUTHORIZED", "RESERVED", "CANCELLED"],
  DEPOSIT_AUTHORIZED: ["RESERVED", "CANCELLED"],
  RESERVED: ["LAUNCHED", "CANCELLED"],
  LAUNCHED: ["COMPLETED"],
};

export default async function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const adminUser = await requireRole(["ADMIN"]);
  const { id } = await params;

  const request = await prisma.reservationRequest.findUnique({
    where: { id },
    include: {
      payload: true,
      opportunity: { include: { providerOrg: true } },
      buyerOrg: true,
      match: { include: { opportunity: true } },
      thread: {
        include: {
          messages: {
            include: { sender: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      adminNotes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      followUps: { include: { author: true }, orderBy: { createdAt: "desc" } },
      payment: true,
    },
  });

  if (!request) notFound();

  const opportunities = await prisma.launchOpportunity.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { launchWindowStart: "asc" },
  });

  // Server actions
  async function updateStatus(formData: FormData) {
    "use server";
    const u = await requireRole(["ADMIN"]);
    const newStatus = String(formData.get("newStatus"));
    const r = await prisma.reservationRequest.findUnique({ where: { id } });
    if (!r) return;

    const before = { status: r.status };
    await prisma.reservationRequest.update({ where: { id }, data: { status: newStatus as never } });
    await prisma.auditLog.create({
      data: {
        actorUserId: u.id,
        action: "UPDATE_STATUS",
        entityType: "ReservationRequest",
        entityId: id,
        before,
        after: { status: newStatus },
      },
    });

    await notifyOrgMembers(r.buyerOrgId, {
      title: `Request status updated`,
      body: `Your reservation request status changed to ${newStatus.replace(/_/g, " ")}.`,
      link: `/app/requests/${id}`,
      requestId: id,
    });

    revalidatePath(`/admin/requests/${id}`);
  }

  async function assignOpportunity(formData: FormData) {
    "use server";
    const u = await requireRole(["ADMIN"]);
    const opportunityId = String(formData.get("opportunityId"));

    await prisma.$transaction(async (tx) => {
      await tx.reservationRequest.update({
        where: { id },
        data: { opportunityId, status: "MATCHED" },
      });

      const existing = await tx.match.findUnique({ where: { requestId: id } });
      if (existing) {
        await tx.match.update({
          where: { requestId: id },
          data: { opportunityId, matchedByAdminId: u.id, matchedAt: new Date() },
        });
      } else {
        await tx.match.create({
          data: {
            requestId: id,
            opportunityId,
            matchedByAdminId: u.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: u.id,
          action: "MATCH_REQUEST",
          entityType: "ReservationRequest",
          entityId: id,
          after: { opportunityId, status: "MATCHED" },
        },
      });
    });

    const r = await prisma.reservationRequest.findUnique({ where: { id } });
    if (r) {
      await notifyOrgMembers(r.buyerOrgId, {
        title: "Request matched",
        body: "Your reservation request has been matched to a launch opportunity.",
        link: `/app/requests/${id}`,
        requestId: id,
      });
    }

    revalidatePath(`/admin/requests/${id}`);
  }

  async function addNote(formData: FormData) {
    "use server";
    const u = await requireRole(["ADMIN"]);
    const body = String(formData.get("body"));
    if (!body.trim()) return;
    await prisma.adminNote.create({
      data: { requestId: id, authorUserId: u.id, body },
    });
    revalidatePath(`/admin/requests/${id}`);
  }

  async function addFollowUp(formData: FormData) {
    "use server";
    const u = await requireRole(["ADMIN"]);
    await prisma.followUp.create({
      data: {
        requestId: id,
        authorUserId: u.id,
        method: formData.get("method") ? String(formData.get("method")) : null,
        contacted: formData.get("contacted") ? String(formData.get("contacted")) : null,
        notes: formData.get("notes") ? String(formData.get("notes")) : null,
      },
    });
    revalidatePath(`/admin/requests/${id}`);
  }

  async function markFollowUpDone(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const followUpId = String(formData.get("followUpId"));
    await prisma.followUp.update({
      where: { id: followUpId },
      data: { done: true, doneAt: new Date() },
    });
    revalidatePath(`/admin/requests/${id}`);
  }

  async function sendMessage(formData: FormData) {
    "use server";
    const u = await requireRole(["ADMIN"]);
    const body = String(formData.get("body"));
    const visibility = String(formData.get("visibility") || "ALL") as "ALL" | "ADMIN_PROVIDER" | "ADMIN_ONLY";
    if (!body.trim()) return;
    let thread = await prisma.messageThread.findUnique({ where: { requestId: id } });
    if (!thread) {
      thread = await prisma.messageThread.create({ data: { requestId: id } });
    }
    await prisma.message.create({
      data: { threadId: thread.id, senderUserId: u.id, body, visibility },
    });
    revalidatePath(`/admin/requests/${id}`);
  }

  async function setDepositReady() {
    "use server";
    const u = await requireRole(["ADMIN"]);
    await prisma.reservationRequest.update({
      where: { id },
      data: { status: "READY_FOR_DEPOSIT" },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: u.id,
        action: "SET_READY_FOR_DEPOSIT",
        entityType: "ReservationRequest",
        entityId: id,
      },
    });
    const r = await prisma.reservationRequest.findUnique({ where: { id } });
    if (r) {
      await notifyOrgMembers(r.buyerOrgId, {
        title: "Deposit authorization required",
        body: "Your reservation request is ready for deposit. Please authorize the deposit to secure your slot.",
        link: `/app/requests/${id}/authorize-deposit`,
        requestId: id,
      });
    }
    revalidatePath(`/admin/requests/${id}`);
  }

  const transitions = VALID_TRANSITIONS[request.status] ?? [];

  // suppress unused variable warning - adminUser used for auth side-effect
  void adminUser;

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin/requests" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">← All Requests</Link>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="text-xl font-medium text-white">{request.payload.name}</h1>
            <p className="text-sm text-[#A0A6B0] mt-0.5">{request.buyerOrg.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={request.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status actions */}
          {transitions.length > 0 && (
            <div className="rounded border border-white/10 bg-[#161A22] p-4 space-y-3">
              <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Status Actions</p>
              <div className="flex flex-wrap gap-2">
                {transitions.map((t) => (
                  <form key={t} action={updateStatus}>
                    <input type="hidden" name="newStatus" value={t} />
                    <button
                      type="submit"
                      className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                        t === "CANCELLED"
                          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      → {t.replace(/_/g, " ")}
                    </button>
                  </form>
                ))}
                {request.status === "MATCHED" && (
                  <form action={setDepositReady}>
                    <button type="submit" className="px-3 py-1.5 rounded text-xs font-medium border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">
                      Mark Ready for Deposit
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Match to opportunity */}
          {["SUBMITTED", "UNDER_REVIEW", "MATCHED"].includes(request.status) && (
            <div className="rounded border border-white/10 bg-[#161A22] p-4 space-y-3">
              <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Match to Opportunity</p>
              <form action={assignOpportunity} className="flex gap-2">
                <select
                  name="opportunityId"
                  className="flex-1 bg-[#12151B] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                  defaultValue={request.opportunityId ?? ""}
                >
                  <option value="">Select opportunity...</option>
                  {opportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.missionName} — {o.vehicle} ({o.launchWindowStart.toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-white text-black rounded px-3 py-2 text-xs font-medium hover:bg-white/90 transition-colors shrink-0"
                >
                  Assign
                </button>
              </form>
            </div>
          )}

          {/* Payment */}
          {request.payment && (
            <div className="rounded border border-white/10 bg-[#161A22] p-4 space-y-2">
              <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Payment</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">${(request.payment.amount / 100).toLocaleString()} {request.payment.currency.toUpperCase()}</span>
                <StatusBadge status={request.payment.status} />
              </div>
              <p className="text-xs text-[#A0A6B0]">Intent: {request.payment.stripePaymentIntentId}</p>
              {request.payment.status === "AUTHORIZED" && (
                <div className="flex gap-2 pt-2">
                  <Link href={`/api/payments/capture?requestId=${id}`}>
                    <button className="px-3 py-1.5 rounded text-xs font-medium bg-white text-black hover:bg-white/90 transition-colors">Capture</button>
                  </Link>
                  <Link href={`/api/payments/void?requestId=${id}`}>
                    <button className="px-3 py-1.5 rounded text-xs font-medium border border-white/20 text-white hover:bg-white/5 transition-colors">Void</button>
                  </Link>
                </div>
              )}
              {request.payment.status === "CAPTURED" && (
                <div className="pt-2">
                  <Link href={`/api/payments/refund?requestId=${id}`}>
                    <button className="px-3 py-1.5 rounded text-xs font-medium border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">Refund</button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Payload spec */}
          <div className="rounded border border-white/10 overflow-hidden">
            <div className="bg-[#161A22] px-4 py-2 border-b border-white/10">
              <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Payload Specification</p>
            </div>
            <div className="divide-y divide-white/5">
              {[
                ["Payload", request.payload.name],
                ["Mass", `${request.payload.massKg} kg`],
                ["Volume", request.payload.volumeU ? `${request.payload.volumeU} U` : "—"],
                ["Dimensions", request.payload.dimsCm ?? "—"],
                ["Power", request.payload.powerW ? `${request.payload.powerW} W` : "—"],
                ["Desired Orbit", request.payload.desiredOrbit ?? "—"],
                ["Target Window", request.payload.targetLaunchWindow ?? "—"],
                ["Constraints", request.payload.specialConstraints ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center px-4 py-2.5 bg-[#0B0D10]">
                  <span className="w-36 text-xs text-[#A0A6B0] shrink-0">{label}</span>
                  <span className="text-sm text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunity details */}
          {request.opportunity && (
            <div className="rounded border border-white/10 overflow-hidden">
              <div className="bg-[#161A22] px-4 py-2 border-b border-white/10">
                <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Assigned Opportunity</p>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  ["Mission", request.opportunity.missionName],
                  ["Vehicle", request.opportunity.vehicle],
                  ["Launch Site", request.opportunity.launchSite],
                  ["Window", `${request.opportunity.launchWindowStart.toLocaleDateString()} – ${request.opportunity.launchWindowEnd.toLocaleDateString()}`],
                  ["Orbit", request.opportunity.orbitRegime],
                  ["Provider", request.opportunity.providerOrg?.name ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center px-4 py-2.5 bg-[#0B0D10]">
                    <span className="w-36 text-xs text-[#A0A6B0] shrink-0">{label}</span>
                    <span className="text-sm text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-white">Messages</h2>
            <div className="space-y-2">
              {(request.thread?.messages ?? []).length === 0 ? (
                <p className="text-sm text-[#A0A6B0]">No messages.</p>
              ) : (
                request.thread!.messages.map((m) => (
                  <div key={m.id} className={`rounded border p-3 ${m.visibility === "ADMIN_ONLY" ? "border-amber-500/20 bg-amber-500/5" : "border-white/10 bg-[#161A22]"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white">{m.sender.name ?? m.sender.email}</span>
                      <div className="flex items-center gap-2">
                        {m.visibility !== "ALL" && (
                          <span className="text-[10px] text-[#A0A6B0] uppercase tracking-wider">{m.visibility}</span>
                        )}
                        <span className="text-xs text-[#A0A6B0]">{m.createdAt.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#A0A6B0]">{m.body}</p>
                  </div>
                ))
              )}
            </div>
            <form action={sendMessage} className="space-y-2">
              <Textarea
                name="body"
                placeholder="Message..."
                rows={3}
                className="bg-[#12151B] border-white/10 text-white resize-none placeholder:text-[#A0A6B0]"
              />
              <div className="flex items-center gap-2">
                <select
                  name="visibility"
                  className="bg-[#12151B] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All parties</option>
                  <option value="ADMIN_PROVIDER">Admin + Provider</option>
                  <option value="ADMIN_ONLY">Admin only</option>
                </select>
                <Button type="submit" variant="outline" className="border-white/10 text-white hover:bg-white/5 text-xs h-7">
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Admin notes */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-white">Admin Notes</h2>
            <div className="space-y-2">
              {request.adminNotes.map((n) => (
                <div key={n.id} className="rounded border border-white/10 bg-[#161A22] p-3">
                  <p className="text-xs text-[#A0A6B0] mb-1">{n.author.name ?? n.author.email} · {n.createdAt.toLocaleDateString()}</p>
                  <p className="text-sm text-white">{n.body}</p>
                </div>
              ))}
            </div>
            <form action={addNote} className="space-y-2">
              <Textarea
                name="body"
                placeholder="Add internal note..."
                rows={2}
                className="bg-[#12151B] border-white/10 text-white resize-none placeholder:text-[#A0A6B0] text-sm"
              />
              <Button type="submit" variant="outline" className="border-white/10 text-white hover:bg-white/5 text-xs h-7 w-full">
                Add Note
              </Button>
            </form>
          </div>

          {/* Follow-ups */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-white">Follow-ups</h2>
            <div className="space-y-2">
              {request.followUps.map((f) => (
                <div key={f.id} className={`rounded border p-3 ${f.done ? "border-white/5 opacity-60" : "border-white/10 bg-[#161A22]"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#A0A6B0]">
                        {f.method && <span>{f.method}</span>}
                        {f.contacted && <span> · {f.contacted}</span>}
                        {" · "}{f.createdAt.toLocaleDateString()}
                      </p>
                      {f.notes && <p className="text-sm text-white mt-1">{f.notes}</p>}
                    </div>
                    {!f.done && (
                      <form action={markFollowUpDone}>
                        <input type="hidden" name="followUpId" value={f.id} />
                        <button type="submit" className="text-[10px] text-[#A0A6B0] hover:text-white transition-colors">Done</button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form action={addFollowUp} className="space-y-2">
              <Input name="method" placeholder="Method (call, email...)" className="bg-[#12151B] border-white/10 text-white text-xs h-7 placeholder:text-[#A0A6B0]" />
              <Input name="contacted" placeholder="Contacted (name/email)" className="bg-[#12151B] border-white/10 text-white text-xs h-7 placeholder:text-[#A0A6B0]" />
              <Textarea name="notes" placeholder="Notes..." rows={2} className="bg-[#12151B] border-white/10 text-white resize-none text-sm placeholder:text-[#A0A6B0]" />
              <Button type="submit" variant="outline" className="border-white/10 text-white hover:bg-white/5 text-xs h-7 w-full">
                Log Follow-up
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
