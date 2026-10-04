import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingSourceEvidence } from "@/components/ListingSourceEvidence";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import { getListingEvidence } from "@/lib/listing-evidence";
import { mcps } from "@/lib/mcps";

export function generateStaticParams() {
  return mcps.map((mcp) => ({ slug: mcp.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const mcp = mcps.find((item) => item.slug === params.slug);
  if (!mcp) return { title: "MCP" };
  return { title: mcp.name, description: mcp.description, alternates: { canonical: `/mcp/${mcp.slug}` } };
}

export default function McpDetailPage({ params }: { params: { slug: string } }) {
  const mcp = mcps.find((item) => item.slug === params.slug);
  if (!mcp) notFound();
  const category = categories.find((item) => item.slug === mcp.category);
  const evidence = getListingEvidence(mcp.slug);
  const sourceUrl = mcp.documentationUrl || mcp.repo;

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-16 pt-12 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky">Indexed MCP Listing</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">{mcp.name}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{mcp.description}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{category?.name}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{mcp.platform}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{mcp.useCase}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Indexed source: {mcp.source}</span>
        </div>

        {evidence ? <ListingSourceEvidence evidence={evidence} /> : null}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Before you install:</strong> EveryMCP has not security-audited this listing or independently verified its publisher. Review the linked repository, requested permissions, deployment model, and official-registry record where applicable. <Link href="/methodology" className="font-bold underline underline-offset-2">How the catalog works →</Link>
        </div>

        <dl className="mt-8 grid gap-5 border-y border-slate-200 py-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Listed author</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{mcp.author}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{mcp.documentationUrl ? "Publisher documentation" : evidence ? "Previously indexed repository" : "Repository"}</dt>
            <dd className="mt-1 break-all text-sm font-semibold text-sky">
              <a href={sourceUrl} target="_blank" rel="noreferrer" className="hover:text-ink">{sourceUrl}</a>
            </dd>
          </div>
        </dl>

        <div className="mt-8 space-y-8">
          <article>
            <h2 className="text-xl font-extrabold text-ink">Installation reference</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{mcp.installation}</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">Treat this as catalog metadata, not an audited command. Confirm current instructions in the linked sources before running it.</p>
          </article>

          <article>
            <h2 className="text-xl font-extrabold text-ink">Use Cases</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">{mcp.useCases.map((item) => <li key={item}>• {item}</li>)}</ul>
          </article>

          <article>
            <h2 className="text-xl font-extrabold text-ink">Tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">{mcp.tags.map((tag) => <span key={tag} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">{tag}</span>)}</div>
          </article>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-border bg-background p-8 shadow-soft text-foreground">
        <h2 className="text-2xl font-extrabold">Choose a starting stack</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">The free planner offers three-server shortlists for five common goals. It does not automatically include {mcp.name} or confirm compatibility with your environment.</p>
        <Button asChild className="mt-5 h-auto whitespace-normal py-3"><Link href="/plan">Build a free starting stack</Link></Button>
        <p className="mt-5 text-sm text-muted-foreground">For complex enterprise requirements, <Link href="/services#implementation-inquiry" className="text-primary underline underline-offset-4">share consulting context</Link>.</p>
      </section>
    </section>
  );
}
