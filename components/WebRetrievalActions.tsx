"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Resource = "worksheet" | "offer" | "planner";

function recordIntent(resource: Resource) {
  try {
    track("web_retrieval_resource_clicked", { article: "web-scraping", resource });
  } catch {
    // Optional telemetry must never interrupt navigation or the free download.
  }
}

export function WebRetrievalActions({ kind }: { kind: Resource }) {
  if (kind === "worksheet") {
    return <Button asChild className="mt-5 h-auto whitespace-normal py-3"><a href="/samples/web-retrieval-evaluation.md" download onClick={() => recordIntent(kind)}>Download the free evaluation worksheet</a></Button>;
  }

  const offer = kind === "offer";
  return (
    <Button asChild variant={offer ? "default" : "outline"} className={cn("h-auto whitespace-normal py-3", !offer && "text-foreground")}>
      <Link href={offer ? "/pricing#kit-preview" : "/plan"} onClick={() => recordIntent(kind)}>
        {offer ? "Review the starter kit sample and price" : "Build a free starting stack"}
      </Link>
    </Button>
  );
}
