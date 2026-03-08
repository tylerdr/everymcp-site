"use client";

import { FormEvent, useState } from "react";

type LeadFormProps = {
  compact?: boolean;
  className?: string;
};

type FormState = "idle" | "loading" | "success" | "error";

export function LeadForm({ compact = false, className = "" }: LeadFormProps) {
  const [state, setState] = useState<FormState>("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setState("success");
      form.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
      <div className={compact ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
        <input
          required
          name="name"
          placeholder="Name"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-sky transition focus:border-sky focus:ring-2"
        />
        <input
          required
          name="email"
          type="email"
          placeholder="Work email"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-sky transition focus:border-sky focus:ring-2"
        />
      </div>

      <input
        name="company"
        placeholder="Company"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-sky transition focus:border-sky focus:ring-2"
      />

      <textarea
        required
        name="message"
        placeholder="Use case and what you need built"
        rows={compact ? 4 : 5}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-sky transition focus:border-sky focus:ring-2"
      />

      <button
        disabled={state === "loading"}
        className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "loading" ? "Sending..." : "Request Implementation Help"}
      </button>

      {state === "success" && (
        <p className="text-sm font-medium text-emerald-700">
          Thanks. Your request was submitted.
        </p>
      )}
      {state === "error" && (
        <p className="text-sm font-medium text-red-700">
          Submission failed. Please retry.
        </p>
      )}
    </form>
  );
}
