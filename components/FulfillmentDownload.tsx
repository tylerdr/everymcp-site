"use client";

import { track } from "@vercel/analytics";

export function FulfillmentDownload({ href }: { href: string }) {
  return (
    <a
      href={href}
      onClick={() => track("starter_kit_download_requested")}
      className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky"
    >
      Download your starter kit
    </a>
  );
}
