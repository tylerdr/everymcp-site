import type { MetadataRoute } from "next";
import { categories } from "@/data/categories";
import { mcps } from "@/lib/mcps";
import { marketplaceGuides } from "@/lib/marketplaces";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseEntries: MetadataRoute.Sitemap = ["", "/directory", "/marketplaces", "/methodology", "/pricing", "/services", "/sponsor"].map((path) => ({
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

  const marketplaceEntries: MetadataRoute.Sitemap = marketplaceGuides.map((guide) => ({
    url: `${siteUrl}/marketplaces/${guide.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7
  }));

  return [...baseEntries, ...categoryEntries, ...mcpEntries, ...marketplaceEntries];
}
