"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import type { StackGoalId } from "@/lib/stack-planner";

export function StackPlanResultTracker({ goal }: { goal: StackGoalId }) {
  useEffect(() => { track("stack_plan_generated", { goal }); }, [goal]);
  return null;
}

export function CopyStackBrief({ goal, brief }: { goal: StackGoalId; brief: string }) {
  const [copied, setCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true); setManualCopy(false);
      track("stack_plan_brief_copied", { goal });
      window.setTimeout(() => setCopied(false), 2500);
    } catch { setCopied(false); setManualCopy(true); }
  }
  return (
    <div className="min-w-0">
      <Button type="button" variant="outline" onClick={copyBrief} className="h-12 rounded-full px-5 font-bold">
        {copied ? "Copied stack brief" : "Copy stack brief"}
      </Button>
      {manualCopy ? <div className="mt-3"><p role="status" className="text-sm">Clipboard access is unavailable. Select and copy the brief below.</p><pre tabIndex={0} aria-label="Portable stack brief for copying" className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 text-xs leading-6">{brief}</pre></div> : null}
    </div>
  );
}

export function StarterKitHandoff({ goal }: { goal: StackGoalId }) {
  return <Button asChild variant="secondary" className="h-auto whitespace-normal rounded-full px-6 py-3 text-center font-bold"><Link href={`/pricing?source=stack-planner&goal=${encodeURIComponent(goal)}#starter-kit`} onClick={() => track("stack_plan_starter_kit_clicked", { goal })}>Turn this into a rollout packet — $49</Link></Button>;
}
