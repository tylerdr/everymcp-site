import type { Metadata } from "next";
import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { HomeSearch } from "@/components/HomeSearch";
import { LeadForm } from "@/components/LeadForm";
import { McpCard } from "@/components/McpCard";
import { categories } from "@/data/categories";
import { catalogTrust } from "@/lib/catalog-trust";
import { featuredMcps, mcps } from "@/lib/mcps";
import { isStripeCheckoutConfigured } from "@/lib/stripe-config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  }
};

export default function Home() {
  const checkoutConfigured = isStripeCheckoutConfigured();

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
        <p className="inline-flex rounded-full bg-sky/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky">
          MCP Infrastructure Directory
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
          Find MCP servers. Check the source. Choose deliberately.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Discover indexed Model Context Protocol servers, compare implementation fit, and follow the repository or registry source before you connect one to an agent.
        </p>

        <HomeSearch />
        <div className="mt-4 text-center">
          <Link href="/plan" className="text-sm font-bold text-sky transition hover:text-ink">
            Not sure which MCPs fit? Build a free three-server starting stack →
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Catalog status:</strong> {catalogTrust.shortDisclosure}{" "}
          <Link href={catalogTrust.methodologyPath} className="font-bold underline underline-offset-2">
            Read the methodology
          </Link>
          .
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-extrabold text-ink">{mcps.length}</p>
            <p className="mt-1 text-sm text-slate-600">Indexed MCP listings</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-extrabold text-ink">{categories.length}</p>
            <p className="mt-1 text-sm text-slate-600">Discovery categories</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-extrabold text-ink">$49</p>
            <p className="mt-1 text-sm text-slate-600">Starter kit, downloaded after a successful checkout return</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <CategoryGrid />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-sky/20 bg-sky/5 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Distribution paths</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Know where a server can actually go.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Compare first-party directories, client connections, the official registry, and community marketplaces with source-backed preparation checklists.
            </p>
          </div>
          <Link href="/marketplaces" className="inline-flex shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky">
            View marketplace guides →
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Featured MCP Servers</h2>
          <Link href="/directory" className="text-sm font-semibold text-sky hover:text-ink">
            Browse all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredMcps.slice(0, 6).map((mcp) => (
            <McpCard key={mcp.id} mcp={mcp} />
          ))}
        </div>
      </section>

      <section className="mx-auto mb-16 mt-8 w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Self-serve starter kit</p>
            <h2 className="mt-3 text-3xl font-extrabold text-ink">Start with an MCP integration plan</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              Get a practical workflow, permission, and rollout packet immediately after payment. If you need help choosing a stack first, use the free planner before you buy.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              <li>• Workflow definition worksheet</li>
              <li>• Source, auth, and permission review prompts</li>
              <li>• Acceptance and rollback checklist</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/plan"
                className="inline-flex rounded-full bg-sky px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink"
              >
                Build my free stack
              </Link>
              <Link
                href="/pricing#starter-kit"
                className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky"
              >
                {checkoutConfigured ? "Get the $49 starter kit" : "Review the $49 starter kit"}
              </Link>
              <Link
                href="/services"
                className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky hover:text-sky"
              >
                View service details
              </Link>
              <Link
                href="/sponsor"
                className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky hover:text-sky"
              >
                Sponsor directory
              </Link>
            </div>
          </div>
          <LeadForm compact />
        </div>
      </section>
    </>
  );
}
