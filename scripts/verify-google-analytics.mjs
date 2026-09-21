import { readFile } from "node:fs/promises";

const component = await readFile("components/GoogleAnalytics.tsx", "utf8");
const layout = await readFile("app/layout.tsx", "utf8");

const required = [
  ["NEXT_PUBLIC_GA_MEASUREMENT_ID", component.includes("NEXT_PUBLIC_GA_MEASUREMENT_ID")],
  ["pathname-only page path", component.includes("usePathname") && component.includes("page_path: path")],
  ["query/hash stripping", component.includes('split("?")[0].split("#")[0]')],
  ["manual page-view control", component.includes("send_page_view: false")],
  ["privacy signals disabled", component.includes("allow_google_signals: false") && component.includes("allow_ad_personalization_signals: false")],
  ["root layout wiring", layout.includes("<GoogleAnalytics />")]
];

const forbidden = ["useSearchParams", "session_id", "user_id", "email", "document.location.search", "window.location.search"];
const failures = required.filter(([, present]) => !present).map(([name]) => name);
const forbiddenMatches = forbidden.filter((value) => component.includes(value));

if (forbiddenMatches.length > 0) {
  failures.push(`forbidden payload terms: ${forbiddenMatches.join(", ")}`);
}

if (failures.length > 0) {
  console.error(`GOOGLE_ANALYTICS_CONTRACT FAILED ${failures.join("; ")}`);
  process.exit(1);
}

console.log(
  `GOOGLE_ANALYTICS_CONTRACT ${JSON.stringify({
    passed: true,
    publicRoutePath: true,
    queryAndHashStripped: true,
    customPiiPayload: false
  })}`
);
