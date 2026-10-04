import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "MCP Enterprise Consulting",
  description: "Share complex enterprise MCP requirements. Consulting availability, scope, and engagement terms require separate confirmation.",
  alternates: { canonical: "/services" }
};

export default function ServicesPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-12 sm:px-6 text-foreground">
      <div className="grid gap-8 lg:grid-cols-2">
        <article className="rounded-3xl border border-border bg-background p-6 shadow-soft sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Enterprise consulting</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Complex MCP requirements?</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Start with the free planner and source documentation. If your enterprise workflow needs a separate discussion, share your context through the inquiry form.
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Consulting availability, scope, timing, and any engagement terms require separate confirmation. Submitting context does not book implementation or a consultation.
          </p>
          <Button asChild variant="outline" className="mt-6 h-auto whitespace-normal py-3"><Link href="/plan">Build a free starting stack</Link></Button>
          <p className="mt-6 text-sm text-muted-foreground"><Link href="#implementation-inquiry" className="text-primary underline underline-offset-4">Share enterprise consulting context</Link></p>
        </article>
        <article id="implementation-inquiry" className="rounded-3xl border border-border bg-background p-6 shadow-soft sm:p-8">
          <h2 className="text-2xl font-extrabold">Share your context</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            This form requests the existing catalog methodology resource and records your context when online capture is available.
          </p>
          <LeadForm className="mt-6" intent="implementation" messagePlaceholder="What complex enterprise MCP requirement are you evaluating?" submitLabel="Request the resource and share context" />
        </article>
      </div>
    </section>
  );
}
