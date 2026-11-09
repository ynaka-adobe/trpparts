/* eslint-disable */
/* global WebImporter */

import columnsParser from './parsers/columns.js';
import tableParser from './parsers/table.js';
import embedParser from './parsers/embed.js';
import quoteParser from './parsers/quote.js';
import columnsRetailerParser from './parsers/columns-retailer.js';
import trppartsCleanupTransformer from './transformers/trpparts-cleanup.js';
import trppartsSectionsTransformer from './transformers/trpparts-sections.js';

const PAGE_TEMPLATE = {
  "name": "media-article",
  "urls": [
    "https://www.trpparts.com/media-center/2013/bus-drivers-trust-trp-led-lights/",
    "https://www.trpparts.com/media-center/2013/choosing-the-right-air-dryer-cartridge-to-protect-your-brakes/",
    "https://www.trpparts.com/media-center/2013/control-the-road-ahead-with-trp-tie-rod-ends/",
    "https://www.trpparts.com/media-center/2013/count-on-trp-coolant-for-your-engine-protection/",
    "https://www.trpparts.com/media-center/2013/everything-you-wanted-to-know-about-def/",
    "https://www.trpparts.com/media-center/2013/make-an-impression-with-trp-chrome-plated-and-stainless-steel-parts/",
    "https://www.trpparts.com/media-center/2013/the-perfect-fit-for-your-exhaust-system/",
    "https://www.trpparts.com/media-center/2013/trp-air-springs-keep-you-comfortable-on-any-terrain/",
    "https://www.trpparts.com/media-center/2013/weather-the-seasons-with-trp-hvac/",
    "https://www.trpparts.com/media-center/2014/trp-20-years-of-quality-and-value/",
    "https://www.trpparts.com/media-center/2014/trp-introduces-new-all-makes-turbochargers-power-steering-pumps-windshield-wash-and-led-work-lamps/",
    "https://www.trpparts.com/media-center/2014/trpme-at-mid-america-trucking-show/",
    "https://www.trpparts.com/media-center/2015/trp-all-makes-all-march-event/",
    "https://www.trpparts.com/media-center/2015/trp-brake-drums-stop-with-confidence/",
    "https://www.trpparts.com/media-center/2015/trp-exhaust-bellows/",
    "https://www.trpparts.com/media-center/2015/trp-introduces-quality-seat-foam-to-suite-of-school-bus-parts/",
    "https://www.trpparts.com/media-center/2015/trp-power-steering-pumps/",
    "https://www.trpparts.com/media-center/2016/ac-compressors/",
    "https://www.trpparts.com/media-center/2016/air-springs/",
    "https://www.trpparts.com/media-center/2016/all-makes-all-march-2016/",
    "https://www.trpparts.com/media-center/2016/fan-clutch-repair-kits/",
    "https://www.trpparts.com/media-center/2016/new-lubricant-program/",
    "https://www.trpparts.com/media-center/2016/paccar-parts-celebrates-the-grand-opening-of-32-million-renton-distribution-center/",
    "https://www.trpparts.com/media-center/2016/paccar-parts-honors-east-penn-manufacturing-co-with-2015-supplier-of-the-year-award/",
    "https://www.trpparts.com/media-center/2016/paccar-parts-introduces-a-new-line-of-bus-safety-equipment/",
    "https://www.trpparts.com/media-center/2016/paccar-parts-opens-new-32-million-renton-distribution-center/",
    "https://www.trpparts.com/media-center/2017/100th-global-trp-store/",
    "https://www.trpparts.com/media-center/2017/ac-tips/",
    "https://www.trpparts.com/media-center/2017/brake-safety/",
    "https://www.trpparts.com/media-center/2017/lubricants/",
    "https://www.trpparts.com/media-center/2017/paccar-parts-announces-the-incoming-2017-peterbilt-parts-council/",
    "https://www.trpparts.com/media-center/2017/paccar-parts-opens-new-distribution-centers-in-brisbane-australia-and-panama-city-panama/",
    "https://www.trpparts.com/media-center/2017/spring-safety-tips/",
    "https://www.trpparts.com/media-center/2017/trp-store-of-the-year/",
    "https://www.trpparts.com/media-center/2017/trusted-reliable-proven/",
    "https://www.trpparts.com/media-center/2018/ac-compressors/",
    "https://www.trpparts.com/media-center/2018/april-uptime-tips/",
    "https://www.trpparts.com/media-center/2018/cvsa/",
    "https://www.trpparts.com/media-center/2018/march-uptime-tips/",
    "https://www.trpparts.com/media-center/2018/paccar-parts-awards-trp-san-diego-as-the-top-worldwide-trp-store/",
    "https://www.trpparts.com/media-center/2018/trp-all-makes-all-march-event-2018/",
    "https://www.trpparts.com/media-center/2019/know-your-torque-rods-inspection-and-replacement/",
    "https://www.trpparts.com/media-center/2019/toronto-pdc/",
    "https://www.trpparts.com/media-center/2019/trp-25th-anniversary/",
    "https://www.trpparts.com/media-center/2019/trp-chemicals/",
    "https://www.trpparts.com/media-center/2019/trp-reman-brake-linings-compared/",
    "https://www.trpparts.com/media-center/2019/trp-u-bolt-kits/",
    "https://www.trpparts.com/media-center/2019/trust-trp-remanufactured-brakes/",
    "https://www.trpparts.com/media-center/2020/aeromirrors/",
    "https://www.trpparts.com/media-center/2020/driverappreciation/",
    "https://www.trpparts.com/media-center/2020/exhaust/",
    "https://www.trpparts.com/media-center/2020/oil-coalescing-cartridges/",
    "https://www.trpparts.com/media-center/2020/roadcheck-international/",
    "https://www.trpparts.com/media-center/2020/systemmaintenance/",
    "https://www.trpparts.com/media-center/2020/thanking-our-truckers/",
    "https://www.trpparts.com/media-center/2020/trp-conley-awarded-global-trp-store-of-the-year/",
    "https://www.trpparts.com/media-center/2020/trp-extended-life-coolant/",
    "https://www.trpparts.com/media-center/2020/trp-windshield-glass/",
    "https://www.trpparts.com/media-center/2021/2020-global-trp-store-of-the-year/",
    "https://www.trpparts.com/media-center/2021/all-makes-drag-links/",
    "https://www.trpparts.com/media-center/2021/trp-releases-driver-appreciation-week-social-media-video-campaign/",
    "https://www.trpparts.com/media-center/2021/trp-releases-new-all-makes-leaf-springs/",
    "https://www.trpparts.com/media-center/2022/250th-store/",
    "https://www.trpparts.com/media-center/2022/paccar-parts-recognizes-parts-excellence-at-kenworth-dealer-meeting/",
    "https://www.trpparts.com/media-center/2022/paccar-parts-recognizes-parts-excellence-at-peterbilt-dealer-meeting/",
    "https://www.trpparts.com/media-center/2022/trp-hemel-awarded-global-trp-store-of-the-year/",
    "https://www.trpparts.com/media-center/2023/durability-starts-with-trp-air-disc-brake-pad-kits/",
    "https://www.trpparts.com/media-center/2023/kenworth-dealer-meeting-2023/",
    "https://www.trpparts.com/media-center/2023/paccar-parts-celebrates-100th-trp-store-in-us-and-canada/",
    "https://www.trpparts.com/media-center/2023/peterbilt-dealer-meeting-2023/",
    "https://www.trpparts.com/media-center/2023/that-s-something-bigger-than-parts/",
    "https://www.trpparts.com/media-center/2023/trp-bibra-lake-awarded-global-trp-store-of-the-year/",
    "https://www.trpparts.com/media-center/2023/trp-fenders/",
    "https://www.trpparts.com/media-center/2023/trp-hvac-system-compressor/",
    "https://www.trpparts.com/media-center/2023/trp-store-openings-2023/",
    "https://www.trpparts.com/media-center/2023/trp-wiper-blades/",
    "https://www.trpparts.com/media-center/2024/paccar-parts-announces-2023-global-trp-store-of-the-year/",
    "https://www.trpparts.com/media-center/2024/paccar-parts-announces-trp-store-openings/",
    "https://www.trpparts.com/media-center/2024/paccar-parts-honors-excellence-in-dealer-performance-at-kenworth-dealer-meeting/",
    "https://www.trpparts.com/media-center/2024/peterbilt-dealer-meeting-2024/",
    "https://www.trpparts.com/media-center/2024/protect-your-engine-with-trp-coolant/",
    "https://www.trpparts.com/media-center/2024/secure-a-reliable-brake-system-with-trp-slack-adjusters/",
    "https://www.trpparts.com/media-center/2024/trp-celebrates-30-years-of-keeping-customers-on-the-road/",
    "https://www.trpparts.com/media-center/2024/trp-marks-30-years-as-an-industry-leader-in-aftermarket-parts/",
    "https://www.trpparts.com/media-center/2024/trp-presents-tips-to-maintain-your-battery-year-round/",
    "https://www.trpparts.com/media-center/2025/5-ac-tips-to-stay-cool-this-summer/",
    "https://www.trpparts.com/media-center/2025/brakeshoekit/",
    "https://www.trpparts.com/media-center/2025/carb/",
    "https://www.trpparts.com/media-center/2025/cvsa-bsw-2025/",
    "https://www.trpparts.com/media-center/2025/cvsa-osdw-2025/",
    "https://www.trpparts.com/media-center/2025/cvsa/",
    "https://www.trpparts.com/media-center/2025/diagnostic-pro/",
    "https://www.trpparts.com/media-center/2025/paccar-parts-announces-2024-global-trp-store-of-the-year/",
    "https://www.trpparts.com/media-center/2025/paccar-parts-announces-the-new-trp-diagnostic-pro-for-all-makes-and-models-of-commercial-trucks/",
    "https://www.trpparts.com/media-center/2025/paccar-parts-announces-trp-store-openings-1/",
    "https://www.trpparts.com/media-center/2025/winterization/",
    "https://www.trpparts.com/media-center/2026/cvsa-bsw-2026/",
    "https://www.trpparts.com/media-center/2026/cvsa-osdw-2026/",
    "https://www.trpparts.com/media-center/2026/cvsa/",
    "https://www.trpparts.com/media-center/2026/paccar-parts-names-trp-ciudad-ju%C3%A1rez-as-2025-trp-global-store-of-the-year/",
    "https://www.trpparts.com/media-center/2026/paccar-parts-recognizes-2025-trp-store-openings/",
    "https://www.trpparts.com/media-center/2026/trp-cast-brake-drums/"
  ],
  "representativeUrl": "https://www.trpparts.com/media-center/2026/cvsa-bsw-2026/",
  "description": "Media center article / press release (2012-2026): title, date, body (text, images, image+text columns, part tables, video, quote), Where To Buy strip",
  "blocks": [
    {
      "name": "columns",
      "instances": [
        ".article-detail-content .flex-container",
        ".article-detail-content .flex-container1",
        ".article-detail-content .cvsa-intro",
        ".article-detail-content .roadcheck-intro",
        ".press-release-detail-content .flex-container"
      ]
    },
    {
      "name": "table",
      "instances": [
        ".article-detail-content table",
        ".press-release-detail-content table"
      ]
    },
    {
      "name": "embed",
      "instances": [
        ".article-detail-content iframe[src*=\"youtube.com/embed/\"]"
      ]
    },
    {
      "name": "quote",
      "instances": [
        ".article-detail-content .the-quote-border",
        ".press-release-detail-content .the-quote-border"
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
      "name": "Article",
      "selector": [
        "section.article-detail",
        "section.press-release-detail"
      ],
      "style": null,
      "blocks": [
        "columns",
        "table",
        "embed",
        "quote"
      ],
      "defaultContent": [
        ".article-detail-content h1",
        ".article-detail-content .article-info",
        ".article-detail-content > *",
        ".press-release-detail-content h1",
        ".press-release-detail-content .article-info",
        ".press-release-detail-content > *"
      ]
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
  'columns': columnsParser,
  'table': tableParser,
  'embed': embedParser,
  'quote': quoteParser,
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
    // the trail the source shows: "Home › Media › <short page name>" (the year folder has no page)
    meta.breadcrumbs = 'true';
    meta['breadcrumb-parent'] = 'Media';
    if (crumb) meta['breadcrumb-title'] = crumb;
    // article typography and image placement are scoped to this template (body.media-article)
    meta.template = 'media-article';
    // images the source floats right of the text (inline style, which authoring can't keep):
    // their positions among the article's images, e.g. "1"
    if (floated.length) meta['image-float'] = floated.join(', ');
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
