import type { CategorySlug } from "@/data/categories";
import { sortedMcps, type McpServer } from "@/lib/mcps";

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
    slug: CategorySlug;
    role: string;
  }[];
};

export const stackGoals: readonly StackGoal[] = [
  {
    id: "research",
    label: "Research and answer faster",
    outcome: "Give an assistant fresh information, a place to reason over it, and a durable source of context.",
    proof: {
      task: "Answer one real research question using fresh source material and preserve the useful context for a second turn.",
      success: "The answer links back to the source material and the follow-up uses the saved context without asking you to restate it.",
      stop: "Stop if the assistant cannot show where the answer came from or the saved context changes the meaning of the source."
    },
    categories: [
      { slug: "web-search-research", role: "Find current source material" },
      { slug: "ai-ml-tools", role: "Add a specialized AI capability" },
      { slug: "memory-context", role: "Keep useful context available between steps" }
    ]
  },
  {
    id: "ship-software",
    label: "Ship software with an agent",
    outcome: "Give a coding agent access to the development surface, files, and application data it needs to complete real work.",
    proof: {
      task: "Have the agent inspect one repository issue, read the relevant files, and propose the smallest code change without writing anything.",
      success: "The proposal cites the actual files and constraints needed for the issue and can be reviewed before any write-capable tool is enabled.",
      stop: "Stop if the agent cannot ground the proposal in the repository or asks for broader access than the first task requires."
    },
    categories: [
      { slug: "development-tools", role: "Work with code and developer systems" },
      { slug: "file-systems-storage", role: "Read and organize project files" },
      { slug: "databases", role: "Reach structured application data" }
    ]
  },
  {
    id: "automate-ops",
    label: "Automate recurring operations",
    outcome: "Connect an agent to the conversations, browser steps, and cloud systems behind a repeatable operating workflow.",
    proof: {
      task: "Run one recurring workflow from its trigger through a read-only browser or cloud lookup and produce the exact handoff a teammate needs.",
      success: "The handoff contains the expected information with no manual copy-paste between the connected systems.",
      stop: "Stop if the workflow needs an unreviewed write, cannot recover from a missing input, or produces a handoff someone still has to reconstruct."
    },
    categories: [
      { slug: "communication", role: "Receive or send operational context" },
      { slug: "browser-automation", role: "Complete browser-based steps" },
      { slug: "cloud-services", role: "Connect the infrastructure behind the workflow" }
    ]
  },
  {
    id: "analyze-data",
    label: "Analyze business data",
    outcome: "Let an assistant reach the data, analysis layer, and infrastructure needed to answer a concrete business question.",
    proof: {
      task: "Ask one decision-relevant question with a known reference answer and have the assistant trace the result back to the source data.",
      success: "The result matches the reference answer and identifies the source records or query path used to produce it.",
      stop: "Stop if the answer cannot be reconciled to the source data or requires write access to complete the first analysis."
    },
    categories: [
      { slug: "databases", role: "Reach the source data" },
      { slug: "data-analysis", role: "Inspect metrics and reporting systems" },
      { slug: "cloud-services", role: "Connect supporting data infrastructure" }
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
      { slug: "memory-context", role: "Preserve useful working context" },
      { slug: "file-systems-storage", role: "Keep source files available" },
      { slug: "databases", role: "Store and retrieve structured facts" }
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

  return goal.categories.flatMap(({ slug, role }) => {
    const match = sortedMcps.find((mcp) => mcp.category === slug && !selected.has(mcp.id));

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
      `   EveryMCP: /mcp/${mcp.slug}`,
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
