const maximumBytes = 1_000_000;
const incomplete = "The kit download was incomplete. Retry here; you do not need to pay again.";

export async function fetchStarterKit(href: string, fetcher: typeof fetch = fetch, deadlineMs = 10_000): Promise<Blob> {
  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("The download timed out. Retry here; you do not need to pay again."));
      controller.abort();
      void reader?.cancel().catch(() => {});
    }, deadlineMs);
  });
  const bounded = <T>(operation: Promise<T>) => Promise.race([operation, deadline]);
  try {
    const response = await bounded(fetcher(href, { cache: "no-store", signal: controller.signal }));
    if (!response.ok) {
      throw new Error(response.status === 403
        ? "Payment could not be verified. Keep your checkout return link and retry after payment completes."
        : "The download is temporarily unavailable. Retry here; you do not need to pay again.");
    }
    const digest = response.headers.get("x-everymcp-artifact-sha256");
    if (!response.headers.get("content-type")?.startsWith("text/markdown") || !digest || !/^[a-f0-9]{64}$/.test(digest) || !response.body) {
      void response.body?.cancel().catch(() => {});
      throw new Error(incomplete);
    }
    reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await bounded(reader.read());
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) throw new Error(incomplete);
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // Digest binds the entire server representation; ordered sections also reject
    // a title-only or structurally incomplete representation from the producer.
    const sections = Array.from(content.matchAll(/^## ([1-7])\. .+$/gm), (match) => match[1]).join("");
    if (!content.startsWith("# EveryMCP MCP Integration Starter Kit\n") || sections !== "1234567" || !content.includes("\n## What this paid packet includes\n")) throw new Error(incomplete);
    const actual = Array.from(new Uint8Array(await bounded(crypto.subtle.digest("SHA-256", bytes))), (byte) => byte.toString(16).padStart(2, "0")).join("");
    if (actual !== digest) throw new Error(incomplete);
    return new Blob([bytes], { type: "text/markdown; charset=utf-8" });
  } finally {
    clearTimeout(timer);
    controller.abort();
    void reader?.cancel().catch(() => {});
  }
}
