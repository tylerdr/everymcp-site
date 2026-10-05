#!/usr/bin/env python3
"""One approved anonymous proof; no target/method/auth overrides and no recurring execution."""
import argparse
import hashlib
import json
import os
import re
import select
import ssl
import subprocess
import sys
import time
from pathlib import Path

CONTROL = Path(__file__).resolve().parents[1]
APPROVED = CONTROL.parent / 'approved-observer'
REPO = 'tylerdr/everymcp-site'
SOURCE_HEAD = '5a99a2caa22787a7bd9f2e001353de2dfcac32c2'
SOURCE_TREE = '9e089fbf9e6898b5763d45ec4997f9aad20efe71'
PLAN_SHA = 'b2f2f1025779b5735cf7619e330d35c3cc39f75ba5c5323bb2f771c075cccb32'
WORKFLOW = '.github/workflows/revenuecat-proof-once.yml'
HISTORY_URL = 'https://api.github.com/repos/' + REPO + '/actions/workflows/revenuecat-proof-once.yml/runs?per_page=1'
TLS_KEYS = ('SSL_CERT_FILE', 'SSL_CERT_DIR', 'SSLKEYLOGFILE', 'CURL_CA_BUNDLE', 'REQUESTS_CA_BUNDLE')
PROXY_KEYS = ('HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy')
PUBLIC_REASONS = frozenset('''not_attempted safety_skipped absent_capability page_limit item_limit duplicate_catalogue_identity run_budget
unsupported_negotiated_version authentication_required access_refused rate_limited redirect_refused
private_response_refused private_cache_refused unexpected_modern_session invalid_legacy_session
invalid_initialized_ack unexpected_http_status invalid_utf8 unverified_transport invalid_framing_evidence
peer_rpc_error unsupported_version declaration_schema_mismatch unsupported_result_type structure_limit
invalid_object_key non_finite_number duplicate_json_key invalid_or_truncated_json invalid_cursor invalid_sse
truncated_sse sse_event_limit unsupported_content_type invalid_jsonrpc_envelope client_interaction_required
response_id_mismatch ambiguous_or_missing_response invalid_jsonrpc_error invalid_result request_deadline
tls_failure dns_failure transport_incomplete custom_tls_environment_refused tls_verification_required
peer_pin_mismatch dns_answer_limit non_public_dns invalid_dns_family resolver_cleanup_incomplete wire_limit
truncated_or_oversized_line line_limit header_limit framing_limit truncated_body extra_response_bytes
invalid_status_line invalid_header duplicate_header encoded_body_refused ambiguous_body_framing body_limit
unsupported_transfer_encoding unsupported_chunk_framing trailers_refused invalid_chunk_terminator'''.split())
CONTROL_REASONS = frozenset('''custom_tls_environment_refused proxy_environment_refused
default_verified_tls_unavailable git_metadata_limit checkout_head_mismatch checkout_tree_mismatch
checkout_origin_mismatch checkout_not_clean hosted_context_refused invalid_hosted_identity
workflow_source_mismatch invalid_event_file unapproved_control_or_repository history_read_deadline
history_body_limit history_read_refused one_time_admission_consumed_or_unverifiable
history_identity_mismatch preloaded_observer_modules_refused approved_plan_hash_mismatch
approved_source_hash_mismatch approved_source_gate_or_plan_mismatch claim_directory_symlink'''.split())


def canonical(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)+'\n').encode()


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def tls_preflight():
    # Configuration presence is inspected; values are never read, printed, cleared or overridden.
    if any(k in os.environ for k in TLS_KEYS): raise ValueError('custom_tls_environment_refused')
    if any(k in os.environ for k in PROXY_KEYS): raise ValueError('proxy_environment_refused')
    context = ssl.create_default_context()
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    certificates = len(context.get_ca_certs())
    if not context.check_hostname or context.verify_mode != ssl.CERT_REQUIRED or not certificates:
        raise ValueError('default_verified_tls_unavailable')
    return {'defaultTrustStoreLoaded': True, 'checkHostname': True, 'certificateRequired': True,
            'caCertificateCount': certificates, 'minimumTls': '1.2', 'networkRequests': 0}


def git(root, *arguments):
    result = subprocess.run(['git', '-C', str(root), *arguments], stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL, timeout=3, check=True)
    if len(result.stdout) > 4096: raise ValueError('git_metadata_limit')
    return result.stdout.decode().strip()


def verify_checkout(root, head, tree=None):
    if git(root, 'rev-parse', 'HEAD') != head: raise ValueError('checkout_head_mismatch')
    if tree is not None and git(root, 'rev-parse', 'HEAD^{tree}') != tree: raise ValueError('checkout_tree_mismatch')
    if git(root, 'remote', 'get-url', 'origin') not in ('https://github.com/'+REPO, 'https://github.com/'+REPO+'.git'):
        raise ValueError('checkout_origin_mismatch')
    if git(root, 'status', '--porcelain', '--untracked-files=all'): raise ValueError('checkout_not_clean')


def execution_context():
    required = {'GITHUB_ACTIONS': 'true', 'GITHUB_EVENT_NAME': 'workflow_dispatch', 'GITHUB_REPOSITORY': REPO,
                'GITHUB_REF': 'refs/heads/main', 'GITHUB_ACTOR': 'tylerdr', 'GITHUB_TRIGGERING_ACTOR': 'tylerdr',
                'GITHUB_RUN_ATTEMPT': '1', 'RUNNER_ENVIRONMENT': 'github-hosted', 'RUNNER_OS': 'Linux',
                'RUNNER_ARCH': 'X64', 'GITHUB_JOB': 'observe',
                'GITHUB_WORKFLOW_REF': REPO+'/'+WORKFLOW+'@refs/heads/main'}
    if any(os.environ.get(k) != v for k,v in required.items()): raise ValueError('hosted_context_refused')
    run_id, control_sha = os.environ.get('GITHUB_RUN_ID',''), os.environ.get('GITHUB_SHA','')
    if not re.fullmatch(r'[1-9][0-9]{0,19}',run_id) or not re.fullmatch(r'[0-9a-f]{40}',control_sha):
        raise ValueError('invalid_hosted_identity')
    if os.environ.get('GITHUB_WORKFLOW_SHA') != control_sha: raise ValueError('workflow_source_mismatch')
    path = Path(os.environ.get('GITHUB_EVENT_PATH',''))
    if not path.is_file() or path.stat().st_size > 524288: raise ValueError('invalid_event_file')
    event = json.loads(path.read_bytes())
    if (event.get('repository',{}).get('full_name') != REPO or event['repository'].get('private') is not False or
            event.get('sender',{}).get('login') != 'tylerdr' or event.get('inputs',{}) != {'approved_control_sha':control_sha}):
        raise ValueError('unapproved_control_or_repository')
    verify_checkout(CONTROL,control_sha)
    return {'repository': REPO, 'repositoryPublic': True, 'controlSha': control_sha,
            'controlTree': git(CONTROL,'rev-parse','HEAD^{tree}'), 'workflow': WORKFLOW,
            'workflowSha256':sha((CONTROL/WORKFLOW).read_bytes()), 'runId':int(run_id), 'runAttempt':1,
            'actor':'tylerdr', 'event':'workflow_dispatch', 'ref':'refs/heads/main', 'runner':'standard ubuntu-24.04'}


def bounded_capture(command):
    """Bound even chunked/lengthless stdout; kill and reap on limit/deadline without network retry."""
    child = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    deadline, output = time.monotonic()+6, bytearray()
    try:
        while True:
            left = deadline-time.monotonic()
            if left <= 0: raise ValueError('history_read_deadline')
            if not select.select([child.stdout], [], [], left)[0]: raise ValueError('history_read_deadline')
            part = os.read(child.stdout.fileno(), min(4096, 32773-len(output)))
            if not part: break
            output.extend(part)
            if len(output) > 32772: raise ValueError('history_body_limit')
        if child.wait(timeout=max(.001, deadline-time.monotonic())) != 0:
            raise ValueError('history_read_refused')
        return bytes(output)
    finally:
        if child.poll() is None: child.kill()
        child.wait(timeout=.25)
        child.stdout.close()


def first_run(provenance):
    """Public administrative metadata read, separate from the one-host MCP observation budget."""
    raw = bounded_capture(['curl', '--disable', '--silent', '--show-error', '--proto', '=https',
        '--max-redirs', '0', '--connect-timeout', '3', '--max-time', '5', '--max-filesize', '32768',
        '--header', 'Accept: application/vnd.github+json', '--header', 'X-GitHub-Api-Version: 2022-11-28',
        '--write-out', '\n%{http_code}', HISTORY_URL])
    body, separator, status = raw.rpartition(b'\n')
    if not separator or status != b'200': raise ValueError('history_read_refused')
    history = json.loads(body)
    runs = history.get('workflow_runs')
    if history.get('total_count') != 1 or not isinstance(runs,list) or len(runs) != 1:
        raise ValueError('one_time_admission_consumed_or_unverifiable')
    run = runs[0]
    if (run.get('id') != provenance['runId'] or run.get('head_sha') != provenance['controlSha'] or
            run.get('head_branch') != 'main' or run.get('event') != 'workflow_dispatch' or run.get('run_attempt') != 1 or
            run.get('actor',{}).get('login') != 'tylerdr' or run.get('repository',{}).get('full_name') != REPO or
            run['repository'].get('private') is not False or run.get('path') != WORKFLOW):
        raise ValueError('history_identity_mismatch')
    return {'githubActionsRequests':1, 'unfilteredWorkflowRunCount':1, 'historyResponseSha256':sha(body),
            'historyMutationLimit':'Administrative deletion of history is outside this admission guarantee.'}


def approved_adapter():
    verify_checkout(APPROVED,SOURCE_HEAD,SOURCE_TREE)
    names = ('discovery_contract','public_discovery_transport','propose_public_discovery')
    if any(name in sys.modules for name in names): raise ValueError('preloaded_observer_modules_refused')
    raw = (APPROVED/'documents/public-discovery/endpoint-proposal.json').read_bytes()
    if sha(raw) != PLAN_SHA: raise ValueError('approved_plan_hash_mismatch')
    plan = json.loads(raw)
    for relative, expected in plan['sourceFileHashes'].items():
        if sha((APPROVED/relative).read_bytes()) != expected: raise ValueError('approved_source_hash_mismatch')
    sys.path.insert(0,str(APPROVED/'scripts'))
    import propose_public_discovery as adapter
    if adapter.LIVE_EXECUTION_ENABLED is not False or canonical(adapter.proposal()) != raw:
        raise ValueError('approved_source_gate_or_plan_mismatch')
    return adapter


def safe_reason(value):
    # Only static observer categories are exported; arbitrary exception text is hashed privately.
    return value if value is None or value in PUBLIC_REASONS or re.fullmatch(r'http_status_[1-5][0-9]{2}',value) else 'unclassified_observer_refusal'


def safe_headers(headers):
    output={}
    for key,value in headers.items():
        if key=='content-type' and re.fullmatch(r'(?:application/json|text/event-stream)(?:\s*;\s*charset=utf-8)?',value,re.I): output[key]=value
        if key=='content-length' and re.fullmatch(r'[0-9]{1,8}',value): output[key]=value
        if key=='content-encoding' and value.lower()=='identity': output[key]=value
        if key=='transfer-encoding' and value.lower()=='chunked': output[key]=value
    return output


def public_summary(receipt,provenance,history,tls):
    reports=[]
    for report in receipt['reports']:
        reports.append({'protocolVersion':report['protocolVersion'],'observedAt':report['observedAt'],
            'states':{key:{'state':report[key]['state'],'reason':safe_reason(report[key]['reason'])} for key in ('discovery','tools','resources','apps')},
            'exchanges':[{key:observation[key] for key in ('sequence','method','requestSha256','httpStatus','outcome','bodyComplete','responseSha256','capturedBytes','attemptedAt','completedAt','attemptedOffsetMs','completedOffsetMs')} |
                {'reason':safe_reason(observation['reason']),'network':observation['network'],
                 'headers':safe_headers(observation['headers']),
                 'authChallengeScheme':observation['authChallenge']['scheme'] if observation['authChallenge'] else None,
                 'authChallengeSha256':sha(canonical(observation['authChallenge'])) if observation['authChallenge'] else None,
                 'authMetadataFollowed':False} for observation in report['exchanges']]})
    return {'kind':'everymcp.one-time-public-declaration-summary.v1','sourceHead':SOURCE_HEAD,'sourceTree':SOURCE_TREE,
            'planSha256':PLAN_SHA,'endpointUrl':'https://mcp.revenuecat.ai/mcp','listingSlug':'revenuecat-mcp',
            'sourceCitationUrl':'https://www.revenuecat.com/docs/tools/mcp','provenance':provenance,'historyAdmission':history,'tlsPreflight':tls,
            'startedAt':receipt['startedAt'],'finishedAt':receipt['finishedAt'],'durationMs':receipt['durationMs'],
            'attempts':receipt['attempts'],'receivedWireBytes':receipt['receivedWireBytes'],'reports':reports,
            'privateReceiptSha256':sha(canonical(receipt)),'privateReceiptExported':False,
            'redactions':['complete bodies','identity/capability/tool/schema/resource/Apps values','raw auth/cookie/session headers','auth metadata URIs'],
            'originAuthenticatedByReceiptHash':False,'publication':receipt['publication'],'assessments':receipt['assessments'],
            'toolCalls':0,'modelCalls':0,'costUsd':0,'billingBasis':'public repository, standard hosted runner; no artifacts/cache/custom image'}


def observe_once():
    provenance=execution_context()
    tls=tls_preflight()
    history=first_run(provenance)
    adapter=approved_adapter()
    folder=CONTROL/'tmp/discovery/one-time-claims'
    for directory in (CONTROL/'tmp', CONTROL/'tmp/discovery', folder):
        if directory.is_symlink(): raise ValueError('claim_directory_symlink')
        directory.mkdir(exist_ok=True,mode=0o700)
        if directory.resolve() != directory: raise ValueError('claim_directory_symlink')
    claim=folder/(str(provenance['runId'])+'.claim')
    descriptor=os.open(claim,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
    with os.fdopen(descriptor,'wb') as output:
        output.write(canonical(provenance))
        output.flush()
        os.fsync(output.fileno())
    # The approved snapshot is unchanged; the permission is limited to this one process call.
    adapter.LIVE_EXECUTION_ENABLED=True
    try:
        receipt=adapter.collect_plan()
    finally:
        adapter.LIVE_EXECUTION_ENABLED=False
    adapter.store_receipt(receipt)
    return public_summary(receipt,provenance,history,tls)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--observe-once',action='store_true')
    args=parser.parse_args()
    if args.observe_once:
        proof=observe_once()
        raw=canonical(proof)
        print('MCP_ONCE_PROOF_JSON='+raw.decode(),end='')
        print('MCP_ONCE_PROOF_SHA256='+sha(raw))
    else:
        try: output={'kind':'network-free-hosted-tls-preflight','ready':True,'tls':tls_preflight()}
        except ValueError as exc:
            print(canonical({'kind':'network-free-hosted-tls-preflight','ready':False,'reason':str(exc),'networkRequests':0}).decode(),end='')
            return 1
        print(canonical(output).decode(),end='')
    return 0


if __name__=='__main__':
    try: sys.exit(main())
    except (ValueError, OSError, subprocess.SubprocessError, KeyError, TypeError) as exc:
        # Do not print a raw exception, response, environment value or traceback into public logs.
        reason = str(exc) if isinstance(exc, ValueError) and str(exc) in CONTROL_REASONS else 'control_or_environment_verification_failed'
        print('MCP_ONCE_REFUSED='+reason)
        sys.exit(1)
