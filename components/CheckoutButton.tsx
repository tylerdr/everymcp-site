"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

type CheckoutPlan = "starter";

type CheckoutButtonProps = {
  plan: CheckoutPlan;
  label: string;
  email?: string;
  source?: string;
  goal?: string;
  className?: string;
  fallbackHref?: string;
  fallbackLabel?: string;
};

export function CheckoutButton({
  plan,
  label,
  email,
  source,
  goal,
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

    track("checkout_started", { plan, ...attribution });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutAttemptKey
        },
        body: JSON.stringify({ plan, email, source, goal })
      });

      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Checkout is temporarily unavailable. No payment was taken.");
      }

      if (!payload.url) {
        throw new Error("Checkout URL missing");
      }

      track("checkout_session_created", { plan, ...attribution });
      window.location.href = payload.url;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Checkout is temporarily unavailable. No payment was taken.";
      setError(message);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className={`rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {isLoading ? "Starting checkout..." : label}
      </button>
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
