import { createOptimizedPicture } from '../../scripts/aem.js';

const READ_MORE = /^\s*read\s+more\s*$/i;

/** text of a link with collapsed whitespace */
function text(node) {
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}

/** true when the paragraph holds nothing but one link (an authored link line) */
function isLinkOnly(p) {
  const a = p.querySelector('a[href]');
  return Boolean(a) && !p.querySelector('picture, img') && text(p) === text(a);
}

/**
 * Same-origin, non-SVG images are re-requested at thumbnail size
 * (~3/12 of a half-width column on desktop, natural size centered on mobile).
 * @param {Element} img
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
    { media: '(width >= 600px)', width: '300' },
    { width: '600' },
  ]);
  const optimized = picture.querySelector('img');
  // keep the intrinsic size Edge Delivery puts on images, so the thumbnail's space is reserved
  ['width', 'height'].forEach((attr) => {
    if (img.hasAttribute(attr)) optimized.setAttribute(attr, img.getAttribute(attr));
  });
  if (priority) optimized.setAttribute('fetchpriority', 'high');
  (img.closest('picture') || img).replaceWith(picture);
}

/**
 * Turns one authored row (image cell, body cell) into a list item.
 * @param {Element} row
 * @returns {Element}
 */
function buildItem(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img') && !c.querySelector('h1, h2, h3, h4, h5, h6'));
  const bodyCell = cells.find((c) => c !== imageCell && text(c)) || document.createElement('div');

  const li = document.createElement('li');
  li.className = 'cards-articles-item';

  const image = document.createElement('div');
  image.className = 'cards-articles-card-image';
  if (imageCell) image.append(...imageCell.childNodes);

  const body = document.createElement('div');
  body.className = 'cards-articles-card-body';
  body.append(...bodyCell.childNodes);

  const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
  heading?.classList.add('cards-articles-title');
  const titleLink = heading?.querySelector('a[href]');
  const title = text(heading);

  // "READ MORE": the link named so, else a trailing link to the title's page
  const links = [...body.querySelectorAll('a[href]')].filter((a) => !heading?.contains(a));
  const more = links.find((a) => READ_MORE.test(text(a)))
    || links.reverse().find((a) => titleLink && a.href === titleLink.href);
  if (more) {
    // a lone READ MORE line would otherwise be decorated as a button
    more.classList.remove('button', 'primary', 'secondary');
    more.parentElement.classList.remove('button-container');
    more.classList.add('cards-articles-more');
    // "READ MORE" alone doesn't say where it goes: add the title for assistive tech and search
    if (title) {
      const about = document.createElement('span');
      about.className = 'cards-articles-visually-hidden';
      about.textContent = ` about ${title}`;
      more.append(about);
    }
    more.closest('p')?.classList.add('cards-articles-teaser');
  }

  // the date: first link-free paragraph (it follows the heading)
  const date = [...body.querySelectorAll(':scope > p')]
    .find((p) => !p.querySelector('a, picture, img') && text(p));
  date?.classList.add('cards-articles-date');

  // thumbnail: link it to the article unless the importer already did
  const img = image.querySelector('img');
  let href = image.querySelector('a[href]')?.href || titleLink?.href || more?.href;
  if (img && !img.closest('a')) {
    // a link authored next to the image (DA can't link images) is the thumbnail's target
    const linkLine = [...image.querySelectorAll('p')].find(isLinkOnly);
    if (linkLine) {
      href = linkLine.querySelector('a').href;
      linkLine.remove();
    }
    if (href) {
      const target = img.closest('picture') || img;
      const a = document.createElement('a');
      a.href = href;
      // the title link already names the article for assistive tech
      a.tabIndex = -1;
      a.setAttribute('aria-hidden', 'true');
      target.replaceWith(a);
      a.append(target);
    }
  }
  const thumbLink = image.querySelector('a[href]');
  if (thumbLink) {
    thumbLink.classList.remove('button', 'primary', 'secondary');
    thumbLink.classList.add('cards-articles-thumbnail');
    // an importer-linked thumbnail duplicates the title link: keep it out of the tab order too
    if (titleLink && thumbLink.href === titleLink.href) {
      thumbLink.tabIndex = -1;
      thumbLink.setAttribute('aria-hidden', 'true');
    }
  }
  if (img) optimize(img);
  else image.classList.add('cards-articles-card-image-empty');

  li.append(image, body);
  return li;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.append(...[...block.children].map(buildItem));
  block.replaceChildren(ul);
}
