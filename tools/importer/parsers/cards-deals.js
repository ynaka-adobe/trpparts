/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-deals (Cards "no images" convention: 1 column, one row per card).
 * Source: #offers-container, items = :scope > .promo-content
 * (enriched with data-categories ("|"-separated display names), data-brand,
 * data-starts and data-ends (MM/DD/YYYY)).
 * One row (single cell) per deal:
 *   <h3>title</h3> (keeps <sup>; mojibake "â€“" fixed to "–"),
 *   <p>N Redemption Limit</p>,
 *   <p>Valid through MM/DD/YYYY</p> (from data-ends),
 *   <p>$X.XX OFF</p>,
 *   <p>Category: A, B | Brand: X | Starts: MM/DD/YYYY</p> (each part optional)
 */

function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function fixMojibake(s) {
  return (s || '')
    .replace(/â€“/g, '–')
    .replace(/â€”/g, '—')
    .replace(/â€™/g, '’');
}

function para(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function buildTitle(document, source) {
  const h3 = document.createElement('h3');
  // Copy text and <sup> nodes, normalising whitespace and fixing mojibake.
  source.childNodes.forEach((node) => {
    if (node.nodeType === 1 && node.tagName === 'SUP') {
      const sup = document.createElement('sup');
      sup.textContent = cleanText(fixMojibake(node.textContent));
      h3.append(sup);
    } else if (node.nodeType === 1 || node.nodeType === 3) {
      h3.append(document.createTextNode(fixMojibake(node.textContent).replace(/\s+/g, ' ')));
    }
  });
  const first = h3.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = h3.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return h3;
}

export default function parse(element, { document }) {
  const cells = [];
  let items = [...element.querySelectorAll(':scope > .promo-content')];
  if (!items.length) items = [...element.querySelectorAll('.promo-content')];

  items.forEach((item) => {
    const content = [];

    const titleEl = item.querySelector('.promo-title');
    if (titleEl && cleanText(titleEl.textContent)) content.push(buildTitle(document, titleEl));

    const limit = cleanText((item.querySelector('.redemption-count') || {}).textContent);
    if (limit) content.push(para(document, limit));

    const ends = cleanText(item.getAttribute('data-ends'))
      || cleanText((item.querySelector('.valid-until') || {}).textContent)
        .replace(/^Valid through\s*/i, '');
    if (ends) content.push(para(document, `Valid through ${ends}`));

    const amountText = cleanText((item.querySelector('.discount-price-amount') || {}).textContent);
    const amountNum = parseFloat(amountText.replace(/[^0-9.]/g, ''));
    if (!Number.isNaN(amountNum)) content.push(para(document, `$${amountNum.toFixed(2)} OFF`));

    const categories = (item.getAttribute('data-categories') || '')
      .split('|').map(cleanText).filter(Boolean);
    const brand = cleanText(item.getAttribute('data-brand'));
    const starts = cleanText(item.getAttribute('data-starts'));
    const parts = [];
    if (categories.length) parts.push(`Category: ${categories.join(', ')}`);
    if (brand) parts.push(`Brand: ${brand}`);
    if (starts) parts.push(`Starts: ${starts}`);
    if (parts.length) content.push(para(document, parts.join(' | ')));

    cells.push([content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-deals', cells });
  element.replaceWith(block);
}
