import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { organizationJsonLd, siteName, siteUrl, websiteJsonLd } from "@/lib/site";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EveryMCP | The Complete MCP Directory",
    template: `%s | ${siteName}`
  },
  description:
    "Discover MCP servers across search, databases, cloud, communication, automation, and AI tooling.",
  openGraph: {
    title: siteName,
    description:
      "Search 50 verified MCP servers and find implementation support for production deployments.",
    url: siteUrl,
    siteName,
    images: [
      {
        url: "/og-default.svg",
        width: 1200,
        height: 630,
        alt: "EveryMCP Directory"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: "The complete MCP directory with implementation support.",
    images: ["/og-default.svg"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable} bg-mist text-slate-900 antialiased`}>
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
