import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[55vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">404</p>
      <h1 className="mt-3 text-4xl font-extrabold text-ink">Page Not Found</h1>
      <p className="mt-4 text-sm text-slate-600">
        The page you requested does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-sky hover:text-sky"
      >
        Back to homepage
      </Link>
    </section>
  );
}
