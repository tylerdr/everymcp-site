import { redirect } from "next/navigation";

export default function BrowsePage({
  searchParams
}: {
  searchParams: { q?: string; category?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.category) params.set("category", searchParams.category);
  const qs = params.toString();
  redirect(qs ? `/directory?${qs}` : "/directory");
}
