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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/carousel-hero.js
  var ORIGIN = "https://www.trpparts.com";
  function absUrl(url) {
    if (!url) return "";
    const u = url.trim().replace(/^['"]|['"]$/g, "");
    if (/^(https?:|data:)/i.test(u)) return u;
    if (u.startsWith("//")) return `https:${u}`;
    if (u.startsWith("/")) return `${ORIGIN}${u}`;
    return u;
  }
  function bgUrlFromCss(css) {
    if (!css) return "";
    const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
    let m;
    while ((m = re.exec(css)) !== null) {
      if (m[2] && !/^none$/i.test(m[2])) return m[2];
    }
    return "";
  }
  function parse(element, { document: document2 }) {
    const cells = [];
    let slides = [...element.querySelectorAll(".hero-slide-item")].filter((s) => !s.classList.contains("slick-cloned"));
    if (!slides.length) slides = [element];
    slides.forEach((slide) => {
      let img = slide.querySelector(".billboard-flex-container img") || slide.querySelector("img");
      let imageCell = "";
      if (img && img.getAttribute("src")) {
        img.setAttribute("src", absUrl(img.getAttribute("src")));
        imageCell = img.closest("picture") || img;
      } else {
        const container = slide.querySelector(".billboard-flex-container") || slide;
        let url = bgUrlFromCss(container.getAttribute("style"));
        if (!url) {
          const styleText = [...slide.querySelectorAll("style")].map((s) => s.textContent).join("\n");
          const rule = styleText.match(/\.billboard-flex-container\s*\{[^}]*\}/i);
          url = bgUrlFromCss(rule ? rule[0] : "") || bgUrlFromCss(styleText);
        }
        if (url) {
          img = document2.createElement("img");
          img.src = absUrl(url);
          const h = slide.querySelector("h1");
          img.alt = h ? h.textContent.replace(/\s+/g, " ").trim() : "";
          imageCell = img;
        }
      }
      const content = [];
      const heading2 = slide.querySelector("h1") || slide.querySelector("h2");
      if (heading2) content.push(heading2);
      [...slide.querySelectorAll("a")].forEach((a) => {
        if (heading2 && heading2.contains(a)) return;
        const p = document2.createElement("p");
        p.append(a);
        content.push(p);
      });
      if (imageCell || content.length) cells.push([imageCell, content]);
    });
    slides.forEach((s) => s.querySelectorAll("style").forEach((st) => st.remove()));
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-category.js
  var ORIGIN2 = "https://www.trpparts.com";
  function fixSrc(src) {
    if (!src) return "";
    let u = src.trim();
    if (u.startsWith("//")) u = `https:${u}`;
    else if (u.startsWith("/")) u = `${ORIGIN2}${u}`;
    return u.replace(/ /g, "%20");
  }
  function parse2(element, { document: document2 }) {
    const cells = [];
    const items = [...element.querySelectorAll(":scope > li")];
    items.forEach((li) => {
      const a = li.querySelector("a");
      const img = li.querySelector("img");
      let imageCell = "";
      if (img) {
        const newImg = document2.createElement("img");
        newImg.src = fixSrc(img.getAttribute("src"));
        newImg.alt = img.getAttribute("alt") || "";
        imageCell = newImg;
      }
      const labelEl = li.querySelector("span");
      const label = ((labelEl || a || li).textContent || "").replace(/\s+/g, " ").trim();
      const href = a ? a.getAttribute("href") || a.getAttribute("data-url") || "" : "";
      let textCell;
      if (href) {
        const link = document2.createElement("a");
        link.href = href;
        link.textContent = label;
        textCell = link;
      } else {
        textCell = label;
      }
      if (imageCell || label) cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-category", cells });
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

  // tools/importer/parsers/cards-video.js
  function toWatchUrl(raw) {
    if (!raw) return "";
    let url;
    try {
      url = new URL(raw.trim(), "https://www.trpparts.com");
    } catch (e) {
      return raw;
    }
    const host = url.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") {
      id = url.pathname.split("/")[1];
    } else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const m = url.pathname.match(/^\/(?:embed|shorts|v)\/([^/?#]+)/);
      id = m ? m[1] : url.searchParams.get("v");
    }
    return id ? `https://www.youtube.com/watch?v=${id}` : url.href;
  }
  function cleanText2(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }
  function parse4(element, { document: document2 }) {
    const cells = [];
    let cards = [...element.querySelectorAll(':scope > div[class*="col-"]')];
    if (!cards.length) cards = [element];
    cards.forEach((card) => {
      const img = card.querySelector("img");
      const videoEl = card.querySelector("[data-href]");
      const rawHref = videoEl ? videoEl.getAttribute("data-href") : [...card.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).find((h) => h && h !== "#") || "";
      const href = toWatchUrl(rawHref);
      let imageCell = "";
      if (img) {
        const newImg = document2.createElement("img");
        newImg.src = img.getAttribute("src") || "";
        newImg.alt = img.getAttribute("alt") || "";
        imageCell = newImg;
      }
      const paras = [...card.querySelectorAll("p")].filter((p) => !p.querySelector("img"));
      let title = "";
      let linkText = "Watch Video";
      const textP = paras.find((p) => cleanText2(p.textContent));
      if (textP) {
        const clone = textP.cloneNode(true);
        const a = clone.querySelector("a");
        if (a) {
          linkText = cleanText2(a.textContent) || linkText;
          a.remove();
        }
        title = cleanText2(clone.textContent);
      }
      if (!title && img) title = cleanText2(img.getAttribute("alt"));
      const content = [];
      if (title) {
        const p = document2.createElement("p");
        p.textContent = title;
        content.push(p);
      }
      if (href) {
        const p = document2.createElement("p");
        const link = document2.createElement("a");
        link.href = href;
        link.textContent = linkText;
        p.append(link);
        content.push(p);
      }
      if (imageCell || content.length) cells.push([imageCell, content]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-offers.js
  function parse5(element, { document: document2 }) {
    const cells = [];
    let tiles = [...element.querySelectorAll(':scope > div[class*="col-"]')];
    if (!tiles.length) tiles = [element];
    tiles.forEach((tile) => {
      const img = tile.querySelector("img");
      let imageCell = "";
      if (img) {
        const newImg = document2.createElement("img");
        newImg.src = img.getAttribute("src") || "";
        newImg.alt = img.getAttribute("alt") || "";
        imageCell = newImg;
      }
      let linkCell = "";
      const a = [...tile.querySelectorAll("a")].find((l) => {
        const h = l.getAttribute("href") || l.getAttribute("data-href");
        return h && h !== "#";
      });
      if (a) {
        const link = document2.createElement("a");
        link.href = a.getAttribute("href") && a.getAttribute("href") !== "#" ? a.getAttribute("href") : a.getAttribute("data-href");
        link.textContent = (a.textContent || "").replace(/\s+/g, " ").trim() || img && img.getAttribute("alt") || link.href;
        linkCell = link;
      }
      if (imageCell || linkCell) cells.push([imageCell, linkCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-offers", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-banner.js
  var ORIGIN3 = "https://www.trpparts.com";
  function absUrl2(u) {
    if (!u) return "";
    const s = u.trim().replace(/^['"]|['"]$/g, "");
    if (/^(https?:|data:)/i.test(s)) return s;
    if (s.startsWith("//")) return `https:${s}`;
    if (s.startsWith("/")) return `${ORIGIN3}${s}`;
    return s;
  }
  function bgFromStyle(el) {
    const m = (el && el.getAttribute("style") || "").match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    return m ? m[2] : "";
  }
  function cleanText3(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }
  function copyInline(document2, source, target) {
    source.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        target.append(document2.createTextNode(node.textContent.replace(/\s+/g, " ")));
      } else if (node.nodeType === 1 && /^(SUP|SUB|EM|STRONG|I|B)$/.test(node.tagName)) {
        const el = document2.createElement(node.tagName.toLowerCase());
        el.textContent = cleanText3(node.textContent);
        target.append(el);
      } else if (node.nodeType === 1) {
        target.append(document2.createTextNode(cleanText3(node.textContent)));
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
        a.textContent = cleanText3(link.textContent);
        np.append(a);
        text.push(np);
        return;
      }
      if (!cleanText3(p.textContent)) return;
      text.push(copyInline(document2, p, document2.createElement("p")));
    });
    const image = [];
    if (logo && logo.getAttribute("src")) {
      const img = document2.createElement("img");
      img.src = absUrl2(logo.getAttribute("src"));
      img.alt = logo.getAttribute("alt") || "";
      image.push(img);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-banner", cells: [[text, image]] });
    element.replaceWith(block);
  }
  function parse6(element, { document: document2 }) {
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
      img.src = absUrl2(bgImg.getAttribute("src"));
      img.alt = bgImg.getAttribute("alt") || "";
      bgCell = img;
    } else {
      const url = bgFromStyle(container) || bgFromStyle(element);
      if (url) {
        const img = document2.createElement("img");
        img.src = absUrl2(url);
        img.alt = "";
        bgCell = img;
      }
    }
    const content = [];
    const scope = contentRow || container;
    const logo = [...scope.querySelectorAll("img")].find((i) => i !== bgImg);
    if (logo) {
      const img = document2.createElement("img");
      img.src = absUrl2(logo.getAttribute("src"));
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
        '.press-release-detail-content a[href^="https://www.trpparts.com/"]',
        // any other site link in the page body (e.g. the home page's offers and membership promos)
        '#mainContent a[href^="/"]'
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

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
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
          'section[aria-label="Video Boxes"] > div.container-fluid > div.row',
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
          'section[aria-label="Video Boxes"]',
          "#mainContent > div.container-fluid > section:nth-of-type(3)"
        ],
        "style": null,
        "blocks": [
          "cards-video"
        ],
        "defaultContent": [
          'section[aria-label="Video Boxes"] > div.container-fluid > div.col-xs-12.col-sm h2'
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
  var parsers = {
    "carousel-hero": parse,
    "cards-category": parse2,
    "columns-retailer": parse3,
    "cards-video": parse4,
    "cards-offers": parse5,
    "hero-banner": parse6
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
  var import_home_default = {
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
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
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
  return __toCommonJS(import_home_exports);
})();
