/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed (a YouTube video in a trpparts.com article).
 * Block table: block name row, then one row with a single cell holding the video URL.
 * Source: <iframe src="https://www.youtube.com/embed/<id>?...">; the cell gets the watch URL
 * (https://www.youtube.com/watch?v=<id>), from which the embed block builds the player.
 */

export default function parse(element, { document }) {
  const src = element.getAttribute('src') || '';
  const id = (src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/) || [])[1];
  if (!id) return;
  const href = `https://www.youtube.com/watch?v=${id}`;
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Embed', cells: [[a]] });
  element.replaceWith(block);
}
