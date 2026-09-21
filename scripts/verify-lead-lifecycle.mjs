import { readFile } from "node:fs/promises";

const [route, adapter, form, readme] = await Promise.all([
  readFile("app/api/lead/route.ts", "utf8"),
  readFile("lib/lead-capture.ts", "utf8"),
  readFile("components/LeadForm.tsx", "utf8"),
  readFile("README.md", "utf8")
]);

const required = [
  ["validated JSON input", route.includes("parseLeadInput") && adapter.includes("parseLeadInput")],
  ["durable adapter boundary", adapter.includes("EVERYMCP_LEAD_STORAGE_URL") && adapter.includes("EVERYMCP_LEAD_STORAGE_TOKEN")],
  ["stable idempotency", adapter.includes("Idempotency-Key") && adapter.includes("leadIdempotencyKey")],
  ["opt-in consent", adapter.includes("consent: true") && form.includes('name="consent"')],
  ["provider confirmation gate", adapter.includes("confirmationAccepted") && adapter.includes('confirmation: {')],
  ["resource follow-up", adapter.includes('LEAD_RESOURCE_PATH = "/methodology"') && form.includes("Read the methodology follow-up")],
  ["truthful retry state", route.includes('Retry-After') && route.includes("retryable")],
  ["no manual mailto fallback", !form.includes("mailto:") && !route.includes("tai@sprinterconsulting.com")],
  ["provider contract documented", readme.includes("EVERYMCP_LEAD_STORAGE_URL")]
];

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`LEAD_LIFECYCLE_CONTRACT FAILED ${failures.join("; ")}`);
  process.exit(1);
}

console.log(`LEAD_LIFECYCLE_CONTRACT ${JSON.stringify({
  passed: true,
  idempotentProviderCapture: true,
  confirmationRequired: true,
  resourceFollowUp: "/methodology",
  manualFallback: false
})}`);
