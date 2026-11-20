"""Bounded static response projections. No fetching, execution or semantic inference."""
from collections import Counter
from datetime import datetime
import hashlib
from html.parser import HTMLParser
import json
import re

PROFILE = 'static-document-v1'
MAX_SECTIONS = 16
MAX_TOKENS = 20000
MAX_DEPTH = 128
MAX_WORDS = 24
MAX_FRAGMENT = 160
MEDIA = {'text/html', 'text/plain', 'text/markdown'}
STATES = {'captured', 'not_captured', 'incomplete', 'unsupported'}
REASONS = {'complete_static_projection', 'legacy_body_not_retained', 'body_unavailable',
           'unsupported_media_type', 'unsupported_encoding', 'invalid_utf8',
           'unsupported_charset', 'unsafe_text', 'malformed_markup', 'projection_limit', 'empty_document'}
OMISSIONS = {'script', 'style', 'comment', 'declaration'}
HEX = re.compile(r'^[a-f0-9]{64}$')
UNSAFE_TEXT = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]')


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def digest(value):
    return hashlib.sha256(value).hexdigest()


def identity(source):
    return digest(canonical({'url': source['url'], 'relationships': sorted(source['relationships'], key=canonical)}))


def clip(text, words):
    """Bound stored/rendered quotes without rewriting their characters."""
    matches = list(re.finditer(r'\S+', text))
    end = matches[min(words, len(matches)) - 1].end() if matches and words else 0
    value = text[:min(end, MAX_FRAGMENT)]
    return value, value != text, len(re.findall(r'\S+', value))


def unavailable(source, observation, state='not_captured', reason='legacy_body_not_retained'):
    return {'profileVersion': PROFILE, 'state': state, 'reason': reason,
            'sourceUrl': source['url'], 'sourceIdentity': identity(source),
            'bodyHash': observation['contentHash'], 'bodyObservedAt': None,
            'mediaType': None, 'projectionHash': None, 'sections': [], 'omissions': []}


class ProjectionLimit(ValueError): pass


class StaticHTML(HTMLParser):
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.sections, self.omissions = [], [], set()
        self.count = 0
        self.new_section('preamble', 0)

    def new_section(self, heading, level):
        if len(self.sections) >= MAX_SECTIONS: raise ProjectionLimit()
        self.sections.append({'heading': heading, 'level': level, 'tokens': [], 'text': []})

    def token(self, value):
        self.count += 1
        if self.count > MAX_TOKENS: raise ProjectionLimit()
        self.sections[-1]['tokens'].append(value)

    def handle_starttag(self, tag, attrs):
        if len(attrs) > 64 or any(len(k) > 256 or len(v or '') > 8192 for k, v in attrs): raise ProjectionLimit()
        if len({k for k, _ in attrs}) != len(attrs): raise ValueError('duplicate attributes')
        if any(UNSAFE_TEXT.search(k) or UNSAFE_TEXT.search(v or '') for k, v in attrs): raise ValueError('unsafe attributes')
        if len(self.stack) >= MAX_DEPTH: raise ProjectionLimit()
        if re.fullmatch(r'h[1-6]', tag): self.new_section('', int(tag[1]))
        self.token(['start', tag, sorted(attrs)])
        if tag not in self.VOID: self.stack.append(tag)
        if tag in ('script', 'style'): self.omissions.add(tag)

    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1] != tag: raise ValueError('unbalanced markup')
        self.stack.pop()
        self.token(['end', tag])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID: self.handle_endtag(tag)

    def handle_data(self, data):
        if any(tag in ('script', 'style') for tag in self.stack): return
        if UNSAFE_TEXT.search(data): raise ValueError('unsafe text')
        self.token(['text', data])
        if any(re.fullmatch(r'h[1-6]', tag) for tag in self.stack):
            self.sections[-1]['heading'] += data
        else:
            self.sections[-1]['text'].append(data)

    def handle_comment(self, _data): self.omissions.add('comment')
    def handle_decl(self, _decl): self.omissions.add('declaration')
    def handle_pi(self, _data): raise ValueError('processing instruction')
    def unknown_decl(self, _data): raise ValueError('unknown declaration')


def capture(body, headers, source, observation, previous=None):
    """Called only on bytes already obtained by the existing collector."""
    result = unavailable(source, observation)
    if observation['httpStatus'] == 304:
        prior = (previous or {}).get('lastSuccessfulObservation') or {}
        projection = prior.get('documentProjection')
        if projection is not None:
            validate(projection, prior, source)
            if prior['contentHash'] != observation['contentHash']: raise ValueError('304 body lineage mismatch')
            return json.loads(json.dumps(projection))
        return result
    if observation['state'] != 'reachable' or not observation['bodyComplete']:
        return {**result, 'state': 'incomplete', 'reason': 'body_unavailable'}
    result['bodyObservedAt'] = observation['checkedAt']
    content_type = headers.get('content-type', '')
    media = content_type.split(';', 1)[0].strip().lower()
    result['mediaType'] = media if media in MEDIA else None
    if media not in MEDIA: return {**result, 'state': 'unsupported', 'reason': 'unsupported_media_type'}
    if headers.get('content-encoding', 'identity').strip().lower() != 'identity':
        return {**result, 'state': 'unsupported', 'reason': 'unsupported_encoding'}
    parameters = [x.strip().lower() for x in content_type.split(';')[1:]]
    if any(x not in ('charset=utf-8', 'charset="utf-8"') for x in parameters):
        return {**result, 'state': 'unsupported', 'reason': 'unsupported_charset'}
    try: text = body.decode('utf-8')
    except UnicodeError: return {**result, 'state': 'unsupported', 'reason': 'invalid_utf8'}
    if UNSAFE_TEXT.search(text): return {**result, 'state': 'unsupported', 'reason': 'unsafe_text'}
    try:
        if media == 'text/html':
            parser = StaticHTML(); parser.feed(text)
            if parser.rawdata: raise ValueError('unfinished markup')
            parser.close()
            if parser.stack or parser.rawdata: raise ValueError('unfinished markup')
            parts, omissions = parser.sections, sorted(parser.omissions)
        else:
            parts = [{'heading': 'document', 'level': 0, 'tokens': [['text', text]], 'text': [text]}]
            omissions = []
    except ProjectionLimit: return {**result, 'state': 'incomplete', 'reason': 'projection_limit'}
    except ValueError: return {**result, 'state': 'unsupported', 'reason': 'malformed_markup'}
    if not any(''.join(p['text']).strip() or p['level'] and p['heading'].strip() for p in parts):
        return {**result, 'state': 'unsupported', 'reason': 'empty_document'}
    sections, counts, budget = [], Counter(), MAX_WORDS
    for part in parts:
        heading_key = digest(canonical([part['level'], part['heading']]))
        counts[heading_key] += 1
        key = f'{heading_key}:{counts[heading_key]}'
        heading, heading_cut, used = clip(part['heading'], min(6, budget)); budget -= used
        excerpt, excerpt_cut, used = clip(''.join(part['text']), min(12, budget)); budget -= used
        sections.append({'id': key, 'heading': heading, 'headingTruncated': heading_cut,
                         'excerpt': excerpt, 'excerptTruncated': excerpt_cut,
                         'contentHash': digest(canonical(part['tokens']))})
    projection_hash = digest(canonical({'sections': [{'id': s['id'], 'contentHash': s['contentHash']} for s in sections], 'omissions': omissions}))
    return {**result, 'state': 'captured', 'reason': 'complete_static_projection',
            'projectionHash': projection_hash, 'sections': sections, 'omissions': omissions}


def validate(value, observation, source=None):
    """Validate cache/import bindings as well as structural schema limits."""
    keys = {'profileVersion', 'state', 'reason', 'sourceUrl', 'sourceIdentity', 'bodyHash',
            'bodyObservedAt', 'mediaType', 'projectionHash', 'sections', 'omissions'}
    if not isinstance(value, dict) or set(value) != keys or value['profileVersion'] != PROFILE or value['state'] not in STATES or value['reason'] not in REASONS: raise ValueError('Invalid projection contract')
    if not isinstance(value['sourceUrl'], str) or not HEX.fullmatch(value['sourceIdentity']): raise ValueError('Invalid projection identity')
    if source is not None and (value['sourceUrl'] != source['url'] or value['sourceIdentity'] != identity(source)): raise ValueError('Projection source identity changed')
    if value['bodyHash'] != observation['contentHash']: raise ValueError('Projection body hash mismatch')
    if value['mediaType'] is not None and value['mediaType'] not in MEDIA: raise ValueError('Invalid projection media')
    if not isinstance(value['omissions'], list) or value['omissions'] != sorted(set(value['omissions'])) or not set(value['omissions']) <= OMISSIONS: raise ValueError('Invalid projection omissions')
    if not isinstance(value['sections'], list) or len(value['sections']) > MAX_SECTIONS: raise ValueError('Invalid projection sections')
    when = value['bodyObservedAt']
    if when is not None:
        time = datetime.fromisoformat(when.replace('Z', '+00:00'))
        observed = datetime.fromisoformat(observation['checkedAt'].replace('Z', '+00:00'))
        if time.tzinfo is None or time > observed or observation['httpStatus'] != 304 and time != observed: raise ValueError('Invalid projection capture date')
    if value['state'] != 'captured':
        if value['sections'] or value['projectionHash'] is not None or value['omissions']: raise ValueError('Unavailable projection contains content')
        if value['state'] == 'not_captured' and (value['reason'] != 'legacy_body_not_retained' or when is not None): raise ValueError('Invented legacy projection')
        if value['state'] == 'incomplete' and value['reason'] not in ('body_unavailable', 'projection_limit'): raise ValueError('Invalid incomplete reason')
        if value['state'] == 'unsupported' and value['reason'] not in REASONS - {'complete_static_projection', 'legacy_body_not_retained', 'body_unavailable', 'projection_limit'}: raise ValueError('Invalid unsupported reason')
        if value['reason'] == 'body_unavailable' and (observation['bodyComplete'] or when is not None): raise ValueError('Unavailable body cannot have a capture')
        if value['state'] == 'unsupported' or value['reason'] == 'projection_limit':
            if when is None or observation['state'] != 'reachable' or not observation['bodyComplete']: raise ValueError('Projection extraction needs a complete response')
        return
    if value['reason'] != 'complete_static_projection' or when is None or not observation['bodyComplete'] or observation['state'] != 'reachable' or not value['sections'] or value['mediaType'] not in MEDIA: raise ValueError('Incomplete projection cannot compare')
    ids, words = set(), 0
    for section in value['sections']:
        if not isinstance(section, dict) or set(section) != {'id', 'heading', 'headingTruncated', 'excerpt', 'excerptTruncated', 'contentHash'}: raise ValueError('Invalid section contract')
        if not isinstance(section['id'], str) or not re.fullmatch(r'[a-f0-9]{64}:[1-9][0-9]*', section['id']) or section['id'] in ids or not HEX.fullmatch(section['contentHash']): raise ValueError('Invalid section identity')
        ids.add(section['id'])
        for field in ('heading', 'excerpt'):
            text = section[field]
            if not isinstance(text, str) or len(text) > MAX_FRAGMENT or UNSAFE_TEXT.search(text) or type(section[field + 'Truncated']) is not bool: raise ValueError('Invalid bounded fragment')
            words += len(re.findall(r'\S+', text))
    if words > MAX_WORDS: raise ValueError('Projection quote budget exceeded')
    expected = digest(canonical({'sections': [{'id': s['id'], 'contentHash': s['contentHash']} for s in value['sections']], 'omissions': value['omissions']}))
    if value['projectionHash'] != expected: raise ValueError('Projection hash mismatch')
