import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");
    if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payment = await prisma.payment.findUnique({ where: { requestId } });
    if (!payment || payment.status !== "CAPTURED") {
      return NextResponse.json({ error: "Payment not in CAPTURED state" }, { status: 400 });
    }

    await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
    await prisma.payment.update({
      where: { requestId },
      data: { status: "REFUNDED" },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: dbUser.id,
        action: "REFUND_PAYMENT",
        entityType: "Payment",
        entityId: payment.id,
        after: { status: "REFUNDED" },
      },
    });

    return NextResponse.redirect(new URL(`/admin/requests/${requestId}`, req.url));
  } catch (err) {
    console.error("Refund error:", err);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
