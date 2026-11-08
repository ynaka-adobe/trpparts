/* eslint-disable */
/* global WebImporter */

/**
 * TRP Parts cleanup transformer.
 * Selectors verified against tools/importer/bd-snapshots/www.trpparts.com/index.html
 * and migration-work/cleaned.html.
 */

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

const TRACKING_ATTRS = [
  'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onchange', 'onsubmit',
  'data-gtm', 'data-ga', 'data-track', 'data-tracking', 'data-analytics',
  'data-slick-index', 'aria-describedby',
];

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // media center: the "VIEW ALL" buttons are repeated in a desktop-only row; keep the in-column copies
    removeAll(element, ['.media-center > .row.media-desktop']);
    // performance membership: the divider row is drawn by the "divider" section style
    removeAll(element, ['.container-fluid:has(> .row.performance-line)', '.row.performance-line']);
    // deals: the cards-deals block rebuilds the finder UI (sort, mobile filter button, sidebar)
    removeAll(element, ['#offer-search .pagination-header', '#offer-search .show-offers-btn']);
    // about us: the rule under the bands is drawn by the "divider" section style; the three
    // image/text rows are siblings, so group them for the columns-media parser
    removeAll(element, ['.about-us > hr']);
    const aboutRows = [...element.querySelectorAll('.about-us > .row')];
    if (aboutRows.length) {
      const bands = element.ownerDocument.createElement('div');
      bands.className = 'about-us-bands';
      aboutRows[0].before(bands);
      bands.append(...aboutRows);
    }
    // local deals: the retailer part is personalized per visitor on trpparts.com (closest retailer,
    // map, its deals), so it isn't copied; a generic panel links to the personalized page instead
    const retailerDetail = element.querySelector('#retailer-detail');
    if (retailerDetail) {
      const doc = retailerDetail.ownerDocument;
      element.querySelector('h2#special-offers')?.closest('.row')?.remove();
      const intro = doc.createElement('p');
      intro.textContent = 'Local deals vary by TRP retailer. See the current deals at the TRP retailer closest to you.';
      const cta = doc.createElement('p');
      const link = doc.createElement('a');
      link.href = 'https://www.trpparts.com/local-deals/';
      link.textContent = 'Find Your Local Deals';
      cta.append(link);
      retailerDetail.replaceWith(intro, cta);
    }
    // local deals banner: an empty spacer paragraph opens the text column
    element.querySelectorAll('.hero-banner.large p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, picture, a')) p.remove();
    });

    // warranty footnotes and FAQ answers: links to migrated pages stay site-relative (with the
    // trailing slash their EDS paths use); everything else is linked on trpparts.com
    const MIGRATED = ['/', '/resources/', '/media-center/', '/performance-membership/', '/deals/',
      '/about-us/', '/about-us/warranty/', '/about-us/faqs/'];
    element.querySelectorAll('.footnotes a[href^="/"], dl.faqs-content a[href^="/"]').forEach((a) => {
      const url = new URL(a.getAttribute('href'), 'https://www.trpparts.com/');
      const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
      a.setAttribute('href', MIGRATED.includes(path) ? `${path}${url.search}${url.hash}` : url.href);
      a.removeAttribute('title');
      a.removeAttribute('data-id');
    });
    // FAQs: the questions are a definition list; author them as H2 headings with their answers
    element.querySelectorAll('dl.faqs-content').forEach((dl) => {
      const doc = dl.ownerDocument;
      const out = doc.createElement('div');
      [...dl.children].forEach((item) => {
        if (item.tagName === 'DT') {
          const h2 = doc.createElement('h2');
          h2.innerHTML = item.innerHTML.trim();
          out.append(h2);
        } else if (item.tagName === 'DD') {
          out.append(...item.childNodes);
        }
      });
      dl.replaceWith(...out.childNodes);
    });

    // pages these link to aren't migrated (media center articles/downloads, membership sign-up
    // and log-in, deals sign-up and local offers, about-us parts), so link them on trpparts.com
    element.querySelectorAll([
      '.media-center a[href^="/"]',
      '.hero-banner.large a[href^="/"]',
      '.performance-list a[href^="/"]',
      '.header-content-wrapper a[href^="/"]',
      '#offer-search .local-deals a[href^="/"]',
      '.about-us a[href^="/"]',
      '.local-deals-cta a[href^="/"]',
    ].join(', ')).forEach((a) => {
      a.setAttribute('href', new URL(a.getAttribute('href'), 'https://www.trpparts.com/').href);
    });

    // Global chrome, popups, cookie consent, widgets (things that could confuse block matching)
    removeAll(element, [
      '#top > header',
      'header',
      '#top > footer',
      'footer',
      '#sign-up-modal',
      '#colorbox',
      '#cboxOverlay',
      '#CybotCookiebotDialog',
      '[id^="CybotCookiebot"]',
      '[class*="CybotCookiebot"]',
      '#makemodelsearch-modal-container',
      '#engine-make-model-container',
      '.ui-autocomplete',
      '.ui-helper-hidden-accessible',
      'a.hide-ada',
      '.backtotop',
      '#canvas',
      // slick carousel controls and clones
      'ul.slick-dots',
      '.slick-arrow',
      'button.slick-prev',
      'button.slick-next',
      '.slick-cloned',
      // resources page UI the cards-resources block rebuilds (breadcrumb comes from page metadata):
      // search box beside the H1, Refine-by sidebar, result counts/pagination, loading spinner
      'nav.breadcrumbs',
      '#resourcesSearch .resources-ui-wrapper',
      '.parts-facet-wrapper',
      '#pagination-header',
      '#pagination-footer',
      'img.part-loading-image',
      // non-content embeds
      'script',
      'noscript',
      'iframe',
      'link',
      // tracking pixels (e.g. DoubleClick floodlight)
      'img[src*="doubleclick.net"]',
      'img[src*="facebook.com/tr"]',
      'img[width="1"][height="1"]',
    ]);

    // Styles: keep inline <style> within hero slides (carousel-hero parser reads background-image)
    element.querySelectorAll('style').forEach((s) => {
      if (!s.closest('.hero-slide-item')) s.remove();
    });

    // Empty spacer paragraph(s) directly under #mainContent > div.container-fluid
    element.querySelectorAll('#mainContent > div.container-fluid > p').forEach((p) => {
      const text = (p.textContent || '').replace(/ /g, '').trim();
      if (!text && !p.querySelector('img, picture, a, video')) p.remove();
    });

    // Hidden form inputs (anti-forgery tokens, search type flags, etc.)
    removeAll(element, [
      'input[type="hidden"]',
      'input[name="__RequestVerificationToken"]',
      'input[name="ufprt"]',
    ]);
  }

  if (hookName === 'afterTransform') {
    // Leftover <style> (including the hero slide inline styles, now consumed by parsers)
    removeAll(element, [
      'style',
      'script',
      'noscript',
      'iframe',
      'link',
      'header',
      'footer',
      '#sign-up-modal',
      'ul.slick-dots',
      '.slick-arrow',
      '.slick-cloned',
      'input[type="hidden"]',
    ]);

    // Strip tracking / slick runtime attributes
    element.querySelectorAll('*').forEach((el) => {
      TRACKING_ATTRS.forEach((attr) => {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
      });
      [...el.attributes].forEach((a) => {
        if (/^data-(gtm|ga|track|analytics)/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
  }
}
