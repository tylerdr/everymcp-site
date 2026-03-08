import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { CheckoutButton } from "@/components/CheckoutButton";
import { HomeSearch } from "@/components/HomeSearch";
import { LeadForm } from "@/components/LeadForm";
import { McpCard } from "@/components/McpCard";
import { categories } from "@/data/categories";
import { featuredMcps, mcps } from "@/lib/mcps";

export default function Home() {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
        <p className="inline-flex rounded-full bg-sky/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky">
          MCP Infrastructure Directory
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
          The Complete MCP Directory
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Discover verified Model Context Protocol servers, evaluate implementation fit, and ship faster with expert integration support.
        </p>

        <HomeSearch />

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-extrabold text-ink">{mcps.length}</p>
            <p className="mt-1 text-sm text-slate-600">Verified MCP servers</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-extrabold text-ink">{categories.length}</p>
            <p className="mt-1 text-sm text-slate-600">Production categories</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-extrabold text-ink">$2,000</p>
            <p className="mt-1 text-sm text-slate-600">Implementation package</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <CategoryGrid />
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Implementation Service</p>
            <h2 className="mt-3 text-3xl font-extrabold text-ink">Need Help Integrating MCPs?</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              We handle architecture, environment setup, server selection, and production rollout for MCP-enabled products.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              <li>• MCP setup and configuration</li>
              <li>• Integration with your agent stack</li>
              <li>• Custom server extensions</li>
            </ul>
            <div className="mt-6">
              <CheckoutButton plan="implementation" label="Buy implementation package" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
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
