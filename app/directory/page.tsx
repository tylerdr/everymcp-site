import type { Metadata } from "next";
import Link from "next/link";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";

export const metadata: Metadata = {
  title: "MCP Directory",
  description:
    "Search and filter indexed MCP server listings by category, use case, and platform, with source provenance kept explicit.",
  alternates: { canonical: "/directory" }
};

export default function DirectoryPage({ searchParams }: { searchParams: { q?: string } }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink">MCP Directory</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        Explore MCP listings indexed from public source lists. Search by functionality and filter by category, use case, or platform.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Inclusion means a listing was indexed, not that EveryMCP security-audited the server, verified its publisher, or confirmed current compatibility. Check the linked repository and the{" "}
        <a href="https://registry.modelcontextprotocol.io" target="_blank" rel="noreferrer" className="font-semibold text-sky hover:text-ink">
          official MCP Registry
        </a>{" "}
        where applicable. <Link href="/methodology" className="font-semibold text-sky hover:text-ink">Methodology →</Link>
      </p>

      <div className="mt-8">
        <DirectoryExplorer initialQuery={searchParams.q ?? ""} />
      </div>
    </section>
  );
}
