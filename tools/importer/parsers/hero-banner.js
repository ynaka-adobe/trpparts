/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner.
 * Source: section.home-loyalty. One column, two rows:
 *   row 1 = background image (home-loyalty-bkg.jpg: first <img> directly in .container-fluid,
 *           or CSS background-image url(...) as a fallback)
 *   row 2 = logo image + H2 + paragraph + "Sign Up And Save" CTA link
 */
const ORIGIN = 'https://www.trpparts.com';

function absUrl(u) {
  if (!u) return '';
  const s = u.trim().replace(/^['"]|['"]$/g, '');
  if (/^(https?:|data:)/i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
}

function bgFromStyle(el) {
  const m = (el && el.getAttribute('style') || '').match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
  return m ? m[2] : '';
}

export default function parse(element, { document }) {
  const container = element.querySelector('.container-fluid') || element;
  const contentRow = container.querySelector('.row');

  // Row 1: background image
  let bgCell = '';
  let bgImg = container.querySelector(':scope > img, :scope > p > img, :scope > picture img');
  if (!bgImg) {
    const first = container.querySelector('img');
    if (first && !(contentRow && contentRow.contains(first))) bgImg = first;
  }
  if (bgImg) {
    const img = document.createElement('img');
    img.src = absUrl(bgImg.getAttribute('src'));
    img.alt = bgImg.getAttribute('alt') || '';
    bgCell = img;
  } else {
    const url = bgFromStyle(container) || bgFromStyle(element);
    if (url) {
      const img = document.createElement('img');
      img.src = absUrl(url);
      img.alt = '';
      bgCell = img;
    }
  }

  // Row 2: logo + heading + text + CTA
  const content = [];
  const scope = contentRow || container;
  const logo = [...scope.querySelectorAll('img')].find((i) => i !== bgImg);
  if (logo) {
    const img = document.createElement('img');
    img.src = absUrl(logo.getAttribute('src'));
    img.alt = logo.getAttribute('alt') || '';
    const p = document.createElement('p');
    p.append(img);
    content.push(p);
  }
  const heading = scope.querySelector('h1, h2, h3');
  if (heading) content.push(heading);
  [...scope.querySelectorAll('p')].forEach((p) => {
    if (p.querySelector('img')) return;
    if (!(p.textContent || '').trim()) return;
    content.push(p);
  });

  const cells = [[bgCell], [content]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
