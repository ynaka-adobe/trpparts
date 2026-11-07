/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-hero.
 * Source: .hero-carousel (slick). One row per .hero-slide-item (clones skipped):
 *   cell 1 = slide image, cell 2 = H1 + CTA link.
 * Slide image is either an <img> inside .billboard-flex-container, or a CSS
 * background url(...) declared in the slide's inline <style> / style attribute.
 */
const ORIGIN = 'https://www.trpparts.com';

function absUrl(url) {
  if (!url) return '';
  const u = url.trim().replace(/^['"]|['"]$/g, '');
  if (/^(https?:|data:)/i.test(u)) return u;
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `${ORIGIN}${u}`;
  return u; // local relative path (e.g. ./images/...) - leave as is
}

function bgUrlFromCss(css) {
  if (!css) return '';
  const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let m;
  while ((m = re.exec(css)) !== null) {
    if (m[2] && !/^none$/i.test(m[2])) return m[2];
  }
  return '';
}

export default function parse(element, { document }) {
  const cells = [];
  let slides = [...element.querySelectorAll('.hero-slide-item')]
    .filter((s) => !s.classList.contains('slick-cloned'));
  if (!slides.length) slides = [element];

  slides.forEach((slide) => {
    // Image cell
    let img = slide.querySelector('.billboard-flex-container img') || slide.querySelector('img');
    let imageCell = '';
    if (img && img.getAttribute('src')) {
      img.setAttribute('src', absUrl(img.getAttribute('src')));
      imageCell = img.closest('picture') || img;
    } else {
      const container = slide.querySelector('.billboard-flex-container') || slide;
      let url = bgUrlFromCss(container.getAttribute('style'));
      if (!url) {
        const styleText = [...slide.querySelectorAll('style')].map((s) => s.textContent).join('\n');
        // prefer the .billboard-flex-container rule, fall back to any url()
        const rule = styleText.match(/\.billboard-flex-container\s*\{[^}]*\}/i);
        url = bgUrlFromCss(rule ? rule[0] : '') || bgUrlFromCss(styleText);
      }
      if (url) {
        img = document.createElement('img');
        img.src = absUrl(url);
        const h = slide.querySelector('h1');
        img.alt = h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
        imageCell = img;
      }
    }

    // Content cell: heading + CTA link(s)
    const content = [];
    const heading = slide.querySelector('h1') || slide.querySelector('h2');
    if (heading) content.push(heading);
    [...slide.querySelectorAll('a')].forEach((a) => {
      if (heading && heading.contains(a)) return;
      const p = document.createElement('p');
      p.append(a);
      content.push(p);
    });

    if (imageCell || content.length) cells.push([imageCell, content]);
  });

  slides.forEach((s) => s.querySelectorAll('style').forEach((st) => st.remove()));

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
