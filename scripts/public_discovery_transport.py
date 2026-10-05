#!/usr/bin/env python3
"""Candidate direct HTTPS transport. No URL/proxy/auth/redirect/resource expansion."""
import ipaddress
import os
import re
import signal
import socket
import ssl
import subprocess
import sys
import threading
from contextlib import contextmanager
import discovery_contract as contract

MAX_HEADERS = 8192
MAX_BODY = 65536
MAX_FRAMING = 8192
REQUEST_SECONDS = 8.0
HOST = 'mcp.revenuecat.ai'
PATH = '/mcp'
URL = 'https://' + HOST + PATH

METHODS = {contract.VERSIONS[0]: {'server/discover': 1, 'tools/list': 2, 'resources/list': 3},
           contract.VERSIONS[1]: {'initialize': 1, 'notifications/initialized': 2, 'tools/list': 3, 'resources/list': 4}}


def request_bytes(version, method):
    if version not in METHODS or method not in METHODS[version]: raise ValueError('disabled_method_or_profile')
    message = contract.request(version, method, METHODS[version][method])
    params = message.get('params', {})
    identity = params.get('clientInfo') if method == 'initialize' else params.get('_meta', {}).get(contract.META_PREFIX + 'clientInfo')
    if identity is not None: identity['name'] = 'EveryMCPPublicDeclarationObserver'
    return contract.canonical(message)


def request_headers(version, method, session=None):
    request_bytes(version, method)
    headers = {'Host': HOST, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream',
               'Accept-Encoding': 'identity', 'Origin': 'https://everymcp.com',
               'User-Agent': 'EveryMCPDeclarationObserver/1 (+https://everymcp.com/methodology)'}
    if method != 'initialize': headers['MCP-Protocol-Version'] = version
    if version == contract.VERSIONS[0]: headers['Mcp-Method'] = method
    if session is not None:
        if version != contract.VERSIONS[1] or method == 'initialize': raise ValueError('session_refused')
        if not isinstance(session, str) or not 0 < len(session) <= 256 or any(not 33 <= ord(c) <= 126 for c in session):
            raise ValueError('invalid_legacy_session')
        headers['Mcp-Session-Id'] = session
    return headers


@contextmanager
def deadline(seconds):
    if threading.current_thread() is not threading.main_thread() or not 0 < seconds <= REQUEST_SECONDS:
        raise ValueError('invalid_deadline_context')
    old_handler = signal.getsignal(signal.SIGALRM)
    old_timer = signal.getitimer(signal.ITIMER_REAL)
    if old_timer[0] or old_timer[1]:
        raise ValueError('nested_deadline_refused')
    def expired(*_):
        raise TimeoutError('request_deadline')
    signal.signal(signal.SIGALRM, expired)
    signal.setitimer(signal.ITIMER_REAL, seconds)
    try:
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, old_handler)


def public_ip(value):
    if not isinstance(value, str): return False
    try:
        ip = ipaddress.ip_address(value)
    except ValueError:
        return False
    if '%' in value or not ip.is_global or ip.is_multicast or ip.is_reserved:
        return False
    if ip.version == 4:
        return value != '168.63.129.16'  # Azure platform virtual address, not a target.
    return (ip in ipaddress.ip_network('2000::/3') and not ip.ipv4_mapped and
            not ip.sixtofour and not ip.teredo)


def resolve_native(host):
    """Child-only libc call; the parent cancels this process at its deadline."""
    if host != HOST:
        raise ValueError('host_not_allowlisted')
    answers = socket.getaddrinfo(host, 443, socket.AF_UNSPEC, socket.SOCK_STREAM, socket.IPPROTO_TCP)
    if not 0 < len(answers) <= 8:
        raise ValueError('dns_answer_limit')
    addresses = set()
    for family, kind, protocol, _name, address in answers:
        if (family not in (socket.AF_INET, socket.AF_INET6) or kind != socket.SOCK_STREAM or
                protocol != socket.IPPROTO_TCP or address[1] != 443 or not public_ip(address[0]) or
                (family == socket.AF_INET6 and (address[2] != 0 or address[3] != 0))):
            raise ValueError('non_public_dns')
        ip = ipaddress.ip_address(address[0])
        if (family == socket.AF_INET) != (ip.version == 4):
            raise ValueError('invalid_dns_family')
        addresses.add((family, str(ip)))
    return sorted(addresses)


def resolve(host):
    if host != HOST:
        raise ValueError('host_not_allowlisted')
    remaining = signal.getitimer(signal.ITIMER_REAL)[0]
    timeout = min(REQUEST_SECONDS, remaining) if remaining else REQUEST_SECONDS
    child = subprocess.Popen([sys.executable, os.path.abspath(__file__), '--fixed-host-dns'],
                             stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    try:
        raw, _ = child.communicate(timeout=timeout)
        if child.returncode or len(raw) > 1024:
            raise ValueError('dns_failure')
        value = contract.strict_json(raw)
        if not isinstance(value, list) or not 0 < len(value) <= 8:
            raise ValueError('dns_answer_limit')
        addresses = []
        for entry in value:
            if (not isinstance(entry, list) or len(entry) != 2 or
                    entry[0] not in (socket.AF_INET, socket.AF_INET6) or not public_ip(entry[1]) or
                    (entry[0] == socket.AF_INET) != (ipaddress.ip_address(entry[1]).version == 4)):
                raise ValueError('non_public_dns')
            addresses.append(tuple(entry))
        return sorted(set(addresses))
    except subprocess.TimeoutExpired as exc:
        raise TimeoutError('request_deadline') from exc
    finally:
        if child.poll() is None:
            child.kill()
        try:
            child.wait(timeout=.25)
        except subprocess.TimeoutExpired as exc:
            raise ValueError('resolver_cleanup_incomplete') from exc
        if child.stdout is not None:
            child.stdout.close()


def peer_matches(sock, selected):
    peer = sock.getpeername()
    if peer[1] != 443 or str(ipaddress.ip_address(peer[0])) != selected:
        raise ValueError('peer_pin_mismatch')


def connect(addresses, timeout, trace):
    if any(key in os.environ for key in ('SSL_CERT_FILE', 'SSL_CERT_DIR', 'SSLKEYLOGFILE')):
        raise ValueError('custom_tls_environment_refused')
    context = ssl.create_default_context()
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    if not context.check_hostname or context.verify_mode != ssl.CERT_REQUIRED:
        raise ValueError('tls_verification_required')
    family, selected = addresses[0]
    trace.update(resolvedAddresses=[ip for _, ip in addresses], selectedAddress=selected)
    sock = socket.socket(family, socket.SOCK_STREAM, socket.IPPROTO_TCP)
    sock.settimeout(timeout)
    try:
        # Literal address and one socket: no create_connection, retries or re-resolution.
        sock.connect((selected, 443) if family == socket.AF_INET else (selected, 443, 0, 0))
        peer_matches(sock, selected)
        secure = context.wrap_socket(sock, server_hostname=HOST)
        try:
            peer_matches(secure, selected)
            trace.update(tlsHostnameVerified=True, peerPinned=True)
            return secure
        except BaseException:
            secure.close()
            raise
    except BaseException:
        sock.close()
        raise


class Wire:
    def __init__(self, sock):
        self.sock, self.buffer = sock, b''
        self.received = self.header_bytes = self.framing_bytes = 0
        self.body = bytearray()

    def receive(self, maximum=4096):
        raw = self.sock.recv(min(maximum, MAX_HEADERS + MAX_BODY + MAX_FRAMING + 1 - self.received))
        self.received += len(raw)
        if self.received > MAX_HEADERS + MAX_BODY + MAX_FRAMING:
            raise ValueError('wire_limit')
        self.buffer += raw
        return bool(raw)

    def line(self, kind, limit):
        while b'\r\n' not in self.buffer:
            maximum = min(4096, limit - len(self.buffer) + 1)
            if kind == 'headers': maximum = min(maximum, MAX_HEADERS - self.header_bytes - len(self.buffer) + 1)
            if maximum <= 0 or not self.receive(maximum):
                raise ValueError('truncated_or_oversized_line')
        at = self.buffer.index(b'\r\n') + 2
        if at > limit:
            raise ValueError('line_limit')
        line, self.buffer = self.buffer[:at], self.buffer[at:]
        if kind == 'headers':
            self.header_bytes += at
            if self.header_bytes > MAX_HEADERS: raise ValueError('header_limit')
        else:
            self.framing_bytes += at
            if self.framing_bytes > MAX_FRAMING: raise ValueError('framing_limit')
        return line

    def exact(self, size, body=False):
        pieces = bytearray()
        while len(pieces) < size:
            if not self.buffer and not self.receive(): raise ValueError('truncated_body')
            take = min(size - len(pieces), len(self.buffer))
            part, self.buffer = self.buffer[:take], self.buffer[take:]
            pieces.extend(part)
            if body:
                self.body.extend(part)
                if len(self.body) > MAX_BODY: raise ValueError('body_limit')
        return bytes(pieces)

    def eof(self):
        if self.buffer or self.receive(): raise ValueError('extra_response_bytes')

    def read_headers(self):
        status_line = self.line('headers', MAX_HEADERS)
        match = re.fullmatch(rb'HTTP/1\.[01] ([1-5][0-9]{2})(?: [\x20-\x7e]*)?\r\n', status_line)
        if not match: raise ValueError('invalid_status_line')
        headers, raw = {}, bytearray(status_line)
        while True:
            line = self.line('headers', MAX_HEADERS)
            raw.extend(line)
            if line == b'\r\n': break
            match = re.fullmatch(rb"([!#$%&'*+.^_`|~0-9A-Za-z-]+):[ \t]*([\x20-\x7e\t]*)\r\n", line)
            if not match: raise ValueError('invalid_header')
            key = match[1].decode('ascii').lower()
            if key in headers: raise ValueError('duplicate_header')
            headers[key] = match[2].decode('ascii').strip()
        return int(status_line.split(b' ')[1]), headers, bytes(raw)

    def read_body(self, headers):
        if headers.get('content-encoding', 'identity').lower() != 'identity':
            raise ValueError('encoded_body_refused')
        length = headers.get('content-length')
        transfer = headers.get('transfer-encoding')
        if length is not None and transfer is not None: raise ValueError('ambiguous_body_framing')
        if length is not None:
            if not re.fullmatch(r'[0-9]{1,8}', length) or int(length) > MAX_BODY:
                raise ValueError('body_limit')
            self.exact(int(length), body=True)
        elif transfer is not None:
            if transfer.lower() != 'chunked': raise ValueError('unsupported_transfer_encoding')
            while True:
                line = self.line('framing', 256)
                if not re.fullmatch(rb'[0-9a-fA-F]{1,8}\r\n', line): raise ValueError('unsupported_chunk_framing')
                size = int(line[:-2], 16)
                if size > MAX_BODY - len(self.body): raise ValueError('body_limit')
                if not size:
                    if self.line('framing', MAX_HEADERS) != b'\r\n': raise ValueError('trailers_refused')
                    break
                self.exact(size, body=True)
                if self.line('framing', 2) != b'\r\n': raise ValueError('invalid_chunk_terminator')
        else:
            while self.buffer or self.receive():
                size = len(self.buffer)
                if size > MAX_BODY - len(self.body): raise ValueError('body_limit')
                self.exact(size, body=True)
        self.eof()
        return bytes(self.body)


def post(body, headers, timeout, trace):
    """Only called behind the disabled coordinator gate; exact authority is fixed here."""
    allowed = {'Host', 'Content-Type', 'Accept', 'Accept-Encoding', 'Origin', 'User-Agent',
               'MCP-Protocol-Version', 'Mcp-Method', 'Mcp-Session-Id'}
    if (set(headers) - allowed or headers.get('Host') != HOST or len(body) > 4096 or
            headers.get('Content-Type') != 'application/json' or
            headers.get('Accept') != 'application/json, text/event-stream' or
            headers.get('Accept-Encoding') != 'identity' or headers.get('Origin') != 'https://everymcp.com'):
        raise ValueError('request_policy_rejected')
    if any(not isinstance(v, str) or not 0 < len(v) <= 256 or any(not 32 <= ord(c) < 127 for c in v) for v in headers.values()):
        raise ValueError('request_header_rejected')
    message = contract.strict_json(body)
    if not isinstance(message, dict): raise ValueError('request_policy_rejected')
    method = message.get('method')
    params = message.get('params', {})
    if not isinstance(params, dict): raise ValueError('request_policy_rejected')
    version = params.get('protocolVersion') if method == 'initialize' else headers.get('MCP-Protocol-Version')
    if body != request_bytes(version, method) or headers != request_headers(version, method, headers.get('Mcp-Session-Id')):
        raise ValueError('request_policy_rejected')
    if any(key in os.environ for key in ('SSL_CERT_FILE', 'SSL_CERT_DIR', 'SSLKEYLOGFILE')):
        raise ValueError('custom_tls_environment_refused')
    sock = wire = None
    with deadline(timeout):
        try:
            addresses = resolve(HOST)
            sock = connect(addresses, timeout, trace)
            wire = Wire(sock)
            head = 'POST ' + PATH + ' HTTP/1.1\r\n'
            head += ''.join(k + ': ' + v + '\r\n' for k, v in headers.items())
            head += 'Connection: close\r\nContent-Length: ' + str(len(body)) + '\r\n\r\n'
            sock.sendall(head.encode('ascii') + body)
            status, response_headers, raw_headers = wire.read_headers()
            trace.update(httpStatus=status, responseHeaderSha256=contract.sha(raw_headers), responseHeaderBytes=len(raw_headers))
            # Auth/redirect/error responses carry no retained body or derived request.
            try:
                response_body = wire.read_body(response_headers) if status in (200, 202) else None
                return status, response_headers, raw_headers, response_body
            finally:
                trace.update(capturedBytes=len(wire.body), receivedWireBytes=wire.received)
        finally:
            if wire is not None:
                trace.update(capturedBytes=len(wire.body), receivedWireBytes=wire.received,
                             responseFramingBytes=wire.framing_bytes)
            if sock is not None: sock.close()


if __name__ == '__main__':
    # No input URL/host/env override. The sole child task emits at most eight public literals.
    if sys.argv[1:] != ['--fixed-host-dns']:
        raise SystemExit(2)
    try:
        print(contract.canonical(resolve_native(HOST)).decode(), end='')
    except (OSError, ValueError):
        raise SystemExit(1)
