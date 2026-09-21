import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <p>© {new Date().getFullYear()} EveryMCP. Built for source-aware MCP discovery.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/methodology" className="font-semibold text-sky hover:text-ink">Catalog methodology</Link>
          <a href="https://registry.modelcontextprotocol.io" target="_blank" rel="noreferrer" className="font-semibold text-sky hover:text-ink">Official MCP Registry ↗</a>
        </div>
      </div>
    </footer>
  );
}
