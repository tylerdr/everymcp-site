// Local synthetic adapter only. Vercel's ephemeral filesystem is not production storage.
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { EntitlementStore, Ledger } from "./entitlements";

export class LocalFileStore implements EntitlementStore {
  constructor(private readonly directory: string) {}
  async transaction<T>(change: (ledger: Ledger) => T): Promise<T> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const lock = join(this.directory, "lock");
    const deadline = Date.now() + 2000;
    for (;;) {
      try { await mkdir(lock, { mode: 0o700 }); break; }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST" || Date.now() >= deadline) throw error;
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    }
    const temporary = join(this.directory, randomUUID() + ".tmp");
    try {
      let ledger: Ledger;
      try { ledger = JSON.parse(await readFile(join(this.directory, "ledger.json"), "utf8")) as Ledger; }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        ledger = { events: {}, receipts: {} };
      }
      const result = change(ledger);
      if (result instanceof Promise) throw new Error("Transaction callback must be synchronous");
      const file = await open(temporary, "wx", 0o600);
      try { await file.writeFile(JSON.stringify(ledger)); await file.sync(); }
      finally { await file.close(); }
      await rename(temporary, join(this.directory, "ledger.json"));
      const directory = await open(this.directory, "r");
      try { await directory.sync(); } finally { await directory.close(); }
      return result;
    } finally { await rm(temporary, { force: true }); await rm(lock, { recursive: true }); }
  }
}
