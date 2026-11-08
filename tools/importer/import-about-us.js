/* eslint-disable */
/* global WebImporter */

import columnsMediaParser from './parsers/columns-media.js';
import columnsRetailerParser from './parsers/columns-retailer.js';
import trppartsCleanupTransformer from './transformers/trpparts-cleanup.js';
import trppartsSectionsTransformer from './transformers/trpparts-sections.js';

const PAGE_TEMPLATE = {
  "name": "about-us",
  "urls": [
    "https://www.trpparts.com/about-us/"
  ],
  "representativeUrl": "https://www.trpparts.com/about-us/",
  "description": "About Us: H1, tagline, image/text bands (Trusted, Reliable, Proven), all-makes list, Where To Buy strip",
  "blocks": [
    {
      "name": "columns-media",
      "instances": [
        ".about-us-bands"
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
      "name": "Intro + Trusted / Reliable / Proven",
      "selector": [
        "section.subpage-content"
      ],
      "style": "blue-headings, divider",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": [
        "section.subpage-content h1",
        ".about-us > h2.campaign-headline"
      ]
    },
    {
      "id": "section-2",
      "name": "Aftermarket parts for all makes",
      "selector": [
        ".about-us > h2:not(.campaign-headline)"
      ],
      "style": "blue-headings, list-columns",
      "blocks": [],
      "defaultContent": [
        ".about-us > h2:not(.campaign-headline)",
        ".about-us > h2 ~ p",
        "ul.about-us-makes"
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
  'columns-media': columnsMediaParser,
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
    // page metadata from the source head, plus the breadcrumb the source shows ("Home › About Us")
    const meta = WebImporter.Blocks.getMetadata(document);
    meta.breadcrumbs = 'true';
    meta['breadcrumb-title'] = 'About Us';
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
