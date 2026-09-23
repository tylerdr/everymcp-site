import type { Route } from "next";
import Link from "next/link";

const nav: Array<{ href: Route; label: string }> = [
  { href: "/directory", label: "Directory" },
  { href: "/marketplaces", label: "Marketplaces" },
  { href: "/methodology", label: "Methodology" },
  { href: "/services", label: "Implementation" },
  { href: "/sponsor", label: "Sponsor" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight text-ink">EveryMCP</Link>
        <nav className="flex min-w-0 flex-1 flex-wrap justify-end gap-x-3 gap-y-2 text-sm font-semibold text-slate-700 sm:gap-x-4">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap transition hover:text-sky">{item.label}</Link>
          ))}
          <a href="https://registry.modelcontextprotocol.io" target="_blank" rel="noreferrer" className="hidden rounded-full border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 hover:border-sky hover:text-sky sm:inline-flex">
            Official Registry ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
