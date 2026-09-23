"use client";

import Link from "next/link";
import { useEffect } from "react";
import { track } from "@vercel/analytics";
import type { StackGoalId } from "@/lib/stack-planner";

export function StackPlanResultTracker({ goal }: { goal: StackGoalId }) {
  useEffect(() => {
    track("stack_plan_generated", { goal });
  }, [goal]);

  return null;
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
