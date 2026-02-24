import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { prisma } from "@/lib/prisma";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["PROVIDER", "ADMIN"]).catch(() => null);
  if (!user) redirect("/login");

  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null }
  });

  return (
    <div className="min-h-screen bg-[#0B0D10]">
      <Nav role="PROVIDER" userName={user.name ?? user.email} unreadCount={unread} />
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
