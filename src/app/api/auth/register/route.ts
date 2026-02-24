import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["BUYER", "PROVIDER"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role } = registerSchema.parse(body);

    // Get supabase user to verify auth
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Create user + org in a transaction
    const supabaseId = supabaseUser?.id ?? `dev_${email}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          supabaseId,
          email,
          name,
          role,
        },
      });

      const orgType = role === "PROVIDER" ? "PROVIDER" : "BUYER";
      const org = await tx.organization.create({
        data: {
          name: `${name}'s Organization`,
          type: orgType,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId: user.id,
          orgId: org.id,
          roleInOrg: "OWNER",
        },
      });

      if (role === "PROVIDER") {
        await tx.providerProfile.create({
          data: {
            orgId: org.id,
          },
        });
      } else {
        await tx.buyerProfile.create({
          data: {
            orgId: org.id,
          },
        });
      }

      return { user, org };
    });

    return NextResponse.json({ success: true, userId: result.user.id });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
