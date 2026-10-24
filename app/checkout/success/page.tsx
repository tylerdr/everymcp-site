import type { Metadata } from "next";
import { headers } from "next/headers";
import { getStarterBinding } from "@/lib/recovery/binding";
import { receiptId } from "@/lib/recovery/entitlements";
import { buyerIntent, buyerSignIn, pricingIntent } from "@/lib/buyer/context";
import { siteUrl } from "@/lib/site";
import Link from "next/link";
import { FulfillmentDownload } from "@/components/FulfillmentDownload";
import { verifyPaidSession } from "@/lib/stripe-fulfillment";

type SearchParams = {
  session_id?: string;
};

type FulfillmentState = "paid" | "missing" | "unavailable" | "invalid" | "not_paid" | "revoked";

export const metadata: Metadata = {
  title: "Checkout status",
  robots: { index: false, follow: true },
  description: "Check payment verification and starter kit delivery status.",
  alternates: {
    canonical: "/checkout/success"
  }
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const result = await verifyPaidSession(searchParams.session_id?.trim() || null, "starter");
  const state: FulfillmentState = result.status;
  let signInHref: string | undefined;
  if (result.status === "paid" && result.session.metadata && ["fulfillment_owner", "fulfillment_auth_project", "pricing_policy"].some((key) => key in result.session.metadata!)) {
    const binding = getStarterBinding();
    const returnTo = binding ? "/buyer/purchases?receipt=" + receiptId(binding.scope, result.session.id) : "/buyer/purchases";
    signInHref = buyerSignIn(returnTo);
    const principal = binding ? await binding.authenticate(new Request(siteUrl + "/checkout/success", { headers: { cookie: headers().get("cookie") || "" } })).catch(() => undefined) : null;
    if (!binding || !principal || principal.ownerKey !== result.session.metadata.fulfillment_owner) {
      return <section className="mx-auto max-w-xl space-y-5 px-4 py-16 text-foreground"><h1 className="text-3xl font-bold">Your payment was verified</h1><p>{binding && principal !== undefined ? "Sign in with the email used for this purchase to recover your original packet." : "Packet delivery or buyer verification is temporarily unavailable. Keep this checkout return link and retry later."} You do not need to pay again.</p><Link href={signInHref} className="underline">Sign in to recover your purchase</Link></section>;
    }
  }
  const intent = result.status === "paid" ? buyerIntent({source: result.session.metadata?.acquisition_source, listing: result.session.metadata?.acquisition_listing, goal: result.session.metadata?.acquisition_goal}) : {};

  if (state === "paid" && searchParams.session_id) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6">
        <p className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Payment verified
        </p>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink">Your starter kit is ready.</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {signInHref ? "Stripe confirmed your payment. Download your original starter kit here or recover it later with your verified buyer email." : "Stripe confirmed your payment. Download the MCP Integration Starter Kit before leaving this page; the link can be retried if your browser interrupts the download."}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <FulfillmentDownload href={`/api/fulfillment/starter-kit?session_id=${encodeURIComponent(searchParams.session_id)}`} signInHref={signInHref} />
          <Link href={pricingIntent(intent)} className="underline">Return to your offer</Link>
          <Link href="/buyer/purchases" className="rounded-full border border-border px-5 py-2.5 text-foreground">Recover your purchases</Link>
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
        : state === "revoked"
          ? "Access is unavailable because this payment was refunded or disputed. Your original purchase record is preserved. Contact support if this looks incorrect."
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
        <Link href="/buyer/purchases" className="rounded-full border border-border px-5 py-2.5 text-foreground">Recover a purchase</Link>
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
