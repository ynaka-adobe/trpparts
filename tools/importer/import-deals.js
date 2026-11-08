/* eslint-disable */
/* global WebImporter */

import cardsDealsParser from './parsers/cards-deals.js';
import columnsRetailerParser from './parsers/columns-retailer.js';
import trppartsCleanupTransformer from './transformers/trpparts-cleanup.js';
import trppartsSectionsTransformer from './transformers/trpparts-sections.js';

const PAGE_TEMPLATE = {
  "name": "deals",
  "urls": [
    "https://www.trpparts.com/deals/"
  ],
  "representativeUrl": "https://www.trpparts.com/deals/",
  "description": "Deals: red header band (H1 + intro), deals finder (search, filters, sort, deal cards), local offers button, Where To Buy strip",
  "blocks": [
    {
      "name": "cards-deals",
      "instances": [
        "#offers-container"
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
      "name": "Everyday Savings header band",
      "selector": [
        "div.header:has(> .header-content-wrapper)"
      ],
      "style": "red-dark-gradient, centered",
      "blocks": [],
      "defaultContent": [
        "div.header:has(> .header-content-wrapper) h1",
        "div.header:has(> .header-content-wrapper) p"
      ]
    },
    {
      "id": "section-2",
      "name": "Deals finder",
      "selector": [
        "section.parts-list-content"
      ],
      "style": null,
      "blocks": [
        "cards-deals"
      ],
      "defaultContent": [
        ".local-deals a.button"
      ]
    },
    {
      "id": "section-3",
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
  'cards-deals': cardsDealsParser,
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
    // page metadata: the source <title> is the generic site title, so set the page's own;
    // plus the breadcrumb the source shows ("Home › Deals")
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.Title = 'Deals';
    meta.breadcrumbs = 'true';
    meta['breadcrumb-title'] = 'Deals';
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
