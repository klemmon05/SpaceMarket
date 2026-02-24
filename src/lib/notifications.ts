import { prisma } from "@/lib/prisma";

interface NotifyOptions {
  title: string;
  body: string;
  link?: string;
  requestId?: string;
}

export async function notifyUser(userId: string, opts: NotifyOptions) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: opts.title,
        body: opts.body,
        link: opts.link,
        requestId: opts.requestId,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

export async function notifyOrgMembers(orgId: string, opts: NotifyOptions) {
  try {
    const members = await prisma.organizationMember.findMany({
      where: { orgId },
      select: { userId: true },
    });
    await Promise.all(members.map((m) => notifyUser(m.userId, opts)));
  } catch (err) {
    console.error("Failed to notify org members:", err);
  }
}
