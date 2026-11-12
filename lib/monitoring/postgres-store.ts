import type { SqlPool } from "@/lib/recovery/postgres-store";
import { jobIdentity, receiptSchema, startSchema, type CustodyStore, type ExecutionStart, type RuntimeReceipt, type OriginalExecution, type Job } from "./runtime";
import { PostgresCustodyCore, type PostgresCustodyConfiguration } from "./postgres-custody-core";
export { CUSTODY_SQL, type CustodyAccess, type PostgresCustodyConfiguration } from "./postgres-custody-core";

/** Legacy deployment-bound custody; never accepts service execution records. */
export class PostgresCustodyStore extends PostgresCustodyCore<ExecutionStart, RuntimeReceipt, OriginalExecution> implements CustodyStore {
  constructor(pool: SqlPool, config: PostgresCustodyConfiguration) { super(pool, config); }
  protected parseStart(input: unknown) { return startSchema.parse(input); }
  protected parseReceipt(input: unknown) { return receiptSchema.parse(input); }
  protected identity(job: Job) { return jobIdentity(job); }
  protected validateOriginal(): void { /* Legacy validation remains in the shared core. */ }
}
