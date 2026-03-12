"use client";

import { useState } from "react";

type CheckoutPlan = "implementation" | "sponsor";

type CheckoutButtonProps = {
  plan: CheckoutPlan;
  label: string;
  email?: string;
  className?: string;
  fallbackHref?: string;
  fallbackLabel?: string;
};

export function CheckoutButton({
  plan,
  label,
  email,
  className = "",
  fallbackHref,
  fallbackLabel = "Open inquiry form"
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan, email })
      });

      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!response.ok) {
        if (payload.error === "Stripe is not configured") {
          throw new Error("Checkout is not live yet. Use the inquiry form and we will follow up manually.");
        }

        throw new Error(payload.error || "Unable to start checkout");
      }

      if (!payload.url) {
        throw new Error("Checkout URL missing");
      }

      window.location.href = payload.url;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Checkout is temporarily unavailable. Use the form and we will follow up.";
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
        <div className="space-y-2">
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
