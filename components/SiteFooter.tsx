export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} EveryMCP. Built for fast MCP discovery.</p>
        <p>50 verified servers sourced from official MCP lists.</p>
      </div>
    </footer>
  );
}
