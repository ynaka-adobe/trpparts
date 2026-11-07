import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Builds one tile: the whole tile (image + label) is a single link, as on the source.
 * Falls back to image + body cells when the row has no link.
 * @param {Element} row authored block row
 * @returns {HTMLLIElement}
 */
function buildTile(row) {
  const li = document.createElement('li');
  const picture = row.querySelector('picture');
  const link = row.querySelector('a[href]');

  if (!link) {
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      div.className = div.querySelector('picture') ? 'cards-category-card-image' : 'cards-category-card-body';
    });
    return li;
  }

  const a = document.createElement('a');
  a.href = link.getAttribute('href');
  a.className = 'cards-category-link';
  if (link.target) a.target = link.target;

  if (picture) {
    const image = document.createElement('div');
    image.className = 'cards-category-card-image';
    image.append(picture);
    a.append(image);
  } else {
    li.classList.add('cards-category-view-all');
  }

  const label = document.createElement('span');
  label.className = 'cards-category-card-label';
  label.textContent = link.textContent.trim();
  a.append(label);

  li.append(a);
  return li;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => ul.append(buildTile(row)));

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
