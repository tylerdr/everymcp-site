import type { Route } from "next";
import Link from "next/link";

const nav: Array<{ href: Route; label: string }> = [
  { href: "/directory", label: "Directory" },
  { href: "/services", label: "Implementation" },
  { href: "/sponsor", label: "Sponsor" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-ink">
          EveryMCP
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold text-slate-700">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-sky">
              {item.label}
            </Link>
          ))}
          <a
            href="https://github.com/punkpeye/awesome-mcp-servers"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 hover:border-sky hover:text-sky"
          >
            Source Lists
          </a>
        </nav>
      </div>
    </header>
  );
}
