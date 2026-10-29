"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buyerSignIn, pricingIntent } from "@/lib/buyer/context";
import { track } from "@vercel/analytics";

type CheckoutPlan = "starter";

type CheckoutButtonProps = {
  plan: CheckoutPlan;
  label: string;
  email?: string;
  source?: string;
  goal?: string;
  listing?: string;
  className?: string;
  fallbackHref?: string;
  fallbackLabel?: string;
};

// Optional measurement must never block identity, checkout creation or redirect.
function trackCheckout(name: "checkout_started" | "checkout_session_created", properties: Parameters<typeof track>[1]) {
  try { void Promise.resolve(track(name, properties)).catch(() => {}); } catch { /* Measurement is best effort. */ }
}

export function CheckoutButton({
  plan,
  label,
  email,
  source,
  goal,
  listing,
  className = "",
  fallbackHref,
  fallbackLabel = "Open inquiry form"
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  async function handleCheckout() {
    const checkoutAttemptKey = idempotencyKey || crypto.randomUUID();
    if (!idempotencyKey) {
      setIdempotencyKey(checkoutAttemptKey);
    }

    setIsLoading(true);
    setError(null);

    const attribution = {
      ...(source ? { source } : {}),
      ...(goal ? { goal } : {})
    };

    trackCheckout("checkout_started", { plan, ...attribution });

    try {
      const returnTo = pricingIntent({ source: source === "listing" || source === "stack-planner" ? source : undefined, listing, goal: goal as Parameters<typeof pricingIntent>[0]["goal"] });
      const identity = await fetch("/api/buyer/session", { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (identity.status === 401) { window.location.assign(buyerSignIn(returnTo)); return; }
      if (!identity.ok) throw new Error("Buyer sign-in setup is temporarily unavailable. No payment was taken.");
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutAttemptKey
        },
        body: JSON.stringify({ plan, email, source, goal, listing })
      });

      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

      if (response.status === 401) { window.location.assign(buyerSignIn(returnTo)); return; }
      if (!response.ok) {
        throw new Error(payload.error || "Checkout is temporarily unavailable. No payment was taken.");
      }

      if (!payload.url) {
        throw new Error("Checkout URL missing");
      }

      trackCheckout("checkout_session_created", { plan, ...attribution });
      window.location.href = payload.url;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Checkout is temporarily unavailable. No payment was taken.";
      setError(message);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className={`rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {isLoading ? "Starting checkout..." : label}
      </Button>
      {error && (
        <div className="space-y-2" aria-live="polite">
          <p className="text-sm font-medium text-red-700">{error}</p>
          {fallbackHref ? (
            <a href={fallbackHref} className="inline-flex text-sm font-semibold text-sky hover:text-ink">
              {fallbackLabel} →
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
