import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { LeadForm } from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "Sponsor EveryMCP",
  description: "Reach MCP buyers with a featured sponsor placement on EveryMCP.",
  alternates: {
    canonical: "/sponsor"
  }
};

const includes = [
  "Featured sponsor badge in directory listings",
  "Pinned placement on homepage sponsor module",
  "Inclusion in outbound distribution content",
  "Direct intro path for implementation-ready teams"
];

export default function SponsorPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Sponsorship</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">Get in front of MCP buyers</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Sponsor EveryMCP to reach engineering leaders actively evaluating Model Context Protocol infrastructure.
          </p>

          <h2 className="mt-8 text-xl font-extrabold text-ink">What&apos;s included</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {includes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Starting at</p>
            <p className="mt-2 text-4xl font-extrabold text-ink">$500</p>
            <p className="mt-2 text-sm text-slate-600">Launch sponsor slot (one-time placement package).</p>
            <div className="mt-5">
              <CheckoutButton
                plan="sponsor"
                label="Reserve Sponsor Slot"
                fallbackHref="#sponsor-inquiry"
                fallbackLabel="Open sponsor inquiry form"
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Prefer to confirm audience fit first? Use the sponsor inquiry form and we&apos;ll reply with placement details.
            </p>
          </div>

          <p className="mt-6 text-sm text-slate-600">
            Need a combined sponsor + integration package?{" "}
            <Link href="/services" className="font-semibold text-sky hover:text-ink">
              Book implementation support
            </Link>
            .
          </p>
        </article>

        <article id="sponsor-inquiry" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-extrabold text-ink">Talk through sponsor fit</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Send your product, audience, and launch window. We&apos;ll confirm placement fit, inventory, and timing within one business day.
          </p>
          <LeadForm
            className="mt-6"
            intent="sponsor"
            messagePlaceholder="What are you sponsoring, who do you want to reach, and when do you want to run?"
            submitLabel="Request Sponsor Details"
            successMessage="Thanks. Your sponsor inquiry was submitted."
          />
        </article>
      </div>
    </section>
  );
}
