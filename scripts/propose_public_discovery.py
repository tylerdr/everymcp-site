#!/usr/bin/env python3
"""Reviewable fixed-endpoint plan; live execution remains hard-disabled pending parent review."""
import argparse
import copy
import json
import os
import re
import socket
import ssl
import time
from datetime import datetime, timezone
from pathlib import Path

import discovery_contract as contract
import public_discovery_transport as network

LIVE_EXECUTION_ENABLED = False
MANIFEST = contract.ROOT / 'documents/public-discovery/endpoint-review.json'
BOUNDS = {'hosts': 1, 'maxRequests': 7, 'requestSeconds': 8, 'runSeconds': 60,
          'cancellationCleanupSeconds': .25,
          'minimumHostIntervalSeconds': 1, 'bodyBytesPerResponse': 65536,
          'headerBytesPerResponse': 8192, 'framingBytesPerResponse': 8192,
          'aggregateWireBytes': 573447, 'requestBodyBytes': 4096, 'dnsAnswersPerRequest': 8,
          'pagesPerList': 1, 'itemsPerList': 40, 'concurrency': 1, 'redirects': 0, 'retries': 0, 'cacheReuse': False}
RELATIONSHIP = {'id': 'revenuecat-publisher', 'endpointUrl': network.URL,
                'listingSlug': 'revenuecat-mcp', 'legacyListingId': 'revenuecat-mcp',
                'sourceCitationUrl': 'https://www.revenuecat.com/docs/tools/mcp',
                'relationshipRole': 'publisher_documented_endpoint'}
SOURCES = ['scripts/discovery_contract.py', 'scripts/public_discovery_transport.py',
           'scripts/propose_public_discovery.py', 'documents/public-discovery/profiles.json',
           'documents/public-discovery/spec-provenance.json',
           'documents/public-discovery/2026-07-28-declarations.schema.json',
           'documents/public-discovery/2025-11-25-declarations.schema.json']


def now():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def reviewed_manifest():
    manifest = contract.strict_json(MANIFEST.read_bytes())
    endpoints = manifest.get('reviewedEndpoints')
    if (manifest.get('liveExecutionEnabled') is not False or manifest.get('approvalState') != 'pending_parent_review' or
            manifest.get('bounds') != BOUNDS or not isinstance(endpoints, list) or len(endpoints) != 1 or
            any(endpoints[0].get(k) != v for k, v in RELATIONSHIP.items()) or
            endpoints[0].get('profiles') != list(contract.VERSIONS) or endpoints[0].get('credentialsUsed') is not False or
            endpoints[0].get('observationState') != 'not_attempted'):
        raise ValueError('unreviewed_endpoint_or_bounds')
    catalog = json.loads((contract.ROOT / 'data/mcps.json').read_text())
    row = next(x for x in catalog if x['slug'] == RELATIONSHIP['listingSlug'])
    evidence = json.loads((contract.ROOT / 'data/listing-evidence.json').read_text())
    refs = next(x['references'] for x in evidence if x['slug'] == row['slug'])
    if row['id'] != RELATIONSHIP['legacyListingId'] or not any(
            x['kind'] == 'publisher' and x['url'] == RELATIONSHIP['sourceCitationUrl'] for x in refs):
        raise ValueError('listing_source_relationship_mismatch')
    if manifest.get('assessments') != {'score': None, 'badge': None, 'applicableDenominator': None,
                                       'runtime': 'unknown', 'security': 'unknown'} or manifest.get('publication') != {
                                           'eligible': False, 'automatic': False, 'state': 'review_required'}:
        raise ValueError('publication_policy_rejected')
    contract.validate_fixture_clock(manifest['sourceReviewedAt'])
    return manifest


def proposal():
    manifest = reviewed_manifest()
    requests = []
    for version, methods in network.METHODS.items():
        for method, sequence in methods.items():
            headers = network.request_headers(version, method)
            requests.append({'protocolVersion': version, 'profileId': f'mcp-{version}-streamable-http-declarations-v1',
                             'sequence': sequence, 'httpMethod': 'POST', 'endpointUrl': network.URL,
                             'method': method, 'body': contract.strict_json(network.request_bytes(version, method)),
                             'requestSha256': contract.sha(network.request_bytes(version, method)), 'headers': headers,
                             'sessionHeader': 'transient assigned legacy value only' if version == contract.VERSIONS[1] and method != 'initialize' else 'disabled',
                             'condition': 'first request' if sequence == 1 else
                                 'valid exact-version initialize' if method == 'notifications/initialized' else
                                 'valid exact-version discovery, declared capability, and legacy acknowledgment if applicable'})
    return {'kind': 'unexecuted_parent_review_proposal', 'liveExecutionEnabled': False,
            'manifestSha256': contract.sha(contract.canonical(manifest)), 'endpoint': copy.deepcopy(manifest['reviewedEndpoints'][0]),
            'bounds': BOUNDS, 'requests': requests, 'sourceFileHashes': {p: contract.sha((contract.ROOT / p).read_bytes()) for p in SOURCES},
            'liveProbes': 0, 'toolCalls': 0, 'modelCalls': 0, 'costUsd': 0,
            'publication': manifest['publication'], 'assessments': manifest['assessments']}


def receipt_relationship(plan):
    return {**RELATIONSHIP, 'sourceReviewedAt': reviewed_manifest()['sourceReviewedAt'],
            'publisherAssessment': plan['endpoint']['publisherAssessment']}


SAFE_HEADERS = {'content-type', 'content-length', 'content-encoding', 'transfer-encoding', 'cache-control'}
TRANSPORT_REASONS = {'request_deadline', 'tls_failure', 'dns_failure', 'transport_incomplete',
    'custom_tls_environment_refused', 'tls_verification_required', 'peer_pin_mismatch',
    'dns_answer_limit', 'non_public_dns', 'invalid_dns_family', 'resolver_cleanup_incomplete',
    'wire_limit', 'truncated_or_oversized_line', 'line_limit', 'header_limit', 'framing_limit',
    'truncated_body', 'extra_response_bytes', 'invalid_status_line', 'invalid_header', 'duplicate_header',
    'encoded_body_refused', 'ambiguous_body_framing', 'body_limit', 'unsupported_transfer_encoding',
    'unsupported_chunk_framing', 'trailers_refused', 'invalid_chunk_terminator'}


def observation_base(version, method, trace):
    return {'method': method, 'sequence': network.METHODS[version][method],
            'requestSha256': contract.sha(network.request_bytes(version, method)), 'httpStatus': trace.get('httpStatus'),
            'outcome': 'unknown', 'reason': None, 'bodyComplete': False, 'responseSha256': None,
            'completeBody': None, 'capturedBytes': trace.get('capturedBytes', 0),
            'authChallenge': None, 'cacheHint': None, 'sessionAssigned': False,
            'headerSignals': {'privateState': False, 'sessionPresent': False, 'invalidSession': False,
                              'privateResult': False},
            'network': copy.deepcopy(trace), 'headers': {}}


def complete_frame(headers, size, trace):
    """The same complete-frame invariants as Wire, also for suppressed public/privacy bodies."""
    if headers.get('content-encoding','identity').lower() != 'identity': raise ValueError('encoded_body_refused')
    if size > contract.MAX_BODY: raise ValueError('body_limit')
    length, transfer = headers.get('content-length'), headers.get('transfer-encoding')
    if length is not None and transfer is not None: raise ValueError('ambiguous_body_framing')
    if length is not None and (not re.fullmatch(r'[0-9]{1,8}',length) or int(length) > contract.MAX_BODY): raise ValueError('body_limit')
    if length is not None and int(length) != size: raise ValueError('truncated_body')
    if transfer is not None and transfer.lower() != 'chunked': raise ValueError('unsupported_transfer_encoding')
    framing = trace.get('responseFramingBytes',0)
    if (transfer is None and framing != 0) or (transfer is not None and framing < (10 if size else 5)):
        raise ValueError('invalid_framing_evidence')


def normalize(version, method, status, headers, body, trace):
    """Pure interpretation of one bounded response; never follows a returned reference."""
    observed = observation_base(version, method, trace)
    observed['httpStatus'] = status
    observed['headers'] = {k: v for k, v in headers.items() if k in SAFE_HEADERS}
    observed['capturedBytes'] = len(body) if body is not None else trace.get('capturedBytes', 0)
    assigned = headers.get('mcp-session-id')
    observed['headerSignals'].update(privateState='set-cookie' in headers or 'authentication-info' in headers,
        sessionPresent=assigned is not None, invalidSession=assigned is not None and (
            not isinstance(assigned, str) or not 0 < len(assigned) <= 256 or any(not 33 <= ord(c) <= 126 for c in assigned)))
    result, session = None, None
    try:
        addresses = trace.get('resolvedAddresses', [])
        if (trace.get('tlsHostnameVerified') is not True or trace.get('peerPinned') is not True or
                not addresses or any(not network.public_ip(ip) for ip in addresses) or
                trace.get('selectedAddress') not in addresses):
            raise ValueError('unverified_transport')
        if 300 <= status < 400: raise ValueError('redirect_refused')
        if status in (401, 403):
            observed['authChallenge'] = contract.auth_challenge(headers.get('www-authenticate', ''))
            raise ValueError('authentication_required' if status == 401 else 'access_refused')
        if status == 429: raise ValueError('rate_limited')
        if status not in (200, 202): raise ValueError('http_status_' + str(status))
        if body is None: raise ValueError('body_limit')
        complete_frame(headers,len(body),trace)
        if ('set-cookie' in headers or 'authentication-info' in headers or
                any(x.split('=',1)[0].strip().lower() in ('private', 'no-store') for x in headers.get('cache-control', '').split(','))):
            raise ValueError('private_response_refused')
        if assigned is not None:
            if version == contract.VERSIONS[0]: raise ValueError('unexpected_modern_session')
            if method != 'initialize' or not 0 < len(assigned) <= 256 or any(not 33 <= ord(c) <= 126 for c in assigned):
                raise ValueError('invalid_legacy_session')
            session = assigned
            observed['sessionAssigned'] = True
        # Retain complete public semantic failures so unknown reasons can also be replayed.
        observed.update(bodyComplete=True, responseSha256=contract.sha(body), completeBody=body.decode('utf-8'))
        if method == 'notifications/initialized':
            if status != 202 or body: raise ValueError('invalid_initialized_ack')
            result = {}
        else:
            if status != 200: raise ValueError('unexpected_http_status')
            result = contract.response_message(body, headers.get('content-type', ''), observed['sequence'])
            root = {'server/discover': 'DiscoverResult', 'initialize': 'InitializeResult',
                    'tools/list': 'ListToolsResult', 'resources/list': 'ListResourcesResult'}[method]
            contract.validate_declaration(version, root, result)
            if version == contract.VERSIONS[0]:
                if result['cacheScope'] != 'public':
                    observed['headerSignals']['privateResult'] = True
                    observed.update(bodyComplete=False, responseSha256=None, completeBody=None)
                    raise ValueError('private_cache_refused')
                observed['cacheHint'] = {'ttlMs': result['ttlMs'], 'scope': result['cacheScope'], 'reused': False}
        observed.update(outcome='observed', reason=None, bodyComplete=True,
                        responseSha256=contract.sha(body), completeBody=body.decode('utf-8'))
    except (ValueError, UnicodeError) as exc:
        observed['reason'] = 'invalid_utf8' if isinstance(exc, UnicodeError) else str(exc)
        result, session = None, None
    return observed, result, session


def should_halt(reason):
    return reason is not None and reason not in ('peer_rpc_error', 'unsupported_version', 'declaration_schema_mismatch') and not re.fullmatch(r'http_status_[1-5][0-9]{2}', reason)


def profile_facts(version, send, halted, catalogue):
    """One pure state machine is used by collection and saved-receipt validation."""
    facts = {name: contract.unknown('not_attempted') for name in ('discovery', 'tools', 'resources', 'apps')}
    facts.update(toolDeclarations=[], resourceDeclarations=[])
    if halted():
        facts['discovery'] = contract.unknown('safety_skipped')
        return facts
    first = 'server/discover' if version == contract.VERSIONS[0] else 'initialize'
    result, reason, observation = send(first)
    if result is None:
        facts['discovery'] = contract.unknown(reason)
        return facts
    if (version == contract.VERSIONS[0] and version not in result['supportedVersions']) or (
            version == contract.VERSIONS[1] and result['protocolVersion'] != version):
        facts['discovery'] = contract.unknown('unsupported_negotiated_version')
        return facts
    capabilities = result['capabilities']
    facts['discovery'] = contract.declared(contract.discovery_value(result, version), contract.citation(observation, '/result'))
    if version == contract.VERSIONS[1]:
        ack, reason, _ = send('notifications/initialized')
        if ack is None:
            facts['tools'] = facts['resources'] = contract.unknown(reason)
            return facts
    for name in ('tools', 'resources'):
        if name not in capabilities:
            facts[name] = {'state': 'not_declared', 'reason': 'absent_capability', 'value': None, 'citations': facts['discovery']['citations']}
        elif halted(): facts[name] = contract.unknown('safety_skipped')
        else:
            result, reason, observation = send(name + '/list')
            if result is None: facts[name] = contract.unknown(reason)
            else:
                facts[name], facts['toolDeclarations' if name == 'tools' else 'resourceDeclarations'] = catalogue(name, result, observation)
    ui = capabilities.get('extensions', {}).get(contract.APP_ID)
    if ui is not None:
        facts['apps'] = contract.declared({'extension': ui, 'interpretationVersion': '2026-01-26',
            'negotiated': False, 'renderingVerified': False, 'resourceContentFetched': False}, facts['discovery']['citations'][0])
    return facts


def catalog_fact(name, result, observation):
    if len(result[name]) > contract.MAX_ITEMS:
        return contract.unknown('item_limit'), []
    items, seen = [], set()
    for index, item in enumerate(result[name]):
        key = item['name'] if name == 'tools' else item['uri']
        if key in seen: return contract.unknown('duplicate_catalogue_identity'), items
        seen.add(key)
        cite = contract.citation(observation, '/result/' + name + '/' + str(index))
        if name == 'tools': items.append(contract.tool_declaration(item, cite))
        else:
            items.append({**{k: item[k] for k in ('name', 'uri', 'title', 'description', 'mimeType') if k in item},
                          'citations': [cite], 'trust': 'unverified_self_declaration', 'contentFetched': False})
    if 'nextCursor' in result: return contract.unknown('page_limit'), items
    return {'state': 'declared', 'reason': None, 'value': {'count': len(items), 'complete': True},
            'citations': [contract.citation(observation, '/result/' + name)]}, items


def collect_plan():
    if LIVE_EXECUTION_ENABLED is not True:
        raise ValueError('live_execution_disabled_pending_parent_exact_plan_review')
    planned = proposal()
    started_at, started = now(), time.monotonic()
    last_attempt, reports, attempts, received, halt = None, [], 0, 0, False
    offset = lambda: int((time.monotonic() - started) * 1000)
    for version in contract.VERSIONS:
        report = {'profileId': f'mcp-{version}-streamable-http-declarations-v1', 'protocolVersion': version,
                  'transport': 'streamable-http', 'actor': 'anonymous_declaration_observer', 'observedAt': now(),
                  'observedAtBasis': 'observer_utc_clock', 'originAuthenticatedByReceiptHash': False, 'exchanges': []}
        reports.append(report)
        session, catalogues = None, {}
        def send(method):
            nonlocal last_attempt, session, attempts, received, halt
            if last_attempt is not None:
                delay = max(0, 1 - (time.monotonic() - last_attempt))
                if time.monotonic() - started + delay >= 60: return None, 'run_budget', None
                time.sleep(delay)
            left = 60 - (time.monotonic() - started)
            if attempts >= 7 or left <= 0 or received >= BOUNDS['aggregateWireBytes']: return None, 'run_budget', None
            attempts += 1
            last_attempt = time.monotonic()
            attempted_at, attempted_offset = now(), offset()
            timeout = min(8, left)
            trace = {'httpStatus': None, 'capturedBytes': 0, 'receivedWireBytes': 0,
                     'responseHeaderBytes': 0, 'responseHeaderSha256': None, 'responseFramingBytes': 0,
                     'resolvedAddresses': [], 'selectedAddress': None, 'tlsHostnameVerified': False, 'peerPinned': False}
            try:
                status, headers, _raw_headers, body = network.post(network.request_bytes(version, method),
                    network.request_headers(version, method, session), timeout, trace)
                parse_left = timeout - (time.monotonic() - last_attempt)
                if parse_left <= 0: raise TimeoutError('request_deadline')
                with network.deadline(parse_left):
                    observation, result, assigned = normalize(version, method, status, headers, body, trace)
                    if result is not None and method in ('tools/list', 'resources/list'):
                        catalogues[method.split('/')[0]] = catalog_fact(method.split('/')[0], result, observation)
                if assigned is not None: session = assigned
            except (ValueError, OSError, TimeoutError) as exc:
                reason = str(exc) if isinstance(exc, ValueError) else 'request_deadline' if isinstance(exc, TimeoutError) else 'tls_failure' if isinstance(exc, ssl.SSLError) else 'dns_failure' if isinstance(exc, socket.gaierror) else 'transport_incomplete'
                if reason not in TRANSPORT_REASONS: raise
                observation = observation_base(version, method, trace)
                observation['reason'] = reason
                result = None
            received += trace['receivedWireBytes']
            observation.update(attemptedAt=attempted_at, completedAt=now(),
                               attemptedOffsetMs=attempted_offset, completedOffsetMs=offset())
            report['exchanges'].append(observation)
            if received > BOUNDS['aggregateWireBytes']: raise ValueError('aggregate_wire_budget')
            halt = halt or should_halt(observation['reason'])
            return result, observation['reason'], observation
        report.update(profile_facts(version, send, lambda: halt, lambda name, *_: catalogues[name]))
    receipt = {'contractVersion': 'everymcp.public-discovery.public-candidate.v1', 'planSha256': contract.sha(contract.canonical(planned)),
            'manifestSha256': planned['manifestSha256'], 'listingRelationship': receipt_relationship(planned),
            'startedAt': started_at, 'finishedAt': now(), 'durationMs': offset(), 'reports': reports,
            'attempts': attempts, 'receivedWireBytes': received, 'cache': {'enabled': False, 'reused': False},
            'toolCalls': 0, 'modelCalls': 0, 'costUsd': 0, 'assessments': planned['assessments'], 'publication': planned['publication']}
    return validate_receipt(receipt)


def validate_receipt(receipt):
    """Replay the exact global request plan, including unknowns; hashes do not authenticate origin."""
    plan = proposal()
    if (set(receipt) != {'contractVersion','planSha256','manifestSha256','listingRelationship','startedAt',
            'finishedAt','durationMs','reports','attempts','receivedWireBytes','cache','toolCalls','modelCalls','costUsd','assessments','publication'} or
            receipt.get('contractVersion') != 'everymcp.public-discovery.public-candidate.v1' or
            receipt.get('planSha256') != contract.sha(contract.canonical(plan)) or
            receipt.get('manifestSha256') != plan['manifestSha256'] or
            receipt.get('listingRelationship') != receipt_relationship(plan) or
            receipt.get('assessments') != plan['assessments'] or receipt.get('publication') != plan['publication'] or
            receipt.get('cache') != {'enabled': False, 'reused': False} or
            any(type(receipt.get(k)) is not int or receipt.get(k) != 0 for k in ('toolCalls', 'modelCalls', 'costUsd')) or
            type(receipt.get('attempts')) is not int or type(receipt.get('receivedWireBytes')) is not int):
        raise ValueError('invalid_receipt_plan_or_policy')
    clock = lambda value: datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    for field in ('startedAt', 'finishedAt'): contract.validate_fixture_clock(receipt[field])
    duration = receipt.get('durationMs')
    if (type(duration) is not int or not 0 <= duration <= 60250 or
            not 0 <= (clock(receipt['finishedAt']) - clock(receipt['startedAt'])).total_seconds() <= 61):
        raise ValueError('invalid_receipt_chronology')
    reports = receipt.get('reports')
    if not isinstance(reports, list) or len(reports) != 2: raise ValueError('invalid_receipt_profiles')
    attempts, received, halt, last_offset, last_completed, last_clock = 0, 0, False, None, 0, receipt['startedAt']
    for version, report in zip(contract.VERSIONS, reports):
        if (set(report) != {'profileId','protocolVersion','transport','actor','observedAt','observedAtBasis',
                'originAuthenticatedByReceiptHash','exchanges','discovery','tools','resources','apps','toolDeclarations','resourceDeclarations'} or
                report.get('protocolVersion') != version or report.get('profileId') != f'mcp-{version}-streamable-http-declarations-v1' or
                report.get('transport') != 'streamable-http' or report.get('actor') != 'anonymous_declaration_observer' or
                report.get('observedAtBasis') != 'observer_utc_clock' or report.get('originAuthenticatedByReceiptHash') is not False):
            raise ValueError('invalid_receipt_profile')
        contract.validate_fixture_clock(report['observedAt'])
        if not last_clock <= report['observedAt'] <= receipt['finishedAt']: raise ValueError('invalid_receipt_chronology')
        exchanges = report.get('exchanges')
        if not isinstance(exchanges, list): raise ValueError('invalid_receipt_exchanges')
        cursor = 0
        def replay(method):
            nonlocal cursor, attempts, received, halt, last_offset, last_completed, last_clock
            if halt: raise ValueError('request_after_safety_halt')
            if cursor >= len(exchanges):
                if attempts >= 7 or received >= BOUNDS['aggregateWireBytes'] or duration >= 59000:
                    return None, 'run_budget', None
                raise ValueError('missing_planned_request')
            observation = exchanges[cursor]; cursor += 1
            if (observation.get('method') != method or observation.get('sequence') != network.METHODS[version][method] or
                    observation.get('requestSha256') != contract.sha(network.request_bytes(version, method))):
                raise ValueError('invalid_receipt_method_or_request')
            allowed = set(observation_base(version, method, {})) | {'attemptedAt', 'completedAt', 'attemptedOffsetMs', 'completedOffsetMs'}
            if set(observation) != allowed: raise ValueError('invalid_receipt_observation_fields')
            for field in ('attemptedAt', 'completedAt'): contract.validate_fixture_clock(observation[field])
            start, end = observation['attemptedOffsetMs'], observation['completedOffsetMs']
            if (type(start) is not int or type(end) is not int or not last_completed <= start <= end <= duration or
                    start >= 60000 or end - start > 8250 or (last_offset is not None and start - last_offset < 999) or
                    not max(last_clock, report['observedAt']) <= observation['attemptedAt'] <= observation['completedAt'] <= receipt['finishedAt'] or
                    (clock(observation['completedAt']) - clock(observation['attemptedAt'])).total_seconds() > 9):
                raise ValueError('invalid_receipt_chronology')
            last_offset, last_completed, last_clock = start, end, observation['completedAt']
            trace = observation.get('network', {})
            keys = {'httpStatus','capturedBytes','receivedWireBytes','responseHeaderBytes','responseHeaderSha256',
                    'responseFramingBytes','resolvedAddresses','selectedAddress','tlsHostnameVerified','peerPinned'}
            if set(trace) != keys: raise ValueError('invalid_receipt_trace_fields')
            if (any(type(trace[k]) is not bool for k in ('tlsHostnameVerified','peerPinned')) or
                    not isinstance(trace['resolvedAddresses'],list) or len(trace['resolvedAddresses']) > 8 or
                    any(not network.public_ip(ip) for ip in trace['resolvedAddresses']) or
                    trace['selectedAddress'] is not None and trace['selectedAddress'] not in trace['resolvedAddresses'] or
                    type(observation['sessionAssigned']) is not bool):
                raise ValueError('invalid_receipt_transport_evidence')
            wire, captured, header, framing = (trace[k] for k in ('receivedWireBytes','capturedBytes','responseHeaderBytes','responseFramingBytes'))
            if (any(type(x) is not int for x in (wire,captured,header,framing)) or
                    not 0 <= wire <= 81921 or not 0 <= captured <= 65536 or not 0 <= header <= 8192 or not 0 <= framing <= 8192 or
                    wire < header + captured + framing or observation['capturedBytes'] != captured):
                raise ValueError('invalid_receipt_budget')
            status = observation['httpStatus']
            if trace['httpStatus'] != status or (status is not None and (type(status) is not int or not 100 <= status <= 599)):
                raise ValueError('invalid_receipt_http_status')
            if status is not None:
                if (header < 16 or not isinstance(trace['responseHeaderSha256'],str) or not re.fullmatch('[0-9a-f]{64}',trace['responseHeaderSha256']) or
                        trace['tlsHostnameVerified'] is not True or trace['peerPinned'] is not True or
                        not trace['resolvedAddresses'] or len(trace['resolvedAddresses']) > 8 or
                        any(not network.public_ip(ip) for ip in trace['resolvedAddresses']) or trace['selectedAddress'] not in trace['resolvedAddresses']):
                    raise ValueError('invalid_receipt_transport_evidence')
            elif trace['responseHeaderSha256'] is not None or header:
                raise ValueError('invalid_receipt_transport_evidence')
            headers = observation['headers']
            signals = observation['headerSignals']
            if (not isinstance(headers,dict) or set(headers) - SAFE_HEADERS or
                    any(not isinstance(v,str) or len(v) > 8192 or any(ord(c) < 32 and c != '\t' or ord(c) > 126 for c in v) for v in headers.values()) or
                    not isinstance(signals,dict) or set(signals) != {'privateState','sessionPresent','invalidSession','privateResult'} or
                    any(type(v) is not bool for v in signals.values()) or signals['invalidSession'] and not signals['sessionPresent']):
                raise ValueError('invalid_receipt_stored_headers')
            challenge = observation['authChallenge']
            if challenge is not None:
                if (status not in (401,403) or not isinstance(challenge,dict) or
                        set(challenge) != {'scheme','resourceMetadataUri','followed','authenticationVerified'} or
                        challenge['scheme'] not in ('Bearer','unknown') or challenge['followed'] is not False or challenge['authenticationVerified'] is not False):
                    raise ValueError('invalid_receipt_auth_hint')
                uri = challenge['resourceMetadataUri']
                if uri is not None and (not isinstance(uri,str) or contract.auth_challenge('Bearer resource_metadata="'+uri+'"')['resourceMetadataUri'] != uri):
                    raise ValueError('invalid_receipt_auth_hint')
            rebuilt_headers = copy.deepcopy(headers)
            if signals['privateState']: rebuilt_headers['set-cookie'] = 'redacted-present'
            if signals['sessionPresent']: rebuilt_headers['mcp-session-id'] = ' ' if signals['invalidSession'] else 'redacted-transient-session'
            if challenge is not None:
                rebuilt_headers['www-authenticate'] = challenge['scheme'] + (' resource_metadata="'+challenge['resourceMetadataUri']+'"' if challenge['resourceMetadataUri'] else '')
            result = None
            if observation['bodyComplete'] is True:
                text = observation['completeBody']
                if not isinstance(text,str): raise ValueError('invalid_receipt_body')
                body = text.encode('utf-8')
                if (len(body) > contract.MAX_BODY or captured != len(body) or wire != header+captured+framing or
                        observation['responseSha256'] != contract.sha(body)):
                    raise ValueError('response_hash_or_wire_mismatch')
                rebuilt, result, _ = normalize(version, method, status, rebuilt_headers, body, trace)
                for field in ('outcome','reason','bodyComplete','responseSha256','sessionAssigned','cacheHint','headerSignals','authChallenge'):
                    if observation[field] != rebuilt[field]: raise ValueError('receipt_transport_or_projection_mismatch')
            else:
                if (observation['bodyComplete'] is not False or observation['completeBody'] is not None or
                        observation['responseSha256'] is not None or observation['outcome'] != 'unknown' or
                        observation['cacheHint'] is not None): raise ValueError('invalid_receipt_unknown')
                reason = observation['reason']
                if status not in (None,200,202):
                    rebuilt, _, _ = normalize(version, method, status, rebuilt_headers, None, trace)
                    if (reason != rebuilt['reason'] or challenge != rebuilt['authChallenge'] or signals != rebuilt['headerSignals'] or
                            observation['sessionAssigned'] != rebuilt['sessionAssigned']): raise ValueError('invalid_receipt_unknown_reason')
                elif reason in ('private_response_refused','unexpected_modern_session','invalid_legacy_session'):
                    # Safe length-only placeholder: session/privacy checks precede any parsing/retention.
                    rebuilt, _, _ = normalize(version, method, status, rebuilt_headers, b' ' * captured, trace)
                    if (reason != rebuilt['reason'] or signals != rebuilt['headerSignals'] or
                            observation['sessionAssigned'] != rebuilt['sessionAssigned'] or wire != header+captured+framing):
                        raise ValueError('invalid_receipt_unknown_reason')
                elif reason == 'private_cache_refused':
                    complete_frame(headers,captured,trace)
                    if (status != 200 or version != contract.VERSIONS[0] or not signals['privateResult'] or
                            signals['privateState'] or signals['sessionPresent'] or observation['sessionAssigned'] or
                            wire != header+captured+framing or headers.get('content-encoding','identity').lower() != 'identity' or
                            any(x.split('=',1)[0].strip().lower() in ('private','no-store') for x in headers.get('cache-control','').split(','))):
                        raise ValueError('invalid_receipt_unknown_reason')
                elif reason == 'invalid_utf8':
                    complete_frame(headers,captured,trace)
                    if (status not in (200,202) or signals['privateState'] or signals['privateResult'] or
                            signals['sessionPresent'] and (version != contract.VERSIONS[1] or method != 'initialize' or signals['invalidSession']) or
                            observation['sessionAssigned'] != signals['sessionPresent'] or wire != header+captured+framing or
                            any(x.split('=',1)[0].strip().lower() in ('private','no-store') for x in headers.get('cache-control','').split(','))):
                        raise ValueError('invalid_receipt_unknown_reason')
                elif reason not in TRANSPORT_REASONS:
                    raise ValueError('invalid_receipt_unknown_reason')
                elif any(signals.values()) or challenge is not None:
                    raise ValueError('invalid_receipt_unknown_evidence')
                if observation['sessionAssigned'] and not (version == contract.VERSIONS[1] and method == 'initialize' and signals['sessionPresent'] and not signals['invalidSession']):
                    raise ValueError('invalid_receipt_session')
            attempts += 1; received += wire
            halt = halt or should_halt(observation['reason'])
            return result, observation['reason'], observation
        expected = profile_facts(version, replay, lambda: halt, catalog_fact)
        if cursor != len(exchanges) or any(report.get(k) != v for k,v in expected.items()):
            raise ValueError('invalid_receipt_state_replay')
    if receipt.get('attempts') != attempts or attempts > 7 or receipt.get('receivedWireBytes') != received or received > BOUNDS['aggregateWireBytes']:
        raise ValueError('invalid_receipt_budget')
    return receipt


def store_receipt(report):
    """Private operational content-addressed output; no catalog/application path."""
    validate_receipt(report)
    folder = contract.ROOT / 'tmp/discovery/public-receipts'
    for directory in (contract.ROOT / 'tmp', contract.ROOT / 'tmp/discovery', folder):
        if directory.is_symlink(): raise ValueError('receipt_directory_symlink')
        directory.mkdir(exist_ok=True, mode=0o700)
        if directory.resolve() != directory: raise ValueError('receipt_directory_symlink')
    raw = contract.canonical(report)
    path = folder / (contract.sha(raw) + '.json')
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, 'wb') as output:
        output.write(raw)
        output.flush()
        os.fsync(output.fileno())
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-reviewed', action='store_true', help='Disabled until exact endpoint/head/plan parent review')
    args = parser.parse_args()
    if args.run_reviewed:
        if not LIVE_EXECUTION_ENABLED: parser.error('live execution disabled; parent must approve exact endpoint/head/plan first')
        output = collect_plan()
        store_receipt(output)
    else: output = proposal()
    print(contract.canonical(output).decode(), end='')


if __name__ == '__main__':
    main()
