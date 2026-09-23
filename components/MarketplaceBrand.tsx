import Image from "next/image";

type BrandSpec = {
  label: string;
  wordmark: string;
  src?: string;
  sourceUrl: string;
  assetSourceUrl?: string;
};

const brands: Record<string, BrandSpec> = {
  chatgpt: {
    label: "ChatGPT / OpenAI",
    wordmark: "ChatGPT / OpenAI",
    sourceUrl: "https://openai.com/brand/"
  },
  claude: {
    label: "Claude",
    wordmark: "Claude",
    src: "/marketplaces/brands/claude.png",
    sourceUrl: "https://claude.ai/",
    assetSourceUrl: "https://claude.ai/favicon.ico"
  },
  grok: {
    label: "Grok",
    wordmark: "Grok",
    src: "/marketplaces/brands/grok.svg",
    sourceUrl: "https://grok.com/",
    assetSourceUrl: "https://grok.com/images/favicon.svg"
  },
  "grok-build": {
    label: "Grok Build",
    wordmark: "Grok Build",
    sourceUrl: "https://github.com/xai-org/plugin-marketplace"
  },
  "meta-muse": {
    label: "Muse",
    wordmark: "Muse",
    src: "/marketplaces/brands/muse.png",
    sourceUrl: "https://muse.ai/",
    assetSourceUrl: "https://muse.ai/favicon.ico"
  },
  "mcp-registry": {
    label: "Official MCP Registry",
    wordmark: "MCP Registry",
    sourceUrl: "https://registry.modelcontextprotocol.io/docs"
  },
  smithery: {
    label: "Smithery",
    wordmark: "Smithery",
    src: "/marketplaces/brands/smithery.png",
    sourceUrl: "https://smithery.ai/",
    assetSourceUrl: "https://smithery.ai/favicon.ico"
  },
  glama: {
    label: "Glama",
    wordmark: "Glama",
    src: "/marketplaces/brands/glama.png",
    sourceUrl: "https://glama.ai/",
    assetSourceUrl: "https://glama.ai/favicon.ico"
  }
};

export function MarketplaceBrand({ slug }: { slug: string }) {
  const brand = brands[slug];
  if (!brand) return null;
  const sourceLinkLabel = brand.src
    ? `Official ${brand.wordmark} brand source`
    : `${brand.wordmark} official source`;

  return (
    <a
      href={brand.sourceUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={sourceLinkLabel}
      className="group inline-flex min-h-11 max-w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-sky/40 hover:shadow-soft"
      title={brand.assetSourceUrl ? `Brand asset from ${brand.assetSourceUrl}` : `Wordmark reference from ${brand.sourceUrl}`}
    >
      {brand.src ? (
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-50">
          <Image
            src={brand.src}
            alt={`${brand.label} logo`}
            fill
            sizes="32px"
            className="object-contain p-1"
          />
        </span>
      ) : null}
      <span className="min-w-0 truncate font-sora text-sm font-extrabold tracking-tight text-ink group-hover:text-sky">
        {brand.wordmark}
      </span>
      <span aria-hidden="true" className="text-xs text-slate-400">
        ↗
      </span>
    </a>
  );
}
