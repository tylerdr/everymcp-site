import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { isStackGoalId } from "@/lib/stack-planner";
import { isStripeCheckoutConfigured } from "@/lib/stripe-config";

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
    description: "A self-serve selection, setup, and rollout packet downloaded after a successful checkout return.",
    features: ["Grounded MCP selection matrix", "Worked client configuration example", "Source and permission review prompts", "Acceptance and rollback checklist"],
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

type PricingPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PricingPage({ searchParams }: PricingPageProps) {
  const checkoutConfigured = isStripeCheckoutConfigured();
  const requestedSource = firstParam(searchParams?.source);
  const requestedGoal = firstParam(searchParams?.goal);
  const source = requestedSource === "stack-planner" ? requestedSource : undefined;
  const goal = source && isStackGoalId(requestedGoal) ? requestedGoal : undefined;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Pricing</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">Simple, honest pricing</h1>
        <p className="mt-4 text-sm text-slate-600 max-w-xl mx-auto">
          Browse for free. Turn a chosen stack into a rollout packet for $49. Use implementation help when the work needs a team.
        </p>
      </div>

      {source === "stack-planner" ? (
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-sky/20 bg-sky/5 p-4 text-center text-sm leading-6 text-slate-700">
          <strong className="text-ink">Your stack is picked.</strong> The starter kit is the next step if you want to turn that shortlist into a reusable permission, acceptance, and rollback plan.
        </div>
      ) : null}

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
                checkoutConfigured ? (
                  <CheckoutButton
                    plan="starter"
                    label={tier.cta.label}
                    source={source}
                    goal={goal}
                    fallbackHref="#starter-kit"
                    fallbackLabel="Retry starter kit checkout"
                  />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-amber-800">Checkout is temporarily closed while payment configuration is verified.</p>
                    <Link href="#starter-kit" className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-sky hover:text-sky">
                      Review the starter kit
                    </Link>
                  </div>
                )
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
        <p className="mt-3 text-sm text-slate-600 max-w-lg mx-auto">Build a free starting stack first. If the workflow needs custom implementation, open a scoped inquiry after you know what outcome matters.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/plan" className="inline-block rounded-full bg-sky px-6 py-3 text-sm font-bold text-white hover:bg-ink">
            Build a free stack
          </Link>
          <Link href="/services#implementation-inquiry" className="inline-block rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:border-sky hover:text-sky">
            Open implementation inquiry
          </Link>
        </div>
      </div>
    </section>
  );
}
