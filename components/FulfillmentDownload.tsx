"use client";

import { track } from "@vercel/analytics";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchStarterKit } from "@/lib/starter-kit-download";

export function FulfillmentDownload({ href }: { href: string }) {
  const [state, setState] = useState<"idle" | "loading" | "downloaded" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
  async function download() {
    setState("loading"); setError(null);
    track("starter_kit_download_requested");
    try {
      const body = await fetchStarterKit(href);
      const objectUrl = URL.createObjectURL(body);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "everymcp-mcp-integration-starter-kit.md";
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setState("downloaded");
      track("starter_kit_download_received");
    } catch (failure) {
      setState("failed");
      setError(failure instanceof Error ? failure.message : "Download unavailable. Retry here; you do not need to pay again.");
      track("starter_kit_download_failed");
    }
  }
  return (
    <div className="space-y-3 text-center">
      <Button onClick={download} disabled={state === "loading"} className="h-auto rounded-full px-5 py-2.5 font-bold">
        {state === "loading" ? "Preparing download..." : state === "failed" ? "Retry your download" : state === "downloaded" ? "Download again" : "Download your starter kit"}
      </Button>
      <p role="status" className="max-w-lg text-sm text-muted-foreground">{error || (state === "downloaded" ? "Your kit was received by this browser. Save the file and keep this checkout return link for another download." : "Keep this checkout return link until you have saved your kit.")}</p>
      <noscript><Button asChild variant="outline"><a href={href}>Download the kit without JavaScript</a></Button></noscript>
    </div>
  );
}
