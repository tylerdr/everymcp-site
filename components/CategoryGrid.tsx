import Link from "next/link";
import { categories } from "@/data/categories";
import { mcps } from "@/lib/mcps";

export function CategoryGrid() {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">Browse Categories</h2>
        <Link href="/directory" className="text-sm font-semibold text-sky hover:text-ink">
          View full directory
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {categories.map((category) => {
          const count = mcps.filter((mcp) => mcp.category === category.slug).length;

          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-sky/40 hover:shadow-soft"
            >
              <p className="text-sm font-bold text-ink">{category.name}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{category.blurb}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {count} servers
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
