import type { Metadata } from "next";
import { mcps } from "@/lib/mcps";

export const metadata: Metadata = {
  title: "Catalog Methodology",
  description: "How EveryMCP indexes MCP listings, what inclusion means, and what builders still need to verify before installation.",
  alternates: { canonical: "/methodology" }
};

const sourceLabels = {
  "modelcontextprotocol/servers": "modelcontextprotocol/servers source snapshot",
  "punkpeye/awesome-mcp-servers": "punkpeye/awesome-mcp-servers community list"
} as const;

export default function MethodologyPage() {
  const counts = Object.entries(
    mcps.reduce<Record<string, number>>((acc, mcp) => {
      acc[mcp.source] = (acc[mcp.source] ?? 0) + 1;
      return acc;
    }, {})
  );

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-16 pt-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Catalog Methodology</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">Indexed is not verified.</h1>
      <p className="mt-5 text-base leading-8 text-slate-600">
        EveryMCP is a discovery layer. A listing appearing here means it was indexed from one of the public source lists represented in this repository. It does not mean EveryMCP audited the code, verified the publisher identity, tested every tool, or confirmed that the server is currently compatible with your client.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {counts.map(([source, count]) => (
          <article key={source} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-3xl font-extrabold text-ink">{count}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{sourceLabels[source as keyof typeof sourceLabels] ?? source}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 space-y-8">
        <article>
          <h2 className="text-2xl font-extrabold text-ink">What to verify before installation</h2>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
            <li>• The repository or package really belongs to the publisher you expect.</li>
            <li>• The server version and MCP protocol compatibility match your client.</li>
            <li>• Requested filesystem, network, account, secret, and write permissions are appropriate for the job.</li>
            <li>• Authentication, authorization, and tool boundaries are safe for the data and actions you will expose.</li>
            <li>• You have a rollback path before enabling write-capable tools in production.</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-sky/20 bg-sky/5 p-6">
          <h2 className="text-xl font-extrabold text-ink">Use the official registry as primary provenance where available.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            The MCP project now operates an official registry as a primary source of truth for publicly available servers. EveryMCP has not yet reconciled this static catalog against that registry, so a listing here should not be described as official merely because it is present.
          </p>
          <a href="https://registry.modelcontextprotocol.io" target="_blank" rel="noreferrer" className="mt-4 inline-flex font-bold text-sky hover:text-ink">
            Open the official MCP Registry ↗
          </a>
        </article>

        <article>
          <h2 className="text-2xl font-extrabold text-ink">What EveryMCP can responsibly add next</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Freshness, official-registry reconciliation, publisher provenance, protocol-version compatibility, permission surface, and repeatable connectivity checks are useful evidence layers. They should be exposed as separate statuses with dates and receipts rather than collapsed into a single “verified” badge.
          </p>
        </article>
      </div>
    </section>
  );
}
