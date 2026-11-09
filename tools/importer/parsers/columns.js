/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns (article bodies on trpparts.com media-center pages).
 * Block table: block name row, then one row whose cells are the side-by-side columns.
 * Sources:
 *   .flex-container / .flex-container1: cells = the :scope > .column-* children (any other child,
 *     e.g. a note paragraph under the columns, stays default content after the block, in order);
 *   .cvsa-intro / .roadcheck-intro: a "lockup" image floated beside its text; cell 1 = the image,
 *     cell 2 = everything else.
 * Each cell keeps its content (headings, paragraphs, lists, images, links); wrapper divs inside a
 * cell are unwrapped so the cell holds plain authored content.
 * Options: (wide-narrow) / (narrow-wide) for a 2:1 split (source column-2 beside column-1), and
 * (lockup) for the lockup image beside its text.
 */

function unwrapDivs(el) {
  el.querySelectorAll('div, section').forEach((d) => {
    d.replaceWith(...d.childNodes);
  });
  return el;
}

export default function parse(element, { document }) {
  let cells;
  let variant = '';
  const after = [];

  if (element.matches('.cvsa-intro, .roadcheck-intro')) {
    // the lockup keeps its own (small) width beside the text
    variant = 'lockup';
    const img = element.querySelector(':scope > img, :scope > picture, :scope > p > img');
    const imageCell = document.createElement('div');
    if (img) {
      const p = img.closest('p');
      imageCell.append(p && p.parentElement === element ? p : img);
    }
    const textCell = document.createElement('div');
    textCell.append(...element.childNodes);
    cells = [[imageCell, unwrapDivs(textCell)]];
  } else {
    const columns = [];
    [...element.children].forEach((child) => {
      if ([...child.classList].some((c) => /^column-\d+$/.test(c))) columns.push(child);
      else after.push(child);
    });
    if (columns.length < 2) {
      // not really columns: keep the content as default content
      element.replaceWith(...element.childNodes);
      return;
    }
    // the source sizes columns by their class (column-2 is twice as wide as column-1): keep a
    // 2:1 split as a block option
    const flexes = columns.map((col) => Number(([...col.classList].find((c) => /^column-\d+$/.test(c)) || '-1').split('-')[1]));
    if (columns.length === 2 && flexes[0] !== flexes[1]) {
      variant = flexes[0] > flexes[1] ? 'wide-narrow' : 'narrow-wide';
    }
    cells = [columns.map((col) => {
      const cell = document.createElement('div');
      cell.append(...col.childNodes);
      return unwrapDivs(cell);
    })];
  }

  const name = variant ? `Columns (${variant})` : 'Columns';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block, ...after);
}
