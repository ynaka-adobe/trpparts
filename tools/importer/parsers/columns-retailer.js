/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-retailer.
 * Source: section.retailer-search. One row, two cells:
 *   cell 1 = H2 "Where To Buy" + "Nearby" link (/retailers?findNearBy=findNearBy)
 *   cell 2 = H2 "Buy Online" + CTA link "Request access or login"
 * Form inputs / buttons / fieldsets are intentionally not carried over
 * (the block code renders the address search and distance options).
 */

function cleanText(el) {
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

function linkPara(document, a, fallbackHref) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href') || a.getAttribute('data-href') || fallbackHref || '';
  link.textContent = cleanText(a);
  const p = document.createElement('p');
  p.append(link);
  return p;
}

function heading(document, h) {
  const h2 = document.createElement('h2');
  h2.textContent = cleanText(h);
  return h2;
}

export default function parse(element, { document }) {
  // Column 1: retailer search
  const col1 = [];
  const searchCol = element.querySelector('.retail-form-wrap');
  if (searchCol) {
    const h = searchCol.querySelector('h2');
    if (h) col1.push(heading(document, h));
    const nearby = searchCol.querySelector('a.find-nearby, #findNearByBttn')
      || searchCol.querySelector('a[href*="retailers"]');
    if (nearby) {
      const p = linkPara(document, nearby, '/retailers?findNearBy=findNearBy');
      // the retailer locator isn't migrated: point Nearby (and the block's address search) at trpparts.com
      const link = p.querySelector('a');
      link.href = new URL(link.getAttribute('href'), 'https://www.trpparts.com/').href;
      col1.push(p);
    }
  }

  // Column 2: buy online
  const col2 = [];
  const onlineCol = [...element.querySelectorAll('.row > div')]
    .find((d) => d !== searchCol && !d.classList.contains('retail-form-wrap') && d.querySelector('h2'));
  if (onlineCol) {
    const h = onlineCol.querySelector('h2');
    if (h) col2.push(heading(document, h));
    onlineCol.querySelectorAll('a').forEach((a) => col2.push(linkPara(document, a)));
  }

  const cells = [[col1, col2]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-retailer', cells });
  element.replaceWith(block);
}
