"""Local acceptance adapter ONLY: fake identity/rights, no production binding or sends."""
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
import argparse
import hashlib
import os
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import import_source_receipt as receipt
import source_receipt_history as history
import monitoring_workflow as workflow

SCOPE = workflow.Scope('acct_monitoringfixture', 'test', 'monitoring-fixture-v1')
OWNER_A = hashlib.sha256(b'fixture monitoring owner A').hexdigest()
OWNER_B = hashlib.sha256(b'fixture monitoring owner B').hexdigest()
WORKER_KEY = hashlib.sha256(b'fixture monitoring worker').hexdigest()
WATCHLIST_ID = hashlib.sha256(b'fixture watchlist').hexdigest()
SLUGS = ('heap-mcp', 'revenuecat-mcp')
JOB = workflow.PeriodJob(WATCHLIST_ID, 1, '2026-10-01T00:00:00Z', '2026-11-12T00:00:00Z')
NOW = datetime(2026, 11, 12, 12, tzinfo=timezone.utc)


def actual_inputs():
    saved = ROOT / 'documents/source-monitor-reviews/2026-10-04-manual'
    sha = '2196cc1d41678e4ac23cda41751bfb5eceb6a2c114dc6a6a53ebda070c87d347'
    return workflow.EngineInputs(
        [{'report': receipt.read_receipt(saved / 'receipt.json', sha), 'execution': receipt.strict_json((saved / 'execution.json').read_bytes()), 'sha256': sha, 'headSha': 'a3f2affc5a8e354428ecc66ed11c33ea1ec4dca8'}],
        receipt.strict_json((ROOT / 'data/mcps.json').read_bytes()), receipt.strict_json((ROOT / 'data/listing-evidence.json').read_bytes()))


class LocalFixtureStore:
    """Testing only; never imported by get_production_binding or application routes."""
    def __init__(self, directory):
        self.directory = Path(directory)
        history.reject_symlinks(self.directory)
        receipt.validate_output_directory(self.directory, [])
        self.bundles, self.index = self.directory / 'bundles', self.directory / 'jobs'
        self.prepares = self.commits = self.reads = 0
        self.fail_after_prepare = self.fail_after_commit = False

    def get(self, job_id):
        if not workflow.HEX.fullmatch(job_id): raise ValueError('Invalid fixture index')
        target = self.index / (job_id + '.json'); history.reject_symlinks(target)
        try: data = receipt.strict_json(receipt.bounded_read(target))
        except FileNotFoundError: return None
        if set(data) != {'schemaVersion', 'record'} or data['schemaVersion'] != 1: raise ValueError('Invalid fixture index')
        record = data['record']
        return workflow.CommittedReport(**{**record, 'scope': workflow.Scope(**record['scope']), 'artifact': workflow.Artifact(**record['artifact']), 'slugs': tuple(record['slugs'])})

    def prepare(self, report):
        self.prepares += 1
        bundle = history.write_history(self.bundles, report)
        body = history.recover_history(bundle)
        if self.fail_after_prepare:
            self.fail_after_prepare = False
            raise OSError('Synthetic crash after bundle, before index')
        return workflow.Artifact(bundle.name, hashlib.sha256(body).hexdigest(), len(body))

    def commit_if_absent(self, record):
        self.commits += 1
        self.index.mkdir(parents=True, exist_ok=True, mode=0o700)
        target = self.index / (record.job_id + '.json'); history.reject_symlinks(target)
        payload = receipt.canonical_bytes({'schemaVersion': 1, 'record': asdict(record)})
        fd, temporary = tempfile.mkstemp(prefix='.fixture-index-', dir=self.index)
        try:
            with os.fdopen(fd, 'wb') as file:
                file.write(payload); file.flush(); os.fsync(file.fileno())
            try: os.link(temporary, target)
            except FileExistsError: pass
            fd = os.open(self.index, os.O_RDONLY | os.O_DIRECTORY)
            try: os.fsync(fd)
            finally: os.close(fd)
        finally: Path(temporary).unlink()
        if self.fail_after_commit:
            self.fail_after_commit = False
            raise OSError('Synthetic lost acknowledgement after commit')
        return self.get(record.job_id)

    def read_bytes(self, artifact):
        self.reads += 1
        if not workflow.HEX.fullmatch(artifact.bundle_id): raise ValueError('Invalid fixture bundle')
        return history.recover_history(self.bundles / artifact.bundle_id)


class FixtureAuthority:
    def __init__(self):
        self.status = {'generate': 'active', 'recover': 'active'}
        self.calls = []
        self.watchlist = workflow.CanonicalWatchlist(SCOPE, OWNER_A, WATCHLIST_ID, 1, SLUGS)
        self.inputs = actual_inputs()
        self.source_calls = self.watchlist_calls = 0

    def authenticate_worker(self, context):
        return workflow.VerifiedWorker(SCOPE, WORKER_KEY) if context == 'fixture-worker' else None

    def authenticate_owner(self, context):
        owner = {'fixture-owner-a': OWNER_A, 'fixture-owner-b': OWNER_B}.get(context)
        return workflow.Principal(SCOPE, owner) if owner else None

    def load_watchlist(self, job):
        self.watchlist_calls += 1
        return self.watchlist

    def current_rights(self, scope, owner, watchlist, version, start, end, action):
        self.calls.append(action)
        return workflow.RightsDecision(scope, owner, watchlist, version, start, end, action, self.status[action])

    def load_sources(self, job, watchlist):
        self.source_calls += 1
        return self.inputs

    def worker(self, store, **overrides):
        args = dict(scope=SCOPE, authenticate_worker=self.authenticate_worker, authenticate_owner=self.authenticate_owner, load_watchlist=self.load_watchlist, current_rights=self.current_rights, load_verified_sources=self.load_sources, store=store, now=lambda: NOW)
        return workflow.MonitoringWorker(**{**args, **overrides})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('generate', 'recover'))
    parser.add_argument('--directory', type=Path, required=True)
    parser.add_argument('--job-id')
    parser.add_argument('--owner', choices=('fixture-owner-a', 'fixture-owner-b'), default='fixture-owner-a')
    args = parser.parse_args()
    authority = FixtureAuthority(); worker = authority.worker(LocalFixtureStore(args.directory))
    if args.command == 'generate':
        sys.stdout.buffer.write(receipt.canonical_bytes(asdict(worker.run_period('fixture-worker', JOB))))
    else:
        body = worker.recover(args.owner, args.job_id)
        if body is None: parser.exit(3, 'Fixture access denied or absent\n')
        sys.stdout.buffer.write(body)


if __name__ == '__main__': main()
