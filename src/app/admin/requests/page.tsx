import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";

const ALL_STATUSES = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "MATCHED", "READY_FOR_DEPOSIT",
  "DEPOSIT_AUTHORIZED", "RESERVED", "LAUNCHED", "COMPLETED", "CANCELLED",
] as const;

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;

  const where = params.status ? { status: params.status as (typeof ALL_STATUSES)[number] } : {};

  const requests = await prisma.reservationRequest.findMany({
    where,
    include: {
      payload: true,
      opportunity: true,
      buyerOrg: true,
      payment: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-white">All Requests</h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">{requests.length} result{requests.length !== 1 ? "s" : ""}.</p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/requests"
          className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${!params.status ? "border-white text-black bg-white" : "border-white/10 text-[#A0A6B0] hover:text-white hover:border-white/30"}`}
        >
          All
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/requests?status=${s}`}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${params.status === s ? "border-white text-black bg-white" : "border-white/10 text-[#A0A6B0] hover:text-white hover:border-white/30"}`}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <div className="rounded border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-[#161A22]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Payload</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Buyer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Opportunity</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Updated</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#A0A6B0]">
                  No requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white">
                    <Link href={`/admin/requests/${r.id}`} className="hover:underline">{r.payload.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{r.buyerOrg.name}</td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{r.opportunity?.missionName ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{r.priority}</td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{r.updatedAt.toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
