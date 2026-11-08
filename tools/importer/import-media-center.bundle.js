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

  // tools/importer/import-media-center.js
  var import_media_center_exports = {};
  __export(import_media_center_exports, {
    default: () => import_media_center_default
  });

  // tools/importer/parsers/cards-articles.js
  function cleanText(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }
  function makeLink(document2, href, text) {
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
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
  function parse(element, { document: document2 }) {
    const cells = [];
    let items = [...element.querySelectorAll(":scope > li.media-item")];
    if (!items.length) items = [...element.querySelectorAll("li.media-item")];
    items.forEach((item) => {
      const titleLink = item.querySelector("h3 a[href]");
      const titleH3 = item.querySelector("h3");
      const titleSrc = titleLink || titleH3;
      const title = cleanText(titleSrc ? titleSrc.textContent : "");
      const summary = item.querySelector("p.summary");
      const more = summary ? summary.querySelector("a[href]") : null;
      const srcImg = item.querySelector("img");
      const imgLink = srcImg ? srcImg.closest("a[href]") : null;
      const href = titleLink && titleLink.getAttribute("href") || more && more.getAttribute("href") || imgLink && imgLink.getAttribute("href") || "";
      const imageCell = [];
      if (srcImg && srcImg.getAttribute("src")) {
        const img = document2.createElement("img");
        img.src = srcImg.getAttribute("src");
        img.alt = title || cleanText(srcImg.getAttribute("alt"));
        imageCell.push(img);
      }
      const content = [];
      if (titleSrc && title) {
        const h3 = document2.createElement("h3");
        if (href) {
          const a = document2.createElement("a");
          a.href = href;
          copyInline(document2, titleSrc, a);
          h3.append(a);
        } else {
          copyInline(document2, titleSrc, h3);
        }
        content.push(h3);
      }
      const details = item.querySelector("p.details");
      if (details && cleanText(details.textContent)) {
        const p = document2.createElement("p");
        p.textContent = cleanText(details.textContent);
        content.push(p);
      }
      if (summary) {
        const p = document2.createElement("p");
        const teaser = cleanText([...summary.childNodes].filter((n) => !(n.nodeType === 1 && n.tagName === "A")).map((n) => n.textContent).join(" "));
        if (teaser) p.append(document2.createTextNode(`${teaser} `));
        const moreHref = more && more.getAttribute("href") || href;
        if (moreHref) {
          p.append(makeLink(document2, moreHref, cleanText(more ? more.textContent : "") || "READ MORE"));
        }
        if (cleanText(p.textContent)) content.push(p);
      }
      if (imageCell.length || content.length) cells.push([imageCell, content]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-articles", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-downloads.js
  function cleanText2(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }
  function makeLink2(document2, href, text) {
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  function copyInline2(document2, source, target) {
    source.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        target.append(document2.createTextNode(node.textContent.replace(/\s+/g, " ")));
      } else if (node.nodeType === 1 && /^(SUP|SUB|EM|STRONG|I|B)$/.test(node.tagName)) {
        const el = document2.createElement(node.tagName.toLowerCase());
        el.textContent = cleanText2(node.textContent);
        target.append(el);
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
  function parse2(element, { document: document2 }) {
    const cells = [];
    let items = [...element.querySelectorAll(":scope > li.media-item")];
    if (!items.length) items = [...element.querySelectorAll("li.media-item")];
    items.forEach((item) => {
      const info = item.querySelector(".video-info");
      const titleP = info ? info.querySelector(":scope > p") : null;
      const title = cleanText2(titleP ? titleP.textContent : "");
      const imageCell = [];
      const srcImg = item.querySelector("img");
      if (srcImg && srcImg.getAttribute("src")) {
        const img = document2.createElement("img");
        img.src = srcImg.getAttribute("src");
        img.alt = title || cleanText2(srcImg.getAttribute("alt"));
        imageCell.push(img);
      }
      const content = [];
      if (titleP && title) {
        content.push(copyInline2(document2, titleP, document2.createElement("p")));
      }
      if (info) {
        info.querySelectorAll(":scope > .row").forEach((row) => {
          const p = document2.createElement("p");
          const addSpace = () => {
            if (p.childNodes.length) p.append(document2.createTextNode(" "));
          };
          row.querySelectorAll(".download-item").forEach((di) => {
            const links = [...di.querySelectorAll("a")];
            if (!links.length) {
              const label = cleanText2(di.textContent);
              if (label) {
                addSpace();
                p.append(document2.createTextNode(label));
              }
              return;
            }
            links.forEach((a) => {
              const href = a.getAttribute("href");
              const text = cleanText2(a.textContent);
              if (!href || !text) return;
              addSpace();
              p.append(makeLink2(document2, href, text));
            });
          });
          if (cleanText2(p.textContent)) content.push(p);
        });
      }
      if (imageCell.length || content.length) cells.push([imageCell, content]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-downloads", cells });
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
    if (hookName === "beforeTransform") {
      removeAll(element, [".media-center > .row.media-desktop"]);
      removeAll(element, [".container-fluid:has(> .row.performance-line)", ".row.performance-line"]);
      element.querySelectorAll('.media-center a[href^="/"], .hero-banner.large a[href^="/"], .performance-list a[href^="/"]').forEach((a) => {
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

  // tools/importer/import-media-center.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "cards-articles": parse,
    "cards-downloads": parse2,
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
  var import_media_center_default = {
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
      meta.breadcrumbs = "true";
      meta["breadcrumb-title"] = "Media";
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
  return __toCommonJS(import_media_center_exports);
})();
