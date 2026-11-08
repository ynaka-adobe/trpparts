/* eslint-disable */
/* global WebImporter */

/**
 * Parser for faq-index (custom block: block name row only, no content rows).
 * Source: ul.faqs-links (the jump list of questions above the answers).
 * The block's JS builds the jump list at runtime from the page's H2 questions
 * (the cleanup transformer turns dl.faqs-content into H2 + answer paragraphs),
 * so the authored block is empty and replaces the source list in place.
 */

export default function parse(element, { document }) {
  const cells = [];
  const block = WebImporter.Blocks.createBlock(document, { name: 'faq-index', cells });
  element.replaceWith(block);
}
