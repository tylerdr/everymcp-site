import type { Metadata } from "next";
import Link from "next/link";
import { FulfillmentDownload } from "@/components/FulfillmentDownload";
import { verifyPaidSession } from "@/lib/stripe-fulfillment";

type SearchParams = {
  session_id?: string;
};

type FulfillmentState = "paid" | "missing" | "unavailable" | "invalid" | "not_paid";

export const metadata: Metadata = {
  title: "Checkout Complete",
  description: "Your EveryMCP checkout is complete.",
  alternates: {
    canonical: "/checkout/success"
  }
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const result = await verifyPaidSession(searchParams.session_id?.trim() || null, "starter");
  const state: FulfillmentState = result.status;

  if (state === "paid" && searchParams.session_id) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6">
        <p className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Payment verified
        </p>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink">Your starter kit is ready.</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Stripe confirmed your payment. Download the MCP Integration Starter Kit immediately; the link can be retried if your browser interrupts the download.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <FulfillmentDownload href={`/api/fulfillment/starter-kit?session_id=${encodeURIComponent(searchParams.session_id)}`} />
          <Link
            href="/directory"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky hover:text-sky"
          >
            Continue browsing directory
          </Link>
        </div>
      </section>
    );
  }

  const message =
    state === "missing"
      ? "Open this page from a completed checkout to receive your download."
      : state === "unavailable"
        ? "Checkout verification is temporarily unavailable. Refresh this page later; no download is unlocked until payment is verified."
        : state === "not_paid"
          ? "Payment is still pending or was not completed. No download is unlocked yet."
          : "This checkout link is invalid or expired. No download is unlocked.";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6">
      <p className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
        Delivery pending
      </p>
      <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink">We couldn&apos;t unlock the kit.</h1>
      <p className="mt-4 text-base leading-7 text-slate-600">{message}</p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/pricing#starter-kit"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky"
        >
          Return to pricing
        </Link>
        <Link
          href="/directory"
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky hover:text-sky"
        >
          Browse directory
        </Link>
      </div>
    </section>
  );
}
