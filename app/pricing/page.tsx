import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";

export const metadata: Metadata = {
  title: "Pricing — EveryMCP",
  description: "A self-serve MCP integration starter kit plus implementation and sponsorship paths for production teams.",
  alternates: { canonical: "/pricing" }
};

const tiers = [
  {
    name: "Directory",
    price: "Free",
    period: "",
    description: "Search and browse indexed MCP listings with source links.",
    features: ["Full directory access", "Category and tag filtering", "Repository + source provenance", "No account required"],
    cta: { label: "Browse Directory", href: "/directory", primary: false },
    selfServe: false
  },
  {
    name: "MCP Integration Starter Kit",
    price: "$49",
    period: "one time",
    description: "A self-serve worksheet and rollout packet delivered immediately after payment.",
    features: ["Workflow definition worksheet", "Source and permission review prompts", "Tool-boundary record", "Acceptance and rollback checklist"],
    cta: { label: "Get the starter kit", href: "#starter-kit", primary: true },
    selfServe: true
  },
  {
    name: "Implementation Package",
    price: "$2,000",
    period: "fixed",
    description: "Human delivered MCP setup for production teams. Start with an implementation inquiry.",
    features: ["MCP architecture and server selection", "Client + server integration and environment setup", "Auth, permissions, and tool boundary hardening", "Custom MCP server development", "Production launch support"],
    cta: { label: "Open implementation inquiry", href: "/services#implementation-inquiry", primary: true },
    highlight: true,
    selfServe: false
  },
  {
    name: "Sponsor",
    price: "Custom",
    period: "",
    description: "Human coordinated placement for tools and services that fit the directory.",
    features: ["Featured placement in directory", "Logo + link in header or footer", "Dedicated sponsor spotlight", "Monthly reach report"],
    cta: { label: "View sponsor options", href: "/sponsor", primary: false },
    selfServe: false
  }
];

export default function PricingPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Pricing</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">Simple, honest pricing</h1>
        <p className="mt-4 text-sm text-slate-600 max-w-xl mx-auto">
          Browse for free. Get help building with a fixed-rate implementation package. Reach developers with a sponsorship.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <article id={tier.selfServe ? "starter-kit" : undefined} key={tier.name} className={`rounded-3xl border p-8 flex flex-col ${tier.highlight ? "border-sky bg-sky/5 shadow-soft" : "border-slate-200 bg-white"}`}>
            {tier.highlight && <p className="mb-3 text-xs font-bold uppercase tracking-wide text-sky">Most popular</p>}
            <h2 className="text-lg font-extrabold text-ink">{tier.name}</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-ink">{tier.price}</span>
              {tier.period && <span className="text-sm text-slate-500">{tier.period}</span>}
            </div>
            <p className="mt-2 text-sm text-slate-600">{tier.description}</p>
            <ul className="mt-6 space-y-2 text-sm text-slate-700 flex-1">
              {tier.features.map((feature) => <li key={feature}>• {feature}</li>)}
            </ul>
            <div className="mt-8">
              {tier.selfServe ? (
                <CheckoutButton plan="starter" label={tier.cta.label} fallbackHref="#starter-kit" fallbackLabel="Retry starter kit checkout" />
              ) : (
                <Link href={tier.cta.href} className={`block w-full rounded-full py-3 text-center text-sm font-bold transition ${tier.cta.primary ? "bg-sky text-white hover:bg-sky/90" : "border border-slate-300 text-slate-700 hover:border-sky hover:text-sky"}`}>
                  {tier.cta.label}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-extrabold text-ink">Not sure what you need?</h2>
        <p className="mt-3 text-sm text-slate-600 max-w-lg mx-auto">Tell us your stack and use case. We will scope the right approach and come back with a plan.</p>
        <Link href="/services#implementation-inquiry" className="mt-6 inline-block rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:border-sky hover:text-sky">
          Open implementation inquiry
        </Link>
      </div>
    </section>
  );
}
