import type { Metadata } from "next";
import Link from "next/link";
import { MarketplaceCard } from "@/components/MarketplaceCard";
import { MarketplaceFilters } from "@/components/MarketplaceFilters";
import { MarketplaceHeroVisual } from "@/components/MarketplaceHeroVisual";
import {
  filterMarketplaceGuides,
  marketplaceGuides,
  marketplaceLastChecked,
  type MarketplaceKind,
  type MarketplaceMode
} from "@/lib/marketplaces";

export const metadata: Metadata = {
  title: "MCP Marketplaces & Listing Guides",
  description:
    "Source-backed guides for listing or connecting an MCP server across first-party directories, client connections, registries, and community marketplaces.",
  alternates: { canonical: "/marketplaces" }
};

const kinds: MarketplaceKind[] = [
  "first-party-directory",
  "first-party-connection",
  "official-registry",
  "community-directory",
  "community-marketplace"
];

const modes: MarketplaceMode[] = ["hosted-remote-mcp", "local-plugin-or-desktop", "both"];

function validKind(value?: string): MarketplaceKind | undefined {
  return value && kinds.includes(value as MarketplaceKind) ? (value as MarketplaceKind) : undefined;
}

function validMode(value?: string): MarketplaceMode | undefined {
  return value && modes.includes(value as MarketplaceMode) ? (value as MarketplaceMode) : undefined;
}

export default function MarketplacesPage({
  searchParams
}: {
  searchParams: { kind?: string; mode?: string };
}) {
  const activeKind = validKind(searchParams.kind);
  const activeMode = validMode(searchParams.mode);
  const guides = filterMarketplaceGuides(activeKind, activeMode);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:items-center lg:gap-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Distribution paths</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            MCP marketplaces and listing guides
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Use this directory to choose the right distribution path for a hosted MCP server or a local package. Each guide links to the source that was checked and separates a connection, a registry record, and a reviewed marketplace entry.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/directory" className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky">
              Browse MCP servers
            </Link>
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {marketplaceGuides.length} paths checked
            </span>
          </div>
        </div>
        <MarketplaceHeroVisual />
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
        <strong>Evidence boundary:</strong> These are planning guides, not submission receipts. EveryMCP has not submitted a server, accepted platform terms, or received marketplace approval through any path here. A working custom connector proves a client connection, not catalog publication.
        <span className="mt-2 block text-xs font-bold uppercase tracking-wide text-amber-900/70">
          Sources checked {marketplaceLastChecked}
        </span>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Brand references link to official platform sources. EveryMCP is an independent directory and is not endorsed by the platforms listed here.
      </p>

      <div className="mt-8">
        <MarketplaceFilters activeKind={activeKind} activeMode={activeMode} />
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-700">
          {guides.length} of {marketplaceGuides.length} destinations shown
        </p>
        <Link href="/directory" className="text-sm font-bold text-sky hover:text-ink">
          Browse MCP servers →
        </Link>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <MarketplaceCard key={guide.slug} guide={guide} />
        ))}
      </div>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Future / closed</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          Done-for-you listing submissions are not open
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          EveryMCP is documenting the work needed to prepare a submission. No orders, external submissions, or fulfillment are active through this directory, and these guides do not promise acceptance by a platform.
        </p>
        <Link href="/directory" className="mt-5 inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky hover:text-sky">
          Continue to the MCP directory
        </Link>
      </section>

      <p className="mt-8 text-sm leading-7 text-slate-600">
        Need the underlying discovery catalog? Read the <Link href="/methodology" className="font-bold text-sky hover:text-ink">catalog methodology</Link> before treating an indexed server as verified.
      </p>
    </section>
  );
}
