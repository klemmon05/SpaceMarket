import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const user = await requireRole(["BUYER", "ADMIN"]);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  async function markAllRead() {
    "use server";
    const u = await requireRole(["BUYER", "ADMIN"]);
    await prisma.notification.updateMany({
      where: { userId: u.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/app/notifications");
  }

  async function markRead(formData: FormData) {
    "use server";
    const u = await requireRole(["BUYER", "ADMIN"]);
    const notifId = String(formData.get("id"));
    await prisma.notification.updateMany({
      where: { id: notifId, userId: u.id },
      data: { readAt: new Date() },
    });
    revalidatePath("/app/notifications");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Notifications</h1>
          <p className="mt-1 text-sm text-[#A0A6B0]">
            {notifications.filter(n => !n.readAt).length} unread.
          </p>
        </div>
        {notifications.some(n => !n.readAt) && (
          <form action={markAllRead}>
            <button type="submit" className="text-xs text-[#A0A6B0] hover:text-white transition-colors">
              Mark all read
            </button>
          </form>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={24} className="mx-auto text-[#A0A6B0] mb-3" />
            <p className="text-sm text-[#A0A6B0]">No notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded border p-4 transition-colors ${
                !n.readAt ? "border-white/20 bg-[#161A22]" : "border-white/5 bg-[#0B0D10] opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.readAt ? "text-white font-medium" : "text-[#A0A6B0]"}`}>{n.title}</p>
                  <p className="text-xs text-[#A0A6B0] mt-0.5">{n.body}</p>
                  <p className="text-xs text-[#A0A6B0] mt-1">{n.createdAt.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {n.link && (
                    <Link href={n.link} className="text-xs text-white hover:underline">View →</Link>
                  )}
                  {!n.readAt && (
                    <form action={markRead}>
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="text-[10px] text-[#A0A6B0] hover:text-white transition-colors">Dismiss</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
