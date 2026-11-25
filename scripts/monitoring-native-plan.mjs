/** Review-only plan. This module never downloads, probes, or starts PostgreSQL. */
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export const NATIVE_PLAN = deepFreeze({
  status: 'unapproved',
  executionAuthorized: false,
  environment: { uid: 1000, os: 'Debian 13.6', arch: 'x86_64', installedLibpq: '17.11' },
  package: { url: 'https://deb.debian.org/debian/pool/main/p/postgresql-17/postgresql-17_17.11-0+deb13u1_amd64.deb', size: 16678028, sha256: 'd2ce1ddffafa783f9acda4c92c86fc21e8288bff3782d739294f14fa797d7886', verification: 'https-size-sha256', gpgVerified: false },
  schema: { path: '/workspace/everymcp-site/documents/monitoring-custody.proposal.sql', sha256: 'd6b71ff5d3e3e8308ad3683272f9dd2723b9781e356f4cc854d299ed18cf66c8' },
  paths: { root: '/workspace/everymcp-native-pg1711', engine: '/workspace/everymcp-native-pg1711/engine', data: '/workspace/everymcp-native-pg1711/data', socket: '/workspace/everymcp-native-pg1711/socket', test: '/workspace/everymcp-site/tests/native/monitoring-postgres.native.test.ts' },
  budgets: { downloadSeconds: 60, wallSeconds: 900, killAfterSeconds: 20, watchdogIntervalSeconds: 1, watchdogRssBytes: 1073741824, watchdogRootBytes: 1073741824, fileSizeBytes: 134217728, retainedLogBytes: 1048576, sqlQueries: 1000, connections: 160, activeConnections: 12, fixtureBytes: 10485760 },
  isolation: { user: true, network: true, pid: true, mountProc: true, tcpListen: false, socketTrust: 'isolates other UIDs, not hostile processes with the same UID', dedicatedCgroup: false },
  cleanup: { stop: 'fast then immediate', secondsPerAttempt: 10, retain: 'bounded cleanup receipt', delete: ['data', 'socket', 'engine', 'package'], unknownFiles: 'preserve' },
  limitations: ['No hard aggregate RSS or disk cap', 'No GPG verification', 'No execution or acquisition approved']
});

/** Produce a fixture-only transaction from the exact reviewed proposal bytes. */
export function fixtureProposal(source) {
  if (typeof source !== 'string') throw new TypeError('Expected source text');
  if (createHash('sha256').update(source, 'utf8').digest('hex') !== NATIVE_PLAN.schema.sha256) throw new Error('Proposal hash mismatch');
  if ((source.match(/^BEGIN;\r?$/gm) || []).length !== 1) throw new Error('Invalid proposal transaction wrapper');
  const match = /(^|\n)ROLLBACK;(\r?\n?)$/.exec(source);
  if (!match) throw new Error('Invalid proposal transaction wrapper');
  return source.slice(0, match.index) + match[1] + 'COMMIT;' + match[2];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 2) {
    process.stderr.write('Plan only; execution and flags are unavailable.\n');
    process.exitCode = 2;
  } else process.stdout.write(JSON.stringify(NATIVE_PLAN, null, 2) + '\n');
}
