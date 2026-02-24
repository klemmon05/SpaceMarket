import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        orgMembers: {
          include: { org: true }
        }
      }
    });

    return dbUser;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/");
  }
  return user;
}

export async function getUserOrg(userId: string) {
  const member = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { org: true }
  });
  return member?.org ?? null;
}
