"use client";

import { useState } from "react";

type CheckoutPlan = "implementation" | "sponsor";

type CheckoutButtonProps = {
  plan: CheckoutPlan;
  label: string;
  email?: string;
  className?: string;
};

export function CheckoutButton({ plan, label, email, className = "" }: CheckoutButtonProps) {
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

      if (!response.ok) {
        throw new Error("Unable to start checkout");
      }

      const payload = (await response.json()) as { url?: string };

      if (!payload.url) {
        throw new Error("Checkout URL missing");
      }

      window.location.href = payload.url;
    } catch {
      setError("Checkout is temporarily unavailable. Use the form and we will follow up.");
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
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
