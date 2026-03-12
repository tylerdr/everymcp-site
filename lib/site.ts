export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://everymcp.com")
  .trim()
  .replace(/\/+$/, "");

export const siteName = "EveryMCP";

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/og-default.svg`
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/directory?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};
