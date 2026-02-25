import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { revalidatePath } from "next/cache";

export default async function AdminProvidersPage() {
  await requireRole(["ADMIN"]);

  const providers = await prisma.organization.findMany({
    where: { type: "PROVIDER" },
    include: {
      providerProfile: true,
      _count: { select: { opportunities: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  async function updateVerification(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const orgId = String(formData.get("orgId"));
    const status = String(formData.get("status"));
    await prisma.providerProfile.update({
      where: { orgId },
      data: { verificationStatus: status },
    });
    revalidatePath("/admin/providers");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-white">Providers</h1>
        <p className="mt-1 text-sm text-[#A0A6B0]">{providers.length} registered.</p>
      </div>

      <div className="space-y-2">
        {providers.length === 0 ? (
          <p className="text-sm text-[#A0A6B0] py-8 text-center">No providers registered.</p>
        ) : (
          providers.map((p) => (
            <div key={p.id} className="rounded border border-white/10 bg-[#161A22] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-[#A0A6B0] mt-0.5">
                    {p._count.opportunities} opportunit{p._count.opportunities !== 1 ? "ies" : "y"}
                    {p.providerProfile?.pointOfContact && ` · ${p.providerProfile.pointOfContact}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.providerProfile?.verificationStatus ?? "PENDING"} />
                  <form action={updateVerification} className="flex gap-1">
                    <input type="hidden" name="orgId" value={p.id} />
                    {["PENDING", "VERIFIED"].map((s) => (
                      <button
                        key={s}
                        type="submit"
                        name="status"
                        value={s}
                        className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                          p.providerProfile?.verificationStatus === s
                            ? "border-white bg-white text-black"
                            : "border-white/10 text-[#A0A6B0] hover:text-white hover:border-white/30"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
