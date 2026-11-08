import { createOptimizedPicture } from '../../scripts/aem.js';

const AMOUNT = /\boff\s*$/i;
const VALIDITY = /^\s*valid\s+until/i;
const OFF_SUFFIX = /\s*\boff\s*$/i;

/** text of a node with collapsed whitespace */
function text(node) {
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Same-origin, non-SVG images are re-requested at card size (~300px on desktop);
 * others (the offer images come from the loyalty CDN) are only lazy-loaded.
 * @param {Element} img
 */
function optimize(img) {
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) {
    img.loading = 'lazy';
    return;
  }
  const picture = createOptimizedPicture(img.src, img.alt, false, [
    { media: '(width >= 600px)', width: '400' },
    { width: '750' },
  ]);
  const optimized = picture.querySelector('img');
  // keep the authored intrinsic size, so the image's space is reserved
  ['width', 'height'].forEach((attr) => {
    if (img.hasAttribute(attr)) optimized.setAttribute(attr, img.getAttribute(attr));
  });
  (img.closest('picture') || img).replaceWith(picture);
}

/**
 * Wraps the trailing "OFF" of the amount line in a span so it can be sized apart
 * from the figure ("<sup>$</sup>3.00 OFF").
 * @param {Element} p
 */
function markOff(p) {
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  let last = null;
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim()) last = walker.currentNode;
  }
  if (!last || !OFF_SUFFIX.test(last.textContent)) return;
  const match = last.textContent.match(OFF_SUFFIX);
  const tail = last.splitText(match.index);
  const off = document.createElement('span');
  off.className = 'cards-member-offers-off';
  off.textContent = ` ${tail.textContent.trim()}`;
  tail.replaceWith(off);
}

/**
 * The text lines of the body cell: its paragraphs/headings, or its bare text wrapped in one.
 * @param {Element} cell
 * @returns {Element[]}
 */
function lines(cell) {
  const blocks = [...cell.querySelectorAll(':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')];
  if (blocks.length || !text(cell)) return blocks.filter((el) => text(el));
  const p = document.createElement('p');
  p.append(...cell.childNodes);
  cell.append(p);
  return [p];
}

/**
 * Turns one authored row (image cell, text cell) into a list item.
 * @param {Element} row
 * @returns {Element}
 */
function buildItem(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const bodyCell = cells.find((c) => c !== imageCell && text(c)) || document.createElement('div');

  const li = document.createElement('li');
  li.className = 'cards-member-offers-item';

  const image = document.createElement('div');
  image.className = 'cards-member-offers-card-image';
  if (imageCell) image.append(...imageCell.childNodes);

  const body = document.createElement('div');
  body.className = 'cards-member-offers-card-body';
  const bodyLines = lines(bodyCell);
  body.append(...bodyCell.childNodes);

  // lines are recognized by pattern, so authors can reorder them
  const amount = bodyLines.find((el) => AMOUNT.test(text(el)));
  const validity = bodyLines.find((el) => el !== amount && VALIDITY.test(text(el)));
  const title = bodyLines.find((el) => el !== amount && el !== validity);
  if (amount) {
    amount.classList.add('cards-member-offers-amount');
    markOff(amount);
  }
  title?.classList.add('cards-member-offers-title');
  validity?.classList.add('cards-member-offers-validity');
  // shown in a fixed order (amount, title, validity) whatever the authored order; extras follow
  body.prepend(...[amount, title, validity].filter(Boolean));

  const img = image.querySelector('img');
  if (img) {
    // the product name is the image's description when the author left alt empty
    if (!img.alt && title) img.alt = text(title);
    optimize(img);
  } else {
    image.classList.add('cards-member-offers-card-image-empty');
  }

  li.append(image, body);
  return li;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.append(...[...block.children].map(buildItem));
  block.replaceChildren(ul);
}
