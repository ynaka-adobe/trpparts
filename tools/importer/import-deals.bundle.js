/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-deals.js
  var import_deals_exports = {};
  __export(import_deals_exports, {
    default: () => import_deals_default
  });

  // tools/importer/parsers/cards-deals.js
  function cleanText(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }
  function fixMojibake(s) {
    return (s || "").replace(/â€“/g, "\u2013").replace(/â€”/g, "\u2014").replace(/â€™/g, "\u2019");
  }
  function para(document2, text) {
    const p = document2.createElement("p");
    p.textContent = text;
    return p;
  }
  function buildTitle(document2, source) {
    const h3 = document2.createElement("h3");
    source.childNodes.forEach((node) => {
      if (node.nodeType === 1 && node.tagName === "SUP") {
        const sup = document2.createElement("sup");
        sup.textContent = cleanText(fixMojibake(node.textContent));
        h3.append(sup);
      } else if (node.nodeType === 1 || node.nodeType === 3) {
        h3.append(document2.createTextNode(fixMojibake(node.textContent).replace(/\s+/g, " ")));
      }
    });
    const first = h3.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = h3.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    return h3;
  }
  function parse(element, { document: document2 }) {
    const cells = [];
    let items = [...element.querySelectorAll(":scope > .promo-content")];
    if (!items.length) items = [...element.querySelectorAll(".promo-content")];
    items.forEach((item) => {
      const content = [];
      const titleEl = item.querySelector(".promo-title");
      if (titleEl && cleanText(titleEl.textContent)) content.push(buildTitle(document2, titleEl));
      const limit = cleanText((item.querySelector(".redemption-count") || {}).textContent);
      if (limit) content.push(para(document2, limit));
      const ends = cleanText(item.getAttribute("data-ends")) || cleanText((item.querySelector(".valid-until") || {}).textContent).replace(/^Valid through\s*/i, "");
      if (ends) content.push(para(document2, `Valid through ${ends}`));
      const amountText = cleanText((item.querySelector(".discount-price-amount") || {}).textContent);
      const amountNum = parseFloat(amountText.replace(/[^0-9.]/g, ""));
      if (!Number.isNaN(amountNum)) content.push(para(document2, `$${amountNum.toFixed(2)} OFF`));
      const categories = (item.getAttribute("data-categories") || "").split("|").map(cleanText).filter(Boolean);
      const brand = cleanText(item.getAttribute("data-brand"));
      const starts = cleanText(item.getAttribute("data-starts"));
      const parts = [];
      if (categories.length) parts.push(`Category: ${categories.join(", ")}`);
      if (brand) parts.push(`Brand: ${brand}`);
      if (starts) parts.push(`Starts: ${starts}`);
      if (parts.length) content.push(para(document2, parts.join(" | ")));
      cells.push([content]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-deals", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-retailer.js
  function cleanText2(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }
  function linkPara(document2, a, fallbackHref) {
    const link = document2.createElement("a");
    link.href = a.getAttribute("href") || a.getAttribute("data-href") || fallbackHref || "";
    link.textContent = cleanText2(a);
    const p = document2.createElement("p");
    p.append(link);
    return p;
  }
  function heading(document2, h) {
    const h2 = document2.createElement("h2");
    h2.textContent = cleanText2(h);
    return h2;
  }
  function parse2(element, { document: document2 }) {
    const col1 = [];
    const searchCol = element.querySelector(".retail-form-wrap");
    if (searchCol) {
      const h = searchCol.querySelector("h2");
      if (h) col1.push(heading(document2, h));
      const nearby = searchCol.querySelector("a.find-nearby, #findNearByBttn") || searchCol.querySelector('a[href*="retailers"]');
      if (nearby) {
        const p = linkPara(document2, nearby, "/retailers?findNearBy=findNearBy");
        const link = p.querySelector("a");
        link.href = new URL(link.getAttribute("href"), "https://www.trpparts.com/").href;
        col1.push(p);
      }
    }
    const col2 = [];
    const onlineCol = [...element.querySelectorAll(".row > div")].find((d) => d !== searchCol && !d.classList.contains("retail-form-wrap") && d.querySelector("h2"));
    if (onlineCol) {
      const h = onlineCol.querySelector("h2");
      if (h) col2.push(heading(document2, h));
      onlineCol.querySelectorAll("a").forEach((a) => col2.push(linkPara(document2, a)));
    }
    const cells = [[col1, col2]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-retailer", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/trpparts-cleanup.js
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  var TRACKING_ATTRS = [
    "onclick",
    "onload",
    "onerror",
    "onmouseover",
    "onmouseout",
    "onchange",
    "onsubmit",
    "data-gtm",
    "data-ga",
    "data-track",
    "data-tracking",
    "data-analytics",
    "data-slick-index",
    "aria-describedby"
  ];
  function transform(hookName, element, payload) {
    var _a, _b;
    if (hookName === "beforeTransform") {
      removeAll(element, [".media-center > .row.media-desktop"]);
      removeAll(element, [".container-fluid:has(> .row.performance-line)", ".row.performance-line"]);
      removeAll(element, ["#offer-search .pagination-header", "#offer-search .show-offers-btn"]);
      removeAll(element, [".about-us > hr"]);
      const aboutRows = [...element.querySelectorAll(".about-us > .row")];
      if (aboutRows.length) {
        const bands = element.ownerDocument.createElement("div");
        bands.className = "about-us-bands";
        aboutRows[0].before(bands);
        bands.append(...aboutRows);
      }
      const retailerDetail = element.querySelector("#retailer-detail");
      if (retailerDetail) {
        const doc = retailerDetail.ownerDocument;
        (_b = (_a = element.querySelector("h2#special-offers")) == null ? void 0 : _a.closest(".row")) == null ? void 0 : _b.remove();
        const intro = doc.createElement("p");
        intro.textContent = "Local deals vary by TRP retailer. See the current deals at the TRP retailer closest to you.";
        const cta = doc.createElement("p");
        const link = doc.createElement("a");
        link.href = "https://www.trpparts.com/local-deals/";
        link.textContent = "Find Your Local Deals";
        cta.append(link);
        retailerDetail.replaceWith(intro, cta);
      }
      element.querySelectorAll(".hero-banner.large p").forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector("img, picture, a")) p.remove();
      });
      const MIGRATED = [
        "/",
        "/resources/",
        "/media-center/",
        "/performance-membership/",
        "/deals/",
        "/about-us/",
        "/about-us/warranty/",
        "/about-us/faqs/"
      ];
      element.querySelectorAll('.footnotes a[href^="/"], dl.faqs-content a[href^="/"]').forEach((a) => {
        const url = new URL(a.getAttribute("href"), "https://www.trpparts.com/");
        const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
        a.setAttribute("href", MIGRATED.includes(path) ? `${path}${url.search}${url.hash}` : url.href);
        a.removeAttribute("title");
        a.removeAttribute("data-id");
      });
      element.querySelectorAll("dl.faqs-content").forEach((dl) => {
        const doc = dl.ownerDocument;
        const out = doc.createElement("div");
        [...dl.children].forEach((item) => {
          if (item.tagName === "DT") {
            const h2 = doc.createElement("h2");
            h2.innerHTML = item.innerHTML.trim();
            out.append(h2);
          } else if (item.tagName === "DD") {
            out.append(...item.childNodes);
          }
        });
        dl.replaceWith(...out.childNodes);
      });
      element.querySelectorAll([
        '.media-center a[href^="/"]',
        '.hero-banner.large a[href^="/"]',
        '.performance-list a[href^="/"]',
        '.header-content-wrapper a[href^="/"]',
        '#offer-search .local-deals a[href^="/"]',
        '.about-us a[href^="/"]',
        '.local-deals-cta a[href^="/"]'
      ].join(", ")).forEach((a) => {
        a.setAttribute("href", new URL(a.getAttribute("href"), "https://www.trpparts.com/").href);
      });
      removeAll(element, [
        "#top > header",
        "header",
        "#top > footer",
        "footer",
        "#sign-up-modal",
        "#colorbox",
        "#cboxOverlay",
        "#CybotCookiebotDialog",
        '[id^="CybotCookiebot"]',
        '[class*="CybotCookiebot"]',
        "#makemodelsearch-modal-container",
        "#engine-make-model-container",
        ".ui-autocomplete",
        ".ui-helper-hidden-accessible",
        "a.hide-ada",
        ".backtotop",
        "#canvas",
        // slick carousel controls and clones
        "ul.slick-dots",
        ".slick-arrow",
        "button.slick-prev",
        "button.slick-next",
        ".slick-cloned",
        // resources page UI the cards-resources block rebuilds (breadcrumb comes from page metadata):
        // search box beside the H1, Refine-by sidebar, result counts/pagination, loading spinner
        "nav.breadcrumbs",
        "#resourcesSearch .resources-ui-wrapper",
        ".parts-facet-wrapper",
        "#pagination-header",
        "#pagination-footer",
        "img.part-loading-image",
        // non-content embeds
        "script",
        "noscript",
        "iframe",
        "link",
        // tracking pixels (e.g. DoubleClick floodlight)
        'img[src*="doubleclick.net"]',
        'img[src*="facebook.com/tr"]',
        'img[width="1"][height="1"]'
      ]);
      element.querySelectorAll("style").forEach((s) => {
        if (!s.closest(".hero-slide-item")) s.remove();
      });
      element.querySelectorAll("#mainContent > div.container-fluid > p").forEach((p) => {
        const text = (p.textContent || "").replace(/ /g, "").trim();
        if (!text && !p.querySelector("img, picture, a, video")) p.remove();
      });
      removeAll(element, [
        'input[type="hidden"]',
        'input[name="__RequestVerificationToken"]',
        'input[name="ufprt"]'
      ]);
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        "style",
        "script",
        "noscript",
        "iframe",
        "link",
        "header",
        "footer",
        "#sign-up-modal",
        "ul.slick-dots",
        ".slick-arrow",
        ".slick-cloned",
        'input[type="hidden"]'
      ]);
      element.querySelectorAll("*").forEach((el) => {
        TRACKING_ATTRS.forEach((attr) => {
          if (el.hasAttribute(attr)) el.removeAttribute(attr);
        });
        [...el.attributes].forEach((a) => {
          if (/^data-(gtm|ga|track|analytics)/i.test(a.name)) el.removeAttribute(a.name);
        });
      });
    }
  }

  // tools/importer/transformers/trpparts-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionEl(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionEl(element, section);
        if (!el || !el.parentNode) continue;
        if (i === 0 && !section.style) continue;
        const hr = doc.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const anchor = marker || findSectionEl(element, section);
        if (!anchor || !anchor.parentNode) continue;
        const meta = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (marker) {
          const hrs = [...element.querySelectorAll("hr")];
          const end = hrs[hrs.indexOf(marker) + 1];
          if (end) end.parentNode.insertBefore(meta, end);
          else marker.parentNode.appendChild(meta);
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER);
        } else {
          anchor.after(meta);
        }
      }
    }
  }

  // tools/importer/import-deals.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "cards-deals": parse,
    "columns-retailer": parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document2.querySelectorAll(selector).forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_deals_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document: document2, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document2.createElement("hr"));
      const meta = WebImporter.Blocks.getMetadata(document2);
      meta.Title = "Deals";
      meta.breadcrumbs = "true";
      meta["breadcrumb-title"] = "Deals";
      main.append(WebImporter.Blocks.getMetadataBlock(document2, meta));
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const { pathname } = new URL(params.originalURL);
      const rawPath = pathname.replace(/\/$/, pathname.length > 1 ? "/index" : "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_deals_exports);
})();
