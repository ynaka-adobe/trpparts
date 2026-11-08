/**
 * hero-banner
 *
 * Supported authoring structures:
 *  A) Single content row: picture + heading + text + CTA in one cell.
 *     The first picture becomes the full-bleed background.
 *  B) Row 1 = picture only (background), row 2+ = content.
 *     If a content cell starts with a picture (e.g. a logo) followed by
 *     text, it is laid out as a media column beside a text column.
 *  C) One row of two cells, text and a picture-only cell (e.g. a promo with a logo):
 *     no background; the cells sit side by side on the section's color.
 */

const hasText = (el) => el.textContent.trim() !== '';

/** true when the element is a picture, or a wrapper that only holds a picture */
const isPictureOnly = (el) => el.matches('picture')
  || (!!el.querySelector('picture') && !hasText(el) && el.children.length === 1);

/**
 * Structure C: a single row holding a text cell and a picture-only cell.
 * @param {Element[]} rows
 * @returns {boolean}
 */
function isColumnsLayout(rows) {
  if (rows.length !== 1 || rows[0].children.length < 2) return false;
  const cells = [...rows[0].children];
  return cells.some((cell) => cell.querySelector('picture') && !hasText(cell))
    && cells.some(hasText);
}

export default function decorate(block) {
  const rows = [...block.children];
  if (isColumnsLayout(rows)) {
    block.classList.add('hero-banner-columns');
    rows[0].classList.add('hero-banner-content');
    [...rows[0].children].forEach((cell) => {
      const media = cell.querySelector('picture') && !hasText(cell);
      cell.classList.add(media ? 'hero-banner-media' : 'hero-banner-text');
    });
    return;
  }

  let bgRow = rows.find((row) => row.querySelector('picture') && !hasText(row));
  const authoredBackground = !!bgRow;

  if (!bgRow) {
    // structure A: lift the first picture out into a background row
    const picture = block.querySelector('picture');
    if (picture) {
      const wrapper = picture.parentElement;
      bgRow = document.createElement('div');
      const cell = document.createElement('div');
      cell.append(picture);
      bgRow.append(cell);
      block.prepend(bgRow);
      if (wrapper && wrapper.tagName === 'P' && !wrapper.children.length && !hasText(wrapper)) {
        wrapper.remove();
      }
    }
  }

  if (bgRow) bgRow.classList.add('hero-banner-background');

  [...block.children].filter((row) => row !== bgRow).forEach((row) => {
    row.classList.add('hero-banner-content');
    // a leading picture in a content cell is only treated as media when a
    // dedicated background row was authored (structure B)
    if (!authoredBackground) return;
    [...row.children].forEach((cell) => {
      const first = cell.firstElementChild;
      if (!first || !isPictureOnly(first) || cell.children.length < 2) return;
      const media = document.createElement('div');
      media.className = 'hero-banner-media';
      const text = document.createElement('div');
      text.className = 'hero-banner-text';
      media.append(first);
      text.append(...cell.childNodes);
      cell.append(media, text);
      cell.classList.add('hero-banner-split');
      block.classList.add('hero-banner-has-media');
    });
  });
}
