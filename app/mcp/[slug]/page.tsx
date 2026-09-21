import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories } from "@/data/categories";
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

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Before you install:</strong> EveryMCP has not security-audited this listing or independently verified its publisher. Review the linked repository, requested permissions, deployment model, and official-registry record where applicable. <Link href="/methodology" className="font-bold underline underline-offset-2">How the catalog works →</Link>
        </div>

        <dl className="mt-8 grid gap-5 border-y border-slate-200 py-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Listed author</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{mcp.author}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Repository</dt>
            <dd className="mt-1 break-all text-sm font-semibold text-sky">
              <a href={mcp.repo} target="_blank" rel="noreferrer" className="hover:text-ink">{mcp.repo}</a>
            </dd>
          </div>
        </dl>

        <div className="mt-8 space-y-8">
          <article>
            <h2 className="text-xl font-extrabold text-ink">Installation reference</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{mcp.installation}</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">Treat this as catalog metadata, not an audited command. Confirm current instructions in the linked repository before running it.</p>
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

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-extrabold text-ink">Need Implementation Help?</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">We can help evaluate {mcp.name}, review its permissions and deployment model, and integrate an appropriate MCP server into your production stack.</p>
        <Link href="/services" className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-sky">View implementation service</Link>
      </section>
    </section>
  );
}
