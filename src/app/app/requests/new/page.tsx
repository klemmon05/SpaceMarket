import { redirect } from "next/navigation";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notifyUser } from "@/lib/notifications";

async function submitRequest(formData: FormData) {
  "use server";
  const user = await requireRole(["BUYER", "ADMIN"]);
  const org = await getUserOrg(user.id);
  if (!org) throw new Error("No organization found");

  const payloadId = String(formData.get("payloadId"));
  const opportunityId = formData.get("opportunityId") ? String(formData.get("opportunityId")) : undefined;
  const notes = formData.get("notes") ? String(formData.get("notes")) : null;
  const status = formData.get("action") === "submit" ? "SUBMITTED" : "DRAFT";

  const request = await prisma.reservationRequest.create({
    data: {
      buyerOrgId: org.id,
      payloadId,
      opportunityId: opportunityId || null,
      notes,
      status,
    },
  });

  if (status === "SUBMITTED") {
    await notifyUser(user.id, {
      title: "Request submitted",
      body: "Your reservation request has been submitted and is under review.",
      link: `/app/requests/${request.id}`,
      requestId: request.id,
    });
  }

  revalidatePath("/app/requests");
  redirect(`/app/requests/${request.id}`);
}

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string }>;
}) {
  const user = await requireRole(["BUYER", "ADMIN"]);
  const org = await getUserOrg(user.id);
  const params = await searchParams;

  const payloads = org ? await prisma.payload.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
  }) : [];

  const opportunity = params.opportunityId
    ? await prisma.launchOpportunity.findUnique({ where: { id: params.opportunityId } })
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <a href="/app/requests" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">← Requests</a>
        <h1 className="mt-3 text-xl font-medium text-white">New Reservation Request</h1>
        {opportunity && (
          <p className="mt-1 text-sm text-[#A0A6B0]">
            For: {opportunity.missionName} ({opportunity.vehicle})
          </p>
        )}
      </div>

      {payloads.length === 0 ? (
        <div className="rounded border border-white/10 bg-[#161A22] p-6">
          <p className="text-sm text-[#A0A6B0]">
            You need to create a payload profile before submitting a reservation request.
          </p>
          <a href="/app/payloads/new" className="mt-3 inline-block text-xs text-white hover:underline">
            Create payload →
          </a>
        </div>
      ) : (
        <form action={submitRequest} className="space-y-5">
          {params.opportunityId && (
            <input type="hidden" name="opportunityId" value={params.opportunityId} />
          )}

          <div className="rounded border border-white/10 bg-[#161A22] p-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="payloadId" className="text-xs text-[#A0A6B0]">Select Payload *</Label>
              <select
                id="payloadId"
                name="payloadId"
                required
                className="w-full bg-[#12151B] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="">Select a payload...</option>
                {payloads.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.massKg}kg)
                  </option>
                ))}
              </select>
            </div>

            {!params.opportunityId && (
              <div className="space-y-1.5">
                <Label htmlFor="opportunityId" className="text-xs text-[#A0A6B0]">
                  Opportunity (optional — admin can match later)
                </Label>
                <a href="/app/opportunities" className="block text-xs text-[#A0A6B0] hover:text-white transition-colors mt-1">
                  Browse opportunities →
                </a>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs text-[#A0A6B0]">Notes / Requirements</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Describe any special requirements, constraints, or questions..."
                className="bg-[#12151B] border-white/10 text-white resize-none placeholder:text-[#A0A6B0]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              name="action"
              value="submit"
              className="bg-white text-black rounded px-4 py-2 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Submit Request
            </button>
            <button
              type="submit"
              name="action"
              value="draft"
              className="border border-white/10 text-white rounded px-4 py-2 text-sm hover:bg-white/5 transition-colors"
            >
              Save as Draft
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
