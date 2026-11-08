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

  // tools/importer/import-performance-membership.js
  var import_performance_membership_exports = {};
  __export(import_performance_membership_exports, {
    default: () => import_performance_membership_default
  });

  // tools/importer/parsers/hero-banner.js
  var ORIGIN = "https://www.trpparts.com";
  function absUrl(u) {
    if (!u) return "";
    const s = u.trim().replace(/^['"]|['"]$/g, "");
    if (/^(https?:|data:)/i.test(s)) return s;
    if (s.startsWith("//")) return `https:${s}`;
    if (s.startsWith("/")) return `${ORIGIN}${s}`;
    return s;
  }
  function bgFromStyle(el) {
    const m = (el && el.getAttribute("style") || "").match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    return m ? m[2] : "";
  }
  function cleanText(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }
  function copyInline(document2, source, target) {
    source.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        target.append(document2.createTextNode(node.textContent.replace(/\s+/g, " ")));
      } else if (node.nodeType === 1 && /^(SUP|SUB|EM|STRONG|I|B)$/.test(node.tagName)) {
        const el = document2.createElement(node.tagName.toLowerCase());
        el.textContent = cleanText(node.textContent);
        target.append(el);
      } else if (node.nodeType === 1) {
        target.append(document2.createTextNode(cleanText(node.textContent)));
      }
    });
    const first = target.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = target.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    return target;
  }
  function parseLarge(element, document2) {
    const imgs = [...element.querySelectorAll("img")];
    const logo = imgs[0];
    const textCol = [...element.querySelectorAll('[class*="col-"]')].find((c) => c.querySelector(":scope > p") && !c.querySelector("img"));
    const scope = textCol || element;
    const text = [];
    [...scope.querySelectorAll("p")].forEach((p) => {
      if (p.querySelector("img")) return;
      const link = p.querySelector("a[href]");
      if (link) {
        const np = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = cleanText(link.textContent);
        np.append(a);
        text.push(np);
        return;
      }
      if (!cleanText(p.textContent)) return;
      text.push(copyInline(document2, p, document2.createElement("p")));
    });
    const image = [];
    if (logo && logo.getAttribute("src")) {
      const img = document2.createElement("img");
      img.src = absUrl(logo.getAttribute("src"));
      img.alt = logo.getAttribute("alt") || "";
      image.push(img);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-banner", cells: [[text, image]] });
    element.replaceWith(block);
  }
  function parse(element, { document: document2 }) {
    if (element.matches && element.matches(".hero-banner.large")) {
      parseLarge(element, document2);
      return;
    }
    const container = element.querySelector(".container-fluid") || element;
    const contentRow = container.querySelector(".row");
    let bgCell = "";
    let bgImg = container.querySelector(":scope > img, :scope > p > img, :scope > picture img");
    if (!bgImg) {
      const first = container.querySelector("img");
      if (first && !(contentRow && contentRow.contains(first))) bgImg = first;
    }
    if (bgImg) {
      const img = document2.createElement("img");
      img.src = absUrl(bgImg.getAttribute("src"));
      img.alt = bgImg.getAttribute("alt") || "";
      bgCell = img;
    } else {
      const url = bgFromStyle(container) || bgFromStyle(element);
      if (url) {
        const img = document2.createElement("img");
        img.src = absUrl(url);
        img.alt = "";
        bgCell = img;
      }
    }
    const content = [];
    const scope = contentRow || container;
    const logo = [...scope.querySelectorAll("img")].find((i) => i !== bgImg);
    if (logo) {
      const img = document2.createElement("img");
      img.src = absUrl(logo.getAttribute("src"));
      img.alt = logo.getAttribute("alt") || "";
      const p = document2.createElement("p");
      p.append(img);
      content.push(p);
    }
    const heading2 = scope.querySelector("h1, h2, h3");
    if (heading2) content.push(heading2);
    [...scope.querySelectorAll("p")].forEach((p) => {
      if (p.querySelector("img")) return;
      if (!(p.textContent || "").trim()) return;
      content.push(p);
    });
    const cells = [[bgCell], [content]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function cleanText2(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }
  function copyInline2(document2, source, target, keepLinks = false) {
    source.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        target.append(document2.createTextNode(node.textContent.replace(/\s+/g, " ")));
      } else if (node.nodeType === 1 && /^(SUP|SUB|EM|STRONG|I|B)$/.test(node.tagName)) {
        const el = document2.createElement(node.tagName.toLowerCase());
        el.textContent = cleanText2(node.textContent);
        target.append(el);
      } else if (keepLinks && node.nodeType === 1 && node.tagName === "A" && node.getAttribute("href")) {
        const a = document2.createElement("a");
        a.href = node.getAttribute("href");
        a.textContent = cleanText2(node.textContent);
        target.append(a);
      } else if (node.nodeType === 1) {
        target.append(document2.createTextNode(cleanText2(node.textContent)));
      }
    });
    const first = target.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = target.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    return target;
  }
  function imageCell(document2, scope) {
    const src = scope && scope.querySelector("img");
    if (!src || !src.getAttribute("src")) return [];
    const img = document2.createElement("img");
    img.src = src.getAttribute("src");
    img.alt = src.getAttribute("alt") || "";
    return [img];
  }
  function buttonParagraph(document2, link, wrapTag) {
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    a.href = link.getAttribute("href");
    a.textContent = cleanText2(link.textContent);
    if (wrapTag) {
      const w = document2.createElement(wrapTag);
      w.append(a);
      p.append(w);
    } else {
      p.append(a);
    }
    return p;
  }
  function parseList(element, document2) {
    const imgCol = element.querySelector(".performance-list-img");
    const list = element.querySelector(".performance-list");
    const text = [];
    if (list) {
      const heading2 = list.querySelector("h1, h2, h3");
      if (heading2) {
        text.push(copyInline2(document2, heading2, document2.createElement(heading2.tagName.toLowerCase())));
      }
      const srcUl = list.querySelector("ul");
      if (srcUl) {
        const ul = document2.createElement("ul");
        srcUl.querySelectorAll(":scope > li").forEach((li) => {
          if (!cleanText2(li.textContent)) return;
          const nli = document2.createElement("li");
          copyInline2(document2, li.querySelector(":scope > p") || li, nli);
          ul.append(nli);
        });
        if (ul.children.length) text.push(ul);
      }
      list.querySelectorAll(".performance-list-cta a[href]").forEach((a) => {
        let wrap = null;
        if (a.classList.contains("redsolid")) wrap = "strong";
        else if (a.classList.contains("blueoutline")) wrap = "em";
        text.push(buttonParagraph(document2, a, wrap));
      });
    }
    return [[imageCell(document2, imgCol), text]];
  }
  function textCell(document2, col, keepLinks = false) {
    const text = [];
    col.querySelectorAll("h1, h2, h3, h4, p").forEach((el) => {
      if (el.querySelector("img")) return;
      if (!cleanText2(el.textContent)) return;
      text.push(copyInline2(document2, el, document2.createElement(el.tagName.toLowerCase()), keepLinks));
    });
    return text;
  }
  function bandRows(document2, inner, keepLinks = false) {
    const rank = (c) => {
      if (c.classList.contains("first-sm")) return 0;
      if (c.classList.contains("last-sm")) return 2;
      return 1;
    };
    const rows = [];
    inner.forEach((row) => {
      const cols = [...row.querySelectorAll(':scope > [class*="col-"]')].map((c, i) => ({ c, i })).sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i).map(({ c }) => c);
      const cells = cols.map((c) => c.querySelector("img") && !c.querySelector("h1, h2, h3, h4") ? imageCell(document2, c) : textCell(document2, c, keepLinks));
      while (cells.length < 2) cells.push("");
      if (cells.some((c) => c && c.length)) rows.push(cells.slice(0, 2));
    });
    return rows;
  }
  function parseBands(element, document2) {
    let inner = [...element.querySelectorAll(":scope > .col-xs-12 > .row")];
    if (!inner.length) inner = [...element.querySelectorAll(".row")];
    return bandRows(document2, inner);
  }
  function parseAbout(element, document2) {
    return bandRows(document2, [...element.querySelectorAll(":scope > .row")], true);
  }
  function parse2(element, { document: document2 }) {
    if (element.classList.contains("about-us-bands")) {
      const block2 = WebImporter.Blocks.createBlock(document2, {
        name: "columns-media (image-first)",
        cells: parseAbout(element, document2)
      });
      element.replaceWith(block2);
      return;
    }
    const isList = !!element.querySelector(".performance-list-img, .performance-list");
    const cells = isList ? parseList(element, document2) : parseBands(element, document2);
    const name = isList ? "columns-media" : "columns-media (text-first)";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-retailer.js
  function cleanText3(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }
  function linkPara(document2, a, fallbackHref) {
    const link = document2.createElement("a");
    link.href = a.getAttribute("href") || a.getAttribute("data-href") || fallbackHref || "";
    link.textContent = cleanText3(a);
    const p = document2.createElement("p");
    p.append(link);
    return p;
  }
  function heading(document2, h) {
    const h2 = document2.createElement("h2");
    h2.textContent = cleanText3(h);
    return h2;
  }
  function parse3(element, { document: document2 }) {
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

  // tools/importer/import-performance-membership.js
  var PAGE_TEMPLATE = {
    "name": "performance-membership",
    "urls": [
      "https://www.trpparts.com/performance-membership/"
    ],
    "representativeUrl": "https://www.trpparts.com/performance-membership/",
    "description": "Performance Membership: promo banner, Online Rewards Program (image + list + sign-up/log-in buttons), image/text bands, Where To Buy strip",
    "blocks": [
      {
        "name": "hero-banner",
        "instances": [
          "div.hero-banner.large"
        ]
      },
      {
        "name": "columns-media",
        "instances": [
          "section.subpage-content .row:has(> .col-sm-5 .performance-list-img)",
          "section.subpage-content .row:has(> .col-xs-12 > .row > .col-sm-8)"
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
        "name": "Promo banner",
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
        "name": "Online Rewards Program",
        "selector": [
          "section.subpage-content .row:has(> .col-sm-5 .performance-list-img)"
        ],
        "style": "divider",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Your Ticket to Savings / Easy Management",
        "selector": [
          "section.subpage-content .row:has(> .col-xs-12 > .row > .col-sm-8)"
        ],
        "style": null,
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
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
  var parsers = {
    "hero-banner": parse,
    "columns-media": parse2,
    "columns-retailer": parse3
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
  var import_performance_membership_default = {
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
      meta.Title = "Performance Membership";
      meta.breadcrumbs = "true";
      meta["breadcrumb-title"] = "Performance Membership";
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
  return __toCommonJS(import_performance_membership_exports);
})();
