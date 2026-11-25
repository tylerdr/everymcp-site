import type { SqlPool } from "@/lib/recovery/postgres-store";
import { z } from "zod";
import { canonicalJson } from "./source-contract";
import { MonitoringUnavailable, type Job } from "./runtime";
import { PostgresCustodyCore, type PostgresCustodyConfiguration } from "./postgres-custody-core";
import { serviceStartSchema, serviceReceiptSchema, serviceJobIdentity, type ServiceStart, type ServiceOriginal } from "./service-records";
import type { ServiceVerifier } from "./service-authority";

/** Service-origin records require a separately bound authoritative verifier. */
export class ServicePostgresCustodyStore extends PostgresCustodyCore<ServiceStart, z.infer<typeof serviceReceiptSchema>, ServiceOriginal> {
  constructor(pool: SqlPool, config: PostgresCustodyConfiguration, private readonly verifier: ServiceVerifier) {
    super(pool, config);
    if (!verifier || !canonicalJson(verifier.scope).equals(canonicalJson(config.scope))) throw new MonitoringUnavailable("Monitoring custody unavailable");
  }
  protected parseStart(input: unknown): ServiceStart {
    const start = serviceStartSchema.parse(input);
    if (!this.verifier.verifyStart(start)) throw new MonitoringUnavailable("Monitoring custody unavailable");
    return start;
  }
  protected parseReceipt(input: unknown) { return serviceReceiptSchema.parse(input); }
  protected identity(job: Job) { return serviceJobIdentity(job); }
  protected validateOriginal(input: ServiceOriginal): void {
    if (!this.verifier.verifyOriginal(input)) throw new MonitoringUnavailable("Monitoring custody unavailable");
  }
}
