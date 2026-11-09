/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-downloads.
 * Source: ul.media-items.featured-downloads, items = :scope > li.media-item.
 * One row per downloadable:
 *   cell 1 = image (alt = title text, e.g. "TRP® Wallpaper")
 *   cell 2 = <p>title</p> (<sup> kept), then one <p> per .video-info > .row:
 *            "<label> <a>size</a> <a>size</a>" (empty placeholder links skipped)
 * Links keep their href as found (made absolute by the cleanup transformer).
 * The TRP Downloads page (/media-center/trp-downloads/) marks items up a little differently: the
 * title is an <h2>, and some download links sit directly in .video-info (p.download-item, or a <p>
 * with several links split by <br>); each such line of links becomes its own <p>.
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
  let items = [...element.querySelectorAll(':scope > li.media-item')];
  if (!items.length) items = [...element.querySelectorAll('li.media-item')];

  items.forEach((item) => {
    const info = item.querySelector('.video-info');
    const titleP = info
      ? (info.querySelector(':scope > h2, :scope > h3') || info.querySelector(':scope > p'))
      : null;
    const title = cleanText(titleP ? titleP.textContent : '');

    // Cell 1: image (src + alt only)
    const imageCell = [];
    const srcImg = item.querySelector('img');
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = srcImg.getAttribute('src');
      img.alt = title || cleanText(srcImg.getAttribute('alt'));
      imageCell.push(img);
    }

    // Cell 2: title + one paragraph per format row ("Desktop 1920x1080 1024x768")
    const content = [];
    if (titleP && title) {
      content.push(copyInline(document, titleP, document.createElement('p')));
    }

    if (info) {
      info.querySelectorAll(':scope > .row').forEach((row) => {
        const p = document.createElement('p');
        const addSpace = () => { if (p.childNodes.length) p.append(document.createTextNode(' ')); };
        row.querySelectorAll('.download-item').forEach((di) => {
          const links = [...di.querySelectorAll('a')];
          if (!links.length) {
            const label = cleanText(di.textContent);
            if (label) {
              addSpace();
              p.append(document.createTextNode(label));
            }
            return;
          }
          links.forEach((a) => {
            const href = a.getAttribute('href');
            const text = cleanText(a.textContent);
            if (!href || !text) return;
            addSpace();
            p.append(makeLink(document, href, text));
          });
        });
        if (cleanText(p.textContent)) content.push(p);
      });
      // link lines directly in .video-info (TRP Downloads page): one <p> per line of links
      info.querySelectorAll(':scope > p').forEach((line) => {
        if (line === titleP) return;
        let p = document.createElement('p');
        const flush = () => {
          if (cleanText(p.textContent)) content.push(p);
          p = document.createElement('p');
        };
        line.childNodes.forEach((node) => {
          if (node.nodeType === 1 && node.tagName === 'BR') {
            flush();
          } else if (node.nodeType === 1 && node.tagName === 'A') {
            const href = node.getAttribute('href');
            const text = cleanText(node.textContent);
            if (!href || !text) return;
            if (p.childNodes.length) p.append(document.createTextNode(' '));
            p.append(makeLink(document, href, text));
          } else if (cleanText(node.textContent)) {
            if (p.childNodes.length) p.append(document.createTextNode(' '));
            p.append(document.createTextNode(cleanText(node.textContent)));
          }
        });
        flush();
      });
    }

    if (imageCell.length || content.length) cells.push([imageCell, content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-downloads', cells });
  element.replaceWith(block);
}
