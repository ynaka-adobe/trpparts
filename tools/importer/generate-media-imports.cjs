// Generate tools/importer/import-media-{article,listing,downloads}.js (and urls-*.txt) from page-templates.json,
// following the shape of import-local-deals.js (same transformers, template embedded verbatim).
const fs = require('fs');

const root = __dirname;
const doc = JSON.parse(fs.readFileSync(`${root}/page-templates.json`, 'utf8'));
const camel = (n) => `${n.replace(/-([a-z])/g, (m, c) => c.toUpperCase())}Parser`;

const META = {
  'media-article': `    // the trail the source shows: "Home › Media › <short page name>" (the year folder has no page)
    meta.breadcrumbs = 'true';
    meta['breadcrumb-parent'] = 'Media';
    if (crumb) meta['breadcrumb-title'] = crumb;
    // article typography and image placement are scoped to this template (body.media-article)
    meta.template = 'media-article';
    // images the source floats right of the text (inline style, which authoring can't keep):
    // their positions among the article's images, e.g. "1"
    if (floated.length) meta['image-float'] = floated.join(', ');`,
  'media-listing': `    // "Home › Media › Articles"
    meta.breadcrumbs = 'true';
    meta['breadcrumb-parent'] = 'Media';`,
  'media-downloads': `    // the source page has the site's generic title; the trail shows "Home › Media › TRP Downloads"
    meta.Title = 'TRP Downloads';
    meta.breadcrumbs = 'true';
    meta['breadcrumb-parent'] = 'Media';
    meta['breadcrumb-title'] = crumb || 'TRP Downloads';
    // the downloads list is laid out as rows on this page (body.media-downloads)
    meta.template = 'media-downloads';`,
};

['media-article', 'media-listing', 'media-downloads'].forEach((name) => {
  const t = doc.templates.find((x) => x.name === name);
  const parsers = t.blocks.map((b) => b.name);
  parsers.forEach((p) => { if (!fs.existsSync(`${root}/parsers/${p}.js`)) throw new Error(`missing parser ${p}`); });
  const js = `/* eslint-disable */
/* global WebImporter */

${parsers.map((p) => `import ${camel(p)} from './parsers/${p}.js';`).join('\n')}
import trppartsCleanupTransformer from './transformers/trpparts-cleanup.js';
import trppartsSectionsTransformer from './transformers/trpparts-sections.js';

const PAGE_TEMPLATE = ${JSON.stringify(t, null, 2)};

const parsers = {
${parsers.map((p) => `  '${p}': ${camel(p)},`).join('\n')}
};

const transformers = [
  trppartsCleanupTransformer,
  trppartsSectionsTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try {
      fn(hookName, element, enhancedPayload);
    } catch (e) {
      console.error(\`Transformer failed at \${hookName}:\`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // the source breadcrumb's last item (a short page name), read before the cleanup removes it
    const crumb = (document.querySelector('nav.breadcrumbs li.active')?.textContent || '').replace(/\\s+/g, ' ').trim();
    // positions (1-based) of the article images the source floats right, read before cleanup
    const floated = [...document.querySelectorAll('.article-detail-content img, .press-release-detail-content img')]
      .filter((img) => !/\\/media\\/2944\\/morethanparts\\.png$/.test(img.getAttribute('src') || ''))
      .map((img, i) => (/float:\\s*right/i.test(img.getAttribute('style') || '') ? i + 1 : 0))
      .filter(Boolean);

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try {
        parser(block.element, { document, url, params });
      } catch (e) {
        console.error(\`Failed to parse \${block.name} (\${block.selector}):\`, e);
      }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
${META[name]}
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // a folder URL (/media-center/articles/) is served by its index page on Edge Delivery
    const { pathname } = new URL(params.originalURL);
    const rawPath = pathname
      .replace(/\\/$/, pathname.length > 1 ? '/index' : '')
      .replace(/\\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
`;
  fs.writeFileSync(`${root}/import-${name}.js`, js);
  fs.writeFileSync(`${root}/urls-${name}.txt`, `${t.urls.join('\n')}\n`);
  console.log(name, parsers.join(','), t.urls.length);
});
