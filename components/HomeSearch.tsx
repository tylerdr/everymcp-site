"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function HomeSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = (query.trim() ? `/directory?q=${encodeURIComponent(query.trim())}` : "/directory") as Route;
    router.push(target);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, category, or tags"
        className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm text-slate-900 outline-none ring-sky focus:border-sky focus:ring-2"
      />
      <button className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-sky">
        Search MCPs
      </button>
    </form>
  );
}
