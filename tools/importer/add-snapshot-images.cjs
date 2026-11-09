// Localize images a snapshot's capture missed (e.g. lazy images below the fold that never loaded):
// each trpparts.com image is downloaded through the Bright Data browser (the site is bot-protected)
// to content/media-da/<md5(url)>.<ext> and added to the snapshot's .images.json sidecar, as the
// scrape step does.
//
// usage: node tools/importer/add-snapshot-images.cjs <snapshot.html> <image-url> [<image-url>...]
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { chromium } = require('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-navigation-orchestrator/scripts/node_modules/playwright');

const [snapshot, ...images] = process.argv.slice(2);
const ROOT = path.resolve(__dirname, '../..');
const SIDECAR = snapshot.replace(/\.html$/, '.images.json');

(async () => {
  const browser = await chromium.connectOverCDP(process.env.BD_ENDPOINT, { timeout: 60000 });
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  try {
    await page.goto('https://www.trpparts.com/media-center/', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector('#mainContent', { timeout: 60000 });
    const sidecar = fs.existsSync(SIDECAR) ? JSON.parse(fs.readFileSync(SIDECAR, 'utf8')) : {};
    for (const url of images) {
      // eslint-disable-next-line no-await-in-loop
      const res = await page.evaluate(async (u) => {
        const r = await fetch(u);
        if (!r.ok) return { status: r.status };
        const buf = new Uint8Array(await r.arrayBuffer());
        let s = '';
        for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return { status: r.status, b64: btoa(s) };
      }, url);
      if (!res.b64) {
        console.warn(`${res.status} ${url}`);
        // eslint-disable-next-line no-continue
        continue;
      }
      const ext = (path.extname(new URL(url).pathname) || '.png').toLowerCase();
      const name = `${crypto.createHash('md5').update(url).digest('hex')}${ext}`;
      fs.writeFileSync(path.join(ROOT, 'content/media-da', name), Buffer.from(res.b64, 'base64'));
      sidecar[url] = `/media-da/${name}`;
      console.log(`200 ${url} -> /media-da/${name}`);
    }
    fs.writeFileSync(SIDECAR, `${JSON.stringify(sidecar, null, 2)}\n`);
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
