"""Provider-free history acceptance; all multi-run transitions here are synthetic."""
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from datetime import timedelta, timezone
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import import_source_receipt as importer
import monitor_sources as monitor
import source_receipt_history as history

ACTUAL = ROOT / 'documents/source-monitor-reviews/2026-10-04-manual'
ACTUAL_HASH = '2196cc1d41678e4ac23cda41751bfb5eceb6a2c114dc6a6a53ebda070c87d347'
ACTUAL_HEAD = 'a3f2affc5a8e354428ecc66ed11c33ea1ec4dca8'
AS_OF = '2026-11-12T00:00:00Z'
NEON = 'https://github.com/neondatabase/mcp-server-neon'
SLUGS = ['neon-mcp', 'neon-mcp-server']


class ReceiptHistoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = importer.strict_json((ROOT / 'data/mcps.json').read_bytes())
        cls.curated = importer.strict_json((ROOT / 'data/listing-evidence.json').read_bytes())
        cls.listings, cls.inventory, cls.rejected = monitor.inventory(cls.catalog, cls.curated)

    def snap(self, day, changes=None, previous=None, *, headers=None, capture=False):
        """Generate explicitly synthetic receipts via real collector schema/cache rules."""
        changes = changes or {}
        cache = {} if previous is None else {
            s['url']: {k: copy.deepcopy(s[k]) for k in ('observation', 'lastSuccessfulObservation', 'reviewFindings')}
            for s in previous['report']['sources'] if s['observation']
        }
        stamp = f'2026-11-{day:02d}T00:00:01Z'
        for url, (status, body) in changes.items():
            prior = cache.get(url, {})
            cache[url] = monitor.update_cache(prior, monitor.observe(status, headers or {}, body, prior, stamp, **({'source': self.inventory[url]} if capture else {})))
        skipped = {url: 'fresh_cache' if url in cache and not monitor.is_due(source, cache[url]['observation'], monitor.parse_date(stamp), 7) else 'run_budget' for url, source in self.inventory.items() if url not in changes}
        metrics = {'requests': len(changes), 'robotsRequests': 0, 'receivedBytes': sum(cache[url]['observation']['receivedBytes'] for url in changes), 'durationMs': 0}
        report = monitor.build_report(self.listings, self.inventory, self.rejected, cache, f'2026-11-{day:02d}T00:00:02Z', len(changes), 'check', skipped, 7, metrics=metrics)
        run_id, job_id = 1000 + day, 2000 + day
        run_url = f'https://github.com/tylerdr/everymcp-site/actions/runs/{run_id}'
        execution = {
            'repository': 'tylerdr/everymcp-site', 'workflowPath': '.github/workflows/source-monitor.yml',
            'run': {'id': run_id, 'headSha': '1' * 40, 'headBranch': 'main', 'event': 'schedule', 'status': 'completed', 'conclusion': 'success', 'createdAt': f'2026-11-{day:02d}T00:00:00Z', 'updatedAt': f'2026-11-{day:02d}T00:00:04Z', 'url': run_url},
            'job': {'id': job_id, 'runId': run_id, 'name': 'observe', 'status': 'completed', 'conclusion': 'success', 'startedAt': f'2026-11-{day:02d}T00:00:00Z', 'completedAt': f'2026-11-{day:02d}T00:00:03Z', 'url': f'{run_url}/job/{job_id}'}
        }
        result = {'report': report, 'execution': execution, 'sha256': monitor.digest(importer.canonical_bytes(report)), 'headSha': '1' * 40}
        importer.validate_execution(execution, report, result['headSha'], AS_OF)
        importer.validate_inventory_and_observations(report, self.catalog, self.curated, execution)
        return result

    def build(self, snapshots, slugs=None, as_of=AS_OF):
        return history.build_history(snapshots, as_of, self.catalog, self.curated, slugs)

    def source(self, report, url=NEON):
        return next(s for entry in report['entries'] for s in entry['sources'] if s['url'] == url)

    def actual(self):
        return {'report': importer.read_receipt(ACTUAL / 'receipt.json', ACTUAL_HASH), 'execution': importer.strict_json((ACTUAL / 'execution.json').read_bytes()), 'sha256': ACTUAL_HASH, 'headSha': ACTUAL_HEAD}

    def test_actual_historical_receipt_preserves_coverage_without_new_changes(self):
        with patch.object(monitor.socket, 'create_connection', side_effect=AssertionError('network forbidden')), patch.object(monitor, 'fetch_source', side_effect=AssertionError('collection forbidden')):
            report = self.build([self.actual()])
        self.assertEqual(len(report['entries']), 616)
        sources = {s['url']: s for e in report['entries'] for s in e['sources']}
        self.assertEqual(len(sources), 585)
        self.assertEqual(sum(s['state'] == 'not_checked' for s in sources.values()), 465)
        self.assertEqual(sum(s['state'] == 'reachable' for s in sources.values()), 38)
        self.assertEqual(sum(s['state'] == 'missing_at_check' for s in sources.values()), 77)
        self.assertEqual(sum(s['state'] == 'unknown' for s in sources.values()), 5)
        self.assertTrue(all(s['freshnessAsOf'] in ('stale', 'unchecked') for s in sources.values()))
        self.assertTrue(all(e['kind'] == 'baseline' for s in sources.values() for e in s['events']))
        text = history.render_history(report).decode()
        self.assertIn('2026-10-04', text)
        self.assertIn(ACTUAL_HASH, text)
        self.assertIn('unknown', text)
        self.assertIn('stale', text)

    def test_shared_url_keeps_both_slugs_and_shuffled_duplicate_input_is_identical(self):
        one = self.snap(1, {NEON: (200, b'first')})
        two = self.snap(2, previous=one)
        expected = self.build([one, two], SLUGS)
        self.assertEqual(importer.canonical_bytes(expected), importer.canonical_bytes(self.build([two, one, copy.deepcopy(one)], list(reversed(SLUGS)))))
        self.assertEqual({e['slug'] for e in expected['entries']}, set(SLUGS))
        self.assertEqual({r['slug'] for r in self.source(expected)['relationships']}, set(SLUGS))
        self.assertEqual(len(self.source(expected)['events']), 1)
        with self.assertRaises(ValueError): self.build([one], ['unknown-listing'])
        with self.assertRaises(ValueError): self.build([one], [])
        with self.assertRaises(ValueError): self.build([one], ['neon-mcp'] * 101)

    def test_unknown_does_not_erase_success_or_the_comparison_evidence(self):
        one = self.snap(1, {NEON: (200, b'first')})
        two = self.snap(2, {NEON: (503, b'unavailable')}, one)
        three = self.snap(3, {NEON: (200, b'changed')}, two)
        interim = self.source(self.build([one, two], SLUGS))
        self.assertEqual(interim['state'], 'unknown')
        self.assertEqual(interim['lastSuccessfulObservation']['contentHash'], monitor.digest(b'first'))
        source = self.source(self.build([one, two, three], SLUGS))
        self.assertEqual([e['kind'] for e in source['events']], ['baseline', 'inconclusive', 'source_body_changed'])
        event = source['events'][-1]
        self.assertEqual(event['beforeObservation']['contentHash'], monitor.digest(b'first'))
        self.assertEqual(event['observation']['contentHash'], monitor.digest(b'changed'))
        self.assertEqual(event['beforeEvidence']['receiptSha256'], one['sha256'])
        self.assertEqual(event['evidence']['receiptSha256'], three['sha256'])
        self.assertTrue(event['evidence']['pointer'].endswith('/observation'))

    def test_missing_unknown_recovery_retains_findings_without_claiming_downtime(self):
        one = self.snap(1, {NEON: (200, b'first')})
        two = self.snap(2, {NEON: (404, b'missing')}, one)
        three = self.snap(3, {NEON: (503, b'unknown')}, two)
        four = self.snap(4, {NEON: (200, b'first')}, three)
        source = self.source(self.build([one, two, three, four], SLUGS))
        self.assertEqual([e['kind'] for e in source['events']], ['baseline', 'source_missing_at_check', 'inconclusive', 'source_reachable_again'])
        self.assertEqual(source['events'][-1]['beforeObservation']['state'], 'missing_at_check')
        self.assertTrue(any(f['kind'] == 'source_missing_at_check' for f in source['reviewFindings']))
        self.assertNotIn('downtimeSeconds', importer.canonical_bytes(source).decode())

    def test_304_and_cached_replay_do_not_repeat_body_changes_or_event_ids(self):
        one = self.snap(1, {NEON: (200, b'first')})
        two = self.snap(2, {NEON: (200, b'changed')}, one)
        three = self.snap(3, {NEON: (304, b'')}, two)
        four = self.snap(4, previous=three)
        before = self.source(self.build([one, two], SLUGS))
        after = self.source(self.build([one, two, three, four], SLUGS))
        self.assertEqual([e['id'] for e in before['events']], [e['id'] for e in after['events']])
        self.assertEqual(after['observation']['httpStatus'], 304)
        self.assertEqual(after['observation']['checkedAt'], '2026-11-03T00:00:01Z')

    def test_first_unknown_remains_baseline_and_earlier_success_is_recovered_from_receipt(self):
        one = self.snap(1, {NEON: (503, b'unknown')})
        self.assertEqual(self.source(self.build([one], SLUGS))['events'][0]['kind'], 'baseline')
        earlier = self.snap(1, {NEON: (200, b'first')})
        later = self.snap(2, {NEON: (503, b'unknown')}, earlier)
        source = self.source(self.build([later], SLUGS))
        self.assertEqual([e['kind'] for e in source['events']], ['baseline', 'inconclusive'])
        self.assertTrue(source['events'][0]['evidence']['pointer'].endswith('/lastSuccessfulObservation'))

    def test_expected_head_tampered_provenance_inventory_and_future_fail_closed(self):
        valid = self.snap(1, {NEON: (200, b'first')})
        for mutate in (
            lambda s: s.update(headSha='0' * 40),
            lambda s: s['execution']['run'].update(event='pull_request'),
            lambda s: s['execution']['job'].update(url='https://example.test/forged'),
            lambda s: s['report']['sources'][0]['relationships'][0].update(slug='wrong-listing'),
            lambda s: s['report']['assessment'].update(score=1),
        ):
            bad = copy.deepcopy(valid); mutate(bad)
            bad['sha256'] = monitor.digest(importer.canonical_bytes(bad['report']))
            with self.subTest(mutate=mutate), self.assertRaises(ValueError): self.build([bad])
        with self.assertRaises(ValueError): self.build([valid], as_of='2026-10-31T00:00:00Z')
        duplicate = copy.deepcopy(valid); duplicate['execution']['run']['id'] += 1
        with self.assertRaises(ValueError): self.build([valid, duplicate])

    def test_regressed_and_conflicting_same_timestamp_observations_are_rejected(self):
        one = self.snap(1, {NEON: (200, b'first')})
        two = self.snap(2, {NEON: (200, b'changed')}, one)
        three = self.snap(3, previous=one)
        with self.assertRaises(ValueError): self.build([one, two, three], SLUGS)
        conflict = self.snap(2, previous=one)
        s = next(s for s in conflict['report']['sources'] if s['url'] == NEON)
        for field in ('observation', 'lastSuccessfulObservation'): s[field]['contentHash'] = '0' * 64
        conflict['sha256'] = monitor.digest(importer.canonical_bytes(conflict['report']))
        with self.assertRaises(ValueError): self.build([one, conflict], SLUGS)

    def test_bundle_is_immutable_and_recovery_works_in_a_fresh_process(self):
        report = self.build([self.snap(1, {NEON: (200, b'first')})], SLUGS)
        with tempfile.TemporaryDirectory() as temp:
            bundle = history.write_history(Path(temp) / 'history', report)
            original = (bundle / 'report.md').read_bytes()
            self.assertEqual(history.write_history(Path(temp) / 'history', report), bundle)
            result = subprocess.run([sys.executable, str(ROOT / 'scripts/source_receipt_history.py'), 'recover', '--bundle', str(bundle)], capture_output=True, check=True)
            self.assertEqual(result.stdout, original)
            self.assertEqual(history.recover_history(bundle), history.render_history(report))
            (bundle / 'report.md').write_bytes(original + b'corruption')
            with self.assertRaises(ValueError): history.recover_history(bundle)
            with self.assertRaises(ValueError): history.write_history(Path(temp) / 'history', report)
            self.assertEqual((bundle / 'report.md').read_bytes(), original + b'corruption')

    def test_latest_summary_deduplicates_shared_sources_and_counts_real_checks(self):
        one = self.snap(1, {NEON: (200, b'first')})
        two = self.snap(2, {NEON: (304, b'')}, one)
        three = self.snap(3, previous=two)
        report = self.build([three, one, two], SLUGS)
        self.assertEqual(report['summary'], {'selectedSlugCount': 2, 'sourceCount': 1, 'stateCounts': {'reachable': 1}, 'staleOrUnchecked': 1, 'datedObservationCount': 2, 'eventCounts': {'baseline': 1}})
        self.assertEqual(report['publication']['mode'], 'review_required')
        self.assertIsNone(report['assessment']['score'])
        self.assertIsNone(report['assessment']['totalApplicableCriteria'])
        text = history.render_history(report).decode()
        self.assertIn('2 selected listings; 1 distinct source URLs; 2 distinct dated observations', text)
        self.assertIn('MCP compatibility', text)
        self.assertIn('unknown is inconclusive', text)

    def test_timezone_offsets_are_sorted_by_instant_not_lexical_date(self):
        one = self.snap(2, {NEON: (200, b'first')})
        two = self.snap(3, {NEON: (200, b'changed')}, one)
        def shift(value):
            return (monitor.parse_date(value) - timedelta(hours=23)).astimezone(timezone(timedelta(hours=-5))).isoformat()
        two['report']['generatedAt'] = shift(two['report']['generatedAt'])
        source = next(s for s in two['report']['sources'] if s['url'] == NEON)
        for field in ('observation', 'lastSuccessfulObservation'): source[field]['checkedAt'] = shift(source[field]['checkedAt'])
        for finding in source['reviewFindings']:
            finding['firstObservedAt'] = shift(finding['firstObservedAt']); finding['lastObservedAt'] = shift(finding['lastObservedAt'])
        for group, fields in [('run', ['createdAt', 'updatedAt']), ('job', ['startedAt', 'completedAt'])]:
            for field in fields: two['execution'][group][field] = shift(two['execution'][group][field])
        two['sha256'] = monitor.digest(importer.canonical_bytes(two['report']))
        source = self.source(self.build([two, one], SLUGS))
        self.assertEqual([e['kind'] for e in source['events']], ['baseline', 'source_body_changed'])
        self.assertEqual(source['observation']['contentHash'], monitor.digest(b'changed'))

    def test_repeated_findings_merge_and_survive_later_receipt_omission(self):
        one = self.snap(1, {NEON: (404, b'missing')})
        two = self.snap(2, {NEON: (410, b'missing')}, one)
        three = self.snap(3, {NEON: (200, b'found')}, two)
        next(s for s in three['report']['sources'] if s['url'] == NEON)['reviewFindings'] = []
        three['sha256'] = monitor.digest(importer.canonical_bytes(three['report']))
        findings = self.source(self.build([one, two, three], SLUGS))['reviewFindings']
        self.assertEqual(findings, [{'kind': 'source_missing_at_check', 'firstObservedAt': '2026-11-01T00:00:01Z', 'lastObservedAt': '2026-11-02T00:00:01Z', 'resolution': 'review_required'}])

    def test_missing_prior_success_and_execution_forks_fail_closed(self):
        one = self.snap(1, {NEON: (200, b'first')})
        two = self.snap(2, {NEON: (503, b'unknown')}, one)
        next(s for s in two['report']['sources'] if s['url'] == NEON)['lastSuccessfulObservation'] = None
        two['sha256'] = monitor.digest(importer.canonical_bytes(two['report']))
        with self.assertRaises(ValueError): self.build([one, two], SLUGS)
        other = self.snap(1, {NEON: (200, b'other')})
        with self.assertRaises(ValueError): self.build([one, other], SLUGS)

    def test_concurrent_publication_is_idempotent_and_never_replaces_empty_target(self):
        report = self.build([self.snap(1, {NEON: (200, b'first')})], SLUGS)
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            original = history.write_history(directory / 'original', report)
            input_json = directory / 'input.json'; input_json.write_bytes(importer.canonical_bytes(report))
            script = 'import sys,json;from pathlib import Path;sys.path.insert(0,sys.argv[1]);import source_receipt_history as h;print(h.write_history(Path(sys.argv[2]),json.loads(Path(sys.argv[3]).read_bytes())))'
            processes = [subprocess.Popen([sys.executable, '-c', script, str(ROOT / 'scripts'), str(directory / 'concurrent'), str(input_json)], stdout=subprocess.PIPE, stderr=subprocess.PIPE) for _ in range(3)]
            results = [p.communicate(timeout=20) for p in processes]
            self.assertEqual([p.returncode for p in processes], [0, 0, 0], results)
            self.assertEqual(len({out for out, err in results}), 1)
            recovered = Path(results[0][0].decode().strip())
            self.assertEqual(history.recover_history(recovered), history.recover_history(original))
            empty_target = directory / 'refuse' / original.name; empty_target.mkdir(parents=True)
            with self.assertRaises(ValueError): history.write_history(directory / 'refuse', report)
            self.assertEqual(list(empty_target.iterdir()), [])

    def test_missing_extra_and_symlink_bundle_members_are_rejected(self):
        report = self.build([self.snap(1)], SLUGS)
        for mode in ('missing', 'extra', 'symlink'):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as temp:
                bundle = history.write_history(Path(temp) / 'history', report)
                if mode == 'missing': (bundle / 'report.md').unlink()
                elif mode == 'extra': (bundle / 'other').write_text('x')
                else:
                    data = (bundle / 'report.md').read_bytes(); (bundle / 'report.md').unlink()
                    target = Path(temp) / 'other'; target.write_bytes(data); (bundle / 'report.md').symlink_to(target)
                with self.assertRaises(ValueError): history.recover_history(bundle)
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp); target = directory / 'outside'; target.mkdir()
            alias = directory / 'alias'; alias.symlink_to(target, target_is_directory=True)
            with self.assertRaises(ValueError): history.write_history(alias / 'history', report)
            with self.assertRaises(ValueError): history.write_history(ROOT / 'data', report)

    def test_cli_manifest_end_to_end_and_no_partial_output_on_rejection(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            (directory / 'receipt.json').write_bytes((ACTUAL / 'receipt.json').read_bytes())
            (directory / 'execution.json').write_bytes((ACTUAL / 'execution.json').read_bytes())
            manifest = {'schemaVersion': 1, 'receipts': [{'receiptPath': 'receipt.json', 'executionPath': 'execution.json', 'sha256': ACTUAL_HASH, 'headSha': ACTUAL_HEAD}]}
            path = directory / 'inputs.json'; path.write_bytes(importer.canonical_bytes(manifest))
            args = [sys.executable, str(ROOT / 'scripts/source_receipt_history.py'), 'build', '--manifest', str(path), '--as-of', AS_OF, '--slug', 'revenuecat-mcp', '--output-dir', str(directory / 'output')]
            result = subprocess.run(args, capture_output=True, check=True)
            bundle = Path(result.stdout.decode().strip()); self.assertTrue(bundle.is_dir())
            self.assertIn(ACTUAL_HASH, history.recover_history(bundle).decode())
            manifest['receipts'][0]['headSha'] = '0' * 40; path.write_bytes(importer.canonical_bytes(manifest))
            result = subprocess.run(args, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(list((directory / 'output').iterdir()), [bundle])
            self.assertNotIn(b'Traceback', result.stderr)


if __name__ == '__main__': unittest.main()
