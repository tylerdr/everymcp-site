import mcpsData from "@/data/mcps.json";
import { categories } from "@/data/categories";

export type McpServer = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: (typeof categories)[number]["slug"];
  tags: string[];
  author: string;
  repo: string;
  featured: boolean;
  useCase: string;
  platform: string;
  source: "modelcontextprotocol/servers" | "punkpeye/awesome-mcp-servers";
  installation: string;
  useCases: string[];
};

export const mcps = mcpsData as McpServer[];

export const sortedMcps = [...mcps].sort((a, b) => {
  if (a.featured === b.featured) {
    return a.name.localeCompare(b.name);
  }

  return a.featured ? -1 : 1;
});

export const featuredMcps = sortedMcps.filter((mcp) => mcp.featured);

export const getMcpBySlug = (slug: string) => mcps.find((mcp) => mcp.slug === slug);

export const getCategoryBySlug = (slug: string) =>
  categories.find((category) => category.slug === slug);

export const getMcpsByCategory = (category: string) =>
  sortedMcps.filter((mcp) => mcp.category === category);

export const allUseCases = Array.from(new Set(mcps.map((mcp) => mcp.useCase))).sort();

export const allPlatforms = Array.from(new Set(mcps.map((mcp) => mcp.platform))).sort();

export const relatedCategories = (currentSlug: string) =>
  categories.filter((category) => category.slug !== currentSlug).slice(0, 3);
