/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-member-offers (Cards convention: 2 columns, one row per card).
 * Source: .specials-box #special-offers .special-offer (Performance Membership offers).
 * One row per offer, two cells:
 *   cell 1 = offer image <img> alone (alt = product name)
 *   cell 2 = <p><sup>$</sup>3.00 OFF</p>, <p>product name</p>, <p>Valid until ...</p>
 */
const ORIGIN = 'https://www.trpparts.com';

function absUrl(u) {
  if (!u) return '';
  const s = u.trim();
  if (/^(https?:|data:)/i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
}

function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

// Offer amount: keep <sup>, unwrap other elements (the " off" span); suffix uppercased.
function buildOffer(document, source) {
  const p = document.createElement('p');
  let text = '';
  const flush = () => {
    if (text) p.append(document.createTextNode(text));
    text = '';
  };
  source.childNodes.forEach((node) => {
    if (node.nodeType === 1 && node.tagName === 'SUP') {
      flush();
      const sup = document.createElement('sup');
      sup.textContent = cleanText(node.textContent);
      p.append(sup);
    } else if (node.nodeType === 1 || node.nodeType === 3) {
      text += node.textContent;
    }
  });
  text = text.replace(/\s+/g, ' ');
  flush();
  const first = p.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = p.lastChild;
  if (last && last.nodeType === 3) {
    last.textContent = last.textContent.replace(/\s+$/, '').replace(/\s*\boff$/i, ' OFF');
  }
  return p;
}

function textP(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

export default function parse(element, { document }) {
  const cells = [];
  const items = [...element.querySelectorAll('.special-offer')];

  items.forEach((item) => {
    const info = item.querySelector('p.info');
    const name = cleanText(info ? info.textContent : '');

    // Cell 1: offer image alone
    const imageCell = [];
    const srcImg = item.querySelector('.special-image img') || item.querySelector('img');
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = absUrl(srcImg.getAttribute('src'));
      img.alt = name || cleanText(srcImg.getAttribute('alt'));
      imageCell.push(img);
    }

    // Cell 2: amount, product name, validity
    const content = [];
    const offer = item.querySelector('p.offer');
    if (offer && cleanText(offer.textContent)) content.push(buildOffer(document, offer));
    if (name) content.push(textP(document, name));
    const valid = item.querySelector('p.valid-until');
    const validText = cleanText(valid ? valid.textContent : '');
    if (validText) content.push(textP(document, validText));

    if (imageCell.length || content.length) cells.push([imageCell, content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-member-offers', cells });
  element.replaceWith(block);
}
