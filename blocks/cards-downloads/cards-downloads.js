import { createOptimizedPicture } from '../../scripts/aem.js';

/** text of a node with collapsed whitespace */
function text(node) {
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}

/** strips the default button decoration from a link */
function plainLink(a) {
  a.classList.remove('button', 'primary', 'secondary');
  a.parentElement?.classList.remove('button-container');
  a.classList.add('cards-downloads-link');
  return a;
}

/**
 * Same-origin, non-SVG images are re-requested at card size (~345px wide).
 * @param {Element} img
 */
function optimize(img) {
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) {
    img.loading = 'lazy';
    return;
  }
  const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
  (img.closest('picture') || img).replaceWith(picture);
}

/**
 * One format row: label, then its size links.
 * @param {string} label
 * @param {Element[]} links
 * @param {string} title card title, used for the links' accessible names
 * @returns {Element}
 */
function formatRow(label, links, title) {
  const row = document.createElement('div');
  row.className = 'cards-downloads-format';
  const name = document.createElement('span');
  name.className = 'cards-downloads-format-label';
  name.textContent = label;
  row.append(name);
  links.forEach((a) => {
    plainLink(a);
    const size = text(a);
    if (!a.getAttribute('aria-label') && size) {
      a.setAttribute('aria-label', [title, label, size, 'Download'].filter(Boolean).join(' '));
    }
    row.append(a);
  });
  return row;
}

/**
 * Turns one authored row (image cell, body cell) into a download card.
 * @param {Element} row
 * @returns {Element}
 */
function buildItem(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img') && !text(c));
  const bodyCell = cells.find((c) => c !== imageCell && text(c)) || document.createElement('div');

  const li = document.createElement('li');
  li.className = 'cards-downloads-item';

  const image = document.createElement('div');
  image.className = 'cards-downloads-card-image';
  if (imageCell) image.append(...imageCell.childNodes);
  const img = image.querySelector('img');
  if (img) optimize(img);
  else image.classList.add('cards-downloads-card-image-empty');

  const body = document.createElement('div');
  body.className = 'cards-downloads-card-body';

  // title: a heading, else the first paragraph without links
  const blocks = [...bodyCell.children];
  const titleEl = blocks.find((el) => /^H[1-6]$/.test(el.tagName))
    || blocks.find((el) => el.tagName === 'P' && !el.querySelector('a[href]'));
  const title = text(titleEl);
  if (titleEl) {
    titleEl.classList.add('cards-downloads-title');
    body.append(titleEl);
  }

  // format rows: "<label> <link> <link>" per paragraph; a paragraph holding only
  // links (or a link authored on its own line) continues the previous row
  const formats = document.createElement('div');
  formats.className = 'cards-downloads-formats';
  let current = null;
  blocks.filter((el) => el !== titleEl).forEach((el) => {
    const links = [...el.querySelectorAll('a[href]')];
    const label = [...el.childNodes]
      .filter((n) => !(n.nodeType === Node.ELEMENT_NODE && (n.matches('a') || n.querySelector('a'))))
      .map((n) => n.textContent)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (label) {
      current = formatRow(label, links, title);
      formats.append(current);
    } else if (links.length && current) {
      const label0 = text(current.querySelector('.cards-downloads-format-label'));
      current.append(...formatRow(label0, links, title).querySelectorAll('a'));
    } else if (links.length) {
      current = formatRow('', links, title);
      formats.append(current);
    }
  });
  if (formats.children.length) body.append(formats);

  li.append(image, body);
  return li;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.append(...[...block.children].map(buildItem));
  block.replaceChildren(ul);
}
