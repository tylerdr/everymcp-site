import { describe, expect, it } from 'vitest';
import { robotsPermission } from '../lib/monitoring/robots';
const check = (text: string, path = '/private') => robotsPermission(text, `https://github.com${path}`);
describe('conservative robots policy', () => {
  it('chooses the longest matching agent and merges equal groups', () => {
    const rules = 'User-agent: *\nDisallow: /\nUser-agent: EveryMCP\nDisallow: /private\nUser-agent: everymcp\nAllow: /private/open\n';
    expect(check(rules).state).toBe('robots_disallowed');
    expect(check(rules, '/private/open').state).toBe('allowed');
    expect(check(rules, '/other').state).toBe('allowed');
  });
  it('handles wildcard, end anchor, equal allow, and empty disallow', () => {
    const rules = 'User-agent: *\nDisallow: /a*end$\nAllow: /a*end$\nDisallow:\nDisallow: /secret';
    expect(check(rules, '/abcend').state).toBe('allowed');
    expect(check(rules, '/secret').state).toBe('robots_disallowed');
    expect(check('User-agent: *\nDisallow: /a*end$', '/abcend/more').state).toBe('allowed');
    expect(check('User-agent: *\nDisallow: /a*end$', '/abcend').state).toBe('robots_disallowed');
  });
  it('counts wildcard and end anchor in specificity', () => {
    for (const pattern of ['/abc*', '/abc$']) {
      expect(check(`User-agent: *\nDisallow: ${pattern}\nAllow: /abc`, '/abc').state).toBe('robots_disallowed');
    }
  });
  it('matches paths case sensitively and isolates unsupported groups', () => {
    expect(check('User-agent: *\nDisallow: /Private', '/private').state).toBe('allowed');
    expect(check('User-agent: Other\nVisit-time: 0100-0200\nUser-agent: *\nDisallow: /private').state).toBe('robots_disallowed');
    expect(check('User-agent: *\nVisit-time: 0100-0200').state).toBe('robots_unknown');
  });
  it('honors multiple user agents and pacing', () => {
    const rules = 'User-agent: Other\nUser-agent: EveryMCP-SourceMonitor\nCrawl-delay: 2.5\nRequest-rate: 2/10\nDisallow: /private';
    expect(check(rules)).toEqual({ state: 'robots_disallowed', minIntervalMs: 5000 });
  });
  it('fails closed for unsupported restrictions and malformed input', () => {
    for (const text of ['User-agent: *\nVisit-time: 0100-0200', 'User-agent: *\nDisallow: /a%2Fb', 'User-agent: *\nRequest-rate: 2/3h', 'User-agent: *\nDisallow: /\u0000', '<html>bad</html>', 'x'.repeat(65537), 'User-agent: *\nDisallow: /\ud800']) expect(check(text).state).toBe('robots_unknown');
  });
});
