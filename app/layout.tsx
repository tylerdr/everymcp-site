import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://everymcp.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EveryMCP | The Complete MCP Directory",
    template: "%s | EveryMCP"
  },
  description:
    "Discover MCP servers across search, databases, cloud, communication, automation, and AI tooling.",
  openGraph: {
    title: "EveryMCP",
    description:
      "Search 50 verified MCP servers and find implementation support for production deployments.",
    url: siteUrl,
    siteName: "EveryMCP",
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
    title: "EveryMCP",
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
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
