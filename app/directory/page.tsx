import type { Metadata } from "next";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";

export const metadata: Metadata = {
  title: "MCP Directory",
  description:
    "Search and filter verified MCP servers by category, use case, and platform.",
  alternates: {
    canonical: "/directory"
  }
};

export default function DirectoryPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">MCP Directory</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        Explore 50 real MCP servers sourced from official lists. Search by functionality and filter by category, use case, or platform.
      </p>

      <div className="mt-8">
        <DirectoryExplorer initialQuery={searchParams.q ?? ""} />
      </div>
    </section>
  );
}
