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

  // tools/importer/import-media-article.js
  var import_media_article_exports = {};
  __export(import_media_article_exports, {
    default: () => import_media_article_default
  });

  // tools/importer/parsers/columns.js
  function unwrapDivs(el) {
    el.querySelectorAll("div, section").forEach((d) => {
      d.replaceWith(...d.childNodes);
    });
    return el;
  }
  function parse(element, { document: document2 }) {
    let cells;
    let variant = "";
    const after = [];
    if (element.matches(".cvsa-intro, .roadcheck-intro")) {
      variant = "lockup";
      const img = element.querySelector(":scope > img, :scope > picture, :scope > p > img");
      const imageCell = document2.createElement("div");
      if (img) {
        const p = img.closest("p");
        imageCell.append(p && p.parentElement === element ? p : img);
      }
      const textCell = document2.createElement("div");
      textCell.append(...element.childNodes);
      cells = [[imageCell, unwrapDivs(textCell)]];
    } else {
      const columns = [];
      [...element.children].forEach((child) => {
        if ([...child.classList].some((c) => /^column-\d+$/.test(c))) columns.push(child);
        else after.push(child);
      });
      if (columns.length < 2) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const flexes = columns.map((col) => Number(([...col.classList].find((c) => /^column-\d+$/.test(c)) || "-1").split("-")[1]));
      if (columns.length === 2 && flexes[0] !== flexes[1]) {
        variant = flexes[0] > flexes[1] ? "wide-narrow" : "narrow-wide";
      }
      cells = [columns.map((col) => {
        const cell = document2.createElement("div");
        cell.append(...col.childNodes);
        return unwrapDivs(cell);
      })];
    }
    const name = variant ? `Columns (${variant})` : "Columns";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block, ...after);
  }

  // tools/importer/parsers/table.js
  function cellContent(document2, cell) {
    const div = document2.createElement("div");
    const label = cell.firstElementChild;
    if (label && label.tagName === "SPAN" && cell.firstChild === label) label.remove();
    div.append(...cell.childNodes);
    div.innerHTML = div.innerHTML.replace(/\s+/g, " ").trim();
    return div;
  }
  function parse2(element, { document: document2 }) {
    const rows = [...element.querySelectorAll(":scope > thead > tr, :scope > tbody > tr")];
    if (!rows.length) rows.push(...element.querySelectorAll("tr"));
    const width = rows.reduce((max, tr) => Math.max(max, tr.querySelectorAll(":scope > th, :scope > td").length), 0);
    const cells = rows.map((tr) => {
      const row = [...tr.querySelectorAll(":scope > th, :scope > td")].map((c) => cellContent(document2, c));
      while (row.length < width) row.push("");
      return row;
    });
    const name = element.classList.contains("striped") ? "Table (striped)" : "Table";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    const wrapper = element.closest(".parts-page-wrapper");
    element.replaceWith(block);
    if (wrapper && !wrapper.querySelector("table")) wrapper.replaceWith(...wrapper.childNodes);
  }

  // tools/importer/parsers/embed.js
  function parse3(element, { document: document2 }) {
    const src = element.getAttribute("src") || "";
    const id = (src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/) || [])[1];
    if (!id) return;
    const href = `https://www.youtube.com/watch?v=${id}`;
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = href;
    const block = WebImporter.Blocks.createBlock(document2, { name: "Embed", cells: [[a]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote.js
  function parse4(element, { document: document2 }) {
    const quote = element.querySelector(".the-quote");
    if (!quote) return;
    const quotation = document2.createElement("p");
    quotation.innerHTML = quote.innerHTML.replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();
    quote.remove();
    const attribution = document2.createElement("p");
    attribution.textContent = element.textContent.replace(/\s+/g, " ").trim().replace(/^[-–—]\s*/, "");
    const cells = [[quotation]];
    if (attribution.textContent) cells.push([attribution]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Quote", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-retailer.js
  function cleanText(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }
  function linkPara(document2, a, fallbackHref) {
    const link = document2.createElement("a");
    link.href = a.getAttribute("href") || a.getAttribute("data-href") || fallbackHref || "";
    link.textContent = cleanText(a);
    const p = document2.createElement("p");
    p.append(link);
    return p;
  }
  function heading(document2, h) {
    const h2 = document2.createElement("h2");
    h2.textContent = cleanText(h);
    return h2;
  }
  function parse5(element, { document: document2 }) {
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
  var MIGRATED = [
    "/",
    "/resources/",
    "/media-center/",
    "/media-center/articles/",
    "/media-center/press-releases/",
    "/media-center/trp-downloads/",
    "/performance-membership/",
    "/deals/",
    "/about-us/",
    "/about-us/warranty/",
    "/about-us/faqs/",
    "/local-deals/"
  ];
  var MIGRATED_ARTICLE = /^\/media-center\/\d{4}\/[a-z0-9-]+\/$/;
  function edsPath(pathname) {
    const segments = pathname.split("/").filter(Boolean).map((s) => {
      let name = s;
      try {
        name = decodeURIComponent(s);
      } catch (e) {
      }
      return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    });
    return `/${segments.join("/")}${segments.length ? "/" : ""}`;
  }
  function siteHref(href) {
    const url = new URL(href, "https://www.trpparts.com/");
    if (url.hostname !== "www.trpparts.com" || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return url.href;
    const path = edsPath(url.pathname);
    return MIGRATED.includes(path) || MIGRATED_ARTICLE.test(path) ? `${path}${url.search}${url.hash}` : url.href;
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
      element.querySelectorAll('.footnotes a[href^="/"], dl.faqs-content a[href^="/"]').forEach((a) => {
        a.setAttribute("href", siteHref(a.getAttribute("href")));
        a.removeAttribute("title");
        a.removeAttribute("data-id");
      });
      removeAll(element, [".article-detail-content hr", ".press-release-detail-content hr"]);
      removeAll(element, [
        '.article-detail-content img[src$="/media/2944/morethanparts.png"]',
        '.press-release-detail-content img[src$="/media/2944/morethanparts.png"]'
      ]);
      if (element.querySelector("form#mediaList")) {
        removeAll(element, [".filter-wrapper", "div:has(> form#mediaList) > h2"]);
      }
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
        '.local-deals-cta a[href^="/"]',
        '.featured-downloads a[href^="/"]',
        'ul.part-categories a[href^="/"]',
        '.article-detail-content a[href^="/"]',
        '.article-detail-content a[href^="https://www.trpparts.com/"]',
        '.press-release-detail-content a[href^="/"]',
        '.press-release-detail-content a[href^="https://www.trpparts.com/"]'
      ].join(", ")).forEach((a) => {
        a.setAttribute("href", siteHref(a.getAttribute("href")));
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
        // non-content embeds (an article's YouTube video is kept for the embed parser)
        "script",
        "noscript",
        'iframe:not(.article-detail-content iframe[src*="youtube.com/embed/"])',
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

  // tools/importer/import-media-article.js
  var PAGE_TEMPLATE = {
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
          '.article-detail-content iframe[src*="youtube.com/embed/"]'
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
  var parsers = {
    "columns": parse,
    "table": parse2,
    "embed": parse3,
    "quote": parse4,
    "columns-retailer": parse5
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
  var import_media_article_default = {
    transform: (payload) => {
      var _a;
      const { document: document2, url, params } = payload;
      const main = document2.body;
      const crumb = (((_a = document2.querySelector("nav.breadcrumbs li.active")) == null ? void 0 : _a.textContent) || "").replace(/\s+/g, " ").trim();
      const floated = [...document2.querySelectorAll(".article-detail-content img, .press-release-detail-content img")].filter((img) => !/\/media\/2944\/morethanparts\.png$/.test(img.getAttribute("src") || "")).map((img, i) => /float:\s*right/i.test(img.getAttribute("style") || "") ? i + 1 : 0).filter(Boolean);
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
      if (typeof meta.Title === "string") meta.Title = meta.Title.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      meta.breadcrumbs = "true";
      meta["breadcrumb-parent"] = "Media";
      if (crumb) meta["breadcrumb-title"] = crumb;
      meta.template = "media-article";
      if (floated.length) meta["image-float"] = floated.join(", ");
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
  return __toCommonJS(import_media_article_exports);
})();
