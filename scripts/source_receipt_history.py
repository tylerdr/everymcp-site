#!/usr/bin/env python3
"""Build and recover offline, immutable public-source history reports."""
import argparse
import ctypes
import errno
import re
from collections import Counter
import os
import sys
import tempfile
from pathlib import Path

import monitor_sources as monitor
import import_source_receipt as receipt


def load_history(manifest_path, as_of, slugs=None):
    manifest_path = Path(manifest_path)
    raw = receipt.strict_json(receipt.bounded_read(manifest_path))
    if not isinstance(raw, dict) or set(raw) != {'schemaVersion', 'receipts'} or type(raw['schemaVersion']) is not int or raw['schemaVersion'] != 1 or not isinstance(raw['receipts'], list) or not 1 <= len(raw['receipts']) <= 32:
        raise ValueError('Invalid history manifest')
    catalog = receipt.strict_json(receipt.bounded_read(monitor.ROOT / 'data/mcps.json'))
    curated = receipt.strict_json(receipt.bounded_read(monitor.ROOT / 'data/listing-evidence.json'))
    snapshots, inputs = [], [manifest_path]
    for item in raw['receipts']:
        if not isinstance(item, dict) or set(item) != {'receiptPath', 'executionPath', 'sha256', 'headSha'} or any(not isinstance(v, str) for v in item.values()):
            raise ValueError('Invalid manifest receipt')
        paths = [manifest_path.parent / item[k] for k in ('receiptPath', 'executionPath')]
        inputs.extend(paths)
        snapshots.append({'report': receipt.read_receipt(paths[0], item['sha256']), 'execution': receipt.strict_json(receipt.bounded_read(paths[1])), 'sha256': item['sha256'], 'headSha': item['headSha']})
    return build_history(snapshots, as_of, catalog, curated, slugs), inputs


def build_history(snapshots, as_of, catalog, curated, slugs=None):
    now = monitor.parse_date(as_of)
    if not isinstance(snapshots, list) or not 1 <= len(snapshots) <= 32:
        raise ValueError('History needs one to 32 receipts')
    listings, inventory, _ = monitor.inventory(catalog, curated)
    known = {x['slug'] for x in listings}
    if slugs is not None and (not isinstance(slugs, (list, tuple)) or not 1 <= len(slugs) <= 100 or any(not isinstance(x, str) or x not in known for x in slugs)):
        raise ValueError('Invalid selected slugs')
    selected = known if slugs is None else set(slugs)
    unique, executions = {}, {}
    for snap in snapshots:
        if set(snap) != {'report', 'execution', 'sha256', 'headSha'}:
            raise ValueError('Invalid snapshot')
        report, execution, sha = snap['report'], snap['execution'], snap['sha256']
        monitor.validate_report(report)
        if monitor.digest(receipt.canonical_bytes(report)) != sha:
            raise ValueError('Receipt SHA-256 mismatch')
        receipt.validate_execution(execution, report, snap['headSha'], as_of)
        receipt.validate_inventory_and_observations(report, catalog, curated, execution)
        execution_id = (execution['run']['id'], execution['job']['id'])
        if execution_id in executions and executions[execution_id] != sha:
            raise ValueError('Conflicting receipts from one execution')
        executions[execution_id] = sha
        if sha in unique and unique[sha] != snap:
            raise ValueError('Conflicting duplicate receipt')
        unique[sha] = snap
    ordered = sorted(unique.values(), key=lambda s: (monitor.parse_date(s['report']['generatedAt']), s['sha256']))
    by_url = {url: [] for url in inventory}
    findings = {url: {} for url in inventory}
    last_attempt = {}
    last_success = {}
    for snap in ordered:
        for index, source in enumerate(snap['report']['sources']):
            url = source['url']
            for field, previous in (('observation', last_attempt), ('lastSuccessfulObservation', last_success)):
                value = source[field]
                if url in previous and (not value or monitor.parse_date(value['checkedAt']) < monitor.parse_date(previous[url]['checkedAt'])):
                    raise ValueError('Observation chronology regressed')
                if value: previous[url] = value
            ref = {'receiptSha256': snap['sha256'], 'runUrl': snap['execution']['run']['url'], 'jobUrl': snap['execution']['job']['url'], 'pointer': f'/sources/{index}', 'receiptGeneratedAt': snap['report']['generatedAt']}
            for key in ('observation', 'lastSuccessfulObservation'):
                obs = source[key]
                if obs:
                    previous = next((x for x in by_url[url] if monitor.parse_date(x['observation']['checkedAt']) == monitor.parse_date(obs['checkedAt'])), None)
                    if previous and {k: v for k, v in previous['observation'].items() if k != 'checkedAt'} != {k: v for k, v in obs.items() if k != 'checkedAt'}:
                        raise ValueError('Conflicting observations')
                    if not previous:
                        by_url[url].append({'observation': obs, 'evidence': {**ref, 'pointer': ref['pointer'] + '/' + key}})
            for finding in source['reviewFindings']:
                old = findings[url].get(finding['kind'])
                if old:
                    finding = {**old, 'firstObservedAt': min((old['firstObservedAt'], finding['firstObservedAt']), key=monitor.parse_date), 'lastObservedAt': max((old['lastObservedAt'], finding['lastObservedAt']), key=monitor.parse_date)}
                findings[url][finding['kind']] = finding
    latest = {s['url']: (s, i) for i, s in enumerate(ordered[-1]['report']['sources'])}
    rows = {}
    for url, attempts in by_url.items():
        attempts.sort(key=lambda x: monitor.parse_date(x['observation']['checkedAt']))
        events, previous, success, conclusive = [], None, None, None
        def add_event(kind, attempt, before=None):
            obs = attempt['observation']
            identity = {'url': url, 'kind': kind, 'observation': {**obs, 'checkedAt': monitor.parse_date(obs['checkedAt']).isoformat()}}
            if before:
                identity['before'] = {k: before['observation'][k] for k in ('state', 'contentHash')}
            event = {'id': monitor.digest(receipt.canonical_bytes(identity)), 'kind': kind, **attempt}
            if before:
                event.update(beforeObservation=before['observation'], beforeEvidence=before['evidence'])
            events.append(event)
        for attempt in attempts:
            obs = attempt['observation']; state = obs['state']
            if previous is None:
                add_event('baseline', attempt)
            elif state == 'unknown':
                add_event('inconclusive', attempt, previous)
            elif conclusive and conclusive['observation']['state'] == 'reachable' and state == 'missing_at_check':
                add_event('source_missing_at_check', attempt, conclusive)
            elif conclusive and conclusive['observation']['state'] == 'missing_at_check' and state == 'reachable':
                add_event('source_reachable_again', attempt, conclusive)
            if state == 'reachable':
                if success and success['observation']['contentHash'] != obs['contentHash']:
                    add_event('source_body_changed', attempt, success)
                success = attempt
            if state != 'unknown': conclusive = attempt
            previous = attempt
        source, index = latest[url]; obs = source['observation']
        if attempts and (not obs or monitor.parse_date(attempts[-1]['observation']['checkedAt']) > monitor.parse_date(obs['checkedAt'])):
            raise ValueError('Observation chronology regressed')
        rows[url] = {'url': url, 'relationships': source['relationships'], 'observation': obs, 'lastSuccessfulObservation': source['lastSuccessfulObservation'], 'state': obs['state'] if obs else 'not_checked', 'freshnessAsOf': 'unchecked' if not obs else 'stale' if monitor.is_due(source, obs, now, 7) else 'current', 'runDisposition': source['runDisposition'], 'reviewFindings': sorted(findings[url].values(), key=lambda x: receipt.canonical_bytes(x)), 'events': events, 'evidence': {'receiptSha256': ordered[-1]['sha256'], 'runUrl': ordered[-1]['execution']['run']['url'], 'jobUrl': ordered[-1]['execution']['job']['url'], 'pointer': f'/sources/{index}', 'receiptGeneratedAt': ordered[-1]['report']['generatedAt']}}
    names = {item['slug']: item['name'] for item in catalog}
    entries = [{**listing, 'name': names[listing['slug']], 'sources': [rows[url] for url in sorted(rows) if any(r['slug'] == listing['slug'] for r in rows[url]['relationships'])]} for listing in sorted(listings, key=lambda x: x['slug']) if listing['slug'] in selected]
    selected_urls = {source['url'] for entry in entries for source in entry['sources']}
    selected_rows = [rows[url] for url in sorted(selected_urls)]
    summary = {'selectedSlugCount': len(selected), 'sourceCount': len(selected_rows), 'stateCounts': dict(sorted(Counter(row['state'] for row in selected_rows).items())), 'staleOrUnchecked': sum(row['freshnessAsOf'] != 'current' for row in selected_rows), 'datedObservationCount': sum(len(by_url[url]) for url in selected_urls), 'eventCounts': dict(sorted(Counter(event['kind'] for row in selected_rows for event in row['events']).items()))}
    refs = [{'receiptSha256': s['sha256'], 'headSha': s['headSha'], 'generatedAt': s['report']['generatedAt'], 'runUrl': s['execution']['run']['url'], 'jobUrl': s['execution']['job']['url']} for s in ordered]
    latest_report = ordered[-1]['report']
    return {'schemaVersion': 1, 'historyPolicyVersion': 'source-receipt-history-v1', 'sourcePolicyVersion': latest_report['policyVersion'], 'asOf': as_of, 'selectedSlugs': sorted(selected), 'receipts': refs, 'summary': summary, 'publication': latest_report['publication'], 'assessment': latest_report['assessment'], 'inventoryFindings': latest_report['inventoryFindings'], 'entries': entries}


def markdown_text(value):
    return re.sub(r'([\\`*_{}\[\]()#+.!|<>-])', r'\\\1', str(value)).replace('\n', ' ').replace('\r', ' ')


def render_history(report):
    summary = report['summary']
    lines = ['# Public source history', '', f"As of: {report['asOf']}", '',
             f"{summary['selectedSlugCount']} selected listings; {summary['sourceCount']} distinct source URLs; {summary['datedObservationCount']} distinct dated observations in {len(report['receipts'])} supplied receipts.",
             f"Latest evidence states: {', '.join(f'{k}: {v}' for k, v in summary['stateCounts'].items())}. Stale or unchecked sources: {summary['staleOrUnchecked']}.", '',
             'Offline, review-required evidence. Receipt dates are observation dates, not proof that monitoring is running now. No automatic delivery or paid entitlement is established.',
             'HTTP observations do not establish MCP compatibility, tool behavior, security or publisher identity. Missing-at-check means HTTP 404/410 at that time; unknown is inconclusive. Neither proves continuous downtime, outage duration or uptime. Raw source-body changes can include page chrome.',
             'Unchanged or cached evidence is not a new check. Unresolved findings remain visible after recovery. Independently verified origin is required: hashes establish content integrity, not who collected it.', '']
    labels = {'baseline': 'Baseline observation', 'inconclusive': 'Inconclusive check', 'source_missing_at_check': 'Source missing at check', 'source_reachable_again': 'Source reachable again', 'source_body_changed': 'Complete source bytes changed'}
    for entry in report['entries']:
        lines += [f"## {markdown_text(entry['name'])} (`{entry['slug']}`)", '']
        for source in entry['sources']:
            obs = source['observation'] or {}
            success = source['lastSuccessfulObservation']
            roles = ', '.join(sorted({r['role'] + '/' + r['identityEvidence'] for r in source['relationships'] if r['slug'] == entry['slug']}))
            lines += [f"- {source['url']} ({roles}): {source['state']} at {obs.get('checkedAt', 'not checked')}; HTTP {obs.get('httpStatus')} / {obs.get('reason', 'no_observation')}; freshness {source['freshnessAsOf']}; disposition {source['runDisposition']}.", f"  Evidence: {source['evidence']['jobUrl']} `{source['evidence']['pointer']}` · receipt `{source['evidence']['receiptSha256']}`."]
            if success:
                lines.append(f"  Last successful observation: {success['checkedAt']} · complete-body SHA-256 `{success['contentHash']}`.")
            for event in source['events']:
                after = event['observation']
                lines.append(f"  - {labels[event['kind']]} at {after['checkedAt']} (HTTP {after['httpStatus']} / {after['reason']}) · {event['evidence']['jobUrl']} `{event['evidence']['pointer']}` · receipt `{event['evidence']['receiptSha256']}`.")
                if event.get('beforeObservation'):
                    before, evidence = event['beforeObservation'], event['beforeEvidence']
                    lines.append(f"    Compared with {before['state']} at {before['checkedAt']}: {evidence['jobUrl']} `{evidence['pointer']}` · receipt `{evidence['receiptSha256']}`.")
                    if event['kind'] == 'source_body_changed':
                        lines.append(f"    Complete-body SHA-256 `{before['contentHash']}` → `{after['contentHash']}`. Inspect the source and your pinned revision before changing an integration; semantic impact is unknown.")
            for finding in source['reviewFindings']:
                lines.append(f"  - Review required: {finding['kind']} ({finding['firstObservedAt']} to {finding['lastObservedAt']}).")
        lines.append('')
    return '\n'.join(lines).encode()


def reject_symlinks(path):
    path = Path(os.path.abspath(path))
    for part in (path, *path.parents):
        if part.is_symlink(): raise ValueError('Symlink path is not permitted')


def recover_history(bundle):
    bundle = Path(bundle)
    reject_symlinks(bundle)
    if bundle.is_symlink() or not bundle.is_dir() or {x.name for x in bundle.iterdir()} != {'manifest.json', 'report.json', 'report.md'}:
        raise ValueError('Invalid bundle contents')
    for p in bundle.iterdir():
        if p.is_symlink() or not p.is_file(): raise ValueError('Invalid bundle file')
    manifest_bytes = receipt.bounded_read(bundle / 'manifest.json')
    manifest = receipt.strict_json(manifest_bytes)
    if not isinstance(manifest, dict) or bundle.name != monitor.digest(manifest_bytes) or set(manifest) != {'schemaVersion', 'files'} or type(manifest['schemaVersion']) is not int or manifest['schemaVersion'] != 1 or not isinstance(manifest['files'], dict) or set(manifest['files']) != {'report.json', 'report.md'}:
        raise ValueError('Invalid bundle identity')
    contents = {}
    for name, meta in manifest['files'].items():
        data = receipt.bounded_read(bundle / name)
        if meta != {'sha256': monitor.digest(data), 'length': len(data)}: raise ValueError('Bundle integrity failure')
        contents[name] = data
    report = receipt.strict_json(contents['report.json'])
    if receipt.canonical_bytes(report) != contents['report.json'] or render_history(report) != contents['report.md']:
        raise ValueError('Bundle report mismatch')
    return contents['report.md']


def write_history(output_dir, report):
    directory = Path(output_dir)
    reject_symlinks(directory)
    receipt.validate_output_directory(directory, [])
    files = {'report.json': receipt.canonical_bytes(report), 'report.md': render_history(report)}
    if any(len(v) > receipt.MAX_INPUT_BYTES for v in files.values()): raise ValueError('Output exceeds size limit')
    manifest = receipt.canonical_bytes({'schemaVersion': 1, 'files': {k: {'sha256': monitor.digest(v), 'length': len(v)} for k, v in files.items()}})
    files['manifest.json'] = manifest
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / monitor.digest(manifest)
    if target.exists() or target.is_symlink():
        recover_history(target)
        if any(receipt.bounded_read(target / k) != v for k, v in files.items()): raise ValueError('Immutable bundle collision')
        return target
    with tempfile.TemporaryDirectory(prefix='.history-', dir=directory) as temp:
        stage = Path(temp) / 'bundle'; stage.mkdir()
        for name, data in files.items():
            with (stage / name).open('xb') as stream:
                stream.write(data); stream.flush(); os.fsync(stream.fileno())
        fd = os.open(stage, os.O_RDONLY | os.O_DIRECTORY)
        try: os.fsync(fd)
        finally: os.close(fd)
        libc = ctypes.CDLL(None, use_errno=True)
        if not hasattr(libc, 'renameat2'):
            raise ValueError('Atomic publication requires Linux renameat2; no overwrite fallback')
        rename = libc.renameat2
        rename.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
        rename.restype = ctypes.c_int
        if rename(-100, os.fsencode(stage), -100, os.fsencode(target), 1) != 0:
            error = ctypes.get_errno()
            if error != errno.EEXIST: raise OSError(error, os.strerror(error))
            recover_history(target)
            if any(receipt.bounded_read(target / k) != v for k, v in files.items()): raise ValueError('Immutable bundle collision')
        fd = os.open(directory, os.O_RDONLY | os.O_DIRECTORY)
        try: os.fsync(fd)
        finally: os.close(fd)
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    build = sub.add_parser('build'); build.add_argument('--manifest', type=Path, required=True); build.add_argument('--as-of', required=True); build.add_argument('--slug', action='append'); build.add_argument('--output-dir', type=Path, default=monitor.ROOT / 'tmp/source-monitor/history')
    recover = sub.add_parser('recover'); recover.add_argument('--bundle', type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == 'recover': sys.stdout.buffer.write(recover_history(args.bundle))
        else:
            report, inputs = load_history(args.manifest, args.as_of, args.slug)
            receipt.validate_output_directory(args.output_dir, inputs)
            print(write_history(args.output_dir, report))
    except (ValueError, OSError, TypeError, KeyError) as error:
        parser.exit(2, f'error: {error}\n')


if __name__ == '__main__': main()
