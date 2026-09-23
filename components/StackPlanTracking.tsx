"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import type { StackGoalId } from "@/lib/stack-planner";

export function StackPlanResultTracker({ goal }: { goal: StackGoalId }) {
  useEffect(() => {
    track("stack_plan_generated", { goal });
  }, [goal]);

  return null;
}

export function CopyStackBrief({ goal, brief }: { goal: StackGoalId; brief: string }) {
  const [copied, setCopied] = useState(false);

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      track("stack_plan_brief_copied", { goal });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyBrief}
      className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-sky hover:text-sky"
    >
      {copied ? "Copied stack brief" : "Copy stack brief"}
    </button>
  );
}

export function StarterKitHandoff({ goal }: { goal: StackGoalId }) {
  return (
    <Link
      href={`/pricing?source=stack-planner&goal=${encodeURIComponent(goal)}#starter-kit`}
      onClick={() => track("stack_plan_starter_kit_clicked", { goal })}
      className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-sky"
    >
      Turn this into a rollout packet — $49
    </Link>
  );
}
