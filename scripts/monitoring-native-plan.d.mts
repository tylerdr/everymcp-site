export const NATIVE_PLAN: Readonly<{
  status: 'unapproved';
  executionAuthorized: false;
  environment: Readonly<{ uid: number; os: string; arch: string; installedLibpq: string }>;
  package: Readonly<{ url: string; size: number; sha256: string; verification: string; gpgVerified: false }>;
  schema: Readonly<{ path: string; sha256: string }>;
  paths: Readonly<{ root: string; engine: string; data: string; socket: string; test: string }>;
  budgets: Readonly<{ downloadSeconds: number; wallSeconds: number; killAfterSeconds: number; watchdogIntervalSeconds: number; watchdogRssBytes: number; watchdogRootBytes: number; fileSizeBytes: number; retainedLogBytes: number; sqlQueries: number; connections: number; activeConnections: number; fixtureBytes: number }>;
  isolation: Readonly<{ user: true; network: true; pid: true; mountProc: true; tcpListen: false; socketTrust: string; dedicatedCgroup: false }>;
  cleanup: Readonly<{ stop: string; secondsPerAttempt: number; retain: string; delete: readonly string[]; unknownFiles: string }>;
  limitations: readonly string[];
}>;
export function fixtureProposal(source: string): string;
