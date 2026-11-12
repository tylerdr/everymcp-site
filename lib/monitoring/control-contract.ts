import { z } from "zod";
import { MonitoringUnavailable, scopeSchema, type Scope } from "./runtime";
import { checkServiceJob, serviceDateSchema, serviceJobIdentity, serviceJobSchema } from "./service-records";
import { canonicalJson, sha256 } from "./source-contract";

export const CONTROL_POLICY = "everymcp-owned-monitoring-v1";
export const RIGHTS_POLICY = "current-paid-subscription-v1";
export const controlHash = z.string().regex(/^[a-f0-9]{64}$/);
const providerId = (prefix: string) => z.string().regex(new RegExp("^" + prefix + "_[A-Za-z0-9]{1,100}$"));
export const watchlistInputSchema = z.object({ expectedVersion: z.number().int().min(0).max(2147483646), mutationId: z.string().uuid().toLowerCase(), slugs: z.array(z.string().regex(/^[a-z0-9][a-z0-9._-]{0,100}$/)).min(1).max(2), enabled: z.boolean() }).strict();
export const watchlistSchema = z.object({ scope: scopeSchema, ownerKey: controlHash, watchlistId: controlHash, version: z.number().int().min(1).max(2147483647), mutationId: z.string().uuid(), requestSha256: controlHash, slugs: watchlistInputSchema.shape.slugs, enabled: z.boolean(), configuredAt: serviceDateSchema, inventorySha256: controlHash, sourceUrls: z.array(z.string().url()).min(1).max(2) }).strict();
export type Watchlist = z.infer<typeof watchlistSchema>;
export type SaveWatchlist = z.infer<typeof watchlistInputSchema> & Pick<Watchlist, "ownerKey" | "configuredAt" | "inventorySha256" | "sourceUrls">;
export const billingBindingSchema = z.object({ scope: scopeSchema, ownerKey: controlHash, customerId: providerId("cus"), subscriptionId: providerId("sub"), enabled: z.boolean() }).strict();
export type BillingBinding = z.infer<typeof billingBindingSchema>;
export const billingAuthorizationSchema = z.object({ policy: z.literal(RIGHTS_POLICY), scope: scopeSchema, ownerKey: controlHash, customerId: providerId("cus"), subscriptionId: providerId("sub"), invoiceId: providerId("in"), periodStart: serviceDateSchema, periodEnd: serviceDateSchema }).strict();
export type BillingAuthorization = z.infer<typeof billingAuthorizationSchema>;
export const coverageSchema = z.object({ expectedPeriods: z.number().int().min(0).max(32), availablePeriods: z.number().int().min(0).max(32), missingPeriodEnds: z.array(serviceDateSchema).max(32), state: z.enum(["complete", "gaps"]) }).strict().refine(value => value.expectedPeriods === value.availablePeriods + value.missingPeriodEnds.length && new Set(value.missingPeriodEnds).size === value.missingPeriodEnds.length && value.state === (value.missingPeriodEnds.length ? "gaps" : "complete"));
export const canonicalJobSchema = z.object({ jobId: controlHash, job: serviceJobSchema, watchlistSha256: controlHash, inventorySha256: controlHash, createdAt: serviceDateSchema, expiresAt: serviceDateSchema, authorization: billingAuthorizationSchema, coverage: coverageSchema }).strict();
export type CanonicalJob = z.infer<typeof canonicalJobSchema>;
export type ControlAccess = "configure" | "produce" | "recover";
export interface MonitoringControlStore {
  readonly scope: Scope;
  getWatchlist(ownerKey: string): Promise<Watchlist | null>;
  getVersion(ownerKey: string, version: number): Promise<Watchlist | null>;
  getMutation(ownerKey: string, mutationId: string): Promise<Watchlist | null>;
  saveWatchlist(input: SaveWatchlist): Promise<Watchlist>;
  getBinding(ownerKey: string): Promise<BillingBinding | null>;
  getCanonicalJob(id: string): Promise<CanonicalJob | null>;
  putCanonicalJob(record: CanonicalJob): Promise<CanonicalJob>;
}
export class WatchlistConflict extends Error {}
export const controlEqual = (a: unknown, b: unknown) => canonicalJson(a).equals(canonicalJson(b));
export function ownedWatchlistId(scope: Scope, ownerKey: string): string { return sha256(canonicalJson([CONTROL_POLICY, scopeSchema.parse(scope), controlHash.parse(ownerKey)])); }
export function watchlistRequestHash(input: SaveWatchlist): string {
  return sha256(canonicalJson(watchlistInputSchema.parse({ expectedVersion: input.expectedVersion, mutationId: input.mutationId, slugs: input.slugs, enabled: input.enabled })));
}
export function validateWatchlist(input: unknown, scope: Scope): Watchlist {
  const row = watchlistSchema.parse(input);
  if (!controlEqual(row.scope, scope) || row.watchlistId !== ownedWatchlistId(scope, row.ownerKey) || !controlEqual(row.slugs, [...new Set(row.slugs)].sort()) || new Set(row.sourceUrls).size !== row.sourceUrls.length || new Set(row.sourceUrls.map(url => new URL(url).hostname)).size !== 1) throw new MonitoringUnavailable("Watchlist integrity unavailable");
  return row;
}
export function validateCanonicalJob(input: unknown, scope: Scope): CanonicalJob {
  const row = canonicalJobSchema.parse(input), auth = row.authorization;
  checkServiceJob(row.job, row.createdAt);
  if (!controlEqual(row.job.scope, scope) || !controlEqual(auth.scope, scope) || auth.ownerKey !== row.job.ownerKey || row.jobId !== serviceJobIdentity(row.job) || row.job.watchlistId !== ownedWatchlistId(scope, row.job.ownerKey) || Date.parse(row.expiresAt) <= Date.parse(row.createdAt) || Date.parse(row.expiresAt) - Date.parse(row.createdAt) > 86400000 || Date.parse(auth.periodStart) >= Date.parse(auth.periodEnd)) throw new MonitoringUnavailable("Canonical job integrity unavailable");
  return row;
}
