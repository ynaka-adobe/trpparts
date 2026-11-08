/* eslint-disable */
/* global WebImporter */

import heroBannerParser from './parsers/hero-banner.js';
import cardsMemberOffersParser from './parsers/cards-member-offers.js';
import columnsRetailerParser from './parsers/columns-retailer.js';
import trppartsCleanupTransformer from './transformers/trpparts-cleanup.js';
import trppartsSectionsTransformer from './transformers/trpparts-sections.js';

const PAGE_TEMPLATE = {
  "name": "local-deals",
  "urls": [
    "https://www.trpparts.com/local-deals/"
  ],
  "representativeUrl": "https://www.trpparts.com/local-deals/",
  "description": "Local Deals: promo banner, closest-retailer panel (generic, links to the personalized page on trpparts.com), Performance Membership offers, Where To Buy strip",
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        "div.hero-banner.large"
      ]
    },
    {
      "name": "cards-member-offers",
      "instances": [
        ".specials-box"
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
      "name": "Get Local Deals banner",
      "selector": [
        "div.hero-banner.large"
      ],
      "style": "red-gradient",
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Your Closest Retailer",
      "selector": [
        "section.subpage-content"
      ],
      "style": "divider",
      "blocks": [],
      "defaultContent": [
        "section.subpage-content h1",
        "section.subpage-content h1 ~ p"
      ]
    },
    {
      "id": "section-3",
      "name": "Performance Membership offers",
      "selector": [
        ".local-deals-cta"
      ],
      "style": "centered, condensed-headings",
      "blocks": [
        "cards-member-offers"
      ],
      "defaultContent": [
        ".local-deals-cta h2",
        ".local-deals-cta p"
      ]
    },
    {
      "id": "section-4",
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
  'hero-banner': heroBannerParser,
  'cards-member-offers': cardsMemberOffersParser,
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
    // page metadata from the source head, plus the breadcrumb the source shows ("Home › Local Deals")
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.breadcrumbs = 'true';
    meta['breadcrumb-title'] = 'Local Deals';
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
