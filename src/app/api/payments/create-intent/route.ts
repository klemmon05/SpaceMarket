import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const DEPOSIT_AMOUNT = 500000; // $5,000 in cents

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");
    if (!requestId) return NextResponse.redirect(new URL("/app", req.url));

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/login", req.url));

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.redirect(new URL("/login", req.url));

    const request = await prisma.reservationRequest.findUnique({
      where: { id: requestId },
      include: { buyerOrg: true, payload: true },
    });

    if (!request || request.status !== "READY_FOR_DEPOSIT") {
      return NextResponse.redirect(new URL(`/app/requests/${requestId}`, req.url));
    }

    // Check user is in buyer org
    if (dbUser.role !== "ADMIN") {
      const member = await prisma.organizationMember.findFirst({
        where: { userId: dbUser.id, orgId: request.buyerOrgId },
      });
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if payment already exists
    const existing = await prisma.payment.findUnique({ where: { requestId } });
    if (existing) {
      return NextResponse.redirect(new URL(`/app/requests/${requestId}`, req.url));
    }

    // Create Stripe PaymentIntent with manual capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: DEPOSIT_AMOUNT,
      currency: "usd",
      capture_method: "manual",
      metadata: {
        requestId,
        buyerOrgId: request.buyerOrgId,
        payloadName: request.payload.name,
      },
      description: `OrbitalSlots deposit for ${request.payload.name}`,
    });

    // Store in DB
    await prisma.payment.create({
      data: {
        requestId,
        stripePaymentIntentId: paymentIntent.id,
        amount: DEPOSIT_AMOUNT,
        currency: "usd",
        status: "REQUIRES_ACTION",
      },
    });

    // Redirect to payment page with Stripe Elements
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      new URL(`/app/requests/${requestId}/payment?clientSecret=${paymentIntent.client_secret}`, appUrl)
    );
  } catch (err) {
    console.error("Create intent error:", err);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
