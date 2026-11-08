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
    // media center: articles, press releases and downloads aren't migrated, so link them on trpparts.com
    element.querySelectorAll('.media-center a[href^="/"]').forEach((a) => {
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
