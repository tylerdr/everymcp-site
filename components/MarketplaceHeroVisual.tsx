export function MarketplaceHeroVisual() {
  return (
    <figure className="overflow-hidden rounded-[1.75rem] border border-sky/20 bg-slate-950 shadow-soft">
      <div className="relative min-h-[300px] p-5 sm:min-h-[360px] sm:p-8">
        <svg
          viewBox="0 0 560 320"
          role="img"
          aria-labelledby="marketplace-route-title marketplace-route-description"
          className="h-full min-h-[260px] w-full"
        >
          <title id="marketplace-route-title">MCP distribution route map</title>
          <desc id="marketplace-route-description">
            A central MCP server routes toward first-party directories, client connections, the official registry, and community marketplaces.
          </desc>
          <defs>
            <linearGradient id="route-line" x1="0" x2="1">
              <stop offset="0" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="1" stopColor="#5eead4" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#route-line)" strokeWidth="2">
            <path d="M280 160 120 70" />
            <path d="M280 160 440 70" />
            <path d="M280 160 120 250" />
            <path d="M280 160 440 250" />
          </g>
          <g fill="#0f172a" stroke="#67e8f9" strokeWidth="2">
            <rect x="220" y="116" width="120" height="88" rx="18" />
            <rect x="40" y="40" width="160" height="60" rx="16" />
            <rect x="360" y="40" width="160" height="60" rx="16" />
            <rect x="40" y="220" width="160" height="60" rx="16" />
            <rect x="360" y="220" width="160" height="60" rx="16" />
          </g>
          <g fill="#e2e8f0" fontFamily="var(--font-manrope), sans-serif" textAnchor="middle">
            <text x="280" y="151" fontSize="17" fontWeight="800">MCP server</text>
            <text x="280" y="174" fill="#94a3b8" fontSize="11">source + transport</text>
            <text x="120" y="67" fontSize="13" fontWeight="800">First-party</text>
            <text x="440" y="67" fontSize="13" fontWeight="800">Client connection</text>
            <text x="120" y="247" fontSize="13" fontWeight="800">Official registry</text>
            <text x="440" y="247" fontSize="13" fontWeight="800">Community path</text>
          </g>
          <g fill="#67e8f9">
            <circle cx="280" cy="160" r="5" />
            <circle cx="120" cy="70" r="5" />
            <circle cx="440" cy="70" r="5" />
            <circle cx="120" cy="250" r="5" />
            <circle cx="440" cy="250" r="5" />
          </g>
        </svg>
      </div>
      <figcaption className="border-t border-white/10 px-5 py-3 text-xs leading-5 text-slate-300 sm:px-7">
        Editorial route diagram. A listed path is not a submission receipt or platform endorsement.
      </figcaption>
    </figure>
  );
}
