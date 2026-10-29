"""Local rendering acceptance only; public production checks use separate verified HTTP."""
import hashlib,json,xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime,timezone
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:3100'
GUIDE='/blog/mcp-servers-for-web-scraping'
OUT=Path('/workspace/monetization-validation')
expected=Path('public/samples/web-retrieval-evaluation.md').read_bytes()
receipt={'checkedAt':datetime.now(timezone.utc).isoformat(),'base':BASE,'scope':'Local Chromium and local dev server; no production browser or payment acceptance.'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 errors=[]
 results=[]
 for js in [True,False]:
  c=b.new_context(java_script_enabled=js,accept_downloads=True,viewport={'width':390,'height':844})
  c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname=='127.0.0.1' else r.abort())
  page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  for slug in ['browser-automation','web-search-research']:
   assert page.goto(BASE+'/category/'+slug,wait_until='networkidle').status==200
   box=page.get_by_role('complementary',name='Choose how your agent reads the web')
   assert box.is_visible()
   assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
   link=box.get_by_role('link',name='Download the free worksheet',exact=True)
   link.focus()
   with page.expect_download() as task:page.keyboard.press('Enter')
   assert Path(task.value.path()).read_bytes()==expected
   link=box.get_by_role('link',name='Read the web retrieval guide',exact=True)
   link.focus();page.keyboard.press('Enter');page.wait_for_url('**'+GUIDE)
   assert page.locator('h1').is_visible()
   page.get_by_role('link',name='Review the starter kit sample and price').click()
   page.wait_for_url('**/pricing#kit-preview')
   assert page.locator('#kit-preview').is_visible()
   assert page.get_by_text('Checkout is temporarily closed',exact=False).is_visible()
   results.append({'category':slug,'javaScript':js,'mobileNoOverflow':True,'keyboardDownloadBytes':len(expected),'guideToSample':True,'checkoutClosed':True})
  page.goto(BASE+'/category/databases',wait_until='networkidle')
  assert page.get_by_role('complementary',name='Choose how your agent reads the web').count()==0
  c.close()
 c=b.new_context(viewport={'width':1440,'height':1000})
 page=c.new_page();page.goto(BASE+'/category/browser-automation',wait_until='networkidle')
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
 page.screenshot(path=str(OUT/'discovery-desktop.png'),full_page=True)
 response=c.request.get(BASE+'/sitemap.xml');assert response.status==200
 root=ET.fromstring(response.text());ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
 urls=[e.find('s:loc',ns).text for e in root]
 assert len(urls)==len(set(urls))==644
 assert sum('/mcp/' in u for u in urls)==616
 for path in ['/blog',GUIDE]:
  entry=next(e for e in root if e.find('s:loc',ns).text=='https://everymcp.com'+path)
  assert entry.find('s:lastmod',ns).text=='2026-10-28T00:00:00.000Z'
 assert not any('/checkout/' in u or '/buyer/' in u for u in urls)
 assert not errors,errors
 receipt.update(browser=b.version,cases=results,unrelatedCategoryUnaffected=True,sitemapUniqueUrls=len(urls),listingUrls=616,reviewedEditorialDates=True,pageErrors=errors,worksheetSha256=hashlib.sha256(expected).hexdigest())
 b.close()
Path('documents/discovery-2026-10-29/local-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt,indent=2))
