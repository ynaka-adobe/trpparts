// Fill the Articles / Press Releases import snapshot with every year's items.
// On trpparts.com these listings show one year per page load (?year=YYYY); the migrated page authors
// all of them in one cards-articles block that switches years in the page. Through the Bright Data
// browser, each year view is loaded, its li.media-item markup collected (in year order, newest first,
// each tagged data-year), and the snapshot's .media-center list replaced with all of them. The item
// thumbnails are downloaded in the page (the site is bot-protected) to content/media-da/<md5(url)>.<ext>
// and added to the snapshot's .images.json sidecar, as the scrape step does for page images.
//
// usage: node tools/importer/render-media-list-snapshot.cjs <articles|press-releases>
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { chromium } = require('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-navigation-orchestrator/scripts/node_modules/playwright');

const list = process.argv[2];
const ROOT = path.resolve(__dirname, '../..');
const SNAP = path.join(ROOT, `tools/importer/bd-snapshots/www.trpparts.com/media-center/${list}.html`);
const SIDECAR = SNAP.replace(/\.html$/, '.images.json');
const MEDIA = path.join(ROOT, 'content/media-da');
const ORIGIN = 'https://www.trpparts.com';

const gotoList = async (page, url) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
    // eslint-disable-next-line no-await-in-loop
    if (await page.waitForSelector('#mainContent .filter-nav', { timeout: 45000 }).then(() => true).catch(() => false)) return;
  }
  throw new Error(`could not load ${url}`);
};

(async () => {
  const browser = await chromium.connectOverCDP(process.env.BD_ENDPOINT, { timeout: 60000 });
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  try {
    await gotoList(page, `${ORIGIN}/media-center/${list}/`);
    const years = await page.$$eval('.filter-nav li a', (as) => as.map((a) => new URL(a.href).searchParams.get('year')).filter(Boolean));
    const items = [];
    for (const year of years) {
      // eslint-disable-next-line no-await-in-loop
      await gotoList(page, `${ORIGIN}/media-center/${list}/?year=${year}`);
      // eslint-disable-next-line no-await-in-loop
      const html = await page.$$eval('.media-center li.media-item', (lis, y) => lis.map((li) => {
        li.setAttribute('data-year', y);
        return li.outerHTML;
      }), year);
      if (!html.length) throw new Error(`no items for ${year}`);
      console.log(list, year, html.length);
      items.push(...html);
    }

    // thumbnails: fetch in the page (same origin, past the bot check), save under content/media-da
    const srcs = [...new Set(items.flatMap((h) => [...h.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1])))];
    const sidecar = fs.existsSync(SIDECAR) ? JSON.parse(fs.readFileSync(SIDECAR, 'utf8')) : {};
    for (const src of srcs) {
      const abs = new URL(src.replace(/&amp;/g, '&'), ORIGIN).href;
      // eslint-disable-next-line no-continue
      if (sidecar[abs]) continue;
      // eslint-disable-next-line no-await-in-loop
      const b64 = await page.evaluate(async (u) => {
        const r = await fetch(u);
        if (!r.ok) return null;
        const buf = new Uint8Array(await r.arrayBuffer());
        let s = '';
        for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return btoa(s);
      }, abs);
      if (!b64) {
        console.warn('image not fetched:', abs);
        // eslint-disable-next-line no-continue
        continue;
      }
      const ext = (path.extname(new URL(abs).pathname) || '.png').toLowerCase();
      const name = `${crypto.createHash('md5').update(abs).digest('hex')}${ext}`;
      fs.writeFileSync(path.join(MEDIA, name), Buffer.from(b64, 'base64'));
      sidecar[abs] = `/media-da/${name}`;
    }
    fs.writeFileSync(SIDECAR, `${JSON.stringify(sidecar, null, 2)}\n`);

    // replace the snapshot's (current-year) list with all years
    const snap = fs.readFileSync(SNAP, 'utf8');
    const start = snap.indexOf('<div class="media-center">');
    const ulStart = snap.indexOf('<ul', start);
    const ulEnd = snap.indexOf('</ul>', ulStart);
    if (start < 0 || ulStart < 0 || ulEnd < 0) throw new Error('media-center list not found in snapshot');
    const out = `${snap.slice(0, ulStart)}<ul>\n${items.join('\n')}\n${snap.slice(ulEnd)}`;
    fs.writeFileSync(SNAP, out);
    console.log(`${list}: ${items.length} items, ${srcs.length} thumbnails`);
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
