/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-offers.
 * Source: .home-promo-boxes .row.center-xs, tiles = :scope > div.col-sm-4.
 * One row per tile:
 *   cell 1 = offer image
 *   cell 2 = link (if the tile has one, text = image alt), else empty.
 */

export default function parse(element, { document }) {
  const cells = [];
  let tiles = [...element.querySelectorAll(':scope > div[class*="col-"]')];
  if (!tiles.length) tiles = [element];

  tiles.forEach((tile) => {
    const img = tile.querySelector('img');
    let imageCell = '';
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.getAttribute('src') || '';
      newImg.alt = img.getAttribute('alt') || '';
      imageCell = newImg;
    }

    let linkCell = '';
    const a = [...tile.querySelectorAll('a')].find((l) => {
      const h = l.getAttribute('href') || l.getAttribute('data-href');
      return h && h !== '#';
    });
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href') && a.getAttribute('href') !== '#'
        ? a.getAttribute('href')
        : a.getAttribute('data-href');
      link.textContent = (a.textContent || '').replace(/\s+/g, ' ').trim()
        || (img && img.getAttribute('alt')) || link.href;
      linkCell = link;
    }

    if (imageCell || linkCell) cells.push([imageCell, linkCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-offers', cells });
  element.replaceWith(block);
}
