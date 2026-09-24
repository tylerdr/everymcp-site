import type { Metadata } from "next";
import Link from "next/link";
import { CopyStackBrief, StackPlanResultTracker, StarterKitHandoff } from "@/components/StackPlanTracking";
import { buildStackBrief, getStackGoal, getStackRecommendations, isStackGoalId, stackGoals } from "@/lib/stack-planner";

export const metadata: Metadata = {
  title: "MCP Stack Planner — EveryMCP",
  description: "Choose the outcome you want and get a concrete three-server MCP starting stack plus an integration sequence.",
  alternates: { canonical: "/plan" }
};

type PlannerPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PlannerPage({ searchParams }: PlannerPageProps) {
  const requestedGoal = firstParam(searchParams?.goal);
  const goalId = isStackGoalId(requestedGoal) ? requestedGoal : undefined;
  const goal = goalId ? getStackGoal(goalId) : undefined;
  const recommendations = goalId ? getStackRecommendations(goalId) : [];
  const stackBrief = goalId ? buildStackBrief(goalId) : "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Free MCP Stack Planner</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Start with the outcome. Leave with a stack.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Pick the job you want an agent to do. EveryMCP will turn the indexed catalog into a practical three-server starting point and a sensible first integration sequence.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <form method="get" action="/plan" className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-2 text-left text-sm font-bold text-ink">
            What do you want your agent to do?
            <select
              name="goal"
              defaultValue={goalId || ""}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none ring-sky focus:border-sky focus:ring-2"
            >
              <option value="" disabled>Choose an outcome</option>
              {stackGoals.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-sky px-6 py-3 text-sm font-bold text-white transition hover:bg-ink"
          >
            Build my stack
          </button>
        </form>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          This planner uses the current EveryMCP catalog and source links. Treat the stack as a shortlist to inspect, not an automatic install.
        </p>
      </section>

      {goal && goalId ? (
        <section className="mt-12" aria-live="polite">
          <StackPlanResultTracker goal={goalId} />
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">Your starting stack</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{goal.label}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">{goal.outcome}</p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {recommendations.map(({ role, mcp }, index) => (
              <article key={mcp.id} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky">Step {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{role}</p>
                <h3 className="mt-4 text-xl font-extrabold text-ink">{mcp.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{mcp.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm font-semibold">
                  <Link href={`/mcp/${mcp.slug}`} className="text-sky hover:text-ink">Inspect listing →</Link>
                  <a href={mcp.repo} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-sky">Source</a>
                </div>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-ink">Take the shortlist with you.</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Copy a portable brief with the selected servers, source links, role of each server, and the first integration sequence. Paste it into your coding agent, implementation ticket, or team notes.
              </p>
            </div>
            <CopyStackBrief goal={goalId} brief={stackBrief} />
          </div>

          <div className="mx-auto mt-8 grid max-w-4xl gap-6 rounded-3xl border border-sky/20 bg-sky/5 p-7 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky">Next 30 minutes</p>
              <h2 className="mt-2 text-2xl font-extrabold text-ink">Prove one useful path before connecting everything.</h2>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                <li><strong>1.</strong> Open the first listing and verify its source, auth model, and tools against your exact workflow.</li>
                <li><strong>2.</strong> Connect the smallest read-only capability that can complete one useful task.</li>
                <li><strong>3.</strong> Write the expected result and rollback step before you add the next server.</li>
              </ol>
            </div>
            <div className="md:text-right">
              <StarterKitHandoff goal={goalId} />
              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                The starter kit turns the shortlist into a reusable selection, permission, acceptance, and rollback packet.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto mt-12 max-w-3xl rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="text-2xl font-extrabold text-ink">A useful plan takes one choice.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Choose the job above and the planner will build the first stack immediately. No account or email is required.</p>
        </section>
      )}
    </main>
  );
}
