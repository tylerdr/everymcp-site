"use client";

import { useMemo, useState } from "react";
import { McpCard } from "@/components/McpCard";
import { categories } from "@/data/categories";
import { allPlatforms, allUseCases, sortedMcps } from "@/lib/mcps";

type DirectoryExplorerProps = {
  initialQuery?: string;
  presetCategory?: string;
};

export function DirectoryExplorer({ initialQuery = "", presetCategory }: DirectoryExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(presetCategory ?? "all");
  const [useCase, setUseCase] = useState("all");
  const [platform, setPlatform] = useState("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return sortedMcps.filter((mcp) => {
      const matchesQuery =
        normalized.length === 0 ||
        mcp.name.toLowerCase().includes(normalized) ||
        mcp.description.toLowerCase().includes(normalized) ||
        mcp.tags.some((tag) => tag.toLowerCase().includes(normalized));

      const matchesCategory = category === "all" || mcp.category === category;
      const matchesUseCase = useCase === "all" || mcp.useCase === useCase;
      const matchesPlatform = platform === "all" || mcp.platform === platform;

      return matchesQuery && matchesCategory && matchesUseCase && matchesPlatform;
    });
  }, [category, platform, query, useCase]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, description, tags"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-sky focus:border-sky focus:ring-2"
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-sky focus:border-sky focus:ring-2"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={useCase}
            onChange={(event) => setUseCase(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-sky focus:border-sky focus:ring-2"
          >
            <option value="all">All use cases</option>
            {allUseCases.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-sky focus:border-sky focus:ring-2"
          >
            <option value="all">All platforms</option>
            {allPlatforms.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">
          {filtered.length} {filtered.length === 1 ? "server" : "servers"} found
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          No MCP servers match your current filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mcp) => (
            <McpCard key={mcp.id} mcp={mcp} />
          ))}
        </div>
      )}
    </section>
  );
}
