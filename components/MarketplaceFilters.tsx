import Link from "next/link";
import {
  marketplaceKindFilters,
  marketplaceModeFilters,
  type MarketplaceKind,
  type MarketplaceMode
} from "@/lib/marketplaces";

function filterHref(kind?: MarketplaceKind, mode?: MarketplaceMode) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (mode) params.set("mode", mode);
  const query = params.toString();
  return query ? `/marketplaces?${query}` : "/marketplaces";
}

export function MarketplaceFilters({
  activeKind,
  activeMode
}: {
  activeKind?: MarketplaceKind;
  activeMode?: MarketplaceMode;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Destination type</p>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filter by destination type">
          {marketplaceKindFilters.map((filter) => {
            const isActive = filter.value === (activeKind ?? "all");
            return (
              <Link
                key={filter.value}
                href={filterHref(filter.value === "all" ? undefined : filter.value, activeMode)}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? "border-ink bg-ink text-white"
                    : "border-slate-300 text-slate-700 hover:border-sky hover:text-sky"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Integration mode</p>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filter by integration mode">
          {marketplaceModeFilters.map((filter) => {
            const isActive = filter.value === (activeMode ?? "all");
            return (
              <Link
                key={filter.value}
                href={filterHref(activeKind, filter.value === "all" ? undefined : filter.value)}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                  isActive
                    ? "border-ink bg-ink text-white"
                    : "border-slate-300 text-slate-700 hover:border-sky hover:text-sky"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
      </div>

      {(activeKind || activeMode) && (
        <Link href="/marketplaces" className="inline-flex text-sm font-bold text-sky hover:text-ink">
          Clear filters
        </Link>
      )}
    </div>
  );
}
