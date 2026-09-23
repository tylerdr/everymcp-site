import Link from "next/link";
import {
  marketplaceAudienceLabels,
  marketplaceKindLabels,
  marketplaceModeLabels,
  type MarketplaceGuide
} from "@/lib/marketplaces";

export function MarketplaceCard({ guide }: { guide: MarketplaceGuide }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-sky/40 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky">
          {marketplaceAudienceLabels[guide.audience]}
        </p>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
          {guide.status === "portal-gated" ? "Portal gated" : "Path checked"}
        </span>
      </div>

      <h2 className="mt-3 text-xl font-extrabold tracking-tight text-ink">
        <Link href={`/marketplaces/${guide.slug}`} className="hover:text-sky">
          {guide.name}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{guide.summary}</p>

      <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        <span className="rounded-full border border-slate-200 px-3 py-1">
          {marketplaceKindLabels[guide.kind]}
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1">
          {marketplaceModeLabels[guide.mode]}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap gap-4 pt-6 text-sm font-bold">
        <Link href={`/marketplaces/${guide.slug}`} className="text-sky hover:text-ink">
          Read checklist →
        </Link>
        <a
          href={guide.listingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-slate-600 hover:text-sky"
        >
          {guide.listingLabel} ↗
        </a>
      </div>
    </article>
  );
}
