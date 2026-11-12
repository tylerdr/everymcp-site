"""Default-off monitoring workflow using injected authoritative adapters only."""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable, Protocol
import hashlib
import json
import re

import source_receipt_history as history

HISTORY_POLICY_VERSION = 'source-receipt-history-v1'
MAX_REPORT_BYTES = 16 * 1024 * 1024
HEX = re.compile(r'^[0-9a-f]{64}$')

class AccessDenied(Exception): pass
class Unavailable(Exception): pass
class InvalidJob(ValueError): pass

@dataclass(frozen=True)
class Scope:
    account_id: str
    mode: str
    product_key: str

@dataclass(frozen=True)
class Principal:
    scope: Scope
    owner_key: str

@dataclass(frozen=True)
class VerifiedWorker:
    scope: Scope
    worker_key: str

@dataclass(frozen=True)
class PeriodJob:
    watchlist_id: str
    watchlist_version: int
    period_start: str
    period_end: str

@dataclass(frozen=True)
class CanonicalWatchlist:
    scope: Scope
    owner_key: str
    watchlist_id: str
    version: int
    slugs: tuple[str, ...]

@dataclass(frozen=True)
class RightsDecision:
    scope: Scope
    owner_key: str
    watchlist_id: str
    version: int
    period_start: str
    period_end: str
    action: str
    decision: str

@dataclass(frozen=True)
class EngineInputs:
    snapshots: list
    catalog: list
    curated: list

@dataclass(frozen=True)
class Artifact:
    bundle_id: str
    sha256: str
    length: int

@dataclass(frozen=True)
class CommittedReport:
    job_id: str
    scope: Scope
    owner_key: str
    watchlist_id: str
    version: int
    period_start: str
    period_end: str
    slugs: tuple[str, ...]
    history_policy_version: str
    artifact: Artifact

@dataclass(frozen=True)
class ReportHandle:
    job_id: str
    artifactId: str
    sha: str
    length: int
    publication: str = 'review_required'

class Store(Protocol):
    def get(self, job_id: str) -> CommittedReport | None: ...
    def prepare(self, report_dict: dict) -> Artifact: ...
    def commit_if_absent(self, report: CommittedReport) -> CommittedReport: ...
    def read_bytes(self, artifact: Artifact) -> bytes: ...


def get_production_binding():
    return None


def _hex(value):
    return isinstance(value, str) and bool(HEX.fullmatch(value))


def _scope(scope):
    return (isinstance(scope, Scope) and isinstance(scope.account_id, str) and bool(re.fullmatch(r'acct_[A-Za-z0-9]{1,64}', scope.account_id)) and scope.mode in ('test', 'live') and isinstance(scope.product_key, str) and bool(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', scope.product_key)) and len(scope.product_key) <= 80)


def _time(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ', value): raise InvalidJob('Invalid period')
    try: return datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    except ValueError as exc: raise InvalidJob('Invalid period') from exc


def _job(job, now):
    if not isinstance(job, PeriodJob) or not _hex(job.watchlist_id) or type(job.watchlist_version) is not int or not 1 <= job.watchlist_version <= 2**31 - 1: raise InvalidJob('Invalid job')
    start, end = _time(job.period_start), _time(job.period_end)
    if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() != timedelta(0): raise Unavailable('Clock unavailable')
    if start >= end or end > now or end - start > timedelta(days=90): raise InvalidJob('Invalid period')


def _slugs(slugs):
    return isinstance(slugs, tuple) and 1 <= len(slugs) <= 100 and all(isinstance(x, str) and re.fullmatch(r'[a-z0-9][a-z0-9._-]{0,100}', x) for x in slugs) and tuple(sorted(set(slugs))) == slugs


def job_identity(scope, owner_key, job):
    data = {'scope': {'account_id': scope.account_id, 'mode': scope.mode, 'product_key': scope.product_key}, 'owner_key': owner_key, 'watchlist_id': job.watchlist_id, 'version': job.watchlist_version, 'period_start': job.period_start, 'period_end': job.period_end, 'history_policy_version': HISTORY_POLICY_VERSION}
    return hashlib.sha256(json.dumps(data, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


class MonitoringWorker:
    def __init__(self, *, scope: Scope, authenticate_worker: Callable, authenticate_owner: Callable, load_watchlist: Callable, current_rights: Callable, load_verified_sources: Callable, store: Store, now: Callable):
        if not _scope(scope): raise ValueError('Invalid scope')
        self.scope, self.authenticate_worker, self.authenticate_owner = scope, authenticate_worker, authenticate_owner
        self.load_watchlist, self.current_rights, self.load_verified_sources, self.store, self.now = load_watchlist, current_rights, load_verified_sources, store, now

    def _rights(self, owner, job, action):
        try: result = self.current_rights(self.scope, owner, job.watchlist_id, job.watchlist_version, job.period_start, job.period_end, action)
        except Exception as exc: raise Unavailable('Rights unavailable') from exc
        expected = (self.scope, owner, job.watchlist_id, job.watchlist_version, job.period_start, job.period_end, action)
        if not isinstance(result, RightsDecision) or type(result.version) is not int or (result.scope, result.owner_key, result.watchlist_id, result.version, result.period_start, result.period_end, result.action) != expected or result.decision not in ('active', 'denied', 'unknown') or result.decision == 'unknown': raise Unavailable('Rights unavailable')
        return result.decision == 'active'

    def _get(self, job_id):
        try: return self.store.get(job_id)
        except Exception as exc: raise Unavailable('Store unavailable') from exc

    def _validate_record(self, record, job_id):
        if not isinstance(record, CommittedReport) or not _scope(record.scope) or not _hex(record.owner_key) or not _slugs(record.slugs) or record.history_policy_version != HISTORY_POLICY_VERSION or not isinstance(record.artifact, Artifact) or not _hex(record.artifact.bundle_id) or not _hex(record.artifact.sha256) or type(record.artifact.length) is not int or not 0 <= record.artifact.length <= MAX_REPORT_BYTES: raise Unavailable('Invalid stored report')
        job = PeriodJob(record.watchlist_id, record.version, record.period_start, record.period_end)
        try: _job(job, self.now())
        except Exception as exc: raise Unavailable('Invalid stored report') from exc
        if record.job_id != job_id or job_identity(record.scope, record.owner_key, job) != job_id: raise Unavailable('Invalid stored report')
        return job

    def _read(self, artifact):
        try: data = self.store.read_bytes(artifact)
        except Exception as exc: raise Unavailable('Store unavailable') from exc
        if not isinstance(data, bytes) or len(data) != artifact.length or len(data) > MAX_REPORT_BYTES or hashlib.sha256(data).hexdigest() != artifact.sha256: raise Unavailable('Invalid stored report')
        return data

    def _handle(self, record):
        return ReportHandle(record.job_id, record.artifact.bundle_id, record.artifact.sha256, record.artifact.length)

    def run_period(self, worker_context, job):
        try: worker = self.authenticate_worker(worker_context)
        except Exception as exc: raise Unavailable('Authentication unavailable') from exc
        if not isinstance(worker, VerifiedWorker) or worker.scope != self.scope or not _hex(worker.worker_key): raise AccessDenied('Access denied')
        try: now = self.now()
        except Exception as exc: raise Unavailable('Clock unavailable') from exc
        _job(job, now)
        try: watch = self.load_watchlist(job)
        except Exception as exc: raise Unavailable('Watchlist unavailable') from exc
        if not isinstance(watch, CanonicalWatchlist) or watch.scope != self.scope or not _hex(watch.owner_key) or watch.watchlist_id != job.watchlist_id or watch.version != job.watchlist_version or type(watch.version) is not int or not _slugs(watch.slugs): raise InvalidJob('Invalid watchlist')
        if not self._rights(watch.owner_key, job, 'generate'): raise AccessDenied('Access denied')
        job_id = job_identity(self.scope, watch.owner_key, job)
        existing = self._get(job_id)
        if existing is not None:
            self._validate_record(existing, job_id)
            if existing.scope != self.scope or existing.owner_key != watch.owner_key or existing.slugs != watch.slugs: raise Unavailable('Stored report conflict')
            self._read(existing.artifact)
            return self._handle(existing)
        try:
            inputs = self.load_verified_sources(job, watch)
            if not isinstance(inputs, EngineInputs): raise ValueError('Invalid inputs')
            report = history.build_history(inputs.snapshots, job.period_end, inputs.catalog, inputs.curated, list(watch.slugs))
            original = history.render_history(report)
            artifact = self.store.prepare(report)
            if not isinstance(artifact, Artifact) or artifact.sha256 != hashlib.sha256(original).hexdigest() or artifact.length != len(original):
                raise ValueError('Prepared artifact differs from generated report')
        except Exception as exc: raise Unavailable('Report preparation unavailable') from exc
        if not self._rights(watch.owner_key, job, 'generate'): raise AccessDenied('Access denied')
        candidate = CommittedReport(job_id, self.scope, watch.owner_key, job.watchlist_id, job.watchlist_version, job.period_start, job.period_end, watch.slugs, HISTORY_POLICY_VERSION, artifact)
        self._validate_record(candidate, job_id)
        # Do not expose a committed index before the original bytes can be read
        # and checked. A failed/partial prepare may leave an invisible orphan.
        self._read(candidate.artifact)
        try: winner = self.store.commit_if_absent(candidate)
        except Exception as exc: raise Unavailable('Store unavailable') from exc
        self._validate_record(winner, job_id)
        if winner.scope != self.scope or winner.owner_key != watch.owner_key or winner.slugs != watch.slugs: raise Unavailable('Stored report conflict')
        self._read(winner.artifact)
        return self._handle(winner)

    def recover(self, request_context, job_id):
        try: principal = self.authenticate_owner(request_context)
        except Exception as exc: raise Unavailable('Authentication unavailable') from exc
        if not isinstance(principal, Principal) or principal.scope != self.scope or not _hex(principal.owner_key) or not _hex(job_id): return None
        record = self._get(job_id)
        if record is None: return None
        if not isinstance(record, CommittedReport): raise Unavailable('Invalid stored report')
        if record.scope != self.scope or record.owner_key != principal.owner_key: return None
        job = self._validate_record(record, job_id)
        if not self._rights(principal.owner_key, job, 'recover'): return None
        return self._read(record.artifact)
