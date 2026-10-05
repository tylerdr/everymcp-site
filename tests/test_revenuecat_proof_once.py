import copy
import json
import os
import socket
import ssl
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import run_revenuecat_proof_once as once

CONTROL_SHA = 'a'*40
PROVENANCE = {'runId':123,'controlSha':CONTROL_SHA}


def history(**updates):
    run={'id':123,'head_sha':CONTROL_SHA,'head_branch':'main','event':'workflow_dispatch',
         'run_attempt':1,'actor':{'login':'tylerdr'},'repository':{'full_name':once.REPO,'private':False},'path':once.WORKFLOW}
    run.update(updates)
    return {'total_count':1,'workflow_runs':[run]}


def environment(path):
    return {'GITHUB_ACTIONS':'true','GITHUB_EVENT_NAME':'workflow_dispatch','GITHUB_REPOSITORY':once.REPO,
            'GITHUB_REF':'refs/heads/main','GITHUB_ACTOR':'tylerdr','GITHUB_TRIGGERING_ACTOR':'tylerdr',
            'GITHUB_RUN_ATTEMPT':'1','RUNNER_ENVIRONMENT':'github-hosted','RUNNER_OS':'Linux','RUNNER_ARCH':'X64',
            'GITHUB_JOB':'observe','GITHUB_WORKFLOW_REF':once.REPO+'/'+once.WORKFLOW+'@refs/heads/main',
            'GITHUB_RUN_ID':'123','GITHUB_SHA':CONTROL_SHA,'GITHUB_WORKFLOW_SHA':CONTROL_SHA,'GITHUB_EVENT_PATH':str(path)}


class OneTimeProofTests(unittest.TestCase):
    def test_environment_overrides_are_refused_without_dns_or_config_mutation(self):
        for key in once.TLS_KEYS+once.PROXY_KEYS:
            with patch.dict(os.environ,{key:'sensitive-controlled-fixture'},clear=True), patch.object(socket,'getaddrinfo',side_effect=AssertionError('DNS prohibited')), patch.object(ssl,'create_default_context',side_effect=AssertionError('no trust override')):
                with self.assertRaisesRegex(ValueError,'environment_refused'): once.tls_preflight()
                self.assertEqual(os.environ[key],'sensitive-controlled-fixture')

    def test_normal_tls_requires_default_verified_trust_store(self):
        for context in (Mock(check_hostname=False,verify_mode=ssl.CERT_REQUIRED),Mock(check_hostname=True,verify_mode=ssl.CERT_NONE),Mock(check_hostname=True,verify_mode=ssl.CERT_REQUIRED)):
            context.get_ca_certs.return_value=[]
            with patch.dict(os.environ,{},clear=True),patch.object(ssl,'create_default_context',return_value=context),self.assertRaisesRegex(ValueError,'verified_tls_unavailable'): once.tls_preflight()
        context=Mock(check_hostname=True,verify_mode=ssl.CERT_REQUIRED);context.get_ca_certs.return_value=[{}]
        with patch.dict(os.environ,{},clear=True),patch.object(ssl,'create_default_context',return_value=context):
            self.assertEqual(once.tls_preflight()['networkRequests'],0)
            self.assertEqual(context.minimum_version,ssl.TLSVersion.TLSv1_2)

    def test_hosted_context_rejects_private_wrong_actor_attempt_ref_and_control_before_network(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'event.json'
            event={'repository':{'full_name':once.REPO,'private':False},'sender':{'login':'tylerdr'},'inputs':{'approved_control_sha':CONTROL_SHA}}
            path.write_text(json.dumps(event))
            env=environment(path)
            for key,value in [('GITHUB_RUN_ATTEMPT','2'),('GITHUB_ACTOR','other'),('GITHUB_REF','refs/heads/feature/other'),('GITHUB_EVENT_NAME','schedule'),('RUNNER_ENVIRONMENT','self-hosted'),('GITHUB_WORKFLOW_SHA','b'*40)]:
                with patch.dict(os.environ,env|{key:value},clear=True),patch.object(once,'verify_checkout',side_effect=AssertionError('early refusal')),self.assertRaises(ValueError): once.execution_context()
            for change in ('private','input','sender'):
                bad=copy.deepcopy(event)
                if change=='private':bad['repository']['private']=True
                elif change=='input':bad['inputs']['approved_control_sha']='b'*40
                else:bad['sender']['login']='other'
                path.write_text(json.dumps(bad))
                with patch.dict(os.environ,env,clear=True),patch.object(once,'verify_checkout',side_effect=AssertionError('early refusal')),self.assertRaisesRegex(ValueError,'unapproved_control'):once.execution_context()

    def test_checkout_refuses_changed_head_tree_origin_or_files(self):
        for answers,reason in [(['b'*40],'head'),([CONTROL_SHA,'b'*40],'tree'),([CONTROL_SHA,'c'*40,'https://github.com/other/repo'],'origin'),([CONTROL_SHA,'c'*40,'https://github.com/'+once.REPO,' M scripts/x.py'],'clean')]:
            with patch.object(once,'git',side_effect=answers),self.assertRaisesRegex(ValueError,reason):once.verify_checkout(ROOT,CONTROL_SHA,'c'*40)

    def test_unfiltered_first_run_requires_one_current_exact_identity(self):
        def check(value,status=b'200'):
            with patch.object(once,'bounded_capture',return_value=once.canonical(value).rstrip(b'\n')+b'\n'+status) as capture:
                result=once.first_run(PROVENANCE)
                command=capture.call_args.args[0]
                self.assertEqual(command[:2],['curl','--disable'])
                self.assertEqual(command[-1],once.HISTORY_URL)
                self.assertNotIn('--location',command);self.assertNotIn('--retry',command);self.assertNotIn('--insecure',command)
                self.assertEqual(result['githubActionsRequests'],1)
        check(history())
        for bad in ({'total_count':2,'workflow_runs':[history()['workflow_runs'][0]]},history(id=124),history(run_attempt=2),history(head_sha='b'*40),history(event='push'),history(repository={'full_name':once.REPO,'private':True}),history(path='another.yml')):
            with self.assertRaises(ValueError):check(bad)
        for status in (b'302',b'403'):
            with self.assertRaisesRegex(ValueError,'history_read_refused'):check(history(),status)

    def test_lengthless_oversize_metadata_child_is_killed_and_reaped(self):
        # Owned Python stdout fixture: no curl, DNS, sockets, or HTTP request.
        child=[];original=subprocess.Popen
        def capture(*args,**kwargs):
            proc=original(*args,**kwargs);child.append(proc);return proc
        with patch.object(once.subprocess,'Popen',side_effect=capture),self.assertRaisesRegex(ValueError,'history_body_limit'):
            once.bounded_capture([sys.executable,'-c','import sys,time;sys.stdout.buffer.write(b"x"*40000);sys.stdout.flush();time.sleep(30)'])
        self.assertIsNotNone(child[0].returncode)
        self.assertTrue(child[0].stdout.closed)

    def test_metadata_nonzero_exit_and_small_success(self):
        self.assertEqual(once.bounded_capture([sys.executable,'-c','print("owned fixture")']),b'owned fixture\n')
        with self.assertRaisesRegex(ValueError,'history_read_refused'):once.bounded_capture([sys.executable,'-c','raise SystemExit(1)'])

    def test_exclusive_claim_and_gate_restore_consume_failed_attempt(self):
        with tempfile.TemporaryDirectory() as folder:
            adapter=SimpleNamespace(LIVE_EXECUTION_ENABLED=False,collect_plan=Mock(side_effect=ValueError('owned refusal')),store_receipt=Mock())
            with patch.object(once,'CONTROL',Path(folder)),patch.object(once,'execution_context',return_value=PROVENANCE),patch.object(once,'tls_preflight',return_value={}),patch.object(once,'first_run',return_value={}),patch.object(once,'approved_adapter',return_value=adapter):
                with self.assertRaisesRegex(ValueError,'owned refusal'):once.observe_once()
                self.assertFalse(adapter.LIVE_EXECUTION_ENABLED)
                claim=Path(folder)/'tmp/discovery/one-time-claims/123.claim'
                self.assertEqual(claim.stat().st_mode&0o777,0o600)
                with self.assertRaises(FileExistsError):once.observe_once()
                self.assertEqual(adapter.collect_plan.call_count,1);adapter.store_receipt.assert_not_called()

    def test_claim_symlink_refuses_before_observer_call(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)/'control';root.mkdir();target=Path(folder)/'target';target.mkdir();(root/'tmp').symlink_to(target)
            adapter=SimpleNamespace(LIVE_EXECUTION_ENABLED=False,collect_plan=Mock())
            with patch.object(once,'CONTROL',root),patch.object(once,'execution_context',return_value=PROVENANCE),patch.object(once,'tls_preflight',return_value={}),patch.object(once,'first_run',return_value={}),patch.object(once,'approved_adapter',return_value=adapter),self.assertRaisesRegex(ValueError,'claim_directory_symlink'):once.observe_once()
            adapter.collect_plan.assert_not_called();self.assertFalse(adapter.LIVE_EXECUTION_ENABLED)

    def test_frozen_plan_or_preloaded_module_refuses_before_adapter_import(self):
        with patch.object(once,'verify_checkout'),patch.dict(sys.modules,{'propose_public_discovery':SimpleNamespace()}),self.assertRaisesRegex(ValueError,'preloaded_observer_modules_refused'):once.approved_adapter()
        with tempfile.TemporaryDirectory() as folder:
            approved=Path(folder);(approved/'documents/public-discovery').mkdir(parents=True);(approved/'documents/public-discovery/endpoint-proposal.json').write_text('{}')
            with patch.object(once,'APPROVED',approved),patch.object(once,'verify_checkout'),self.assertRaisesRegex(ValueError,'approved_plan_hash_mismatch'):once.approved_adapter()

    def test_public_headers_and_reasons_do_not_export_arbitrary_values(self):
        headers={'content-type':'application/json; charset=utf-8','content-length':'120','cache-control':'secret-fixture','authorization':'secret-fixture','set-cookie':'secret-fixture','www-authenticate':'Bearer resource_metadata="secret-fixture"','mcp-session-id':'secret-fixture'}
        self.assertEqual(once.safe_headers(headers),{'content-type':'application/json; charset=utf-8','content-length':'120'})
        self.assertEqual(once.safe_reason('secret_fixture'),'unclassified_observer_refusal')
        self.assertEqual(once.safe_reason('authentication_required'),'authentication_required')

    def test_public_summary_redacts_auth_metadata_and_complete_declaration_values(self):
        # Approved collector, owned complete HTTP fixture; no live endpoint or DNS request.
        from test_public_endpoint_review import adapter, network, trace
        secret='sensitive-controlled-fixture'
        headers={'content-type':'application/json','content-length':'0',
                 'www-authenticate':'Bearer resource_metadata="https://example.com/'+secret+'"'}
        def owned_post(*args):
            args[-1].update(trace(b'',{k.title():v for k,v in headers.items()},401))
            return 401,headers,b'',None
        with patch.object(adapter,'LIVE_EXECUTION_ENABLED',True),patch.object(network,'post',side_effect=owned_post):
            receipt=adapter.collect_plan()
        self.assertEqual(receipt['attempts'],1)
        # Add forbidden public material only after the independently valid receipt fixture.
        receipt['reports'][0]['discovery']['value']={'name':secret}
        receipt['reports'][0]['exchanges'][0]['completeBody']=secret
        receipt['reports'][0]['exchanges'][0]['headers']['cache-control']=secret
        summary=once.public_summary(receipt,PROVENANCE,{}, {})
        raw=once.canonical(summary)
        self.assertNotIn(secret.encode(),raw)
        self.assertEqual(summary['reports'][0]['exchanges'][0]['authChallengeScheme'],'Bearer')
        self.assertFalse(summary['privateReceiptExported'])
        self.assertIsNone(summary['assessments']['score'])
        self.assertFalse(summary['publication']['eligible'])

    def test_default_preflight_and_cli_target_override_have_no_endpoint_network(self):
        result=subprocess.run([sys.executable,str(ROOT/'scripts/run_revenuecat_proof_once.py')],capture_output=True,env=dict(os.environ,SSL_CERT_FILE='owned-refusal-fixture'))
        self.assertEqual(result.returncode,1);self.assertEqual(json.loads(result.stdout)['networkRequests'],0)
        for flag in ('--url','--auth','--tool','--retry'):
            result=subprocess.run([sys.executable,str(ROOT/'scripts/run_revenuecat_proof_once.py'),flag,'owned-fixture'],capture_output=True)
            self.assertEqual(result.returncode,2)


if __name__=='__main__':unittest.main()
