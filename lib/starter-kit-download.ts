export async function fetchStarterKit(href: string, fetcher: typeof fetch = fetch): Promise<Blob> {
  const response = await fetcher(href, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(response.status === 403
      ? "Payment could not be verified. Keep your checkout return link and retry after payment completes."
      : "The download is temporarily unavailable. Retry here; you do not need to pay again.");
  }
  if (!response.headers.get("content-type")?.startsWith("text/markdown")) {
    throw new Error("The server did not return your kit. Retry here; you do not need to pay again.");
  }
  const body = await response.blob();
  if (!body.size || body.size > 1_000_000 || !(await body.text()).startsWith("# EveryMCP MCP Integration Starter Kit")) {
    throw new Error("The kit download was incomplete. Retry here; you do not need to pay again.");
  }
  return body;
}
