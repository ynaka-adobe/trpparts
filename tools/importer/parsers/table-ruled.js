/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table-ruled (Table convention: block name row, then one row per data row,
 * cells = columns; the first data row is the header).
 * Source: .warranty-table, rows = :scope > .header-row, :scope > .body-row (document order),
 * cells = :scope > .cell (each holding a <p>).
 * Each cell becomes plain text; <br> line breaks inside the cell are kept
 * (e.g. "Lifetime<br>3 Year Incandescent/Accessory Warranty"). Header row is plain text too.
 */

function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ');
}

// Plain text of a cell split into lines at <br> (and between block children such as <p>).
function cellLines(cell) {
  const lines = [''];
  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        lines[lines.length - 1] += child.textContent;
      } else if (child.nodeType === 1) {
        if (child.tagName === 'BR') {
          lines.push('');
        } else if (child.tagName === 'P' || child.tagName === 'DIV') {
          if (lines[lines.length - 1].trim()) lines.push('');
          walk(child);
          lines.push('');
        } else {
          walk(child);
        }
      }
    });
  };
  walk(cell);
  return lines.map((l) => cleanText(l).trim()).filter(Boolean);
}

function buildCell(document, cell) {
  const content = [];
  if (!cell) return content;
  cellLines(cell).forEach((line, i) => {
    if (i) content.push(document.createElement('br'));
    content.push(document.createTextNode(line));
  });
  return content;
}

export default function parse(element, { document }) {
  const cells = [];
  let rows = [...element.querySelectorAll(':scope > .header-row, :scope > .body-row')];
  if (!rows.length) rows = [...element.querySelectorAll('.header-row, .body-row')];

  const columnCount = rows.reduce(
    (max, row) => Math.max(max, row.querySelectorAll(':scope > .cell').length),
    0,
  );

  rows.forEach((row) => {
    const rowCells = [...row.querySelectorAll(':scope > .cell')];
    const out = [];
    for (let i = 0; i < columnCount; i += 1) out.push(buildCell(document, rowCells[i]));
    cells.push(out);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-ruled', cells });
  element.replaceWith(block);
}
