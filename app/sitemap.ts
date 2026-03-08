import type { MetadataRoute } from "next";
import { categories } from "@/data/categories";
import { mcps } from "@/lib/mcps";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://everymcp.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseEntries: MetadataRoute.Sitemap = ["", "/directory", "/services", "/sponsor"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7
  }));

  const mcpEntries: MetadataRoute.Sitemap = mcps.map((mcp) => ({
    url: `${siteUrl}/mcp/${mcp.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7
  }));

  return [...baseEntries, ...categoryEntries, ...mcpEntries];
}
