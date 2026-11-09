/* eslint-disable */
/* global WebImporter */

import cardsDownloadsParser from './parsers/cards-downloads.js';
import columnsRetailerParser from './parsers/columns-retailer.js';
import trppartsCleanupTransformer from './transformers/trpparts-cleanup.js';
import trppartsSectionsTransformer from './transformers/trpparts-sections.js';

const PAGE_TEMPLATE = {
  "name": "media-downloads",
  "urls": [
    "https://www.trpparts.com/media-center/trp-downloads/"
  ],
  "representativeUrl": "https://www.trpparts.com/media-center/trp-downloads/",
  "description": "Media center TRP Downloads: wallpapers, calendar and checklists to download, Where To Buy strip",
  "blocks": [
    {
      "name": "cards-downloads",
      "instances": [
        "ul.media-items.featured-downloads"
      ]
    },
    {
      "name": "columns-retailer",
      "instances": [
        "section.retailer-search"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Downloads",
      "selector": [
        "section.subpage-content"
      ],
      "style": null,
      "blocks": [
        "cards-downloads"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Where To Buy / Buy Online",
      "selector": [
        "section.retailer-search"
      ],
      "style": "red",
      "blocks": [
        "columns-retailer"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'cards-downloads': cardsDownloadsParser,
  'columns-retailer': columnsRetailerParser,
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
      console.error(`Transformer failed at ${hookName}:`, e);
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
    const crumb = (document.querySelector('nav.breadcrumbs li.active')?.textContent || '').replace(/\s+/g, ' ').trim();
    // positions (1-based) of the article images the source floats right, read before cleanup
    const floated = [...document.querySelectorAll('.article-detail-content img, .press-release-detail-content img')]
      .filter((img) => !/\/media\/2944\/morethanparts\.png$/.test(img.getAttribute('src') || ''))
      .map((img, i) => (/float:\s*right/i.test(img.getAttribute('style') || '') ? i + 1 : 0))
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
        console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
      }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    const meta = WebImporter.Blocks.getMetadata(document);
    // a few source titles carry markup as text ("TRP<sup>®</sup> ..."): keep the words only
    if (typeof meta.Title === 'string') meta.Title = meta.Title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    // the source page has the site's generic title; the trail shows "Home › Media › TRP Downloads"
    meta.Title = 'TRP Downloads';
    meta.breadcrumbs = 'true';
    meta['breadcrumb-parent'] = 'Media';
    meta['breadcrumb-title'] = crumb || 'TRP Downloads';
    // the downloads list is laid out as rows on this page (body.media-downloads)
    meta.template = 'media-downloads';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // a folder URL (/media-center/articles/) is served by its index page on Edge Delivery
    const { pathname } = new URL(params.originalURL);
    const rawPath = pathname
      .replace(/\/$/, pathname.length > 1 ? '/index' : '')
      .replace(/\.html?$/, '');
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
