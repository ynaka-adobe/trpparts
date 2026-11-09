/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table (part-number and store tables in trpparts.com articles).
 * Block table: block name row, then one row per table row (the source's thead row first, which the
 * table block renders as the header), one cell per column.
 * Source: <table class="mobile-formatted [striped]">. Each body cell starts with a <span> repeating
 * its column name (shown only on phones by the source); that label is dropped. Header rows shorter
 * than the body (a one-cell caption over a two-column table) are padded with empty cells. Cells keep
 * inline content (links, <sup>). "striped" tables become Table (striped).
 */

function cellContent(document, cell) {
  const div = document.createElement('div');
  const label = cell.firstElementChild;
  if (label && label.tagName === 'SPAN' && cell.firstChild === label) label.remove();
  div.append(...cell.childNodes);
  div.innerHTML = div.innerHTML.replace(/\s+/g, ' ').trim();
  return div;
}

export default function parse(element, { document }) {
  const rows = [...element.querySelectorAll(':scope > thead > tr, :scope > tbody > tr')];
  if (!rows.length) rows.push(...element.querySelectorAll('tr'));
  const width = rows.reduce((max, tr) => Math.max(max, tr.querySelectorAll(':scope > th, :scope > td').length), 0);

  const cells = rows.map((tr) => {
    const row = [...tr.querySelectorAll(':scope > th, :scope > td')].map((c) => cellContent(document, c));
    while (row.length < width) row.push('');
    return row;
  });

  const name = element.classList.contains('striped') ? 'Table (striped)' : 'Table';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  const wrapper = element.closest('.parts-page-wrapper');
  element.replaceWith(block);
  if (wrapper && !wrapper.querySelector('table')) wrapper.replaceWith(...wrapper.childNodes);
}
