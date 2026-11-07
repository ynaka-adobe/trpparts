/* eslint-disable */
/* global WebImporter */

/**
 * TRP Parts sections transformer.
 * Inserts <hr> section breaks between template sections (beforeTransform, while
 * the original section elements still exist) and adds Section Metadata for
 * styled sections (afterTransform).
 */

const MARKER = 'data-excat-section-id';

function findSectionEl(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector, try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionEl(element, section);
      if (!el || !el.parentNode) continue;
      if (i === 0 && !section.style) continue;
      const hr = doc.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      const anchor = marker || findSectionEl(element, section);
      if (!anchor || !anchor.parentNode) continue;

      const meta = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      if (marker) {
        // Place metadata at the end of the section, i.e. just before the next <hr>
        let end = marker.nextElementSibling;
        while (end && end.tagName !== 'HR') end = end.nextElementSibling;
        if (end) end.parentNode.insertBefore(meta, end);
        else marker.parentNode.appendChild(meta);
        if (i === 0) marker.remove();
        else marker.removeAttribute(MARKER);
      } else {
        anchor.after(meta);
      }
    }
  }
}
