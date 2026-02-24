"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({ requestId }: { requestId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/app/requests/${requestId}?deposit=authorized`,
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-white text-black hover:bg-white/90 text-sm font-medium"
      >
        {loading ? "Processing..." : "Authorize $5,000 Deposit"}
      </Button>
    </form>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const requestId = params.id as string;
  const clientSecret = searchParams.get("clientSecret");

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-[#A0A6B0]">Payment session expired or invalid.</p>
          <Link href={`/app/requests/${requestId}`}>
            <Button variant="outline" className="border-white/10 text-white text-sm">← Back to Request</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="text-xs font-medium tracking-widest text-[#A0A6B0] uppercase">
            ORBITALSLOTS
          </Link>
          <h1 className="mt-4 text-xl font-medium text-white">Authorize Deposit</h1>
          <p className="mt-1 text-sm text-[#A0A6B0]">
            Refundable deposit authorization — $5,000 USD. Your card will not be charged until your slot is confirmed.
          </p>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorBackground: "#12151B",
                colorText: "#FFFFFF",
                colorTextSecondary: "#A0A6B0",
                colorPrimary: "#FFFFFF",
                borderRadius: "4px",
              },
            },
          }}
        >
          <PaymentForm requestId={requestId} />
        </Elements>

        <p className="mt-4 text-xs text-[#A0A6B0] text-center">
          Powered by Stripe. Your payment info is secured end-to-end.
        </p>
      </div>
    </div>
  );
}
