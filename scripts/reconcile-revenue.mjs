/** Offline normalized evidence reconciliation. No network, secrets or provider writes. */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PRODUCT = 'everymcp-starter-kit';
const kinds = ['collection', 'refund', 'processing_fee', 'settlement', 'booked_unpaid'];
const timestamp = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw Error('Explicit-offset ISO timestamp required');
  const day = value.slice(0,10);
  requireValue(new Date(day + 'T00:00:00Z').toISOString().slice(0,10) === day, 'Invalid calendar date');
  return Date.parse(value);
};
const requireValue = (ok, message) => { if (!ok) throw Error(message); };
const safeSum = values => values.reduce((sum, value) => {
  requireValue(Number.isSafeInteger(sum + value), 'Amount overflow');
  return sum + value;
}, 0);

export function reconcile(input) {
  requireValue(input?.schema === 'everymcp.revenue-evidence.1', 'Unsupported evidence schema');
  const start = timestamp(input.period?.start), end = timestamp(input.period?.end);
  requireValue(start < end, 'Period must be half-open [start, end)');
  requireValue(Array.isArray(input.events), 'events must be an array');
  requireValue(input.events.length <= 100000, 'Event limit exceeded');
  const ids = new Map(), payments = new Set(), rows = [];
  for (const e of input.events) {
    requireValue(e && typeof e === 'object', 'Invalid event');
    requireValue(typeof e.id === 'string' && e.id.length > 0 && e.id.length <= 200, 'Event ID required');
    requireValue(typeof e.paymentId === 'string' && e.paymentId.length > 0 && e.paymentId.length <= 200, 'Payment ID required');
    requireValue(e.product === PRODUCT && e.currency === 'usd', 'Only attributed EveryMCP starter USD evidence is accepted');
    requireValue(['live','test'].includes(e.mode) && kinds.includes(e.kind), 'Invalid mode or kind');
    requireValue(Number.isSafeInteger(e.amountCents) && e.amountCents >= 0, 'Nonnegative integer cents required');
    requireValue(typeof e.sourceRef === 'string' && e.sourceRef.trim().length > 0, 'Private evidence reference required');
    const at = timestamp(e.at);
    const canonical = JSON.stringify([e.paymentId,e.product,e.currency,e.mode,e.kind,e.amountCents,at,e.sourceRef]);
    if (ids.has(e.id)) {
      requireValue(ids.get(e.id) === canonical, 'Conflicting duplicate event');
      continue;
    }
    ids.set(e.id, canonical);
    if (e.kind === 'collection') {
      const key = JSON.stringify([e.mode,e.paymentId]);
      requireValue(!payments.has(key), 'Multiple collection events for one payment; normalize before reporting');
      payments.add(key);
    }
    rows.push({...e, at});
  }
  const period = rows.filter(e => e.at >= start && e.at < end);
  const measures = {};
  for (const kind of kinds) {
    const coverage = input.coverage?.[kind];
    requireValue(coverage && ['complete','partial','unknown'].includes(coverage.status), 'Explicit per-kind coverage required');
    requireValue(Array.isArray(coverage.sourceRefs), 'Coverage evidence references required');
    requireValue(coverage.sourceRefs.every(ref => typeof ref === 'string' && ref.trim()), 'Invalid coverage reference');
    if (coverage.status === 'complete') requireValue(coverage.sourceRefs.length > 0, 'Complete coverage requires a source reference');
    const values = period.filter(e=>e.mode === 'live' && e.kind === kind);
    const observed = safeSum(values.map(e=>e.amountCents));
    measures[kind] = {status:coverage.status, reportedCents:coverage.status === 'complete' ? observed : null, observedCents:observed, observedEvents:values.length};
  }
  const netKnown = ['collection','refund','processing_fee'].every(k=>measures[k].reportedCents !== null);
  const net = netKnown ? safeSum([measures.collection.reportedCents,-measures.refund.reportedCents,-measures.processing_fee.reportedCents]) : null;
  return {
    schema:'everymcp.revenue-summary.1', period:{start:input.period.start,end:input.period.end}, currency:'usd', product:PRODUCT,
    evidenceStatus:'operator-normalized; provider authenticity and coverage require independent reconciliation',
    measures, collectedRevenueNetOfRefundsCents: ['collection','refund'].every(k=>measures[k].reportedCents !== null) ? safeSum([measures.collection.reportedCents,-measures.refund.reportedCents]) : null,
    collectionsLessRefundsAndProcessingFeesCents:net,
    testEvidence:{events:period.filter(e=>e.mode==='test').length, collectionCents:safeSum(period.filter(e=>e.mode==='test' && e.kind==='collection').map(e=>e.amountCents))},
    mrrCents:null, earnedRevenueCents:null, ownerDistributableCents:null,
    limitations:['One-time offer; account-wide MRR is unknown.', 'Collections exclude tax; settlements are separate transfers, never added to collections.', 'Disputes, reserves, hosting, support, acquisition costs and delivery obligations require separate evidence.', 'No identifiers, source references or customer data are emitted. Do not commit private input.']
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw Error('Usage: node scripts/reconcile-revenue.mjs /private/normalized-evidence.json');
    const data = readFileSync(process.argv[2]);
    requireValue(data.length <= 20 * 1024 * 1024, 'Input exceeds 20MiB');
    process.stdout.write(JSON.stringify(reconcile(JSON.parse(data)), null, 2) + '\n');
  } catch {
    // No raw provider data, path, event ID or parser excerpt in logs.
    process.stderr.write('Revenue evidence refused. Validate the private input against documents/REVENUE-RECONCILIATION.md.\n');
    process.exitCode = 1;
  }
}
