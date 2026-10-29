import type { Metadata } from "next";
import Link from "next/link";
import { WebRetrievalActions } from "@/components/WebRetrievalActions";
import { STARTER_KIT_AMOUNT } from "@/lib/products";

const title = "MCP Servers for Web Scraping: Fetch, Playwright or Firecrawl?";
const description = "Choose a web retrieval approach by the output you need. Compare publisher sources, work through a synthetic example, and download a free MCP evaluation worksheet.";
const path = "/blog/mcp-servers-for-web-scraping";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: { title, description, url: `https://everymcp.com${path}`, type: "article" }
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  url: `https://everymcp.com${path}`,
  datePublished: "2026-03-21",
  dateModified: "2026-10-28",
  author: { "@type": "Organization", name: "EveryMCP", url: "https://everymcp.com" },
  publisher: { "@type": "Organization", name: "EveryMCP", url: "https://everymcp.com" }
};

const approaches = [
  {
    name: "Fetch MCP",
    need: "Read text from a known public URL.",
    documented: "The reference server retrieves page content and converts HTML to Markdown; its documented fetch inputs include URL, length, offset and raw-output options.",
    check: "Does the returned content contain the needed fields? A page that depends on browser interaction may need another approach.",
    source: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    sourceLabel: "Fetch maintainer README",
    listing: "/mcp/fetch"
  },
  {
    name: "Microsoft Playwright MCP",
    need: "Navigate a page or interact with browser controls.",
    documented: "Microsoft documents browser automation through accessibility snapshots, with persistent, isolated and extension-based browser contexts.",
    check: "Use an isolated test context. Decide which navigation and interaction tools to expose before connecting an account.",
    source: "https://github.com/microsoft/playwright-mcp",
    sourceLabel: "Microsoft Playwright MCP README",
    listing: "/mcp/playwright-mcp-official"
  },
  {
    name: "Firecrawl MCP",
    need: "Evaluate a hosted web-data service for extraction.",
    documented: "Firecrawl documents limited keyless Search, Scrape and Parse, plus account sign-in or API-key access to the tool surface available on a team’s plan.",
    check: "Confirm the required tool, data destination and usage limit. Test the actual target pages before estimating costs or subscribing.",
    source: "https://docs.firecrawl.dev/mcp-server",
    sourceLabel: "Firecrawl MCP documentation",
    listing: "/mcp/firecrawl"
  }
];

export default function MCPWebScrapingPage() {
  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-12 text-foreground sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <Link href="/blog" className="underline underline-offset-4">MCP guides</Link> / Web scraping
      </nav>
      <header>
        <p className="text-sm font-semibold text-muted-foreground">Source review: October 28, 2026</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-5 text-lg leading-8">Start with the result your workflow needs: readable page text, browser interaction, or hosted extraction. Choose one approach, then prove it can return your required fields within an agreed data and cost boundary.</p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">This comparison uses the linked publisher documentation. EveryMCP has not run these providers for this guide or verified compatibility with your client. The example below is synthetic.</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground"><strong>Commercial disclosure:</strong> Provider links here are ordinary source links without affiliate tracking. EveryMCP sells the optional starter kit described below.</p>
      </header>

      <section aria-labelledby="choose-approach" className="mt-10">
        <h2 id="choose-approach" className="text-2xl font-bold">Choose by the work you need to do</h2>
        <div className="mt-5 grid gap-5">
          {approaches.map((approach) => (
            <section key={approach.name} className="rounded-2xl border border-border bg-background p-5 sm:p-6">
              <h3 className="text-xl font-bold">{approach.name}</h3>
              <p className="mt-2 font-semibold">{approach.need}</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{approach.documented} <a href={approach.source} className="text-primary underline underline-offset-4">{approach.sourceLabel}</a>.</p>
              <p className="mt-3 text-sm leading-7"><strong>Your first check:</strong> {approach.check}</p>
              <Link href={approach.listing} className="mt-3 inline-block text-sm text-primary underline underline-offset-4">Inspect the {approach.name} directory listing</Link>
            </section>
          ))}
        </div>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">These are starting hypotheses, not a speed or quality ranking. For a repeatable fixed workflow, also consider whether an existing API or a small script would meet the need without an agent choosing tools.</p>
      </section>

      <section id="worked-example" aria-labelledby="example-title" className="mt-10 rounded-2xl border border-border bg-background p-5 sm:p-8">
        <h2 id="example-title" className="text-2xl font-bold">Work through one extraction decision</h2>
        <p className="mt-3 leading-7">Example goal: read an approved product page and return its title, plan name and update date, with a source link. Begin with a synthetic page containing exactly those fields. This is a proposed test, not an observed provider result.</p>
        <h3 className="mt-5 font-bold">Synthetic input</h3>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-border p-4 text-xs leading-6">{'<main>\n  <h1>Widget A</h1>\n  <p>Plan: Example</p>\n  <p>Updated: 2026-10-01</p>\n</main>'}</pre>
        <h3 className="mt-5 font-bold">Expected fields</h3>
        <p className="mt-2 text-sm leading-7">Title: <strong>Widget A</strong>. Plan: <strong>Example</strong>. Updated date: <strong>2026-10-01</strong>. Source: the exact approved URL you served. A missing field should stay missing, with an explanation; it should not be inferred from another page.</p>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7">
          <li><strong>Try the smallest surface.</strong> If all fields arrive in the initial HTML, evaluate retrieval first. If the fields appear only after interaction, evaluate a browser approach on a separate fixture.</li>
          <li><strong>Set a bounded run.</strong> For this exercise, propose one approved URL, no login, no writes, one attempt and a 30-second timeout. These are your test requirements; verify how your chosen client enforces them.</li>
          <li><strong>Make failure visible.</strong> Remove the date, return a 403 and simulate a timeout in your own test environment. Record missing data or refusal instead of silently retrying, guessing or switching to a credentialed session.</li>
          <li><strong>Record the decision.</strong> Save the version, requested tools, observed fields, elapsed time, usage and failure outputs. Leave each outcome “not run” until you have the evidence.</li>
        </ol>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">Only move to real pages you are authorized to access after the fixture checks. Review requested permissions, network destinations and retained data. Publisher documentation describes intended behavior; your records establish what happened in your environment.</p>
        <WebRetrievalActions kind="worksheet" />
        <p className="mt-3 text-xs text-muted-foreground">Free Markdown worksheet with this example, a blank decision record and failure-case prompts. No email or account required.</p>
      </section>

      <section aria-labelledby="offer-title" className="mt-10 rounded-2xl border border-border bg-secondary p-5 text-secondary-foreground sm:p-8">
        <h2 id="offer-title" className="text-2xl font-bold">Need a reusable rollout packet?</h2>
        <p className="mt-3 text-sm leading-7">Use the free worksheet for this web retrieval decision. The ${STARTER_KIT_AMOUNT / 100} MCP Integration Starter Kit adds a catalog-based selection matrix, source and permission review, a worked Filesystem client configuration, and acceptance/rollback records for a broader MCP rollout.</p>
        <p className="mt-3 text-sm leading-7">The kit is a general reference packet. It does not include a configured scraping integration, provider credits, managed setup or a security certification. Review its actual sample and current checkout availability on the pricing page.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <WebRetrievalActions kind="offer" />
          <WebRetrievalActions kind="planner" />
        </div>
        <p className="mt-4 text-xs leading-6 text-secondary-foreground/80">The free planner has five general goals; it does not automatically select Firecrawl or reproduce this comparison.</p>
      </section>

      <footer className="mt-10 border-t border-border pt-6 text-sm leading-7 text-muted-foreground">
        <p>Read the <Link href="/methodology" className="text-primary underline underline-offset-4">catalog methodology</Link> for how source references differ from independent verification. Continue with <Link href="/blog/how-to-choose-an-mcp-server" className="text-primary underline underline-offset-4">the MCP selection guide</Link> or <Link href="/directory" className="text-primary underline underline-offset-4">browse the directory</Link>.</p>
      </footer>
    </article>
  );
}
