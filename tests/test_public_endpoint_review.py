import copy
import json
import os
import signal
import socket
import ssl
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import discovery_contract as contract
import public_discovery_transport as network
import propose_public_discovery as adapter

CASES = {x['id']: x for x in json.loads((ROOT / 'tests/fixtures/public-discovery.json').read_text())['cases']}
IP = '93.184.216.34'


class FakeSocket:
    def __init__(self, raw=b'', piece=4096):
        self.raw, self.piece, self.sent, self.closed = raw, piece, [], False
    def recv(self, size):
        part, self.raw = self.raw[:min(size, self.piece)], self.raw[min(size, self.piece):]
        return part
    def sendall(self, data): self.sent.append(data)
    def close(self): self.closed = True
    def getpeername(self): return (IP, 443)


def trace(body=b'', fields=None, status=200):
    raw = raw_response(body,fields,status)
    head = raw[:raw.index(b'\r\n\r\n')+4]
    return {'httpStatus': status, 'receivedWireBytes': len(raw), 'capturedBytes': len(body),
            'responseHeaderBytes':len(head),'responseHeaderSha256':contract.sha(head),'responseFramingBytes':0,
            'resolvedAddresses': [IP], 'selectedAddress': IP, 'tlsHostnameVerified': True, 'peerPinned': True}


def raw_response(body, fields=None, status=200):
    fields = fields or {'Content-Type': 'application/json', 'Content-Length': str(len(body))}
    return (f'HTTP/1.1 {status} Status\r\n' + ''.join(k+': '+v+'\r\n' for k,v in fields.items()) + '\r\n').encode() + body


def fixture_result(case, method, sequence):
    message = copy.deepcopy(CASES[case]['replies'][method][0]['message'])
    message['id'] = sequence
    return contract.canonical(message)


class EndpointReviewTests(unittest.TestCase):
    def test_proposal_is_exact_unexecuted_and_gate_precedes_network(self):
        with patch.object(socket, 'getaddrinfo', side_effect=AssertionError('DNS prohibited')), patch.object(socket, 'socket', side_effect=AssertionError('network prohibited')):
            plan = adapter.proposal()
            with self.assertRaisesRegex(ValueError, 'live_execution_disabled'): adapter.collect_plan()
        self.assertFalse(plan['liveExecutionEnabled'])
        self.assertEqual(plan['endpoint']['endpointUrl'], network.URL)
        self.assertEqual(len(plan['requests']), 7)
        self.assertEqual([x['method'] for x in plan['requests']], ['server/discover', 'tools/list', 'resources/list', 'initialize', 'notifications/initialized', 'tools/list', 'resources/list'])
        for item in plan['requests']:
            self.assertEqual(item['requestSha256'], contract.sha(contract.canonical(item['body'])))
            self.assertNotIn('Authorization', item['headers'])
        self.assertIsNone(plan['assessments']['score'])
        self.assertFalse(plan['publication']['eligible'])
        result = subprocess.run([sys.executable, str(ROOT/'scripts/propose_public_discovery.py'), '--run-reviewed'], capture_output=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn(b'parent must approve', result.stderr)
        for flag in ('--url', '--auth', '--tool'):
            result = subprocess.run([sys.executable, str(ROOT/'scripts/propose_public_discovery.py'), flag, 'https://localhost/'], capture_output=True)
            self.assertEqual(result.returncode, 2)

    def test_manifest_cannot_enlarge_endpoint_listing_source_or_bounds(self):
        original = adapter.reviewed_manifest()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'manifest.json'
            for key, value in (('endpointUrl', 'https://mcp.revenuecat.ai/mcp?target=localhost'), ('listingSlug', 'hotjar-mcp'), ('sourceCitationUrl', 'https://example.com')):
                changed = copy.deepcopy(original); changed['reviewedEndpoints'][0][key] = value
                path.write_bytes(contract.canonical(changed))
                with patch.object(adapter, 'MANIFEST', path), self.assertRaises(ValueError): adapter.proposal()
            for change in ('bounds', 'enabled', 'extra', 'grades'):
                changed = copy.deepcopy(original)
                if change == 'bounds': changed['bounds']['maxRequests'] = 8
                if change == 'enabled': changed['liveExecutionEnabled'] = True
                if change == 'extra': changed['reviewedEndpoints'].append(copy.deepcopy(changed['reviewedEndpoints'][0]))
                if change == 'grades': changed['assessments']['badge'] = 'safe'
                path.write_bytes(contract.canonical(changed))
                with patch.object(adapter, 'MANIFEST', path), self.assertRaises(ValueError): adapter.proposal()

    def test_all_dns_answers_must_be_public_and_bounded(self):
        for value in ('127.0.0.1', '169.254.169.254', '10.0.0.1', '100.100.100.200', '224.0.0.1', '168.63.129.16', '::1', '::ffff:8.8.8.8', '64:ff9b::808:808', '2002:0808:0808::1', '2001::1', 'fe80::1%eth0'):
            self.assertFalse(network.public_ip(value), value)
        self.assertTrue(network.public_ip(IP))
        self.assertTrue(network.public_ip('2606:4700:4700::1111'))
        answer = (socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, '', (IP,443))
        bad = (socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, '', ('127.0.0.1',443))
        for answers in ([], [answer]*9, [answer,bad]):
            with patch.object(socket, 'getaddrinfo', return_value=answers), self.assertRaises(ValueError): network.resolve_native(network.HOST)
        with patch.object(socket, 'getaddrinfo', return_value=[answer]) as resolver:
            self.assertEqual(network.resolve_native(network.HOST), [(socket.AF_INET, IP)])
            resolver.assert_called_once_with(network.HOST, 443, socket.AF_UNSPEC, socket.SOCK_STREAM, socket.IPPROTO_TCP)
        with patch.object(socket, 'getaddrinfo', side_effect=AssertionError('no DNS')), self.assertRaisesRegex(ValueError,'allowlisted'):
            network.resolve('mcp.revenuecat.ai.evil.example')

    @patch.dict(os.environ, {}, clear=True)
    def test_literal_peer_pin_tls_original_hostname_and_no_fallback(self):
        tcp = Mock(); tcp.getpeername.return_value=(IP,443)
        secure = FakeSocket()
        context = Mock(check_hostname=True, verify_mode=ssl.CERT_REQUIRED)
        context.wrap_socket.return_value = secure
        with patch.object(socket, 'socket', return_value=tcp), patch.object(ssl, 'create_default_context', return_value=context):
            record={}; result=network.connect([(socket.AF_INET,IP)], .1, record)
        self.assertIs(result, secure)
        tcp.connect.assert_called_once_with((IP,443))
        context.wrap_socket.assert_called_once_with(tcp,server_hostname=network.HOST)
        self.assertTrue(record['tlsHostnameVerified'] and record['peerPinned'])
        tcp.getpeername.return_value=('127.0.0.1',443)
        with patch.object(socket,'socket',return_value=tcp), patch.object(ssl,'create_default_context',return_value=context), self.assertRaisesRegex(ValueError,'peer_pin_mismatch'):
            network.connect([(socket.AF_INET,IP)], .1, {})
        for variable in ('SSL_CERT_FILE','SSL_CERT_DIR','SSLKEYLOGFILE'):
            with patch.dict(os.environ,{variable:'owned-unit-test-placeholder'}), patch.object(socket,'socket',side_effect=AssertionError('no socket')), self.assertRaisesRegex(ValueError,'custom_tls_environment_refused'):
                network.connect([(socket.AF_INET,IP)], .1, {})
        tcp.getpeername.return_value=(IP,443)
        context.check_hostname=False
        with patch.object(socket,'socket',return_value=tcp), patch.object(ssl,'create_default_context',return_value=context), self.assertRaisesRegex(ValueError,'tls_verification_required'):
            network.connect([(socket.AF_INET,IP)], .1, {})

    def test_wire_accepts_only_complete_bounded_identity_frames(self):
        body=b'{"x":1}'
        examples=[raw_response(body), raw_response(body,{'Content-Type':'application/json'}),
                  raw_response(b'7\r\n'+body+b'\r\n0\r\n\r\n',{'Content-Type':'application/json','Transfer-Encoding':'chunked'})]
        for raw in examples:
            wire=network.Wire(FakeSocket(raw,piece=1)); status,headers,_=wire.read_headers()
            self.assertEqual(status,200); self.assertEqual(wire.read_body(headers),body)
            self.assertLessEqual(wire.received, network.MAX_BODY+network.MAX_HEADERS+network.MAX_FRAMING)

    def test_header_chunk_compression_truncation_and_pipeline_refusals(self):
        variants=[b'HTTP/1.1 200 OK\r\nContent-Length: 2\r\ncontent-length: 2\r\n\r\n{}',
                  raw_response(b'{}',{'Content-Encoding':'gzip','Content-Length':'2'}),
                  raw_response(b'{}',{'Content-Length':'2','Transfer-Encoding':'chunked'}),
                  raw_response(b'{}',{'Content-Length':'3'}),
                  raw_response(b'{}junk',{'Content-Length':'2'}),
                  raw_response(b'2;foo=x\r\n{}\r\n0\r\n\r\n',{'Transfer-Encoding':'chunked'}),
                  raw_response(b'2\r\n{}\r\n0\r\nX-Target: localhost\r\n\r\n',{'Transfer-Encoding':'chunked'}),
                  raw_response(b'10001\r\n',{'Transfer-Encoding':'chunked'}),
                  b'HTTP/1.1 200 OK\r\nX: '+b'a'*8192+b'\r\n\r\n',
                  b'HTTP/1.1 200 OK\r\n Bad: folded\r\n\r\n']
        for raw in variants:
            with self.subTest(raw=raw[:45]), self.assertRaises(ValueError):
                wire=network.Wire(FakeSocket(raw)); _,headers,_=wire.read_headers(); wire.read_body(headers)
        body=b'a'*65536
        wire=network.Wire(FakeSocket(raw_response(body))); _,headers,_=wire.read_headers()
        self.assertEqual(len(wire.read_body(headers)),65536)

    @patch.dict(os.environ, {}, clear=True)
    def test_real_wire_framing_excess_becomes_bounded_unknown_receipt(self):
        raw=raw_response(b'1\r\na\r\n'*2000+b'0\r\n\r\n',{'content-type':'application/json','transfer-encoding':'chunked'})
        sock=FakeSocket(raw)
        def connect(addresses,timeout,record):
            record.update(resolvedAddresses=[IP],selectedAddress=IP,tlsHostnameVerified=True,peerPinned=True)
            return sock
        with patch.object(adapter,'LIVE_EXECUTION_ENABLED',True), patch.object(network,'resolve',return_value=[(socket.AF_INET,IP)]), patch.object(network,'connect',side_effect=connect):
            receipt=adapter.collect_plan()
        self.assertEqual(receipt['reports'][0]['discovery'],contract.unknown('framing_limit'))
        self.assertLessEqual(receipt['reports'][0]['exchanges'][0]['network']['responseFramingBytes'],8192)
        self.assertEqual(receipt['attempts'],1); self.assertTrue(sock.closed)

    def test_whole_operation_deadline_stops_trickle_and_restores_signal(self):
        class Trickle(FakeSocket):
            def recv(self,size): time.sleep(.02); return super().recv(size)
        old=signal.getsignal(signal.SIGALRM); start=time.monotonic()
        with self.assertRaises(TimeoutError), network.deadline(.05):
            network.Wire(Trickle(raw_response(b'{}'),piece=1)).read_headers()
        self.assertLess(time.monotonic()-start,.2)
        self.assertEqual(signal.getsignal(signal.SIGALRM),old)
        self.assertEqual(signal.getitimer(signal.ITIMER_REAL),(0.0,0.0))

    def test_native_dns_is_cancelled_in_owned_child_without_dns_or_socket(self):
        actual_popen = subprocess.Popen
        children=[]
        def owned_child(args, **kwargs):
            self.assertEqual(args,[sys.executable,str(ROOT/'scripts/public_discovery_transport.py'),'--fixed-host-dns'])
            child=actual_popen([sys.executable,'-c','import time; time.sleep(5)'],**kwargs)
            children.append(child); return child
        started=time.monotonic()
        with patch.object(socket,'getaddrinfo',side_effect=AssertionError('no DNS')), patch.object(socket,'socket',side_effect=AssertionError('no socket')), patch.object(subprocess,'Popen',side_effect=owned_child):
            with self.assertRaises(TimeoutError), network.deadline(.04): network.resolve(network.HOST)
        self.assertLess(time.monotonic()-started,.3)
        self.assertTrue(children and all(x.poll() is not None for x in children))

    def test_schema_interpretation_propagates_deadline(self):
        def delayed(_): time.sleep(.1)
        started=time.monotonic()
        with patch.object(contract.Draft202012Validator,'check_schema',side_effect=delayed):
            with self.assertRaises(TimeoutError), network.deadline(.02): contract.schema_declaration({'type':'object'})
        self.assertLess(time.monotonic()-started,.08)

    def test_parent_revalidates_child_dns_literals_without_network(self):
        for value in ([], [[socket.AF_INET,'127.0.0.1']], [[socket.AF_INET6,IP]], [[socket.AF_INET,IP]]*9):
            child=Mock(returncode=0); child.communicate.return_value=(contract.canonical(value),None)
            with patch.object(subprocess,'Popen',return_value=child), self.assertRaises(ValueError): network.resolve(network.HOST)
        child=Mock(returncode=0); child.communicate.return_value=(contract.canonical([[socket.AF_INET,IP]]),None)
        with patch.object(subprocess,'Popen',return_value=child): self.assertEqual(network.resolve(network.HOST),[(socket.AF_INET,IP)])

    def test_complete_public_semantic_unknowns_are_replayed(self):
        clock=[0.0]
        def post(body,headers,timeout,record):
            message=contract.strict_json(body)
            payload=contract.canonical({'jsonrpc':'2.0','id':message['id'],'error':{'code':-32601,'message':'owned method unavailable'}})
            response_headers={'content-type':'application/json','content-length':str(len(payload))}
            record.update(trace(payload,response_headers)); return 200,response_headers,b'',payload
        def advance(seconds): clock[0]+=seconds
        with patch.object(adapter,'LIVE_EXECUTION_ENABLED',True), patch.object(network,'post',side_effect=post), patch.object(time,'sleep',side_effect=advance), patch.object(time,'monotonic',side_effect=lambda:clock[0]):
            report=adapter.collect_plan()
        self.assertEqual(report['attempts'],2)
        self.assertEqual(report['reports'][0]['discovery'],contract.unknown('peer_rpc_error'))
        self.assertTrue(report['reports'][0]['exchanges'][0]['bodyComplete'])
        bad=copy.deepcopy(report); bad['reports'][0]['exchanges'][0]['reason']='unsupported_version'
        with self.assertRaises(ValueError): adapter.validate_receipt(bad)
        bad=copy.deepcopy(report); bad['reports'][0]['exchanges'][0]['completeBody']=None
        with self.assertRaises(ValueError): adapter.validate_receipt(bad)

    def test_invalid_utf8_is_attributable_unknown_and_halts_without_retention(self):
        def post(body,headers,timeout,record):
            payload=b'\xff'; response_headers={'content-type':'application/json','content-length':'1'}
            record.update(trace(payload,response_headers)); return 200,response_headers,b'',payload
        with patch.object(adapter,'LIVE_EXECUTION_ENABLED',True), patch.object(network,'post',side_effect=post): receipt=adapter.collect_plan()
        self.assertEqual(receipt['attempts'],1)
        self.assertEqual(receipt['reports'][0]['discovery'],contract.unknown('invalid_utf8'))
        self.assertEqual(receipt['reports'][1]['discovery'],contract.unknown('safety_skipped'))
        self.assertIsNone(receipt['reports'][0]['exchanges'][0]['completeBody'])

    def test_post_method_headers_and_body_are_allowlisted_before_dns(self):
        headers=network.request_headers(contract.VERSIONS[0],'server/discover')
        with patch.object(socket,'getaddrinfo',side_effect=AssertionError('no DNS')):
            for body in (contract.canonical({'jsonrpc':'2.0','id':1,'method':'tools/call','params':{}}),
                         contract.canonical({'jsonrpc':'2.0','method':'resources/read','params':{}}),
                         contract.canonical({'jsonrpc':'2.0','method':'initialize','params':'wrong'})):
                with self.assertRaises(ValueError): network.post(body,headers,.1,{})
            bad={**headers,'Authorization':'Bearer forbidden'}
            with self.assertRaises(ValueError): network.post(network.request_bytes(contract.VERSIONS[0],'server/discover'),bad,.1,{})
            bad={**headers,'Origin':'https://localhost'}
            with self.assertRaises(ValueError): network.post(network.request_bytes(contract.VERSIONS[0],'server/discover'),bad,.1,{})

    @patch.dict(os.environ, {}, clear=True)
    def test_redirect_and_auth_headers_never_expand_authority(self):
        for status, fields in ((307, {'Location':'https://169.254.169.254/'}), (401, {'WWW-Authenticate':'Bearer resource_metadata="https://auth.example.test/.well-known/oauth-protected-resource"'})):
            sock=FakeSocket(raw_response(b'secret-body',fields,status)); record={}
            with patch.object(network,'resolve',return_value=[(socket.AF_INET,IP)]) as resolver, patch.object(network,'connect',return_value=sock):
                code,headers,_,body=network.post(network.request_bytes(contract.VERSIONS[0],'server/discover'),network.request_headers(contract.VERSIONS[0],'server/discover'),.1,record)
            self.assertEqual(code,status); self.assertIsNone(body); self.assertEqual(record['capturedBytes'],0)
            resolver.assert_called_once_with(network.HOST); self.assertTrue(sock.closed)
            self.assertEqual(len(sock.sent),1); self.assertTrue(sock.sent[0].startswith(b'POST /mcp HTTP/1.1'))

    def test_public_projection_requires_verified_transport_and_refuses_private_hints(self):
        version=contract.VERSIONS[0]; body=fixture_result('modern-json','server/discover',1)
        headers={'content-type':'application/json','content-length':str(len(body))}
        observed,result,_=adapter.normalize(version,'server/discover',200,headers,body,trace())
        self.assertEqual(observed['outcome'],'observed'); self.assertIsNotNone(result)
        for extra in ({'content-encoding':'gzip'},{'mcp-session-id':'nonce'},{'cache-control':'private'},{'cache-control':'private = "Set-Cookie"'},{'cache-control':'no-store'},{'set-cookie':'tracking=secret'}):
            observed,result,_=adapter.normalize(version,'server/discover',200,{**headers,**extra},body,trace())
            self.assertIsNone(result); self.assertIsNone(observed['completeBody']); self.assertIsNone(observed['responseSha256'])
        bad=trace(); bad['peerPinned']=False
        observed,result,_=adapter.normalize(version,'server/discover',200,headers,body,bad)
        self.assertEqual(observed['reason'],'unverified_transport'); self.assertIsNone(result)

    def test_discarded_session_and_private_headers_replay_without_body(self):
        for extra, reason, legacy in (({'mcp-session-id':'forbidden-modern'},'unexpected_modern_session',False),
                                     ({'cache-control':'private = "Set-Cookie"'},'private_response_refused',False),
                                     ({'mcp-session-id':'invalid session'},'invalid_legacy_session',True)):
            clock=[0.0]
            def post(body,headers,timeout,record):
                message=contract.strict_json(body); method=message['method']
                version=message.get('params',{}).get('protocolVersion',headers.get('MCP-Protocol-Version'))
                if legacy and version==contract.VERSIONS[0]:
                    payload=contract.canonical({'jsonrpc':'2.0','id':1,'error':{'code':-32601,'message':'unavailable'}})
                    response_headers={'content-type':'application/json','content-length':str(len(payload))}
                else:
                    payload=fixture_result('legacy-session' if legacy else 'modern-json',method,1)
                    response_headers={'content-type':'application/json','content-length':str(len(payload)),**extra}
                record.update(trace(payload,response_headers)); return 200,response_headers,b'',payload
            def advance(seconds): clock[0]+=seconds
            with patch.object(adapter,'LIVE_EXECUTION_ENABLED',True), patch.object(network,'post',side_effect=post), patch.object(time,'sleep',side_effect=advance), patch.object(time,'monotonic',side_effect=lambda:clock[0]):
                receipt=adapter.collect_plan()
            report=receipt['reports'][1 if legacy else 0]
            self.assertEqual(report['discovery'],contract.unknown(reason))
            self.assertEqual(receipt['attempts'],2 if legacy else 1)
            self.assertIsNone(report['exchanges'][0]['completeBody'])

    def test_partial_catalog_and_derived_schema_apps_references_remain_inert(self):
        version=contract.VERSIONS[0]; body=fixture_result('modern-json','tools/list',2)
        observed,result,_=adapter.normalize(version,'tools/list',200,{'content-type':'application/json','content-length':str(len(body))},body,trace())
        result['nextCursor']='https://169.254.169.254/next'
        with patch.object(socket,'getaddrinfo',side_effect=AssertionError('no reference fetch')):
            fact,items=adapter.catalog_fact('tools',result,observed)
        self.assertEqual(fact,contract.unknown('page_limit')); self.assertGreater(len(items),0)
        for item in items: self.assertEqual(item['execution'],'disabled')

    def test_two_reviewed_profiles_are_separate_and_auth_halts_endpoint(self):
        calls=[]
        def post(body,headers,timeout,record):
            message=contract.strict_json(body); method=message['method']
            version=message.get('params',{}).get('protocolVersion',headers.get('MCP-Protocol-Version'))
            calls.append((version,method))
            if method=='notifications/initialized': payload=b''; status=202
            else:
                case='modern-json' if version==contract.VERSIONS[0] else 'legacy-session'
                payload=fixture_result(case,method,network.METHODS[version][method]); status=200
            response_headers={'content-type':'application/json','content-length':str(len(payload))}
            if method=='initialize': response_headers['mcp-session-id']='fixture-session-secret'
            elif version==contract.VERSIONS[1]: self.assertEqual(headers.get('Mcp-Session-Id'),'fixture-session-secret')
            record.update(trace(payload,response_headers,status))
            return status,response_headers,b'',payload
        clock=[0.0]
        def advance(seconds): clock[0]+=seconds
        with patch.object(adapter,'LIVE_EXECUTION_ENABLED',True), patch.object(network,'post',side_effect=post), patch.object(time,'sleep',side_effect=advance), patch.object(time,'monotonic',side_effect=lambda:clock[0]):
            report=adapter.collect_plan()
        self.assertEqual(report['attempts'],7); self.assertEqual(len(calls),7)
        self.assertEqual([r['discovery']['state'] for r in report['reports']],['declared','declared'])
        self.assertFalse(report['publication']['eligible']); self.assertIsNone(report['assessments']['badge'])
        self.assertNotIn(b'fixture-session-secret',contract.canonical(report))
        safe_legacy=copy.deepcopy(report['reports'][1])
        for mutation in ('profile','request-hash','response-hash','count','citation','tls','encoding','status','policy','budget','header-secret','header-mixed','header-hash','zero-wire','year','request-time','run-time','unknown-summary','impossible-framing','length-digits','impossible-chunked'):
            bad=copy.deepcopy(report)
            if mutation=='profile': bad['reports'][0]['protocolVersion']='2025-11-25'
            if mutation=='request-hash': bad['reports'][0]['exchanges'][0]['requestSha256']='0'*64
            if mutation=='response-hash': bad['reports'][0]['exchanges'][0]['responseSha256']='0'*64
            if mutation=='count': bad['reports'][0]['tools']['value']['count']=0
            if mutation=='citation': bad['reports'][0]['discovery']['citations'][0]['pointer']='/nonexistent'
            if mutation=='tls': bad['reports'][0]['exchanges'][0]['network']['tlsHostnameVerified']=False
            if mutation=='encoding': bad['reports'][0]['exchanges'][0]['headers']['content-encoding']='gzip'
            if mutation=='status':
                bad['reports'][0]['exchanges'][0]['httpStatus']=202
                bad['reports'][0]['exchanges'][0]['network']['httpStatus']=202
            if mutation=='policy': bad['assessments']['score']=100
            if mutation=='budget': bad['attempts']=1
            if mutation=='header-secret': bad['reports'][0]['exchanges'][0]['headers']['authorization']='secret-placeholder'
            if mutation=='header-mixed': bad['reports'][0]['exchanges'][0]['headers']['Content-Type']='application/json'
            if mutation=='header-hash': bad['reports'][0]['exchanges'][0]['network'].pop('responseHeaderSha256')
            if mutation=='zero-wire': bad['reports'][0]['exchanges'][0]['network']['receivedWireBytes']=0
            if mutation=='year': bad['finishedAt']='2027-10-05T01:00:00Z'
            if mutation=='request-time': bad['reports'][0]['exchanges'][0]['completedOffsetMs']=9000
            if mutation=='run-time': bad['durationMs']=61000
            if mutation=='unknown-summary': bad['reports'][0]['discovery']=contract.unknown('unrelated_reason')
            if mutation=='impossible-framing':
                bad['reports'][0]['exchanges'][0]['network']['responseFramingBytes']=1
                bad['reports'][0]['exchanges'][0]['network']['receivedWireBytes']+=1
                bad['receivedWireBytes']+=1
            if mutation=='length-digits': bad['reports'][0]['exchanges'][0]['headers']['content-length']='0'*9+bad['reports'][0]['exchanges'][0]['headers']['content-length']
            if mutation=='impossible-chunked':
                bad['reports'][0]['exchanges'][0]['headers'].pop('content-length')
                bad['reports'][0]['exchanges'][0]['headers']['transfer-encoding']='chunked'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): adapter.validate_receipt(bad)
        def auth(body,headers,timeout,record):
            record.update(trace(fields={'www-authenticate':'Bearer'},status=401))
            return 401,{'www-authenticate':'Bearer'},b'',None
        with patch.object(adapter,'LIVE_EXECUTION_ENABLED',True), patch.object(network,'post',side_effect=auth), patch.object(time,'sleep'):
            report=adapter.collect_plan()
        self.assertEqual(report['attempts'],1)
        self.assertEqual(report['reports'][0]['discovery'],contract.unknown('authentication_required'))
        self.assertEqual(report['reports'][1]['discovery'],contract.unknown('safety_skipped'))
        for mutation in ('splice','reason','summary','impossible-private-result'):
            bad=copy.deepcopy(report)
            if mutation=='splice':
                legacy=copy.deepcopy(safe_legacy)
                bad['reports'][1]=legacy
                bad['attempts']=5; bad['receivedWireBytes']+=sum(x['network']['receivedWireBytes'] for x in legacy['exchanges'])
                bad['durationMs']=6000
            if mutation=='reason': bad['reports'][0]['exchanges'][0]['reason']='unsupported_version'
            if mutation=='summary': bad['reports'][0]['discovery']=contract.unknown('unrelated_reason')
            if mutation=='impossible-private-result': bad['reports'][0]['exchanges'][0]['headerSignals']['privateResult']=True
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): adapter.validate_receipt(bad)

    def test_private_result_cannot_hide_earlier_header_refusals(self):
        def post(body,headers,timeout,record):
            message=contract.strict_json(fixture_result('modern-json','server/discover',1))
            message['result']['cacheScope']='private'; payload=contract.canonical(message)
            response_headers={'content-type':'application/json','content-length':str(len(payload))}
            record.update(trace(payload,response_headers)); return 200,response_headers,b'',payload
        with patch.object(adapter,'LIVE_EXECUTION_ENABLED',True), patch.object(network,'post',side_effect=post): receipt=adapter.collect_plan()
        self.assertEqual(receipt['reports'][0]['discovery'],contract.unknown('private_cache_refused'))
        self.assertEqual(receipt['attempts'],1)
        for signal in ('privateState','sessionPresent'):
            bad=copy.deepcopy(receipt); bad['reports'][0]['exchanges'][0]['headerSignals'][signal]=True
            with self.subTest(signal=signal), self.assertRaises(ValueError): adapter.validate_receipt(bad)

    def test_receipt_writer_is_private_content_addressed_and_refuses_overwrite_symlinks(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(contract,'ROOT',Path(directory)), patch.object(adapter,'validate_receipt',side_effect=lambda x:x):
            data={'kind':'owned writer fixture; no endpoint observation'}
            path=adapter.store_receipt(data)
            self.assertEqual(path.name,contract.sha(contract.canonical(data))+'.json')
            self.assertEqual(path.stat().st_mode & 0o777,0o600)
            with self.assertRaises(FileExistsError): adapter.store_receipt(data)
            path.unlink(); path.symlink_to(Path(directory)/'outside.json')
            with self.assertRaises(OSError): adapter.store_receipt(data)
            path.unlink(); path.parent.rmdir(); path.parent.symlink_to(Path(directory))
            with self.assertRaisesRegex(ValueError,'symlink'): adapter.store_receipt(data)


if __name__ == '__main__': unittest.main()
