/** Conservative robots.txt subset for the public source collector. */
type Permission = { state: 'allowed' | 'robots_disallowed' | 'robots_unknown'; minIntervalMs: number };
type Group = { agents: string[]; rules: Array<{ allow: boolean; pattern: string }>; delay: number; unknown: boolean };
const UNKNOWN: Permission = { state: 'robots_unknown', minIntervalMs: 1000 };
const PRODUCT = 'everymcp-sourcemonitor';

// Dynamic programming avoids regular-expression backtracking on adversarial rules.
function matches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  if (anchored) pattern = pattern.slice(0, -1);
  let states = new Uint8Array(path.length + 1); states[0] = 1;
  for (const c of pattern) {
    const next = new Uint8Array(path.length + 1);
    if (c === '*') {
      let seen = false;
      for (let i = 0; i <= path.length; i++) { seen = seen || !!states[i]; if (seen) next[i] = 1; }
    } else {
      for (let i = 0; i < path.length; i++) if (states[i] && path[i] === c) next[i + 1] = 1;
    }
    states = next;
  }
  return anchored ? !!states[path.length] : states.some(Boolean);
}

export function robotsPermission(text: string, url: string): Permission {
  if (typeof text !== 'string' || typeof url !== 'string' || Buffer.byteLength(text, 'utf8') > 65536 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) || /<\s*\/?\s*(?:html|body|script|!doctype)\b/i.test(text)) return UNKNOWN;
  // Reject unpaired surrogate code units rather than silently replacing them with U+FFFD.
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text)) return UNKNOWN;
  let path: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || /[%\\\s]/.test(parsed.pathname) || !/^[\x21-\x7e]*$/.test(parsed.pathname)) return UNKNOWN;
    path = parsed.pathname || '/';
    if (path.length > 2048) return UNKNOWN;
  } catch { return UNKNOWN; }
  const lines = text.split(/\r\n|\n|\r/);
  if (lines.length > 4096 || lines.some(line => line.length > 2048)) return UNKNOWN;
  const groups: Group[] = [];
  let group: Group | undefined; let directives = false; let count = 0;
  for (const raw of lines) {
    const line = raw.split('#', 1)[0].trim();
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon <= 0) return UNKNOWN;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (!/^[a-z][a-z0-9_-]*$/.test(key) || ++count > 4096) return UNKNOWN;
    if (key === 'user-agent') {
      if (!value || !/^(?:\*|[A-Za-z0-9_-]+)$/.test(value)) return UNKNOWN;
      if (!group || directives) { group = { agents: [], rules: [], delay: 1000, unknown: false }; groups.push(group); directives = false; }
      group.agents.push(value.toLowerCase());
      continue;
    }
    if (key === 'sitemap') continue;
    if (!group) return UNKNOWN;
    directives = true;
    if (key === 'allow' || key === 'disallow') {
      if (!value) continue;
      // Encoded and non-ASCII patterns need octet normalization; fail closed for applicable groups.
      if (!value.startsWith('/') || /[^\x21-\x7e]|%|\\/.test(value) || /\$(?!$)/.test(value)) group.unknown = true;
      else group.rules.push({ allow: key === 'allow', pattern: value });
    } else if (key === 'crawl-delay') {
      if (!/^(?:\d+)(?:\.\d{1,3})?$/.test(value)) group.unknown = true;
      else { const ms = Number(value) * 1000; if (!Number.isSafeInteger(ms) || ms > 86400000) group.unknown = true; else group.delay = Math.max(group.delay, ms); }
    } else if (key === 'request-rate') {
      const match = /^(\d+)\s*\/\s*(\d+)$/.exec(value);
      if (!match) group.unknown = true;
      else { const requests = Number(match[1]), seconds = Number(match[2]); const ms = Math.ceil(seconds * 1000 / requests); if (!Number.isSafeInteger(requests) || !Number.isSafeInteger(seconds) || requests < 1 || seconds < 1 || !Number.isSafeInteger(ms) || ms > 86400000) group.unknown = true; else group.delay = Math.max(group.delay, ms); }
    } else group.unknown = true;
  }
  let best = 0;
  const scored = groups.map(g => ({ group: g, score: Math.max(0, ...g.agents.map(a => a === '*' ? 1 : PRODUCT.includes(a) ? a.length + 1 : 0)) }));
  for (const item of scored) best = Math.max(best, item.score);
  if (!best) return { state: 'allowed', minIntervalMs: 1000 };
  const active = scored.filter(x => x.score === best).map(x => x.group);
  const delay = Math.max(...active.map(x => x.delay));
  if (active.some(x => x.unknown)) return { state: 'robots_unknown', minIntervalMs: delay };
  const rules = active.flatMap(x => x.rules);
  if (rules.reduce((sum, rule) => sum + rule.pattern.length * (path.length + 1), 0) > 2_000_000) return { state: 'robots_unknown', minIntervalMs: delay };
  let length = -1; let allowed = true;
  for (const rule of rules) {
    if (!matches(rule.pattern, path)) continue;
    const specificity = rule.pattern.length;
    if (specificity > length || (specificity === length && rule.allow)) { length = specificity; allowed = rule.allow; }
  }
  return { state: allowed ? 'allowed' : 'robots_disallowed', minIntervalMs: delay };
}
