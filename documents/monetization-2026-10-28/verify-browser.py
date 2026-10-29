"""Focused local browser check. Does not call providers or payment endpoints."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3001'
GUIDE = '/blog/mcp-servers-for-web-scraping'
OUT = Path('/workspace/monetization-validation')
OUT.mkdir(exist_ok=True)
expected = Path('public/samples/web-retrieval-evaluation.md').read_bytes()
receipt = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'base': BASE,
           'scope': 'Local Chromium, synthetic analytics sink; no backend receipt, provider execution, payment or paid download proof.'}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1280, 'height': 900}, accept_downloads=True)
    # Keep all browser traffic local, including optional analytics scripts.
    context.route('**/*', lambda route: route.continue_() if urlparse(route.request.url).hostname == '127.0.0.1' else route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    response = page.goto(BASE + GUIDE, wait_until='networkidle')
    assert response.status == 200
    assert page.locator('h1').count() == 1
    assert page.locator('link[rel="canonical"]').get_attribute('href') == 'https://everymcp.com' + GUIDE
    article = json.loads(page.locator('article script[type="application/ld+json"]').text_content())
    assert article['dateModified'] == '2026-10-28'
    assert article['url'] == 'https://everymcp.com' + GUIDE
    assert page.get_by_text('Commercial disclosure:', exact=False).count() == 1
    assert 'The $49 MCP Integration Starter Kit' in page.locator('article').inner_text()
    links = page.locator('article a').evaluate_all('(items) => items.map(a => a.getAttribute("href"))')
    internal = sorted({href for href in links if href.startswith('/')})
    statuses = {}
    for href in internal:
        result = context.request.get(BASE + href)
        assert result.status == 200, (href, result.status)
        statuses[href] = result.status
    for href in links:
        if href.startswith('https:'):
            assert not urlparse(href).query, href
    assert page.locator('button').filter(has_text='Download').count() == 0
    page.evaluate('window.__editorialEvents = []; window.va = (kind, data) => window.__editorialEvents.push({kind, data})')
    download_link = page.get_by_role('link', name='Download the free evaluation worksheet', exact=True)
    download_link.focus()
    with page.expect_download() as task:
        page.keyboard.press('Enter')
    download = task.value
    assert download.suggested_filename == 'web-retrieval-evaluation.md'
    assert Path(download.path()).read_bytes() == expected
    assert page.url == BASE + GUIDE
    page.screenshot(path=str(OUT / 'guide-desktop.png'), full_page=True)
    offer = page.get_by_role('link', name='Review the starter kit sample and price', exact=True)
    offer.focus()
    page.keyboard.press('Enter')
    page.wait_for_url('**/pricing#kit-preview')
    assert page.locator('#kit-preview').is_visible()
    assert page.get_by_text('Checkout is temporarily closed', exact=False).count() == 1
    events = page.evaluate('window.__editorialEvents')
    relevant = [e for e in events if isinstance(e.get('data'), dict) and e['data'].get('name') == 'web_retrieval_resource_clicked']
    assert [e['data']['data'] for e in relevant] == [
        {'article': 'web-scraping', 'resource': 'worksheet'},
        {'article': 'web-scraping', 'resource': 'offer'}
    ], relevant
    page.goto(BASE + GUIDE, wait_until='networkidle')
    page.evaluate('() => { window.va = () => { throw new Error("Synthetic telemetry outage") } }')
    page.get_by_role('link', name='Build a free starting stack', exact=True).click()
    page.wait_for_url('**/plan')
    assert page.get_by_label('What do you want to accomplish?').count() or page.locator('#stack-goal').count()
    page.set_viewport_size({'width': 390, 'height': 844})
    page.goto(BASE + GUIDE, wait_until='networkidle')
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(OUT / 'guide-mobile.png'), full_page=True)
    assert not errors, errors
    static_context = browser.new_context(java_script_enabled=False, accept_downloads=True)
    static_page = static_context.new_page()
    static_page.goto(BASE + GUIDE)
    with static_page.expect_download() as task:
        static_page.get_by_role('link', name='Download the free evaluation worksheet').click()
    assert Path(task.value.path()).read_bytes() == expected
    static_page.get_by_role('link', name='Review the starter kit sample and price').click()
    static_page.wait_for_url('**/pricing#kit-preview')
    receipt.update(browser=browser.version, pageStatus=response.status, links=statuses,
                   canonical=article['url'], worksheetSha256=hashlib.sha256(expected).hexdigest(),
                   downloadBytes=len(expected), keyboardDownload=True, keyboardOfferNavigation=True,
                   offerAnchor=True, checkoutClosed=True, noJavaScriptDownloadAndOffer=True,
                   mobileNoHorizontalOverflow=True, pageErrors=errors,
                   syntheticEvents=[e['data']['data'] for e in relevant], telemetryFailureNavigation=True,
                   screenshots=['/workspace/monetization-validation/guide-desktop.png', '/workspace/monetization-validation/guide-mobile.png'])
    browser.close()
Path('documents/monetization-2026-10-28/browser-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
