import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { NATIVE_PLAN, fixtureProposal } from '../scripts/monitoring-native-plan.mjs';

describe('native PostgreSQL proposal plan', () => {
  it('pins the package, schema and explicit non-approval', () => {
    expect(NATIVE_PLAN.executionAuthorized).toBe(false);
    expect(NATIVE_PLAN.status).toBe('unapproved');
    expect(NATIVE_PLAN.package.size).toBe(16678028);
    expect(NATIVE_PLAN.package.sha256).toBe('d2ce1ddffafa783f9acda4c92c86fc21e8288bff3782d739294f14fa797d7886');
    expect(Object.isFrozen(NATIVE_PLAN.package)).toBe(true);
  });
  it('transforms only the terminal rollback of the pinned proposal', () => {
    const source = readFileSync('documents/monitoring-custody.proposal.sql', 'utf8');
    expect(fixtureProposal(source)).toBe(source.replace(/ROLLBACK;(\r?\n?)$/, 'COMMIT;$1'));
    expect(() => fixtureProposal(source + '\n')).toThrow();
    expect(() => fixtureProposal(source.replace('BEGIN;', 'BEGIN;\nBEGIN;'))).toThrow();
  });
  it('prints the plan and rejects execution flags', () => {
    const script = 'scripts/monitoring-native-plan.mjs';
    const normal = spawnSync(process.execPath, [script], { encoding: 'utf8' });
    expect(normal.status).toBe(0);
    expect(JSON.parse(normal.stdout)).toEqual(NATIVE_PLAN);
    for (const flag of ['--run-once', '--inside', '--download', '--plan']) {
      const result = spawnSync(process.execPath, [script, flag], { encoding: 'utf8' });
      expect(result.status).toBe(2);
      expect(result.stdout).toBe('');
    }
  });
});
