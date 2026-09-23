import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMarketplaceGuide,
  marketplaceAudienceLabels,
  marketplaceKindLabels,
  marketplaceLastChecked,
  marketplaceModeLabels
} from "@/lib/marketplaces";

export function generateStaticParams() {
  return ["chatgpt", "claude", "grok", "grok-build", "meta-muse", "mcp-registry", "smithery", "glama"].map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = getMarketplaceGuide(params.slug);
  if (!guide) return { title: "Marketplace guide" };

  return {
    title: `${guide.name} listing guide`,
    description: guide.summary,
    alternates: { canonical: `/marketplaces/${guide.slug}` }
  };
}

export default function MarketplaceGuidePage({ params }: { params: { slug: string } }) {
  const guide = getMarketplaceGuide(params.slug);
  if (!guide) notFound();

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-16 pt-12 sm:px-6">
      <Link href="/marketplaces" className="text-sm font-bold text-sky hover:text-ink">
        ← All marketplace guides
      </Link>

      <div className="mt-8 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky">
        <span>{marketplaceAudienceLabels[guide.audience]}</span>
        <span className="text-slate-300">•</span>
        <span>{guide.status === "portal-gated" ? "Portal gated" : "Path checked"}</span>
      </div>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{guide.name}</h1>
      <p className="mt-5 text-base leading-8 text-slate-600">{guide.summary}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Destination type</p>
          <p className="mt-2 text-sm font-bold text-ink">{marketplaceKindLabels[guide.kind]}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Integration mode</p>
          <p className="mt-2 text-sm font-bold text-ink">{marketplaceModeLabels[guide.mode]}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Official or platform path</p>
          <a href={guide.listingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-sky hover:text-ink">
            {guide.listingLabel} ↗
          </a>
        </article>
      </div>

      <div className="mt-10 space-y-8">
        <article>
          <h2 className="text-2xl font-extrabold text-ink">Eligibility and connection boundary</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{guide.eligibility}</p>
        </article>

        <article>
          <h2 className="text-2xl font-extrabold text-ink">Review or publication path</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{guide.review}</p>
        </article>

        <article>
          <h2 className="text-2xl font-extrabold text-ink">Cost and terms</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{guide.cost}</p>
        </article>

        <article className="rounded-2xl border border-sky/20 bg-sky/5 p-6">
          <h2 className="text-2xl font-extrabold text-ink">Preparation checklist</h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            {guide.checklist.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="font-bold text-sky">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </article>

        <article>
          <h2 className="text-2xl font-extrabold text-ink">Open questions</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            {guide.unknowns.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-ink">Sources checked</h2>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{marketplaceLastChecked}</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6">
            {guide.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer" className="font-bold text-sky hover:text-ink">
                  {source.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </article>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
          <strong>Receipt boundary:</strong> A connection, a submitted PR, or a registry record does not prove marketplace approval. Keep the platform response, version, review state, and rollback plan with the release evidence.
        </div>
      </div>
    </section>
  );
}
