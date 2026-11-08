/*
 * faq-index: a jump list of the questions (H2s) that follow the block on the page
 * (source: /about-us/faqs/ ul.faqs-links). The author inserts an empty "FAQ Index"
 * block; the links are built here, so no "#anchor" hrefs are stored in the document.
 */
import { toClassName } from '../../scripts/aem.js';

/** text of a node with collapsed whitespace */
function text(node) {
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Gives a heading an id when Edge Delivery did not, unique within the document.
 * @param {Element} heading
 * @returns {string}
 */
function ensureId(heading) {
  if (heading.id) return heading.id;
  const base = toClassName(text(heading)) || 'question';
  let id = base;
  for (let n = 2; document.getElementById(id); n += 1) id = `${base}-${n}`;
  heading.id = id;
  return id;
}

/**
 * The H2s of the default content after the block, up to the end of main.
 * All sections are in the DOM (decorated) before any block loads, so querying
 * the whole main also finds questions in sections that have not loaded yet.
 * @param {Element} block
 * @returns {Element[]}
 */
function findQuestions(block) {
  const root = block.closest('main') || document.body;
  return [...root.querySelectorAll('h2')].filter((h) => {
    // eslint-disable-next-line no-bitwise
    const following = block.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING;
    return following && !h.closest('.block') && text(h);
  });
}

export default function decorate(block) {
  const questions = findQuestions(block);
  if (!questions.length) {
    // nothing to index: leave no empty wrapper behind
    const wrapper = block.parentElement;
    if (wrapper?.classList.contains('faq-index-wrapper')) wrapper.remove();
    else block.remove();
    return;
  }

  const ul = document.createElement('ul');
  questions.forEach((heading) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${ensureId(heading)}`;
    a.textContent = text(heading);
    li.append(a);
    ul.append(li);
  });

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Questions');
  nav.append(ul);
  block.replaceChildren(nav);
}
