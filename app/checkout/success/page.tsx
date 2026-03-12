import type { Metadata } from "next";
import Link from "next/link";

type SearchParams = {
  plan?: string;
};

export const metadata: Metadata = {
  title: "Checkout Complete",
  description: "Your EveryMCP checkout is complete.",
  alternates: {
    canonical: "/checkout/success"
  }
};

export default function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const plan = searchParams.plan === "sponsor" ? "Sponsor Placement" : "Implementation Package";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6">
      <p className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
        Payment received
      </p>
      <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink">You&apos;re in.</h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        Thanks for purchasing the <strong>{plan}</strong>. We&apos;ll follow up via email with next steps.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/directory"
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky hover:text-sky"
        >
          Continue browsing directory
        </Link>
        <Link
          href="/services"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky"
        >
          Book implementation call
        </Link>
      </div>
    </section>
  );
}
