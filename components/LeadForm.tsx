"use client";

type LeadFormProps = {
  compact?: boolean;
  className?: string;
  intent?: string;
  messagePlaceholder?: string;
  submitLabel?: string;
  successMessage?: string;
};

export function LeadForm({ className = "", intent }: LeadFormProps) {
  const subject = encodeURIComponent(`EveryMCP ${intent || "implementation"} inquiry`);
  return (
    <section className={`space-y-4 ${className}`}>
      <p className="text-sm text-slate-700">Online inquiries are temporarily unavailable. Email Tai a short summary of your project for manual review.</p>
      <a className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-sky" href={`mailto:tai@sprinterconsulting.com?subject=${subject}`}>Email about EveryMCP</a>
      <p className="text-sm text-slate-600">This opens your email app. No request is saved or sent until you send the email.</p>
    </section>
  );
}
