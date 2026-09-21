export function isTransientStripeFailure(type: string | undefined, statusCode: number | undefined) {
  return (
    type === "StripeConnectionError" ||
    type === "StripeAPIError" ||
    type === "StripeRateLimitError" ||
    statusCode === 429 ||
    (typeof statusCode === "number" && statusCode >= 500)
  );
}

export function isConfigurationStripeFailure(type: string | undefined) {
  return type === "StripeAuthenticationError" || type === "StripePermissionError";
}
