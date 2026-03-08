import Link from "next/link";
import type { McpServer } from "@/lib/mcps";
import { categories } from "@/data/categories";

type McpCardProps = {
  mcp: McpServer;
};

export function McpCard({ mcp }: McpCardProps) {
  const category = categories.find((item) => item.slug === mcp.category);

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-sky/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">
            <Link href={`/mcp/${mcp.slug}`} className="hover:text-sky">
              {mcp.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            by {mcp.author}
          </p>
        </div>
        {mcp.featured && (
          <span className="rounded-full bg-amber/15 px-3 py-1 text-xs font-bold text-amber">
            Featured
          </span>
        )}
      </div>

      <p className="line-clamp-3 text-sm text-slate-600">{mcp.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {mcp.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-xs font-semibold text-slate-500">{category?.name}</span>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <a
            href={mcp.repo}
            target="_blank"
            rel="noreferrer"
            className="text-slate-600 transition hover:text-sky"
          >
            Repo
          </a>
          <Link href={`/mcp/${mcp.slug}`} className="text-sky">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
