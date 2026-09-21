import { createHash } from "node:crypto";

export const LEAD_RESOURCE_PATH = "/methodology";
export const LEAD_FOLLOW_UP_PATH = "/methodology";

const ALLOWED_INTENTS = new Set(["catalog", "implementation", "sponsor"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 2_000;
const PROVIDER_TIMEOUT_MS = 5_000;

export type LeadIntent = "catalog" | "implementation" | "sponsor";

export type LeadInput = {
  name: string;
  email: string;
  message: string;
  intent: LeadIntent;
  consent: true;
};

type LeadStorageConfig = {
  url: string;
  token: string;
};

export type LeadCaptureResult =
  | { status: "captured"; duplicate: false }
  | { status: "already_captured"; duplicate: true }
  | { status: "confirmation_unavailable"; saved: boolean; retryable: true }
  | { status: "unavailable"; reason: "unconfigured" | "transient" | "provider_rejected"; retryable: boolean };

type ProviderResponse = Record<string, unknown>;

function normalizedString(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function parseLeadInput(body: unknown): { ok: true; value: LeadInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Enter your name, email, and request." };
  }

  const record = body as Record<string, unknown>;
  const name = normalizedString(record.name);
  const email = normalizedString(record.email).toLowerCase();
  const message = normalizedString(record.message);
  const intentValue = normalizedString(record.intent) || "catalog";
  const intent = ALLOWED_INTENTS.has(intentValue) ? (intentValue as LeadIntent) : null;

  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: "Enter a name between 2 and 120 characters." };
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "Keep the request under 2,000 characters." };
  }
  if (!intent) {
    return { ok: false, error: "Choose a valid request type." };
  }
  if (record.consent !== true) {
    return { ok: false, error: "Confirm that you want the requested resource and follow-up." };
  }

  return { ok: true, value: { name, email, message, intent, consent: true } };
}

export function leadIdempotencyKey(input: Pick<LeadInput, "email" | "intent">) {
  return `everymcp-lead-${createHash("sha256").update(`${input.intent}:${input.email}`).digest("hex")}`;
}

function getLeadStorageConfig(): LeadStorageConfig | null {
  const rawUrl = process.env.EVERYMCP_LEAD_STORAGE_URL?.trim();
  const token = process.env.EVERYMCP_LEAD_STORAGE_TOKEN?.trim();
  if (!rawUrl || !token) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    const localDevelopment = process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !localDevelopment) {
      return null;
    }
    return { url: url.toString(), token };
  } catch {
    return null;
  }
}

function confirmationAccepted(payload: ProviderResponse | null) {
  const status = payload?.confirmation_status;
  return status === "accepted" || status === "queued" || status === "sent";
}

function providerPayload(input: LeadInput, idempotencyKey: string) {
  return {
    schema: "everymcp.lead.v1",
    source: "everymcp.com",
    idempotency_key: idempotencyKey,
    intent: input.intent,
    name: input.name,
    email: input.email,
    message: input.message,
    consent: true,
    resource_path: LEAD_RESOURCE_PATH,
    confirmation: {
      required: true,
      channel: "provider"
    }
  };
}

export async function captureLead(input: LeadInput): Promise<LeadCaptureResult> {
  const config = getLeadStorageConfig();
  if (!config) {
    return { status: "unavailable", reason: "unconfigured", retryable: true };
  }

  const idempotencyKey = leadIdempotencyKey(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(providerPayload(input, idempotencyKey)),
      signal: controller.signal,
      cache: "no-store"
    });
    const payload = (await response.json().catch(() => null)) as ProviderResponse | null;

    if ((response.ok || response.status === 409) && confirmationAccepted(payload)) {
      return response.status === 409
        ? { status: "already_captured", duplicate: true }
        : { status: "captured", duplicate: false };
    }
    if (response.ok || response.status === 409) {
      return { status: "confirmation_unavailable", saved: response.ok || response.status === 409, retryable: true };
    }
    if (response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500) {
      return { status: "unavailable", reason: "transient", retryable: true };
    }
    return { status: "unavailable", reason: "provider_rejected", retryable: false };
  } catch {
    return { status: "unavailable", reason: "transient", retryable: true };
  } finally {
    clearTimeout(timeout);
  }
}
