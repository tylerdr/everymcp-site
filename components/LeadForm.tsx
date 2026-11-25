"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

const UNCONFIRMED_MESSAGE = "We could not confirm whether your request was saved or follow-up was sent. Please retry with the same details.";

type LeadFormProps = {
  compact?: boolean;
  className?: string;
  intent?: string;
  messagePlaceholder?: string;
  submitLabel?: string;
  successMessage?: string;
};

export function LeadForm({
  compact = false,
  className = "",
  intent = "catalog",
  messagePlaceholder = "What are you trying to connect, launch, or evaluate?",
  submitLabel = "Request the resource",
  successMessage = "Your request is confirmed and saved."
}: LeadFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmationPath, setConfirmationPath] = useState("/methodology");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          intent,
          consent: formData.get("consent") === "on"
        })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        confirmation?: { resourcePath?: string };
      };

      if (!response.ok || !payload.ok) {
        setStatus("error");
        setError(payload.error || UNCONFIRMED_MESSAGE);
        return;
      }

      setConfirmationPath(payload.confirmation?.resourcePath || "/methodology");
      setStatus("success");
    } catch {
      setStatus("error");
      setError(UNCONFIRMED_MESSAGE);
    }
  }

  return (
    <section className={`space-y-4 ${className}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">{compact ? "Free methodology follow-up" : "Tell us what you need"}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {compact
            ? "Request the existing catalog methodology and a practical next step for your MCP evaluation."
            : "Share your context and receive the existing methodology resource with the next step for your request."}
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-live="polite">
          <p className="text-sm font-semibold text-emerald-900">{successMessage}</p>
          <a className="mt-3 inline-flex font-bold text-emerald-800 underline underline-offset-2" href={confirmationPath}>
            Read the methodology follow-up →
          </a>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input name="name" required minLength={2} maxLength={120} autoComplete="name" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input name="email" required type="email" maxLength={254} autoComplete="email" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Context
            <textarea name="message" maxLength={2000} rows={compact ? 3 : 4} placeholder={messagePlaceholder} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
            <input name="consent" required type="checkbox" className="mt-1" />
            <span>I agree to receive the requested EveryMCP resource and transactional follow-up for this request.</span>
          </label>
          <button type="submit" disabled={status === "submitting"} className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60">
            {status === "submitting" ? "Saving request…" : submitLabel}
          </button>
          {status === "error" && error ? (
            <div aria-live="polite" className="space-y-2">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button asChild variant="link" className="px-0">
                <a href="/methodology">Read the free methodology now →</a>
              </Button>
            </div>
          ) : null}
        </form>
      )}
    </section>
  );
}
