import { createPrivateKey, createPublicKey, sign, timingSafeEqual, verify, type KeyObject } from "node:crypto";
import { z } from "zod";
import { MonitoringUnavailable, scopeSchema, type Scope, type WorkerPrincipal } from "./runtime";
import { canonicalJson, sha256, timestamp } from "./source-contract";
import { sameServiceValue, serviceDateSchema, serviceNameSchema, serviceStartSchema, serviceReceiptSchema, unsignedServiceStartSchema, unsignedServiceReceiptSchema, validateServiceOriginal, validateServiceStart, type ServiceAuthorization, type ServiceOriginal, type ServiceStart, type ServiceReceipt, type UnsignedServiceStart, type UnsignedServiceReceipt } from "./service-records";

const pem = z.string().min(1).max(8192);
const keySchema = z.object({ keyId: serviceNameSchema, publicKey: pem, validFrom: serviceDateSchema, validUntil: serviceDateSchema, revoked: z.boolean(), fixtureOnly: z.boolean() }).strict();
const configSchema = z.object({ scope: scopeSchema, serviceId: serviceNameSchema, evidenceClass: z.enum(["synthetic-fixture", "server-collection"]), keys: z.array(keySchema).min(1).max(16) }).strict();
export type ServiceVerifierConfiguration = z.infer<typeof configSchema>;
export type ServiceVerifier = Readonly<{ scope: Scope; serviceId: string; evidenceClass: "synthetic-fixture" | "server-collection"; verifyStart(start: ServiceStart): boolean; verifyOriginal(original: ServiceOriginal): boolean }>;
export type ServiceProducer = Readonly<{ verifier: ServiceVerifier; authenticateWorker(request: Request): Promise<WorkerPrincipal | null>; authorization(at: string): ServiceAuthorization; signStart(start: UnsignedServiceStart): ServiceStart; signReceipt(start: ServiceStart, receipt: UnsignedServiceReceipt): ServiceReceipt }>;
// Published RFC8032 vectors are never acceptable production authority, even if mislabeled.
const PUBLIC_FIXTURE_KEYS = new Set(["d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a", "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c"]);
const unavailable = () => new MonitoringUnavailable("Service-recorded authority unavailable");
const domains = { start: "everymcp-service-recorded:start:v1\0", receipt: "everymcp-service-recorded:completion:v1\0" } as const;
function signedBytes(kind: keyof typeof domains, input: object): Buffer {
  const bytes = canonicalJson(input);
  if (bytes.length > 65536) throw unavailable();
  return Buffer.concat([Buffer.from(domains[kind], "utf8"), bytes]);
}
function rawPublic(key: KeyObject): string { return (key.export({ type: "spki", format: "der" }) as Buffer).subarray(-32).toString("hex"); }
function unsigned<T extends { signature: string }>(value: T): Omit<T, "signature"> { const { signature, ...body } = value; void signature; return body; }
function registry(configuration: ServiceVerifierConfiguration) {
  const config = configSchema.parse(configuration);
  if (config.evidenceClass === "synthetic-fixture" && config.scope.mode !== "test") throw unavailable();
  const keys = new Map<string, z.infer<typeof keySchema> & { publicObject: KeyObject }>();
  for (const row of config.keys) {
    if (!/^-----BEGIN PUBLIC KEY-----\r?\n(?:[A-Za-z0-9+/=]+\r?\n)+-----END PUBLIC KEY-----\r?\n?$/.test(row.publicKey)) throw unavailable();
    const publicObject = createPublicKey(row.publicKey);
    if (publicObject.asymmetricKeyType !== "ed25519" || keys.has(row.keyId) || timestamp(row.validFrom) >= timestamp(row.validUntil) || row.fixtureOnly !== (config.evidenceClass === "synthetic-fixture") || !row.fixtureOnly && PUBLIC_FIXTURE_KEYS.has(rawPublic(publicObject))) throw unavailable();
    keys.set(row.keyId, { ...row, publicObject });
  }
  const scope = Object.freeze({ ...config.scope });
  function keyFor(start: ServiceStart) {
    const checked = validateServiceStart(start), row = keys.get(checked.runtime.keyId);
    if (!row || row.revoked || checked.runtime.serviceId !== config.serviceId || !sameServiceValue(checked.job.scope, scope) || checked.evidenceClass !== config.evidenceClass || checked.runtime.validFrom !== row.validFrom || checked.runtime.validUntil !== row.validUntil) throw unavailable();
    return row;
  }
  const verifier: ServiceVerifier = Object.freeze({ scope, serviceId: config.serviceId, evidenceClass: config.evidenceClass,
    verifyStart(input: ServiceStart) {
      try { const start = validateServiceStart(input), key = keyFor(start); return verify(null, signedBytes("start", unsigned(start)), key.publicObject, Buffer.from(start.signature, "base64url")); } catch { return false; }
    },
    verifyOriginal(original: ServiceOriginal) {
      try { const { start, receipt } = validateServiceOriginal(original), key = keyFor(start); return verifier.verifyStart(start) && verify(null, signedBytes("receipt", unsigned(receipt)), key.publicObject, Buffer.from(receipt.signature, "base64url")); } catch { return false; }
    },
  });
  return { config, keys, verifier };
}
/** Public verification keys only. No signer, producer credential, remote JWKS or fallback. */
export function createServiceVerifier(config: ServiceVerifierConfiguration): ServiceVerifier { return registry(config).verifier; }

/** Server-only authority configuration. No key generation, environment lookup or hosted setup.
 * Signatures authenticate the trusted service's assertions, not platform/build/fetch truth or time.
 */
export function createServiceProducer(input: { verification: ServiceVerifierConfiguration; keyId: string; privateKey: string; producerToken: string }): ServiceProducer {
  const parsed = z.object({ verification: configSchema, keyId: serviceNameSchema, privateKey: pem, producerToken: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/) }).strict().parse(input);
  const { config, keys, verifier } = registry(parsed.verification), key = keys.get(parsed.keyId);
  const privateKey = createPrivateKey(parsed.privateKey);
  if (!key || key.revoked || privateKey.asymmetricKeyType !== "ed25519" || rawPublic(createPublicKey(privateKey)) !== rawPublic(key.publicObject)) throw unavailable();
  const token = Buffer.from(parsed.producerToken, "ascii");
  const workerKey = sha256(canonicalJson(["everymcp-service-producer-v1", config.scope, config.serviceId]));
  const authorization = (at: string): ServiceAuthorization => {
    if (timestamp(at) < timestamp(key.validFrom) || timestamp(at) > timestamp(key.validUntil)) throw unavailable();
    return { method: "authenticated-service-record-v1", authorityClass: key.fixtureOnly ? "synthetic-fixture" : "service-recorded", serviceId: config.serviceId, keyId: key.keyId, validFrom: key.validFrom, validUntil: key.validUntil };
  };
  return Object.freeze({ verifier, authorization,
    async authenticateWorker(request: Request): Promise<WorkerPrincipal | null> {
      const header = request.headers.get("authorization");
      if (request.method !== "POST" || request.headers.has("cookie") || !header || header.length > 135 || !/^Bearer [A-Za-z0-9_-]{43,128}$/.test(header)) return null;
      const supplied = Buffer.from(header.slice(7), "ascii");
      if (supplied.length !== token.length || !timingSafeEqual(supplied, token)) return null;
      return { scope: { ...config.scope }, workerKey };
    },
    signStart(input: UnsignedServiceStart): ServiceStart {
      const body = unsignedServiceStartSchema.parse(input);
      if (!sameServiceValue(body.runtime, authorization(body.startedAt)) || !sameServiceValue(body.job.scope, config.scope) || body.evidenceClass !== config.evidenceClass) throw unavailable();
      const start = serviceStartSchema.parse({ ...body, signature: sign(null, signedBytes("start", body), privateKey).toString("base64url") });
      if (!verifier.verifyStart(start)) throw unavailable(); return start;
    },
    signReceipt(start: ServiceStart, input: UnsignedServiceReceipt): ServiceReceipt {
      const body = unsignedServiceReceiptSchema.parse(input);
      if (!verifier.verifyStart(start) || !sameServiceValue(start.runtime, authorization(body.completedAt)) || body.startSha256 !== sha256(canonicalJson(start)) || !sameServiceValue(body.runtime, start.runtime) || body.executionId !== start.executionId || body.nonce !== start.nonce || body.jobId !== start.jobId || body.inventorySha256 !== start.inventorySha256 || body.evidenceClass !== start.evidenceClass || body.stage !== start.job.kind || body.startedAt !== start.startedAt || !sameServiceValue(body.inputReceiptIds, start.job.receiptIds)) throw unavailable();
      return serviceReceiptSchema.parse({ ...body, signature: sign(null, signedBytes("receipt", body), privateKey).toString("base64url") });
    },
  });
}
