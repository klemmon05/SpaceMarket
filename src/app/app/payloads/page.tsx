import Link from "next/link";
import { requireRole, getUserOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default async function PayloadsPage() {
  const user = await requireRole(["BUYER", "ADMIN"]);
  const org = await getUserOrg(user.id);

  const payloads = org ? await prisma.payload.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Payloads</h1>
          <p className="mt-1 text-sm text-[#A0A6B0]">Manage your payload profiles.</p>
        </div>
        <Link href="/app/payloads/new">
          <Button className="bg-white text-black hover:bg-white/90 text-xs">
            Add Payload
          </Button>
        </Link>
      </div>

      {payloads.length === 0 ? (
        <EmptyState
          message="No payload profiles yet. Add your first payload to submit reservation requests."
          action={
            <Link href="/app/payloads/new">
              <Button className="bg-white text-black hover:bg-white/90 text-xs">Add Payload</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#161A22]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Mass (kg)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Volume (U)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Orbit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#A0A6B0]">Added</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payloads.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{p.massKg}</td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{p.volumeU ?? "—"}</td>
                  <td className="px-4 py-3 text-[#A0A6B0]">{p.desiredOrbit ?? "—"}</td>
                  <td className="px-4 py-3 text-[#A0A6B0] text-xs">{p.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/app/payloads/${p.id}`} className="text-xs text-[#A0A6B0] hover:text-white transition-colors">
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
