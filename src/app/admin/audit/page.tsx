import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const take = 50;
  const skip = (page - 1) * take;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.auditLog.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-white">Audit Log</h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">{total} entries.</p>
      </div>

      <div className="rounded border border-white/10 overflow-hidden">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-white/10 bg-[#161A22]">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#A0A6B0] font-sans">Time</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#A0A6B0] font-sans">Actor</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#A0A6B0] font-sans">Action</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#A0A6B0] font-sans">Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[#A0A6B0] font-sans">No audit entries.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-[#A0A6B0] text-xs">{log.createdAt.toISOString().replace("T", " ").slice(0, 19)}</td>
                  <td className="px-4 py-2.5 text-[#A0A6B0] text-xs">{log.actor?.name ?? log.actor?.email ?? "system"}</td>
                  <td className="px-4 py-2.5 text-white text-xs">{log.action}</td>
                  <td className="px-4 py-2.5 text-[#A0A6B0] text-xs">{log.entityType} {log.entityId.slice(0, 8)}&hellip;</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > take && (
        <div className="flex items-center justify-between text-xs text-[#A0A6B0]">
          <span>Page {page} of {Math.ceil(total / take)}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/admin/audit?page=${page - 1}`} className="hover:text-white transition-colors">← Previous</a>
            )}
            {page < Math.ceil(total / take) && (
              <a href={`/admin/audit?page=${page + 1}`} className="hover:text-white transition-colors">Next →</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
