/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quote (a pull quote in a trpparts.com article).
 * Source: <p class="the-quote-border"><span class="the-quote">"…"</span><br>- Name, Title</p>.
 * Row 1 = the quotation, row 2 = the attribution (the text after the quote, leading dash removed).
 */

export default function parse(element, { document }) {
  const quote = element.querySelector('.the-quote');
  if (!quote) return;
  const quotation = document.createElement('p');
  quotation.innerHTML = quote.innerHTML.replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ').trim();
  quote.remove();
  const attribution = document.createElement('p');
  attribution.textContent = element.textContent.replace(/\s+/g, ' ').trim().replace(/^[-–—]\s*/, '');
  const cells = [[quotation]];
  if (attribution.textContent) cells.push([attribution]);
  const block = WebImporter.Blocks.createBlock(document, { name: 'Quote', cells });
  element.replaceWith(block);
}
