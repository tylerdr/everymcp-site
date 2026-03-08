import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { LeadForm } from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "MCP Implementation Service",
  description:
    "MCP setup, integration, and custom server implementation for production teams."
};

const offerings = [
  "MCP architecture and server selection",
  "Client + server integration and environment setup",
  "Auth, permissions, and tool boundary hardening",
  "Custom MCP server development",
  "Production launch support"
];

export default function ServicesPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Implementation Service</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">MCP Setup for Production Teams</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            We deliver an end-to-end MCP implementation tailored to your stack, use cases, and compliance constraints.
          </p>

          <h2 className="mt-8 text-xl font-extrabold text-ink">What We Offer</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {offerings.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pricing</p>
            <p className="mt-2 text-4xl font-extrabold text-ink">$2,000</p>
            <p className="mt-2 text-sm text-slate-600">Fixed setup package for MVP delivery and rollout.</p>
            <div className="mt-5">
              <CheckoutButton plan="implementation" label="Buy implementation package" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-extrabold text-ink">Start Your Build</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Share your stack and use case. We will follow up with a scope, timeline, and implementation plan.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Looking for distribution instead? Sponsor the directory on our{" "}
            <Link href="/sponsor" className="font-semibold text-sky hover:text-ink">
              sponsor page
            </Link>
            .
          </p>
          <LeadForm className="mt-6" />
        </article>
      </div>
    </section>
  );
}
