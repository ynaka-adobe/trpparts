/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-articles.
 * Source: .media-center .media-column > ul.media-items:not(.featured-downloads),
 * items = :scope > li.media-item (recent articles / press releases).
 * One row per item:
 *   cell 1 = thumbnail <img> (alt = title text; source alt is a file name or empty)
 *   cell 2 = <h3><a>title</a></h3> (inline <sup> kept), <p>date</p>,
 *            <p>teaser <a>READ MORE</a></p>
 * Links keep their href as found (made absolute by the cleanup transformer).
 * The Articles / Press Releases listings (list inside form#mediaList, every year's items in the
 * import snapshot) become "Cards Articles (years)": the block shows one year at a time, and their
 * teasers have no READ MORE link (as on the source).
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

export default function parse(element, { document }) {
  const cells = [];
  const archive = Boolean(element.closest('#mediaList'));
  let items = [...element.querySelectorAll(':scope > li.media-item')];
  if (!items.length) items = [...element.querySelectorAll('li.media-item')];

  items.forEach((item) => {
    const titleLink = item.querySelector('h3 a[href]');
    const titleH3 = item.querySelector('h3');
    const titleSrc = titleLink || titleH3;
    const title = cleanText(titleSrc ? titleSrc.textContent : '');
    const summary = item.querySelector('p.summary');
    const more = summary ? summary.querySelector('a[href]') : null;
    const srcImg = item.querySelector('img');
    const imgLink = srcImg ? srcImg.closest('a[href]') : null;
    const href = (titleLink && titleLink.getAttribute('href'))
      || (more && more.getAttribute('href'))
      || (imgLink && imgLink.getAttribute('href')) || '';

    // Cell 1: thumbnail image alone (not wrapped in its link)
    const imageCell = [];
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = title || cleanText(srcImg.getAttribute('alt'));
      imageCell.push(img);
    }

    // Cell 2: linked title, date, teaser + READ MORE
    const content = [];
    if (titleSrc && title) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        copyInline(document, titleSrc, a);
        h3.append(a);
      } else {
        copyInline(document, titleSrc, h3);
      }
      content.push(h3);
    }

    const details = item.querySelector('p.details');
    if (details && cleanText(details.textContent)) {
      const p = document.createElement('p');
      p.textContent = cleanText(details.textContent);
      content.push(p);
    }

    if (summary) {
      const p = document.createElement('p');
      const teaser = cleanText([...summary.childNodes]
        .filter((n) => !(n.nodeType === 1 && n.tagName === 'A'))
        .map((n) => n.textContent)
        .join(' '));
      if (teaser) p.append(document.createTextNode(`${teaser} `));
      const moreHref = (more && more.getAttribute('href')) || href;
      if (moreHref && !archive) {
        p.append(makeLink(document, moreHref, cleanText(more ? more.textContent : '') || 'READ MORE'));
      }
      if (cleanText(p.textContent)) content.push(p);
    }

    if (imageCell.length || content.length) cells.push([imageCell, content]);
  });

  const name = archive ? 'Cards Articles (years)' : 'cards-articles';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
