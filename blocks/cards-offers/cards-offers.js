import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      if (div.querySelector('picture') && div.textContent.trim() === '') div.className = 'cards-offers-card-image';
      else div.className = 'cards-offers-card-body';
    });

    // drop empty body cells so the tile is image-only
    li.querySelectorAll('.cards-offers-card-body').forEach((body) => {
      if (!body.textContent.trim() && !body.querySelector('picture, img')) body.remove();
    });

    // a single link in the body makes the whole tile clickable (wraps the image)
    const body = li.querySelector('.cards-offers-card-body');
    const links = body ? [...body.querySelectorAll('a[href]')] : [];
    const image = li.querySelector('.cards-offers-card-image');
    if (links.length === 1 && image && !image.querySelector('a')) {
      const [link] = links;
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.className = 'cards-offers-link';
      if (link.title) anchor.title = link.title;
      anchor.setAttribute('aria-label', link.textContent.trim() || image.querySelector('img')?.alt || '');
      anchor.append(...image.childNodes);
      image.append(anchor);
      // a bare-link body is only the tile's target, not visible copy
      if (body.textContent.trim() === link.textContent.trim()) body.remove();
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}
