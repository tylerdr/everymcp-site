import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildStarterKit } from "../lib/starter-kit";
import { fetchStarterKit } from "../lib/starter-kit-download";

const boundary = (packet: string) => packet.split("## 5. Boundary and rollout record\n")[1].split("## 6.")[0].trim();

describe("paid packet worked example", () => {
  it("shows a labeled, unrun research example in the actual pricing excerpt and preserves the reusable record", () => {
    for (const goal of [undefined, "research", "unknown-goal"]) {
      const excerpt = boundary(buildStarterKit(goal));
      expect(excerpt).toContain("Hypothetical worked example");
      expect(excerpt).toContain("Observed result: NOT RUN");
      expect(excerpt).toContain("Missing fields stay missing");
      expect(excerpt).toContain("stop if authentication is requested");
      expect(excerpt).toContain("verify enforcement in the client");
      expect(excerpt).toContain("| Kill switch or rollback owner | |");
    }
    for (const goal of ["ship-software", "automate-ops", "analyze-data", "agent-memory"]) {
      const excerpt = boundary(buildStarterKit(goal));
      expect(excerpt).not.toContain("one approved page");
      expect(excerpt).toContain("| Kill switch or rollback owner | |");
    }
  });

  it("delivers the expanded real catalog packet through the existing integrity validator", async () => {
    const packet = buildStarterKit("research");
    const delivered = await fetchStarterKit("https://example.invalid/download", async () => new Response(packet, {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "x-everymcp-artifact-sha256": createHash("sha256").update(packet).digest("hex"),
      },
    }));
    expect(await delivered.text()).toBe(packet);
  });

  it("describes recovery as conditional on verified buyer identity and current payment rights", () => {
    const packet = buildStarterKit("research");
    expect(packet).toContain("https://everymcp.com/buyer/purchases");
    expect(packet).toContain("Recovery, when available, requires the verified buyer account and current payment rights.");
    expect(packet).not.toContain("durable entitlement recovery after a lost checkout return");
  });
});
