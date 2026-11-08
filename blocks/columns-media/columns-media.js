import { createOptimizedPicture } from '../../scripts/aem.js';

/** text of a node with collapsed whitespace */
function text(node) {
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}

/** true when the cell holds images and no text (the media side of a row) */
function isImageCell(cell) {
  return Boolean(cell.querySelector('picture, img')) && !text(cell);
}

/**
 * The link of a paragraph that holds nothing but one link (optionally in strong/em),
 * i.e. an authored button line.
 * @param {Element} p
 * @returns {HTMLAnchorElement|null}
 */
function buttonLink(p) {
  const a = p.querySelector('a[href]');
  if (!a || p.querySelector('picture, img') || text(p) !== text(a)) return null;
  return a;
}

/**
 * Same-origin, non-SVG images are re-requested at column size (the image column
 * is at most ~400px on desktop, full width when stacked on mobile).
 * The authored width/height stay on the optimized img so the space is reserved.
 * @param {HTMLImageElement} img
 */
function optimize(img) {
  // the page's first image (scripts.js marks it fetchpriority=high) can be the LCP: keep it eager
  const priority = img.getAttribute('fetchpriority') === 'high';
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) {
    if (!priority) img.loading = 'lazy';
    return;
  }
  const picture = createOptimizedPicture(img.src, img.alt, priority, [
    { media: '(width >= 600px)', width: '800' },
    { width: '750' },
  ]);
  const optimized = picture.querySelector('img');
  ['width', 'height'].forEach((attr) => {
    if (img.hasAttribute(attr)) optimized.setAttribute(attr, img.getAttribute(attr));
  });
  if (priority) optimized.setAttribute('fetchpriority', 'high');
  (img.closest('picture') || img).replaceWith(picture);
}

/**
 * Text cell: lists get check-mark bullets, consecutive button lines sit in one inline group.
 * Bold links are primary (red filled), italic links secondary (blue outline).
 * @param {Element} cell
 */
function decorateText(cell) {
  cell.classList.add('columns-media-text-col');
  cell.querySelectorAll('ul').forEach((ul) => ul.classList.add('columns-media-checklist'));

  let group = null;
  [...cell.children].forEach((child) => {
    const a = child.tagName === 'P' ? buttonLink(child) : null;
    if (!a) {
      group = null;
      return;
    }
    // decorateButtons normally sets these; set them here too in case it didn't run
    if (!a.classList.contains('button')) {
      a.classList.add('button');
      if (a.closest('strong')) a.classList.add('primary');
      else if (a.closest('em')) a.classList.add('secondary');
    }
    child.classList.add('button-container');
    if (!group) {
      group = document.createElement('div');
      group.className = 'columns-media-buttons';
      child.before(group);
    }
    group.append(child);
  });
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-media-row');
    const cells = [...row.children];
    cells.forEach((cell) => {
      if (isImageCell(cell)) {
        cell.classList.add('columns-media-img-col');
        cell.querySelectorAll('img').forEach(optimize);
      } else {
        decorateText(cell);
      }
    });
    // which side the image sits on (desktop), for side-specific spacing
    if (cells[0]?.classList.contains('columns-media-img-col')) {
      row.classList.add('columns-media-img-start');
    } else if (cells.at(-1)?.classList.contains('columns-media-img-col')) {
      row.classList.add('columns-media-img-end');
    }
  });
}
