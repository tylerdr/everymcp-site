"""Actual local worker/report/storage behavior; identity and paid rights are fixtures."""
from dataclasses import replace
from pathlib import Path
import copy
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import monitoring_workflow_fixture as fixture
import monitoring_workflow as workflow
import source_receipt_history as history
import test_source_receipt_history as history_fixtures


class MonitoringWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.store = fixture.LocalFixtureStore(Path(self.temp.name) / 'store')
        self.authority = fixture.FixtureAuthority()
        self.worker = self.authority.worker(self.store)
        self.job = fixture.JOB

    def run_job(self): return self.worker.run_period('fixture-worker', self.job)

    def test_production_has_no_binding_or_environment_enablement(self):
        with patch.dict(os.environ, {'EVERYMCP_MONITORING_ENABLED': 'true', 'VERCEL_ENV': 'preview', 'EVERYMCP_PREVIEW_RECOVERY': 'named-sandbox-v1'}):
            self.assertIsNone(workflow.get_production_binding())

    def test_real_historical_report_persisted_before_visibility_and_recovered(self):
        handle = self.run_job()
        body = self.worker.recover('fixture-owner-a', handle.job_id)
        self.assertEqual(hashlib.sha256(body).hexdigest(), handle.sha)
        self.assertEqual(len(body), handle.length)
        self.assertEqual(handle.publication, 'review_required')
        self.assertIn(b'5 distinct source URLs', body)
        self.assertIn(b'missing_at_check: 2, reachable: 3', body)
        self.assertIn(b'Stale or unchecked sources: 5', body)
        self.assertIn(b'2026-10-04', body)
        self.assertTrue((self.store.index / (handle.job_id + '.json')).is_file())
        self.assertEqual(self.authority.calls, ['generate', 'generate', 'recover'])
        self.assertEqual(self.store.prepares, 1)

    def test_retry_returns_original_even_when_new_source_loader_would_fail(self):
        first = self.run_job(); original = self.worker.recover('fixture-owner-a', first.job_id)
        fresh = self.authority.worker(fixture.LocalFixtureStore(self.store.directory), load_verified_sources=lambda *args: self.fail('Committed retry must not regenerate'))
        self.assertEqual(fresh.run_period('fixture-worker', self.job), first)
        self.assertEqual(fresh.recover('fixture-owner-a', first.job_id), original)
        self.assertEqual(self.authority.source_calls, 1)

    def test_concurrent_different_candidate_returns_the_committed_winner(self):
        first = self.run_job(); original = self.worker.recover('fixture-owner-a', first.job_id)
        inputs = self.authority.inputs
        changed_catalog = copy.deepcopy(inputs.catalog)
        next(item for item in changed_catalog if item['slug'] == 'heap-mcp')['name'] = 'Synthetic changed catalog title'
        self.authority.inputs = replace(inputs, catalog=changed_catalog)
        get = self.store.get
        missed = False
        def miss_once(job_id):
            nonlocal missed
            if not missed:
                missed = True
                return None  # Simulate a worker that read before the winner committed.
            return get(job_id)
        self.store.get = miss_once
        self.assertEqual(self.run_job(), first)
        self.assertEqual(self.worker.recover('fixture-owner-a', first.job_id), original)
        self.assertEqual(len(list(self.store.bundles.iterdir())), 2)
        self.assertEqual(len(list(self.store.index.glob('*.json'))), 1)

    def test_crash_after_bundle_cannot_expose_report_before_index(self):
        self.store.fail_after_prepare = True
        with self.assertRaises(workflow.Unavailable): self.run_job()
        job_id = workflow.job_identity(fixture.SCOPE, fixture.OWNER_A, self.job)
        self.assertTrue(list(self.store.bundles.iterdir()))
        self.assertIsNone(self.worker.recover('fixture-owner-a', job_id))
        self.assertFalse(self.store.index.exists())
        handle = self.run_job()
        self.assertIsNotNone(self.worker.recover('fixture-owner-a', handle.job_id))
        self.assertEqual(len(list(self.store.bundles.iterdir())), 1)

    def test_lost_commit_response_recovers_original_without_rebuilding(self):
        self.store.fail_after_commit = True
        with self.assertRaises(workflow.Unavailable): self.run_job()
        self.assertEqual(len(list(self.store.index.glob('*.json'))), 1)
        first_calls = self.authority.source_calls
        handle = self.run_job()
        self.assertIsNotNone(self.worker.recover('fixture-owner-a', handle.job_id))
        self.assertEqual(self.authority.source_calls, first_calls)
        self.assertEqual(self.store.commits, 1)

    def test_new_process_and_concurrent_workers_converge_on_original_bytes(self):
        script = fixture.ROOT / 'tests/monitoring_workflow_fixture.py'
        args = [sys.executable, str(script), 'generate', '--directory', str(self.store.directory)]
        processes = [subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE) for _ in range(3)]
        outputs = [p.communicate(timeout=30) for p in processes]
        self.assertEqual([p.returncode for p in processes], [0, 0, 0], outputs)
        self.assertEqual(len({out for out, err in outputs}), 1)
        handle = json.loads(outputs[0][0])
        recovered = subprocess.run([sys.executable, str(script), 'recover', '--directory', str(self.store.directory), '--job-id', handle['job_id']], capture_output=True, check=True)
        self.assertEqual(hashlib.sha256(recovered.stdout).hexdigest(), handle['sha'])
        self.assertEqual(len(list(self.store.index.glob('*.json'))), 1)
        denied = subprocess.run([sys.executable, str(script), 'recover', '--directory', str(self.store.directory), '--job-id', handle['job_id'], '--owner', 'fixture-owner-b'], capture_output=True)
        self.assertEqual(denied.returncode, 3)
        self.assertEqual(denied.stdout, b'')

    def test_owner_and_scope_denial_happen_before_rights_and_byte_access(self):
        handle = self.run_job(); self.authority.calls.clear(); reads = self.store.reads
        self.assertIsNone(self.worker.recover('fixture-owner-b', handle.job_id))
        self.assertIsNone(self.worker.recover('unverified', handle.job_id))
        wrong_scope = replace(fixture.SCOPE, product_key='different-product')
        wrong = self.authority.worker(self.store, authenticate_owner=lambda ctx: workflow.Principal(wrong_scope, fixture.OWNER_A))
        self.assertIsNone(wrong.recover('anything', handle.job_id))
        self.assertEqual(self.authority.calls, [])
        self.assertEqual(self.store.reads, reads)

    def test_denied_unknown_and_mismatched_rights_never_read_or_generate(self):
        handle = self.run_job()
        for action in ('generate', 'recover'):
            for decision in ('denied', 'unknown'):
                self.authority.status[action] = decision
                reads = self.store.reads; prepares = self.store.prepares
                with self.subTest(action=action, decision=decision):
                    if action == 'generate':
                        with self.assertRaises(workflow.AccessDenied if decision == 'denied' else workflow.Unavailable): self.run_job()
                    elif decision == 'denied': self.assertIsNone(self.worker.recover('fixture-owner-a', handle.job_id))
                    else:
                        with self.assertRaises(workflow.Unavailable): self.worker.recover('fixture-owner-a', handle.job_id)
                    self.assertEqual(self.store.reads, reads); self.assertEqual(self.store.prepares, prepares)
            self.authority.status[action] = 'active'
        good = self.authority.current_rights
        for replacement in ({'version': True}, {'action': 'different'}, {'owner_key': fixture.OWNER_B}, {'period_end': '2026-11-11T00:00:00Z'}):
            worker = self.authority.worker(self.store, current_rights=lambda *args: replace(good(*args), **replacement))
            with self.assertRaises(workflow.Unavailable): worker.recover('fixture-owner-a', handle.job_id)

    def test_revocation_before_commit_leaves_only_an_invisible_bundle(self):
        def rights(*args):
            result = self.authority.current_rights(*args)
            return replace(result, decision='active' if len(self.authority.calls) == 1 else 'denied')
        self.worker = self.authority.worker(self.store, current_rights=rights)
        with self.assertRaises(workflow.AccessDenied): self.run_job()
        self.assertTrue(list(self.store.bundles.iterdir()))
        self.assertEqual(self.store.commits, 0)

    def test_bad_worker_period_and_watchlist_are_rejected_before_preparation(self):
        with self.assertRaises(workflow.AccessDenied): self.worker.run_period('unverified', self.job)
        self.assertEqual(self.authority.watchlist_calls, 0)
        for job in (replace(self.job, watchlist_version=True), replace(self.job, period_start=self.job.period_end), replace(self.job, period_end='2027-01-01T00:00:00Z'), replace(self.job, period_start='2026-01-01T00:00:00Z'), replace(self.job, period_end='2026-11-12T00:00:00+00:00')):
            with self.assertRaises(workflow.InvalidJob): self.worker.run_period('fixture-worker', job)
        self.authority.watchlist = replace(self.authority.watchlist, version=2)
        with self.assertRaises(workflow.InvalidJob): self.run_job()
        self.assertEqual(self.store.prepares, 0)

    def test_same_version_changed_watchlist_is_a_conflict_not_a_new_report(self):
        self.run_job(); self.authority.watchlist = replace(self.authority.watchlist, slugs=('revenuecat-mcp',))
        with self.assertRaises(workflow.Unavailable): self.run_job()
        self.assertEqual(self.store.prepares, 1)

    def test_wrong_prepared_artifact_or_missing_bytes_never_commit(self):
        original = self.store.prepare
        self.store.prepare = lambda report: replace(original(report), sha256='0' * 64)
        with self.assertRaises(workflow.Unavailable): self.run_job()
        self.assertEqual(self.store.commits, 0)
        self.store.prepare = original
        self.store.read_bytes = lambda artifact: b'wrong bytes'
        with self.assertRaises(workflow.Unavailable): self.run_job()
        self.assertEqual(self.store.commits, 0)

    def test_corrupted_index_and_original_bytes_refuse_without_regeneration(self):
        handle = self.run_job(); index = self.store.index / (handle.job_id + '.json')
        original = index.read_bytes(); data = json.loads(original); data['record']['slugs'] = ['different-listing']; index.write_text(json.dumps(data))
        with self.assertRaises(workflow.Unavailable): self.run_job()
        index.write_bytes(original)
        path = self.store.bundles / handle.artifactId / 'report.md'; path.write_bytes(path.read_bytes() + b'bad')
        with self.assertRaises(workflow.Unavailable): self.worker.recover('fixture-owner-a', handle.job_id)
        self.assertEqual(self.authority.source_calls, 1)

    def test_synthetic_missing_unknown_recovery_uses_real_history_engine(self):
        history_fixtures.ReceiptHistoryTests.setUpClass(); maker = history_fixtures.ReceiptHistoryTests()
        NEON = history_fixtures.NEON
        one = maker.snap(1, {NEON: (200, b'first')})
        two = maker.snap(2, {NEON: (404, b'missing')}, one)
        three = maker.snap(3, {NEON: (503, b'unknown')}, two)
        four = maker.snap(4, {NEON: (200, b'changed')}, three)
        self.authority.inputs = workflow.EngineInputs([one, two, three, four], maker.catalog, maker.curated)
        self.authority.watchlist = replace(self.authority.watchlist, slugs=('neon-mcp', 'neon-mcp-server'))
        body = self.worker.recover('fixture-owner-a', self.run_job().job_id)
        for text in (b'Source missing at check', b'Inconclusive check', b'Source reachable again', b'Complete source bytes changed', b'Stale or unchecked sources: 1'):
            self.assertIn(text, body)
        self.assertIn(hashlib.sha256(b'first').hexdigest().encode(), body)
        self.assertIn(hashlib.sha256(b'changed').hexdigest().encode(), body)
        self.assertEqual(self.store.commits, 1)


if __name__ == '__main__': unittest.main()
