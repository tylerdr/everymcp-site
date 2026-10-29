import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/categories";
import { getCategoryBySlug, getMcpsByCategory, relatedCategories } from "@/lib/mcps";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const category = getCategoryBySlug(params.slug);

  if (!category) {
    return { title: "Category" };
  }

  return {
    title: `${category.name} MCP Servers`,
    description: `${category.blurb} Explore MCP implementations in ${category.name}.`,
    alternates: {
      canonical: `/category/${category.slug}`
    }
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const servers = getMcpsByCategory(params.slug);
  const related = relatedCategories(params.slug);
  const hasWebRetrievalGuide = params.slug === "browser-automation" || params.slug === "web-search-research";

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky">Category</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{category.blurb}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{servers.length} servers in this category</p>

      {hasWebRetrievalGuide && (
        <aside aria-labelledby="web-retrieval-guide" className="mt-6 rounded-2xl border border-border bg-background p-6 text-foreground">
          <h2 id="web-retrieval-guide" className="text-lg font-bold">Choose how your agent reads the web</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Compare URL fetching, browser interaction, and crawling before choosing a server.
            The guide covers Fetch, Microsoft Playwright, and Firecrawl, with a free worksheet
            for evaluating your own pages. No account required.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild className="h-auto whitespace-normal py-3">
              <Link href="/blog/mcp-servers-for-web-scraping">Read the web retrieval guide</Link>
            </Button>
            <Button asChild variant="outline" className="h-auto whitespace-normal py-3">
              <a href="/samples/web-retrieval-evaluation.md" download>Download the free worksheet</a>
            </Button>
          </div>
        </aside>
      )}

      <div className="mt-8">
        <DirectoryExplorer presetCategory={params.slug} />
      </div>

      <article className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-extrabold text-ink">About {category.name}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {category.name} MCP servers help teams expose high-value tools to assistants while keeping boundaries explicit and auditable. On EveryMCP, listings in this category are organized for faster evaluation across repo quality, use cases, and deployment fit.
        </p>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-700">Related Categories</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/category/${item.slug}`}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-sky hover:text-sky"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}
