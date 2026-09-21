import Stripe from "stripe";

export type StripeMode = "test" | "live";

export type StripeConfiguration = {
  client: Stripe;
  mode: StripeMode;
  accountId: string;
};

export type StripeRecoveryConfiguration = {
  client: Stripe;
  mode: StripeMode;
  accountId?: string;
};

type AccountCheck = "valid" | "unavailable" | "mismatch";

const accountChecks = new Map<string, Promise<AccountCheck>>();

function expectedKeyPrefix(mode: StripeMode) {
  return mode === "live" ? "sk_live_" : "sk_test_";
}

function inferModeFromKey(secretKey: string): StripeMode | null {
  if (secretKey.startsWith("sk_live_")) {
    return "live";
  }

  if (secretKey.startsWith("sk_test_")) {
    return "test";
  }

  return null;
}

export function getStripeConfiguration(): StripeConfiguration | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const configuredMode = process.env.STRIPE_MODE?.trim().toLowerCase();
  const accountId = process.env.STRIPE_ACCOUNT_ID?.trim();

  if (
    !secretKey ||
    (configuredMode !== "test" && configuredMode !== "live") ||
    !accountId ||
    !secretKey.startsWith(expectedKeyPrefix(configuredMode))
  ) {
    return null;
  }

  return {
    client: new Stripe(secretKey),
    mode: configuredMode,
    accountId
  };
}

export function isStripeCheckoutConfigured() {
  return getStripeConfiguration() !== null;
}

/**
 * Transitional read-only recovery for sessions created before the strict
 * mode/account environment variables were added. It never enables checkout.
 */
export function getStripeRecoveryConfiguration(): StripeRecoveryConfiguration | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const configuredMode = process.env.STRIPE_MODE?.trim().toLowerCase();
  const inferredMode = inferModeFromKey(secretKey || "");
  const mode = configuredMode === "test" || configuredMode === "live" ? configuredMode : inferredMode;
  const accountId = process.env.STRIPE_ACCOUNT_ID?.trim() || undefined;

  if (!secretKey || !mode || !secretKey.startsWith(expectedKeyPrefix(mode))) {
    return null;
  }

  return {
    client: new Stripe(secretKey),
    mode,
    accountId
  };
}

export function isTransientStripeError(error: unknown) {
  if (!(error instanceof Stripe.errors.StripeError)) {
    return false;
  }

  return (
    error.type === "StripeConnectionError" ||
    error.type === "StripeAPIError" ||
    error.type === "StripeRateLimitError" ||
    error.statusCode === 429 ||
    (typeof error.statusCode === "number" && error.statusCode >= 500)
  );
}

export function isStripeNotFoundError(error: unknown) {
  return error instanceof Stripe.errors.StripeInvalidRequestError && error.statusCode === 404;
}

export function isStripeConfigurationError(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeError &&
    (error.type === "StripeAuthenticationError" || error.type === "StripePermissionError")
  );
}

export async function verifyStripeAccount(configuration: StripeConfiguration): Promise<AccountCheck> {
  const cacheKey = `${configuration.mode}:${configuration.accountId}`;
  const cached = accountChecks.get(cacheKey);
  if (cached) {
    return cached;
  }

  const check = configuration.client.accounts
    .retrieve()
    .then((account) => (account.id === configuration.accountId ? "valid" : "mismatch"))
    .catch((error: unknown) => (isTransientStripeError(error) ? "unavailable" : "mismatch"));

  accountChecks.set(cacheKey, check);
  return check;
}
