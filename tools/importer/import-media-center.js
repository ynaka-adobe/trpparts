/* eslint-disable */
/* global WebImporter */

import cardsArticlesParser from './parsers/cards-articles.js';
import cardsDownloadsParser from './parsers/cards-downloads.js';
import columnsRetailerParser from './parsers/columns-retailer.js';
import trppartsCleanupTransformer from './transformers/trpparts-cleanup.js';
import trppartsSectionsTransformer from './transformers/trpparts-sections.js';

const PAGE_TEMPLATE = {
  "name": "media-center",
  "urls": [
    "https://www.trpparts.com/media-center/"
  ],
  "representativeUrl": "https://www.trpparts.com/media-center/",
  "description": "Media Center: H1, recent articles and recent press releases side by side, featured downloads, Where To Buy strip",
  "blocks": [
    {
      "name": "cards-articles",
      "instances": [
        ".media-center .media-column > ul.media-items:not(.featured-downloads)"
      ]
    },
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
  "urlPattern": "/*",
  "sections": [
    {
      "id": "section-1",
      "name": "Page title",
      "selector": [
        "section.subpage-content"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "section.subpage-content h1"
      ]
    },
    {
      "id": "section-2",
      "name": "Recent Articles",
      "selector": [
        ".media-center > .row:first-child > .media-column:nth-child(1)"
      ],
      "style": "half",
      "blocks": [
        "cards-articles"
      ],
      "defaultContent": [
        ".media-center > .row:first-child > .media-column:nth-child(1) > h2",
        ".media-center > .row:first-child > .media-column:nth-child(1) .media-mobile a.button"
      ]
    },
    {
      "id": "section-3",
      "name": "Recent Press Releases",
      "selector": [
        ".media-center > .row:first-child > .media-column:nth-child(2)"
      ],
      "style": "half",
      "blocks": [
        "cards-articles"
      ],
      "defaultContent": [
        ".media-center > .row:first-child > .media-column:nth-child(2) > h2",
        ".media-center > .row:first-child > .media-column:nth-child(2) .media-mobile a.button"
      ]
    },
    {
      "id": "section-4",
      "name": "TRP Downloads",
      "selector": [
        ".media-center > .row.media-column"
      ],
      "style": null,
      "blocks": [
        "cards-downloads"
      ],
      "defaultContent": [
        ".media-center > .row.media-column h2",
        ".media-center > .row[style] a.button"
      ]
    },
    {
      "id": "section-5",
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
  'cards-articles': cardsArticlesParser,
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
    // page metadata from the source head, plus the breadcrumb the source page shows ("Home › Media")
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.breadcrumbs = 'true';
    meta['breadcrumb-title'] = 'Media';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // a folder URL (/resources/) is served by its index page on Edge Delivery (/resources/index)
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
