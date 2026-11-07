/* eslint-disable */
/* global WebImporter */

import carouselHeroParser from './parsers/carousel-hero.js';
import cardsCategoryParser from './parsers/cards-category.js';
import columnsRetailerParser from './parsers/columns-retailer.js';
import cardsVideoParser from './parsers/cards-video.js';
import cardsOffersParser from './parsers/cards-offers.js';
import heroBannerParser from './parsers/hero-banner.js';
import trppartsCleanupTransformer from './transformers/trpparts-cleanup.js';
import trppartsSectionsTransformer from './transformers/trpparts-sections.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.trpparts.com/"
  ],
  "representativeUrl": "https://www.trpparts.com/",
  "description": "TRP Parts home page: hero carousel, part category grid, retailer search, featured videos, loyalty offers and membership sign-up",
  "urlPattern": "/",
  "blocks": [
    {
      "name": "carousel-hero",
      "instances": [
        "#mainContent div.hero-carousel",
        ".hero-carousel"
      ]
    },
    {
      "name": "cards-category",
      "instances": [
        "section.home-browse-parts ul.part-categories",
        "ul.part-categories"
      ]
    },
    {
      "name": "columns-retailer",
      "instances": [
        "section.retailer-search.home",
        "section.retailer-search"
      ]
    },
    {
      "name": "cards-video",
      "instances": [
        "section[aria-label=\"Video Boxes\"] > div.container-fluid > div.row",
        "#mainContent > div.container-fluid > section:nth-of-type(3) > div.container-fluid > div.row"
      ]
    },
    {
      "name": "cards-offers",
      "instances": [
        "section.home-promo-boxes > div.container-fluid > div.row.center-xs",
        ".home-promo-boxes .row.center-xs"
      ]
    },
    {
      "name": "hero-banner",
      "instances": [
        "section.home-loyalty"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Hero carousel",
      "selector": [
        "#mainContent div.hero-carousel",
        ".hero-carousel"
      ],
      "style": null,
      "blocks": [
        "carousel-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Browse Parts",
      "selector": [
        "section.home-browse-parts"
      ],
      "style": null,
      "blocks": [
        "cards-category"
      ],
      "defaultContent": [
        "section.home-browse-parts h2"
      ]
    },
    {
      "id": "section-3",
      "name": "Where To Buy / Buy Online",
      "selector": [
        "section.retailer-search.home",
        "section.retailer-search"
      ],
      "style": "red",
      "blocks": [
        "columns-retailer"
      ],
      "defaultContent": []
    },
    {
      "id": "section-4",
      "name": "Product Profile Featured Videos",
      "selector": [
        "section[aria-label=\"Video Boxes\"]",
        "#mainContent > div.container-fluid > section:nth-of-type(3)"
      ],
      "style": null,
      "blocks": [
        "cards-video"
      ],
      "defaultContent": [
        "section[aria-label=\"Video Boxes\"] > div.container-fluid > div.col-xs-12.col-sm h2"
      ]
    },
    {
      "id": "section-5",
      "name": "TRP Parts Loyalty Offers",
      "selector": [
        "section.home-promo-boxes"
      ],
      "style": null,
      "blocks": [
        "cards-offers"
      ],
      "defaultContent": [
        "section.home-promo-boxes > div.container-fluid > div.col-xs-12.col-sm h2",
        "section.home-promo-boxes a.button"
      ]
    },
    {
      "id": "section-6",
      "name": "Performance Membership sign-up",
      "selector": [
        "section.home-loyalty"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'carousel-hero': carouselHeroParser,
  'cards-category': cardsCategoryParser,
  'columns-retailer': columnsRetailerParser,
  'cards-video': cardsVideoParser,
  'cards-offers': cardsOffersParser,
  'hero-banner': heroBannerParser,
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
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
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
