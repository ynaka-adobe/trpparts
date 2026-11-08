/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-media (performance membership page).
 * Two source shapes, both a .row inside section.subpage-content:
 *   A) .row:has(> .col-sm-5 .performance-list-img) -> one row [image | text]
 *      image = photo <img> alone; text = <h1>, <ul> of items, then the CTA paragraph split
 *      into <p><strong><a>Sign Up Today</a></strong></p> (redsolid) and
 *      <p><em><a>Log In</a></em></p> (blueoutline).
 *   B) .row:has(> .col-xs-12 > .row > .col-sm-8) -> one row per inner .row, cells in desktop
 *      order (column with first-sm first, last-sm second); text = h2 + p (sup kept),
 *      image = <img> alone. Emitted as "Columns Media (text-first)": on mobile the source shows
 *      the text above the image in both bands.
 * Links keep their href as found (made absolute by the cleanup transformer).
 */

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

function imageCell(document, scope) {
  const src = scope && scope.querySelector('img');
  if (!src || !src.getAttribute('src')) return [];
  const img = document.createElement('img');
  img.src = src.getAttribute('src');
  img.alt = src.getAttribute('alt') || '';
  return [img];
}

function buttonParagraph(document, link, wrapTag) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = link.getAttribute('href');
  a.textContent = cleanText(link.textContent);
  if (wrapTag) {
    const w = document.createElement(wrapTag);
    w.append(a);
    p.append(w);
  } else {
    p.append(a);
  }
  return p;
}

// Shape A: photo beside the rewards list
function parseList(element, document) {
  const imgCol = element.querySelector('.performance-list-img');
  const list = element.querySelector('.performance-list');
  const text = [];
  if (list) {
    const heading = list.querySelector('h1, h2, h3');
    if (heading) {
      text.push(copyInline(document, heading, document.createElement(heading.tagName.toLowerCase())));
    }
    const srcUl = list.querySelector('ul');
    if (srcUl) {
      const ul = document.createElement('ul');
      srcUl.querySelectorAll(':scope > li').forEach((li) => {
        if (!cleanText(li.textContent)) return;
        const nli = document.createElement('li');
        copyInline(document, li.querySelector(':scope > p') || li, nli);
        ul.append(nli);
      });
      if (ul.children.length) text.push(ul);
    }
    list.querySelectorAll('.performance-list-cta a[href]').forEach((a) => {
      let wrap = null;
      if (a.classList.contains('redsolid')) wrap = 'strong';
      else if (a.classList.contains('blueoutline')) wrap = 'em';
      text.push(buttonParagraph(document, a, wrap));
    });
  }
  return [[imageCell(document, imgCol), text]];
}

function textCell(document, col) {
  const text = [];
  col.querySelectorAll('h1, h2, h3, h4, p').forEach((el) => {
    if (el.querySelector('img')) return;
    if (!cleanText(el.textContent)) return;
    text.push(copyInline(document, el, document.createElement(el.tagName.toLowerCase())));
  });
  return text;
}

// Shape B: one row per inner .row, columns in desktop (first-sm / last-sm) order
function parseBands(element, document) {
  const rank = (c) => {
    if (c.classList.contains('first-sm')) return 0;
    if (c.classList.contains('last-sm')) return 2;
    return 1;
  };
  const rows = [];
  let inner = [...element.querySelectorAll(':scope > .col-xs-12 > .row')];
  if (!inner.length) inner = [...element.querySelectorAll('.row')];
  inner.forEach((row) => {
    const cols = [...row.querySelectorAll(':scope > [class*="col-"]')]
      .map((c, i) => ({ c, i }))
      .sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i)
      .map(({ c }) => c);
    const cells = cols.map((c) => (c.querySelector('img') && !c.querySelector('h1, h2, h3, h4')
      ? imageCell(document, c)
      : textCell(document, c)));
    while (cells.length < 2) cells.push('');
    if (cells.some((c) => c && c.length)) rows.push(cells.slice(0, 2));
  });
  return rows;
}

export default function parse(element, { document }) {
  const isList = !!element.querySelector('.performance-list-img, .performance-list');
  const cells = isList ? parseList(element, document) : parseBands(element, document);
  // the bands stack text-first on mobile whichever side the image is on (source DOM order)
  const name = isList ? 'columns-media' : 'columns-media (text-first)';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
