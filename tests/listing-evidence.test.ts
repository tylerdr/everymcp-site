import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import catalog from "../data/mcps.json";
import observations from "../data/listing-observation-notes.json";
import receipt from "../documents/public-discovery/revenuecat-proof-once-2026-10-05.json";
import { formatSourceCheckDate, getListingEvidence, listingEvidence } from "../lib/listing-evidence";

const slugs = ["redash-mcp", "revenuecat-mcp", "icloud-mcp", "heap-mcp", "hotjar-mcp"];

describe("curated listing source evidence", () => {
  it("joins a reviewed public observation without changing historical source evidence", () => {
    expect(observations).toHaveLength(1);
    const observation = observations[0];
    expect(observation.slug).toBe(receipt.listingSlug);
    expect(observation.sourceUrl).toBe(receipt.sourceCitationUrl);
    expect(observation.observedAt).toBe(receipt.startedAt);
    expect(receipt.attempts).toBe(1);
    expect(receipt.reports[0].exchanges[0].httpStatus).toBe(401);
    expect(observation.note).toContain("capabilities were not inspected");
    expect(observation.note).toContain("security remain unassessed");
    const original = listingEvidence.find((item) => item.slug === observation.slug)!;
    expect(original.references[0].note).not.toContain("Separate endpoint observation");
    expect(getListingEvidence(observation.slug)?.references[0].observationReceiptUrl).toBe(observation.receiptUrl);
    for (const slug of ["redash-mcp", "icloud-mcp", "heap-mcp", "hotjar-mcp"])
      expect(getListingEvidence(slug)).toEqual(listingEvidence.find((entry) => entry.slug === slug));
  });
  it("covers only the five reviewed stable listings and retains original repository attribution", () => {
    expect(listingEvidence.map((entry) => entry.slug).sort()).toEqual([...slugs].sort());
    expect(catalog).toHaveLength(616);
    for (const entry of listingEvidence) {
      const listing = catalog.find((item) => item.slug === entry.slug);
      expect(listing?.id).toBe(entry.slug);
      expect(entry.indexedRepository.url).toBe(listing?.repo);
      expect(entry.indexedRepository.httpStatus).toBe(404);
      expect(entry.checkMethod).toContain("no MCP tools invoked");
    }
    expect(getListingEvidence("github")).toBeUndefined();
    expect(getListingEvidence("not-a-listing")).toBeUndefined();
  });

  it("dates every observation and keeps public source URLs separate from execution evidence", () => {
    for (const entry of listingEvidence) {
      for (const source of [entry.indexedRepository, ...entry.references]) {
        expect(source.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        expect(Number.isNaN(Date.parse(source.checkedAt))).toBe(false);
        const url = new URL(source.url);
        expect(url.protocol).toBe("https:");
        expect(url.username).toBe("");
        expect(url.password).toBe("");
        expect(["github.com", "www.revenuecat.com", "contentsquare.com"]).toContain(url.hostname);
      }
      expect(entry.references.every((source) => source.httpStatus === 200)).toBe(true);
    }
    expect(formatSourceCheckDate("2026-10-04T21:25:50Z")).toBe("Oct 4, 2026, 9:25 PM UTC");
  });

  it("does not silently reassign an unconfirmed publisher to a community alternative", () => {
    for (const slug of ["redash-mcp", "icloud-mcp", "heap-mcp", "hotjar-mcp"]) {
      const listing = catalog.find((item) => item.slug === slug);
      expect(listing?.author).toBe("Publisher unconfirmed");
      expect(listing?.source).toContain("publisher unconfirmed");
    }
    for (const slug of ["redash-mcp", "icloud-mcp", "heap-mcp"]) {
      expect(getListingEvidence(slug)?.references[0].kind).toBe("community");
      expect(getListingEvidence(slug)?.references[0].url).not.toBe(getListingEvidence(slug)?.indexedRepository.url);
    }
  });

  it("uses current RevenueCat documentation and authentication without restoring the dead repository identity", () => {
    const listing = catalog.find((item) => item.slug === "revenuecat-mcp");
    expect(listing).toMatchObject({author: "RevenueCat", category: "data-analysis", documentationUrl: "https://www.revenuecat.com/docs/tools/mcp"});
    expect(listing?.installation).toContain("OAuth");
    expect(listing?.installation).toContain("API v2");
    expect(listing?.installation).not.toContain("REVENUECAT_SECRET_API_KEY");
    expect(getListingEvidence("revenuecat-mcp")?.references.every((source) => source.kind === "publisher")).toBe(true);
  });

  it("removes contradicted Heap analytics queries and unconfirmed iCloud photo/sync promises", () => {
    const heap = catalog.find((item) => item.slug === "heap-mcp");
    expect(heap?.description).toContain("does not provide event, funnel, or retention queries");
    expect(heap?.useCases.join(" ")).not.toMatch(/Funnel analysis|Retention data|Event queries/i);
    expect(heap?.tags).not.toContain("funnels");
    const icloud = catalog.find((item) => item.slug === "icloud-mcp");
    expect(icloud?.description).toContain("locally synced folder");
    expect(icloud?.useCases.join(" ")).not.toMatch(/Photo library|Document sync/i);
    expect(getListingEvidence("hotjar-mcp")?.summary).toContain("does not establish compatibility with a legacy Hotjar account");
  });

  it("preserves planner and payment boundaries while removing the fixed human-service promotion", () => {
    const detail = readFileSync("app/mcp/[slug]/page.tsx", "utf8");
    expect(detail).toContain('canonical: `/mcp/${mcp.slug}`');
    expect(detail).toContain('href="/plan"');
    expect(detail).toContain("does not automatically include");
    for (const path of ["app/pricing/page.tsx", "app/services/page.tsx", "public/llms.txt"]) {
      const surface = readFileSync(path, "utf8");
      expect(surface).not.toMatch(/\$2,000|Most popular|fixed-fee implementation service/);
    }
    const pricing = readFileSync("app/pricing/page.tsx", "utf8");
    expect(pricing).toContain('price: "$49"');
    expect(pricing).toContain("Checkout is temporarily closed");
    const service = readFileSync("app/services/page.tsx", "utf8");
    expect(service).toContain('id="implementation-inquiry"');
    expect(service).toContain('intent="implementation"');
    expect(readFileSync("components/LeadForm.tsx", "utf8")).toContain('fetch("/api/lead"');
  });
});
