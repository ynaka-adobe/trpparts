/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-video.
 * Source: section[aria-label="Video Boxes"] > .container-fluid > .row, cards = :scope > div.col-sm-4.
 * One row per card:
 *   cell 1 = thumbnail image
 *   cell 2 = title paragraph + "Watch Video" link (href = data-href video URL, normalised
 *            to a clean YouTube watch URL; source href is "#").
 */

function toWatchUrl(raw) {
  if (!raw) return '';
  let url;
  try {
    url = new URL(raw.trim(), 'https://www.trpparts.com');
  } catch (e) {
    return raw;
  }
  const host = url.hostname.replace(/^www\./, '');
  let id = '';
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1];
  } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const m = url.pathname.match(/^\/(?:embed|shorts|v)\/([^/?#]+)/);
    id = m ? m[1] : url.searchParams.get('v');
  }
  return id ? `https://www.youtube.com/watch?v=${id}` : url.href;
}

function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const cells = [];
  let cards = [...element.querySelectorAll(':scope > div[class*="col-"]')];
  if (!cards.length) cards = [element];

  cards.forEach((card) => {
    const img = card.querySelector('img');
    const videoEl = card.querySelector('[data-href]');
    const rawHref = videoEl
      ? videoEl.getAttribute('data-href')
      : ([...card.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).find((h) => h && h !== '#') || '');
    const href = toWatchUrl(rawHref);

    // Image cell
    let imageCell = '';
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.getAttribute('src') || '';
      newImg.alt = img.getAttribute('alt') || '';
      imageCell = newImg;
    }

    // Title: text of the paragraph that holds the "Watch Video" link, minus link text
    const paras = [...card.querySelectorAll('p')].filter((p) => !p.querySelector('img'));
    let title = '';
    let linkText = 'Watch Video';
    const textP = paras.find((p) => cleanText(p.textContent));
    if (textP) {
      const clone = textP.cloneNode(true);
      const a = clone.querySelector('a');
      if (a) {
        linkText = cleanText(a.textContent) || linkText;
        a.remove();
      }
      title = cleanText(clone.textContent);
    }
    if (!title && img) title = cleanText(img.getAttribute('alt'));

    const content = [];
    if (title) {
      const p = document.createElement('p');
      p.textContent = title;
      content.push(p);
    }
    if (href) {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = href;
      link.textContent = linkText;
      p.append(link);
      content.push(p);
    }

    if (imageCell || content.length) cells.push([imageCell, content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-video', cells });
  element.replaceWith(block);
}
