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

function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

// Copy an element's inline content (text + <sup>/<sub>/<em>/<strong>) into target, trimmed.
function copyInline(document, source, target) {
  source.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      target.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
    } else if (node.nodeType === 1 && /^(SUP|SUB|EM|STRONG|I|B)$/.test(node.tagName)) {
      const el = document.createElement(node.tagName.toLowerCase());
      el.textContent = cleanText(node.textContent);
      target.append(el);
    } else if (node.nodeType === 1) {
      target.append(document.createTextNode(cleanText(node.textContent)));
    }
  });
  const first = target.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = target.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return target;
}

/**
 * Membership promo banner (div.hero-banner.large): one row, two cells.
 *   cell 1 = text paragraphs in order + plain "Sign Up Today" link paragraph
 *   cell 2 = logo image alone
 * Links keep their href as found (made absolute by the cleanup transformer).
 */
function parseLarge(element, document) {
  const imgs = [...element.querySelectorAll('img')];
  const logo = imgs[0];
  const textCol = [...element.querySelectorAll('[class*="col-"]')]
    .find((c) => c.querySelector(':scope > p') && !c.querySelector('img'));
  const scope = textCol || element;

  const text = [];
  [...scope.querySelectorAll('p')].forEach((p) => {
    if (p.querySelector('img')) return;
    const link = p.querySelector('a[href]');
    if (link) {
      const np = document.createElement('p');
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = cleanText(link.textContent);
      np.append(a);
      text.push(np);
      return;
    }
    if (!cleanText(p.textContent)) return;
    text.push(copyInline(document, p, document.createElement('p')));
  });

  const image = [];
  if (logo && logo.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = absUrl(logo.getAttribute('src'));
    img.alt = logo.getAttribute('alt') || '';
    image.push(img);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells: [[text, image]] });
  element.replaceWith(block);
}

export default function parse(element, { document }) {
  if (element.matches && element.matches('.hero-banner.large')) {
    parseLarge(element, document);
    return;
  }
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
