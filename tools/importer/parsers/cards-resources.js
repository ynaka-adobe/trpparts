/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-resources.
 * Source: #resources-container.resources-grid, items = :scope > .resources-item
 * (data-type, data-brand attributes; PDF items and YouTube video items).
 * One row per item:
 *   cell 1 = thumbnail image (unwrapped from its link), '' when missing
 *   cell 2 = <h2><a>title</a></h2>, optional description <p>,
 *            <p><a>Download|Watch Video</a></p>,
 *            <p>Type: <type> | Brand: <brand></p> (brand without trailing " [CODE]")
 */

function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function makeLink(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

export default function parse(element, { document }) {
  const cells = [];
  let items = [...element.querySelectorAll(':scope > .resources-item')];
  if (!items.length) items = [...element.querySelectorAll('.resources-item')];

  items.forEach((item) => {
    // Image cell
    let imageCell = '';
    const img = item.querySelector('img');
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.getAttribute('src') || '';
      newImg.alt = img.getAttribute('alt') || '';
      imageCell = newImg;
    }

    // Title
    const titleLink = item.querySelector('h2 a[href]');
    const titleH2 = item.querySelector('h2');
    const title = cleanText((titleLink || titleH2 || {}).textContent);

    // CTA link (".button") and description (other non-empty <p> in the text column)
    const cta = item.querySelector('a.button[href]');
    const href = (titleLink && titleLink.getAttribute('href'))
      || (cta && cta.getAttribute('href')) || '';

    const content = [];
    if (title) {
      const h2 = document.createElement('h2');
      if (href) h2.append(makeLink(document, href, title));
      else h2.textContent = title;
      content.push(h2);
    }

    const descP = [...item.querySelectorAll('p')].find(
      (p) => !p.querySelector('img, a.button') && cleanText(p.textContent),
    );
    if (descP) {
      const p = document.createElement('p');
      p.textContent = cleanText(descP.textContent);
      content.push(p);
    }

    if (cta || href) {
      const ctaHref = (cta && cta.getAttribute('href')) || href;
      const isVideo = (item.getAttribute('data-type') || '') === 'Videos';
      const ctaText = cleanText(cta && cta.textContent) || (isVideo ? 'Watch Video' : 'Download');
      const p = document.createElement('p');
      p.append(makeLink(document, ctaHref, ctaText));
      content.push(p);
    }

    const type = cleanText(item.getAttribute('data-type'));
    const brand = cleanText(item.getAttribute('data-brand')).replace(/\s*\[[^\]]*\]\s*$/, '');
    const tag = document.createElement('p');
    tag.textContent = `Type: ${type} | Brand: ${brand}`;
    content.push(tag);

    cells.push([imageCell, content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-resources', cells });
  element.replaceWith(block);
}
