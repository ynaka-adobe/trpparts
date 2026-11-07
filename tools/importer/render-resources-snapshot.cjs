// Fill the empty results list of the /resources/ import snapshot with every resource record.
// The source page loads the list client-side from its resources API, which the scrape can't
// reach, so the records are captured separately (migration-work/resources-records.json) and
// rendered here with the markup of the site's list template (scripts/templates/resourcesListTemplate.html).
// Each item also carries its Type and Brand (data-type / data-brand) for the importer's tag line.
//
// usage: node tools/importer/render-resources-snapshot.cjs <snapshot.html> <records.json>
const fs = require('fs');

const [snapshotFile, recordsFile] = process.argv.slice(2);
const ASSETS = 'https://assets.trpparts.com';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Video records hold youtu.be/<id>, youtube.com/watch?v=<id> or /embed/<id> URLs, sometimes with
// extra parameters or an encoded trailing space (e.g. kvguvSP_GdE%20).
function youTubeId(value) {
  const url = new URL(value.trim().replace(/&amp;/g, '&'));
  const id = url.hostname.endsWith('youtu.be')
    ? url.pathname.split('/')[1]
    : url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
  return decodeURIComponent(id).trim();
}

// YouTube answers 404 for the thumbnail of a removed or private video
async function hasThumbnail(src) {
  const resp = await fetch(src, { method: 'HEAD' }).catch(() => null);
  return Boolean(resp && resp.ok);
}

function renderItem(doc, thumbs) {
  const label = esc(doc.Label);
  const attrs = `class="resources-item" data-type="${esc(doc.Type)}" data-brand="${esc(doc.Brand)}"`;
  if (doc.Type === 'Videos') {
    const ytid = youTubeId(doc.Value);
    const watch = `https://www.youtube.com/watch?v=${esc(ytid)}`;
    const src = `https://img.youtube.com/vi/${esc(ytid)}/mqdefault.jpg`;
    const img = thumbs.has(src) ? `<a href="${watch}" class="video-modal-link"><img src="${src}" alt="${label} Image"></a>` : '';
    return `<div ${attrs}>
<h2><a href="${watch}" class="video-modal-link" data-href="https://www.youtube.com/embed/${esc(ytid)}?autoplay=1&amp;rel=0">${label}</a></h2>
<div class="row"><div class="col-xs-12 col-sm-4 col-md-2"><p>${img}</p></div>
<div class="col-xs-12 col-sm-8 col-md-10"><p>${esc(doc.Description)}</p><p><a href="${watch}" class="video-modal-link button">Watch Video</a></p></div></div>
</div>`;
  }
  const docUrl = esc(`${ASSETS}/raw/${encodeURI(doc.Value)}`);
  const thumb = /\.pdf/i.test(doc.Value)
    ? `<div class="col-xs-12 col-sm-4 col-md-2"><p><a href="${docUrl}" class="resource-image-parent"><img src="${esc(`${ASSETS}/thumbnail/${encodeURI(doc.Value)}`)}" alt="${label}"></a></p></div>`
    : '';
  const desc = doc.Description ? `<p>${esc(doc.Description)}</p>` : '';
  return `<div ${attrs}>
<h2><a href="${docUrl}">${label}</a></h2>
<div class="row">${thumb}
<div class="col-xs-12 col-sm-8 col-md-10">${desc}<p><a href="${docUrl}" class="button">Download</a></p></div></div>
</div>`;
}

(async () => {
  const html = fs.readFileSync(snapshotFile, 'utf8');
  const { docs } = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
  const open = '<div id="resources-container" class="resources-grid" style="">';
  const start = html.indexOf(open);
  if (start < 0) throw new Error('results list (#resources-container) not found in the snapshot');
  const end = html.indexOf('</div>', start + open.length);
  if (html.slice(start + open.length, end).trim()) throw new Error('results list is already filled; re-scrape the snapshot first');

  const videoThumbs = docs.filter((d) => d.Type === 'Videos')
    .map((d) => `https://img.youtube.com/vi/${esc(youTubeId(d.Value))}/mqdefault.jpg`);
  const thumbs = new Set();
  await Promise.all(videoThumbs.map(async (src) => { if (await hasThumbnail(src)) thumbs.add(src); }));

  const items = docs.map((d) => renderItem(d, thumbs)).join('\n');
  fs.writeFileSync(snapshotFile, `${html.slice(0, start + open.length)}\n${items}\n${html.slice(end)}`);
  console.log(`rendered ${docs.length} resources into ${snapshotFile} (${videoThumbs.length - thumbs.size} videos without a thumbnail)`);
})().catch((e) => { console.error(e.message); process.exit(1); });
