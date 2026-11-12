"""Fictional document responses only: capture -> receipt admission -> report -> recovery."""
from dataclasses import replace
from pathlib import Path
import copy
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import test_source_receipt_history as fixtures
import monitoring_workflow_fixture as authority_fixture
import monitoring_workflow as workflow
import source_document_projection as projection

history, monitor, receipt = fixtures.history, fixtures.monitor, fixtures.importer
HTML = b'<html><body><h1>Installation</h1><p>Requires Node 18.</p><pre>npm install example@1\n  --save</pre><a href="/v1" title="Setup">Guide &amp; reference</a></body></html>'


class DocumentProjectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        fixtures.ReceiptHistoryTests.setUpClass()
        cls.helper = fixtures.ReceiptHistoryTests()
        cls.source = cls.helper.inventory[fixtures.NEON]

    def observed(self, body=HTML, *, status=200, headers=None, previous=None, source=None, day=1):
        return monitor.observe(status, {'content-type': 'text/html; charset=utf-8'} if headers is None else headers,
                               body, previous or {}, f'2026-11-{day:02d}T00:00:01Z', source=source or self.source)

    def snap(self, day, body, previous=None, status=200, headers=None):
        return self.helper.snap(day, {fixtures.NEON: (status, body)}, previous,
                                headers={'content-type': 'text/html; charset=utf-8'} if headers is None else headers, capture=True)

    def build(self, snapshots): return self.helper.build(snapshots, fixtures.SLUGS)
    def row(self, report): return self.helper.source(report)

    def test_fictional_requirement_change_reaches_worker_and_fresh_process_original_recovery(self):
        one = self.snap(1, HTML)
        two = self.snap(2, HTML.replace(b'Node 18', b'Node 20').replace(b'example@1', b'example@2'), one)
        with tempfile.TemporaryDirectory() as directory:
            authority = authority_fixture.FixtureAuthority()
            authority.watchlist = replace(authority.watchlist, slugs=tuple(sorted(fixtures.SLUGS)))
            authority.inputs = workflow.EngineInputs([one, two], self.helper.catalog, self.helper.curated)
            store = authority_fixture.LocalFixtureStore(Path(directory) / 'store')
            worker = authority.worker(store)
            with patch.object(monitor, 'fetch_source', side_effect=AssertionError('no collection')), patch.object(monitor.socket, 'create_connection', side_effect=AssertionError('no network')):
                handle = worker.run_period('fixture-worker', authority_fixture.JOB)
                original = worker.recover('fixture-owner-a', handle.job_id)
            self.assertIn(b'captured_representation_changed', original)
            self.assertIn(b'Node 18', original); self.assertIn(b'Node 20', original)
            self.assertIn(b'/documentProjection/sections/', original)
            self.assertIn(b'2026-11-01T00:00:01Z', original)
            self.assertIn(b'freshness as of 2026-11-12T00:00:00Z: stale', original)
            fresh = subprocess.run([sys.executable, str(authority_fixture.ROOT / 'tests/monitoring_workflow_fixture.py'), 'recover', '--directory', str(store.directory), '--job-id', handle.job_id], capture_output=True, check=True)
            self.assertEqual(fresh.stdout, original)
            self.assertEqual(hashlib.sha256(original).hexdigest(), handle.sha)
            authority.inputs = None  # Retry must not regenerate from new/missing inputs.
            self.assertEqual(worker.run_period('fixture-worker', authority_fixture.JOB), handle)
            authority.status['recover'] = 'denied'
            self.assertIsNone(worker.recover('fixture-owner-a', handle.job_id))

    def test_syntactic_noise_equal_projection_never_claims_meaningless_or_unchanged_document(self):
        one = self.snap(1, HTML)
        noise = HTML.replace(b'href="/v1" title="Setup"', b"title='Setup' href='/v1'").replace(b'&amp;', b'&#38;')
        two = self.snap(2, noise, one)
        report = self.build([one, two]); event = self.row(report)['events'][-1]
        self.assertEqual(event['documentComparison']['state'], 'captured_representation_unchanged')
        self.assertNotEqual(event['beforeObservation']['contentHash'], event['observation']['contentHash'])
        text = history.render_history(report).decode()
        self.assertIn('Captured representation unchanged; other differences unclassified.', text)
        self.assertNotIn('noise-only', text)

    def test_numbers_versions_link_targets_commands_timestamps_and_pre_whitespace_remain_significant(self):
        base = self.observed()['documentProjection']
        for changed in (HTML.replace(b'18', b'20'), HTML.replace(b'example@1', b'example@2'), HTML.replace(b'/v1', b'/v2'), HTML.replace(b'  --save', b' --save'), HTML.replace(b'Requires', b'2026-11-01 Requires'), HTML.replace(b'Guide', b'guide')):
            with self.subTest(changed=changed):
                self.assertNotEqual(base['projectionHash'], self.observed(changed)['documentProjection']['projectionHash'])

    def test_omitted_scripts_styles_comments_are_recorded_and_not_called_noise(self):
        body = HTML.replace(b'</body>', b'<script>version=1</script><style>.a{color:red}</style><!--nonce:1--></body>')
        first = self.observed(body)
        second = self.observed(body.replace(b'version=1', b'version=2').replace(b'nonce:1', b'nonce:2'), day=2)
        self.assertEqual(first['documentProjection']['omissions'], ['comment', 'script', 'style'])
        result = history.compare_documents(first, second)
        self.assertEqual(result['state'], 'captured_representation_unchanged')

    def test_incomplete_and_unsupported_bodies_do_not_compare(self):
        one = self.snap(1, HTML)
        cases = [(206, HTML, {}), (200, b'x' * (monitor.MAX_BODY_BYTES + 1), {}), (200, b'\xff', {'content-type':'text/html'}), (200, HTML, {'content-type':'application/json'}), (200, HTML, {'content-type':'text/html; charset=latin-1'}), (200, HTML, {'content-type':'text/html', 'content-encoding':'gzip'})]
        for status, body, headers in cases:
            with self.subTest(status=status, headers=headers):
                observation = self.observed(body, status=status, headers=headers, day=2)
                self.assertNotEqual(observation['documentProjection']['state'], 'captured')
                self.assertEqual(history.compare_documents(self.observed(), observation)['state'], 'unavailable')
        two = self.snap(2, HTML, one, status=206)
        report = self.build([one, two]); text = history.render_history(report).decode()
        self.assertIn('Current capture: incomplete', text)
        self.assertIn('unknown', text)
        self.assertFalse(any(e['kind'] == 'source_body_changed' for e in self.row(report)['events']))

    def test_markup_and_resource_bounds_are_explicit_unavailable_outcomes(self):
        cases = [b'<p>unclosed', b'<!--unclosed comment', b'<p>text</p><', b'<p a="1" a="2">duplicate</p>', b'<p>\x00</p>', b'<h1><span>Heading</span></h1><p>body</p>' + b'<h2>x</h2>' * projection.MAX_SECTIONS,
                 b'<div>' * (projection.MAX_DEPTH + 1), b'<p>x</p>' * (projection.MAX_TOKENS // 3 + 1), b'<p a="' + b'x' * 8193 + b'">body</p>', b'<p ' + b' '.join(f'a{i}="x"'.encode() for i in range(65)) + b'>body</p>']
        for body in cases:
            with self.subTest(length=len(body)):
                p = self.observed(body)['documentProjection']
                self.assertNotEqual(p['state'], 'captured')
                self.assertEqual(p['sections'], [])
        nested = self.observed(b'<h1><span>Nested title</span></h1><pre>  a\n b</pre>')['documentProjection']
        self.assertEqual(nested['state'], 'captured')
        self.assertTrue(any(s['heading'] == 'Nested title' for s in nested['sections']))

    def test_plain_text_preserves_exact_whitespace_and_markdown_commands(self):
        before = self.observed(b'# Install\n```sh\nnpm install x@1\n```', headers={'content-type':'text/markdown'})
        after = self.observed(b'# Install\n```sh\n npm install x@1\n```', headers={'content-type':'text/markdown'}, day=2)
        self.assertEqual(history.compare_documents(before, after)['state'], 'captured_representation_changed')

    def test_304_keeps_original_capture_date_and_legacy_stays_not_captured(self):
        prior = monitor.update_cache({}, self.observed())
        observation = self.observed(b'', status=304, previous=prior, day=2)
        self.assertEqual(observation['documentProjection']['bodyObservedAt'], '2026-11-01T00:00:01Z')
        self.assertEqual(observation['checkedAt'], '2026-11-02T00:00:01Z')
        self.assertEqual(observation['documentProjection'], prior['observation']['documentProjection'])
        old = monitor.observe(200, {}, b'legacy discarded text', {}, '2026-11-01T00:00:01Z')
        legacy = self.observed(b'', status=304, previous=monitor.update_cache({}, old), day=2)['documentProjection']
        self.assertEqual(legacy['state'], 'not_captured'); self.assertIsNone(legacy['bodyObservedAt'])

    def test_capture_binding_tampering_and_source_remapping_fail_admission(self):
        valid = self.snap(1, HTML)
        for key, value in [('sourceIdentity', '0'*64), ('sourceUrl', 'https://github.com/other/project'), ('bodyHash','0'*64), ('projectionHash','0'*64), ('bodyObservedAt','2026-11-02T00:00:01Z'), ('profileVersion','invented')]:
            broken = copy.deepcopy(valid)
            source = next(s for s in broken['report']['sources'] if s['url'] == fixtures.NEON)
            for field in ('observation','lastSuccessfulObservation'): source[field]['documentProjection'][key] = value
            broken['sha256'] = monitor.digest(receipt.canonical_bytes(broken['report']))
            with self.subTest(key=key), self.assertRaises(ValueError): self.build([broken])
        source = copy.deepcopy(self.source); source['relationships'][0]['identityEvidence'] = 'publisher'
        remapped = self.observed(source=source, day=2)
        with self.assertRaises(ValueError): history.compare_documents(self.observed(), remapped)
        with self.assertRaises(ValueError): self.observed(b'', status=304, previous=monitor.update_cache({}, self.observed()), source=source, day=2)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'cache.json'
            path.write_text(json.dumps({'schemaVersion':2, 'policyVersion':'public-source-v2', 'sources':{fixtures.NEON:monitor.update_cache({}, self.observed())}}))
            self.assertEqual(monitor.read_cache(path, {fixtures.NEON:self.source})[fixtures.NEON]['observation']['documentProjection']['state'], 'captured')
            with self.assertRaises(ValueError): monitor.read_cache(path, {fixtures.NEON:source})

    def test_v1_schema_cache_and_exact_renderer_recovery_remain_supported(self):
        actual = self.helper.actual()
        monitor.validate_report(actual['report'])
        v2_report = self.helper.build([actual], ['heap-mcp','revenuecat-mcp'])
        self.assertIn(b'Current capture: not_captured', history.render_history(v2_report))
        legacy = {**v2_report, 'schemaVersion':1, 'historyPolicyVersion':'source-receipt-history-v1'}
        expected = (fixtures.ROOT / 'documents/source-monitor-reviews/history-example-2026-11-12.md').read_bytes()
        self.assertEqual(history.render_history(legacy), expected)
        with tempfile.TemporaryDirectory() as directory:
            authority = authority_fixture.FixtureAuthority(); store = authority_fixture.LocalFixtureStore(Path(directory) / 'store')
            artifact = store.prepare(legacy)
            job = authority_fixture.JOB
            job_id = workflow.job_identity(authority_fixture.SCOPE, authority_fixture.OWNER_A, job, 'source-receipt-history-v1')
            record = workflow.CommittedReport(job_id, authority_fixture.SCOPE, authority_fixture.OWNER_A, job.watchlist_id, job.watchlist_version, job.period_start, job.period_end, authority_fixture.SLUGS, 'source-receipt-history-v1', artifact)
            store.commit_if_absent(record)
            authority.inputs = None
            handle = authority.worker(store).run_period('fixture-worker', job)
            self.assertEqual(handle.job_id, job_id)
            self.assertEqual(handle.sha, '187072dc5ef9342e21c415bf29ee4b97e5e430763e72a68d031f788b67c33237')
            fresh = subprocess.run([sys.executable, str(authority_fixture.ROOT / 'tests/monitoring_workflow_fixture.py'), 'recover', '--directory', str(store.directory), '--job-id', job_id], capture_output=True, check=True)
            self.assertEqual(fresh.stdout, expected)
            path = Path(directory) / 'cache.json'
            old = monitor.observe(200, {}, b'old', {}, '2026-11-01T00:00:01Z')
            path.write_text(json.dumps({'schemaVersion':1,'policyVersion':'public-source-v1','sources':{fixtures.NEON:monitor.update_cache({},old)}}))
            self.assertEqual(monitor.read_cache(path, {fixtures.NEON:self.source})[fixtures.NEON]['observation'], old)
        wrong = copy.deepcopy(self.snap(1, HTML)['report']); wrong.update(schemaVersion=1, policyVersion='public-source-v1')
        with self.assertRaises(ValueError): monitor.validate_report(wrong)

    def test_quote_budget_is_shared_across_events_sides_and_duplicate_listing_relationships(self):
        snapshots = []
        for day in range(1,5): snapshots.append(self.snap(day, HTML.replace(b'Node 18', f'Node {18+day}'.encode()), snapshots[-1] if snapshots else None))
        text = history.render_history(self.build(snapshots)).decode()
        quotes = re.findall(r'preview: “(.*?)”', text)
        self.assertLessEqual(sum(len(re.findall(r'\S+', quote)) for quote in quotes), projection.MAX_WORDS)
        self.assertEqual(text.count('### ' + fixtures.NEON), 1)
        self.assertIn('preview omitted: quote budget or capture limit.', text)
        for snap in snapshots:
            p = self.helper.source(self.build([snap]))['observation']['documentProjection']
            self.assertLessEqual(sum(len(re.findall(r'\S+', s[f])) for s in p['sections'] for f in ('heading','excerpt')), projection.MAX_WORDS)


if __name__ == '__main__': unittest.main()
