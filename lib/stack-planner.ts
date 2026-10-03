import type { CategorySlug } from "@/data/categories";
import { sortedMcps, type McpServer } from "@/lib/mcps";
import { siteUrl } from "@/lib/site";

export type StackGoalId =
  | "research"
  | "ship-software"
  | "automate-ops"
  | "analyze-data"
  | "agent-memory";

type StackGoal = {
  id: StackGoalId;
  label: string;
  outcome: string;
  proof: {
    task: string;
    success: string;
    stop: string;
  };
  categories: readonly {
    mcpId: string;
    slug: CategorySlug;
    role: string;
  }[];
};

export const stackGoals: readonly StackGoal[] = [
  {
    id: "research",
    label: "Research and answer faster",
    outcome: "Find current sources, read their content, and preserve the useful facts for a follow-up question.",
    proof: {
      task: "Answer one real research question using fresh source material and preserve the useful context for a second turn.",
      success: "The answer links back to the source material and the follow-up uses the saved context without asking you to restate it.",
      stop: "Stop if the assistant cannot show where the answer came from or the saved context changes the meaning of the source."
    },
    categories: [
      { mcpId: "brave-search", slug: "web-search-research", role: "Find current source material with Brave Search" },
      { mcpId: "fetch", slug: "web-search-research", role: "Read the content of the selected source URLs" },
      { mcpId: "memory", slug: "memory-context", role: "Keep the approved facts and their relationships for follow-up" }
    ]
  },
  {
    id: "ship-software",
    label: "Ship software with an agent",
    outcome: "Read a GitHub issue, inspect the local project, and check current library documentation before proposing a change.",
    proof: {
      task: "Have the agent inspect one repository issue, read the relevant files, and propose the smallest code change without writing anything.",
      success: "The proposal cites the actual files and constraints needed for the issue and can be reviewed before any write-capable tool is enabled.",
      stop: "Stop if the agent cannot ground the proposal in the repository or asks for broader access than the first task requires."
    },
    categories: [
      { mcpId: "github-official", slug: "development-tools", role: "Read the repository issue and pull-request context" },
      { mcpId: "filesystem", slug: "file-systems-storage", role: "Inspect the approved local project files" },
      { mcpId: "context7", slug: "development-tools", role: "Check the relevant library documentation and examples" }
    ]
  },
  {
    id: "automate-ops",
    label: "Automate recurring operations",
    outcome: "Prepare a recurring engineering or website check from a GitHub issue, observed browser results, and local runbook files.",
    proof: {
      task: "Read one recurring-check issue, inspect its approved website pages without changing them, and produce a handoff against the local runbook.",
      success: "The handoff contains the expected information with no manual copy-paste between the connected systems.",
      stop: "Stop if the workflow needs an unreviewed write, cannot recover from a missing input, or produces a handoff someone still has to reconstruct."
    },
    categories: [
      { mcpId: "github-official", slug: "development-tools", role: "Read the recurring task and previous issue context" },
      { mcpId: "playwright-mcp-official", slug: "browser-automation", role: "Inspect the approved website steps" },
      { mcpId: "filesystem", slug: "file-systems-storage", role: "Read the runbook and expected handoff format" }
    ]
  },
  {
    id: "analyze-data",
    label: "Analyze business data",
    outcome: "Query an approved DuckDB or MotherDuck data source, inspect Grafana metrics, and reconcile the answer with a local reference file.",
    proof: {
      task: "Ask one decision-relevant question with a known reference answer and have the assistant trace the result back to the source data.",
      success: "The result matches the reference answer and identifies the source records or query path used to produce it.",
      stop: "Stop if the answer cannot be reconciled to the source data or requires write access to complete the first analysis."
    },
    categories: [
      { mcpId: "motherduck-mcp", slug: "databases", role: "Query the authorized DuckDB or MotherDuck source data" },
      { mcpId: "grafana", slug: "data-analysis", role: "Inspect the relevant Grafana metrics and dashboards" },
      { mcpId: "filesystem", slug: "file-systems-storage", role: "Read the approved reference answer or exported data" }
    ]
  },
  {
    id: "agent-memory",
    label: "Give an agent durable context",
    outcome: "Add memory, file access, and structured storage so a long-running agent can resume work with the right context.",
    proof: {
      task: "Give the agent one bounded fact set, end the session, then ask it to resume the same task from the approved stored context.",
      success: "It retrieves the approved context, distinguishes stored facts from new inference, and resumes without re-asking for the same inputs.",
      stop: "Stop if it recalls data outside the approved context, loses provenance, or cannot distinguish current facts from prior notes."
    },
    categories: [
      { mcpId: "memory", slug: "memory-context", role: "Preserve approved facts and relationships in a local knowledge graph" },
      { mcpId: "filesystem", slug: "file-systems-storage", role: "Keep the original approved source files available" },
      { mcpId: "chroma", slug: "databases", role: "Retrieve relevant documents from the chosen Chroma collection" }
    ]
  }
] as const;

export type StackRecommendation = {
  role: string;
  mcp: McpServer;
};

export function isStackGoalId(value: string | undefined): value is StackGoalId {
  return stackGoals.some((goal) => goal.id === value);
}

export function getStackGoal(goalId: StackGoalId) {
  return stackGoals.find((goal) => goal.id === goalId)!;
}

export function getStackRecommendations(goalId: StackGoalId): StackRecommendation[] {
  const goal = getStackGoal(goalId);
  const selected = new Set<string>();

  // Pick the reviewed capability for the task, not the first alphabetic/featured
  // entry in a broad category. The build gate exercises these IDs in the real catalog.
  return goal.categories.flatMap(({ mcpId, slug, role }) => {
    const match = sortedMcps.find((mcp) => mcp.id === mcpId && mcp.category === slug && !selected.has(mcp.id));

    if (!match) {
      return [];
    }

    selected.add(match.id);
    return [{ role, mcp: match }];
  });
}

export function buildStackBrief(goalId: StackGoalId): string {
  const goal = getStackGoal(goalId);
  const recommendations = getStackRecommendations(goalId);
  const stack = recommendations
    .map(({ role, mcp }, index) => [
      `${index + 1}. ${mcp.name} — ${role}`,
      `   EveryMCP: ${siteUrl}/mcp/${mcp.slug}`,
      `   Source: ${mcp.repo}`,
    ].join("\n"))
    .join("\n\n");

  return [
    `MCP stack: ${goal.label}`,
    goal.outcome,
    "",
    stack,
    "",
    "First proof:",
    `Task: ${goal.proof.task}`,
    `Success: ${goal.proof.success}`,
    `Stop: ${goal.proof.stop}`,
    "",
    "First integration sequence:",
    "1. Verify the first server's source, auth model, and tools against the exact workflow.",
    "2. Connect the smallest read-only capability that can complete one useful task.",
    "3. Write the expected result and rollback step before adding the next server.",
  ].join("\n");
}
