import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function AuthorizeDepositPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["BUYER", "ADMIN"]);
  const org = await getUserOrg(user.id);
  const { id } = await params;

  const request = await prisma.reservationRequest.findUnique({
    where: { id },
    include: { payload: true, opportunity: true, payment: true },
  });

  if (!request) notFound();
  if (user.role === "BUYER" && org && request.buyerOrgId !== org.id) notFound();
  if (request.status !== "READY_FOR_DEPOSIT") {
    return (
      <div className="max-w-lg space-y-6">
        <p className="text-sm text-[#A0A6B0]">This request is not ready for deposit authorization.</p>
        <Link href={`/app/requests/${id}`}>
          <Button variant="outline" className="border-white/10 text-white text-sm">← Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link href={`/app/requests/${id}`} className="text-xs text-[#A0A6B0] hover:text-white transition-colors">← Back to Request</Link>
        <h1 className="mt-3 text-xl font-medium text-white">Authorize Deposit</h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">
          Authorizing a deposit holds the amount on your card without charging it.
          Once your reservation is confirmed, the deposit will be captured.
          If cancelled, the authorization will be voided.
        </p>
      </div>

      <div className="rounded border border-white/10 bg-[#161A22] p-5 space-y-3">
        <p className="text-xs font-medium text-[#A0A6B0] uppercase tracking-widest">Deposit Summary</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#A0A6B0]">Payload</span>
          <span className="text-sm text-white">{request.payload.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#A0A6B0]">Mission</span>
          <span className="text-sm text-white">{request.opportunity?.missionName ?? "TBD"}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-sm text-[#A0A6B0]">Deposit Amount</span>
          <span className="text-base font-medium text-white">$5,000.00</span>
        </div>
        <p className="text-xs text-[#A0A6B0]">
          This is a refundable authorization only. Your card will not be charged until your slot is confirmed.
        </p>
      </div>

      {/* Wired to Stripe in Phase 4 */}
      <Link href={`/api/payments/create-intent?requestId=${id}`}>
        <Button className="w-full bg-white text-black hover:bg-white/90 text-sm font-medium">
          Proceed to Payment →
        </Button>
      </Link>
    </div>
  );
}
