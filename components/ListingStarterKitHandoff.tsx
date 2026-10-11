"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";

export function ListingStarterKitHandoff({ slug }: { slug: string }) {
  return <Button asChild variant="secondary" className="mt-3 h-auto whitespace-normal py-3"><Link href="/pricing?source=listing#starter-kit" onClick={() => track("listing_starter_kit_clicked", { listing: slug })}>Review the rollout packet — $49</Link></Button>;
}
