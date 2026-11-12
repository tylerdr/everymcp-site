import { describe, expect, it } from 'vitest';
import { createServiceProducer, createServiceVerifier } from '../lib/monitoring/service-authority';
import { canonicalJson, parseCanonical } from '../lib/monitoring/source-contract';
import { SERVICE_VERIFICATION } from './fixtures/monitoring-node/service-public-fixture';
import { fixtureProducer, serviceHarness, FICTIONAL_PRIVATE_ONE, FICTIONAL_PRIVATE_TWO, FICTIONAL_PRODUCER_TOKEN } from './fixtures/monitoring-node/service-fixture';

const config = () => structuredClone(SERVICE_VERIFICATION);
const producer = (verification = config(), keyId = verification.keys[0].keyId, privateKey = FICTIONAL_PRIVATE_ONE) => createServiceProducer({ verification, keyId, privateKey, producerToken: FICTIONAL_PRODUCER_TOKEN });

describe('service-recorded authority', () => {
  it('requires a single public key block and rejects fictional vectors as production', () => {
    for (const key of [FICTIONAL_PRIVATE_ONE, SERVICE_VERIFICATION.keys[0].publicKey + FICTIONAL_PRIVATE_ONE, SERVICE_VERIFICATION.keys[0].publicKey + SERVICE_VERIFICATION.keys[1].publicKey]) {
      const c = config(); c.keys[0].publicKey = key;
      expect(() => createServiceVerifier(c)).toThrow();
    }
    const c = config(); c.evidenceClass = 'server-collection'; c.scope.mode = 'live'; c.keys.forEach(k => { k.fixtureOnly = false; });
    expect(() => createServiceVerifier(c)).toThrow();
  });
  it('rejects unknown, revoked, wrong, and expired issuance and permits rotation', () => {
    expect(() => producer(config(), 'unknown')).toThrow();
    const c = config(); c.keys[0].revoked = true;
    expect(() => producer(c)).toThrow();
    expect(() => producer(config(), SERVICE_VERIFICATION.keys[0].keyId, FICTIONAL_PRIVATE_TWO)).toThrow();
    const p = fixtureProducer();
    expect(() => p.authorization('2026-10-31T00:00:00Z')).toThrow();
    expect(() => p.authorization('2026-12-02T00:00:00Z')).toThrow();
    expect(fixtureProducer(1).authorization('2026-12-02T00:00:00Z').keyId).toBe(SERVICE_VERIFICATION.keys[1].keyId);
  });
  it('checks signatures, provenance bindings and historical original integrity', async () => {
    const h = await serviceHarness();
    const handle = await h.capture(0);
    const original = await h.makeStore('recovery').getExecutionByReceipt(handle.receiptId);
    expect(original).not.toBeNull();
    if (!original) throw new Error('missing fixture');
    const verifier = createServiceVerifier(config());
    expect(verifier.verifyOriginal(original)).toBe(true);
    const start = original.start;
    const rotation = fixtureProducer(1);
    const { signature: _signature, ...unsignedStart } = start;
    const rotatedStart = rotation.signStart({ ...unsignedStart, runtime: rotation.authorization(start.startedAt) });
    expect(verifier.verifyStart(rotatedStart)).toBe(true);
    const absent = config(); absent.keys = absent.keys.slice(0, 1);
    expect(createServiceVerifier(absent).verifyStart(rotatedStart)).toBe(false);
    expect(verifier.verifyStart({ ...start, signature: 'A'.repeat(86) })).toBe(false);
    expect(verifier.verifyStart({ ...start, policy: 'vercel-next-custody-v2' } as unknown as typeof start)).toBe(false);
    expect(verifier.verifyStart({ ...start, runtime: { ...start.runtime, serviceId: 'other' } })).toBe(false);
    expect(verifier.verifyStart({ ...start, job: { ...start.job, scope: { ...start.job.scope, accountId: 'acct_other' } } })).toBe(false);
    expect(verifier.verifyStart({ ...start, startedAt: '2026-11-12T00:00:00Z' })).toBe(false);
    expect(verifier.verifyOriginal({ ...original, sourceBytes: Buffer.from('{}\n') })).toBe(false);
    const receipt = parseCanonical(original.receiptBytes, 65536) as Record<string, unknown>;
    expect(verifier.verifyOriginal({ ...original, receiptBytes: canonicalJson({ ...receipt, completedAt: '2026-11-12T00:00:00Z' }) })).toBe(false);
    expect(verifier.verifyOriginal({ ...original, receiptBytes: canonicalJson({ ...receipt, policy: 'vercel-next-custody-v2' }) })).toBe(false);
    const revoked = config(); revoked.keys[0].revoked = true;
    expect(createServiceVerifier(revoked).verifyOriginal(original)).toBe(false);
    // Verification is historical and has no current-clock dependency.
    expect(verifier.verifyOriginal(original)).toBe(true);
    const second = await h.capture(1);
    const other = await h.makeStore('recovery').getExecutionByReceipt(second.receiptId);
    expect(other).not.toBeNull();
    if (!other) throw new Error('missing second fixture');
    expect(verifier.verifyOriginal({ ...original, start: other.start })).toBe(false);
  });
  it('rejects malformed or ambient credentials before authenticating a worker', async () => {
    const p = fixtureProducer();
    const request = (headers: Record<string, string>, method = 'POST') => new Request('https://fictional.invalid/', { method, headers });
    for (const req of [request({}), request({ authorization: `Bearer ${FICTIONAL_PRODUCER_TOKEN}, Bearer ${FICTIONAL_PRODUCER_TOKEN}` }), request({ authorization: `Bearer ${FICTIONAL_PRODUCER_TOKEN}`, cookie: 'session=x' }), request({ authorization: `Bearer ${'x'.repeat(48)}` }), request({ authorization: `Bearer ${FICTIONAL_PRODUCER_TOKEN}` }, 'GET')]) expect(await p.authenticateWorker(req)).toBeNull();
    expect(await p.authenticateWorker(request({ authorization: `Bearer ${FICTIONAL_PRODUCER_TOKEN}` }))).not.toBeNull();
  });
});
