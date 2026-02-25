import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";

export default async function AdminDashboardPage() {
  await requireRole(["ADMIN"]);

  const [
    newRequests,
    underReview,
    awaitingDeposit,
    active,
    recentlyClosed,
    totalOpps,
  ] = await Promise.all([
    prisma.reservationRequest.findMany({
      where: { status: "SUBMITTED" },
      include: { payload: true, buyerOrg: true, opportunity: true },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    prisma.reservationRequest.findMany({
      where: { status: "UNDER_REVIEW" },
      include: { payload: true, buyerOrg: true, opportunity: true },
      orderBy: { updatedAt: "asc" },
      take: 10,
    }),
    prisma.reservationRequest.findMany({
      where: { status: { in: ["READY_FOR_DEPOSIT", "DEPOSIT_AUTHORIZED"] } },
      include: { payload: true, buyerOrg: true, opportunity: true, payment: true },
      orderBy: { updatedAt: "asc" },
      take: 10,
    }),
    prisma.reservationRequest.findMany({
      where: { status: "RESERVED" },
      include: { payload: true, buyerOrg: true, opportunity: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.reservationRequest.findMany({
      where: { status: { in: ["COMPLETED", "CANCELLED"] } },
      include: { payload: true, buyerOrg: true, opportunity: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.launchOpportunity.count({ where: { status: "PUBLISHED" } }),
  ]);

  const RequestTable = ({
    requests,
  }: {
    requests: typeof newRequests;
    showPayment?: boolean;
  }) => (
    <div className="rounded border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-[#161A22]">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[#A0A6B0]">Payload</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[#A0A6B0]">Buyer</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[#A0A6B0]">Opportunity</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[#A0A6B0]">Status</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[#A0A6B0]">Updated</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="px-4 py-2.5 text-white">
                <Link href={`/admin/requests/${r.id}`} className="hover:underline">{r.payload.name}</Link>
              </td>
              <td className="px-4 py-2.5 text-[#A0A6B0] text-xs">{r.buyerOrg.name}</td>
              <td className="px-4 py-2.5 text-[#A0A6B0] text-xs">{r.opportunity?.missionName ?? "—"}</td>
              <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-2.5 text-[#A0A6B0] text-xs">{r.updatedAt.toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Section = ({ title, count, children, href }: { title: string; count: number; children: React.ReactNode; href: string }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-white">{title}</h2>
          {count > 0 && (
            <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-white font-medium">{count}</span>
          )}
        </div>
        <Link href={href} className="text-xs text-[#A0A6B0] hover:text-white transition-colors">View all →</Link>
      </div>
      {count === 0 ? (
        <p className="text-sm text-[#A0A6B0] py-4">No active requests in this category.</p>
      ) : (
        children
      )}
    </div>
  );

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-xl font-medium text-white">Mission Control</h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">Triage, match, and resolve reservation requests.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "New", value: newRequests.length, urgent: newRequests.length > 0 },
          { label: "Under Review", value: underReview.length, urgent: false },
          { label: "Awaiting Deposit", value: awaitingDeposit.length, urgent: awaitingDeposit.length > 0 },
          { label: "Reserved", value: active.length, urgent: false },
          { label: "Published Opps", value: totalOpps, urgent: false },
        ].map((s) => (
          <div key={s.label} className={`rounded border p-4 ${s.urgent ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-[#161A22]"}`}>
            <p className="text-xs text-[#A0A6B0] mb-1">{s.label}</p>
            <p className={`text-2xl font-medium ${s.urgent ? "text-amber-300" : "text-white"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Section title="New Requests" count={newRequests.length} href="/admin/requests?status=SUBMITTED">
        <RequestTable requests={newRequests} />
      </Section>

      <Section title="Under Review" count={underReview.length} href="/admin/requests?status=UNDER_REVIEW">
        <RequestTable requests={underReview} />
      </Section>

      <Section title="Awaiting Deposit" count={awaitingDeposit.length} href="/admin/requests?status=READY_FOR_DEPOSIT">
        <RequestTable requests={awaitingDeposit} showPayment />
      </Section>

      <Section title="Reserved" count={active.length} href="/admin/requests?status=RESERVED">
        <RequestTable requests={active} />
      </Section>

      <Section title="Recently Closed" count={recentlyClosed.length} href="/admin/requests?status=COMPLETED">
        <RequestTable requests={recentlyClosed} />
      </Section>
    </div>
  );
}
