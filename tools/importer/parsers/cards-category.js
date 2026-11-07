/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-category.
 * Source: ul.part-categories > li. One row per li:
 *   cell 1 = category image (empty for the "View All Categories" tile)
 *   cell 2 = linked label (link href from a[href] / a[data-url]).
 */
const ORIGIN = 'https://www.trpparts.com';

function fixSrc(src) {
  if (!src) return '';
  let u = src.trim();
  if (u.startsWith('//')) u = `https:${u}`;
  else if (u.startsWith('/')) u = `${ORIGIN}${u}`;
  return u.replace(/ /g, '%20');
}

export default function parse(element, { document }) {
  const cells = [];
  const items = [...element.querySelectorAll(':scope > li')];

  items.forEach((li) => {
    const a = li.querySelector('a');
    const img = li.querySelector('img');

    let imageCell = '';
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = fixSrc(img.getAttribute('src'));
      newImg.alt = img.getAttribute('alt') || '';
      imageCell = newImg;
    }

    const labelEl = li.querySelector('span');
    const label = ((labelEl || a || li).textContent || '').replace(/\s+/g, ' ').trim();
    const href = a ? (a.getAttribute('href') || a.getAttribute('data-url') || '') : '';

    let textCell;
    if (href) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      textCell = link;
    } else {
      textCell = label;
    }

    if (imageCell || label) cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-category', cells });
  element.replaceWith(block);
}
