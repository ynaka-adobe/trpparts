import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { toEmbedUrl, openVideo } from '../cards-video/cards-video.js';

const PAGE_SIZE = 15;
const PAGE_WINDOW = 5;
const BRANDS_VISIBLE = 11;
const BRAND_PRIORITY = ['TRP', 'PACCAR Genuine', 'Kenworth', 'Peterbilt'];
const TAG_LINE = /^\s*Type:\s*(.*?)\s*\|\s*Brand:\s*(.*?)\s*$/i;

let instance = 0;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  node.append(...children);
  return node;
}

/** "Bendix [BENDX]" -> "Bendix" */
function cleanBrand(brand) {
  return brand.replace(/\s*\[[^\]]*\]\s*$/, '').trim();
}

/** source order: priority brands, then ordinal (code point) order like the source facet */
function compareBrands(a, b) {
  const ia = BRAND_PRIORITY.indexOf(a);
  const ib = BRAND_PRIORITY.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

function compareTypes(a, b) {
  return a.localeCompare(b, 'en');
}

/**
 * Thumbnail of a resource derived from its link, as the source site does: PDFs on the asset
 * server have a cover image at the same name under /thumbnail/, YouTube videos have mqdefault.
 * Authors can still add their own image to a card; this covers cards without one (a page may
 * hold at most 200 images, fewer than the resource list has).
 * @param {string} href resource link
 * @param {string|null} embedUrl video embed URL, if the link is a video
 * @returns {string|null}
 */
function thumbnailFor(href, embedUrl) {
  if (embedUrl) {
    const [, id] = new URL(embedUrl).pathname.match(/^\/embed\/([^/]+)/) || [];
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  }
  const url = new URL(href, window.location.href);
  if (url.hostname !== 'assets.trpparts.com' || !/^\/raw\/.+\.pdf$/i.test(url.pathname)) return null;
  url.pathname = url.pathname.replace(/^\/raw\//, '/thumbnail/');
  return url.href;
}

let videoCssLoaded;
async function playVideo(embedUrl, title) {
  // the player styles live in the cards-video stylesheet
  videoCssLoaded = videoCssLoaded || loadCSS(`${window.hlx.codeBasePath}/blocks/cards-video/cards-video.css`);
  await videoCssLoaded;
  openVideo(embedUrl, title);
}

/**
 * Turns one authored row into a resource card and returns its search/facet data.
 * @param {Element} row
 * @returns {{li: Element, title: string, text: string, type: string, brand: string}}
 */
function buildItem(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img') && !c.querySelector('h1, h2, h3, h4, h5, h6'));
  // the image cell can be empty (no thumbnail), so the body is the cell holding the content
  const bodyCell = cells.find((c) => c !== imageCell && c.querySelector('h1, h2, h3, h4, h5, h6'))
    || cells.find((c) => c !== imageCell && c.textContent.trim())
    || el('div');

  // tag line: "Type: <type> | Brand: <brand>"
  let type = '';
  let brand = '';
  [...bodyCell.querySelectorAll('p')].reverse().some((p) => {
    const match = p.textContent.match(TAG_LINE);
    if (!match) return false;
    [, type, brand] = match;
    brand = cleanBrand(brand);
    p.remove();
    return true;
  });

  const heading = bodyCell.querySelector('h1, h2, h3, h4, h5, h6');
  const title = (heading?.textContent || '').trim();
  const description = [...bodyCell.querySelectorAll('p')]
    .filter((p) => !p.querySelector('a') || p.textContent.trim() !== p.querySelector('a').textContent.trim())
    .map((p) => p.textContent.trim())
    .join(' ');

  const li = el('li', { className: 'cards-resources-item' });
  if (heading) {
    heading.classList.add('cards-resources-title');
    li.append(heading);
  }
  const content = el('div', { className: 'cards-resources-item-content' });
  const image = el('div', { className: 'cards-resources-card-image' });
  if (imageCell) image.append(...imageCell.childNodes);
  const body = el('div', { className: 'cards-resources-card-body' });
  body.append(...bodyCell.childNodes);
  content.append(image, body);
  li.append(content);

  // primary link: the title link, else the first link in the card
  const primary = heading?.querySelector('a[href]') || li.querySelector('a[href]');
  const embedUrl = primary ? toEmbedUrl(primary.href) : null;

  li.querySelectorAll('a[href]').forEach((a) => {
    const linkEmbed = toEmbedUrl(a.href);
    if (linkEmbed) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        playVideo(linkEmbed, title);
      });
    } else if (/\.pdf$/i.test(new URL(a.href, window.location.href).pathname)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    if (a.classList.contains('button')) a.classList.add('cards-resources-cta');
  });

  // no authored image: use the resource's own thumbnail
  if (primary && !image.querySelector('picture, img')) {
    const src = thumbnailFor(primary.href, embedUrl);
    if (src) {
      // loading is set before src so a detached card never starts an eager download
      const img = el('img', { loading: 'lazy', alt: '' });
      img.src = src;
      // drop the thumbnail when it fails (e.g. a removed video, whose placeholder is 120px wide)
      const drop = () => {
        image.replaceChildren();
        image.classList.add('cards-resources-card-image-empty');
      };
      img.addEventListener('error', drop);
      img.addEventListener('load', () => { if (embedUrl && img.naturalWidth <= 120) drop(); });
      image.append(el('p', {}, img));
    }
  }

  // the thumbnail links to the resource too (unless authored with its own link)
  const picture = image.querySelector('picture, img');
  if (picture && primary && !image.querySelector('a[href]')) {
    const target = picture.closest('p') || picture;
    let wrapper;
    if (embedUrl) {
      wrapper = el('button', {
        type: 'button',
        className: 'cards-resources-thumbnail',
        'aria-label': title ? `Play video: ${title}` : 'Play video',
      });
      wrapper.addEventListener('click', () => playVideo(embedUrl, title));
    } else {
      wrapper = el('a', {
        href: primary.href,
        className: 'cards-resources-thumbnail',
        target: primary.target || undefined,
        rel: primary.rel || undefined,
        tabindex: '-1',
        'aria-hidden': 'true',
      });
    }
    target.replaceWith(wrapper);
    wrapper.append(target);
  }
  if (!picture) image.classList.add('cards-resources-card-image-empty');

  return {
    li,
    title: title.toLowerCase(),
    text: description.toLowerCase(),
    type,
    brand,
    isVideo: Boolean(embedUrl),
  };
}

function buildFacetGroup(id, label) {
  const listId = `${id}-list`;
  const toggle = el('button', {
    type: 'button',
    className: 'cards-resources-facet-toggle',
    'aria-expanded': 'true',
    'aria-controls': listId,
  }, label);
  const fieldset = el(
    'fieldset',
    { className: 'cards-resources-facet-options', id: listId },
    el('legend', { className: 'cards-resources-visually-hidden' }, label),
  );
  const ul = el('ul');
  fieldset.append(ul);
  const group = el(
    'div',
    { className: 'cards-resources-facet' },
    el('h3', { className: 'cards-resources-facet-heading' }, toggle),
    fieldset,
  );
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    fieldset.hidden = expanded;
  });
  return { group, ul, fieldset };
}

function pageButton(label, page, extra = {}) {
  return el('button', {
    type: 'button',
    className: 'cards-resources-page',
    'data-page': String(page),
    ...extra,
  }, label);
}

export default function decorate(block) {
  instance += 1;
  const uid = `cards-resources-${instance}`;
  const items = [...block.children].map(buildItem);

  items.forEach(({ li, isVideo }, i) => {
    let img = li.querySelector('.cards-resources-card-image img');
    if (!img) return;
    // media-bus images: request them at thumbnail size
    // (a 1/6 column on desktop, full width on mobile)
    const url = new URL(img.src, window.location.href);
    if (url.origin === window.location.origin && !/\.svg$/i.test(url.pathname)) {
      const optimized = createOptimizedPicture(img.src, img.alt, false, [
        { media: '(width >= 768px)', width: '300' },
        { width: '750' },
      ]);
      (img.closest('picture') || img).replaceWith(optimized);
      img = optimized.querySelector('img');
    }
    // intrinsic size to reserve space:
    // PDF covers are US Letter at 72 dpi, YouTube mqdefault is 320x180
    const [width, height] = isVideo ? [320, 180] : [612, 792];
    img.width = width;
    img.height = height;
    // only the first card can be the LCP image; the rest load when their page is shown
    if (i === 0) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    } else {
      img.loading = 'lazy';
      img.removeAttribute('fetchpriority');
    }
  });

  const state = {
    keyword: '',
    types: new Set(),
    brands: new Set(),
    page: 1,
    showAllBrands: false,
  };

  /* search */
  const searchId = `${uid}-search`;
  const searchInput = el('input', {
    type: 'search', id: searchId, name: 'resourceKeyword', autocomplete: 'off',
  });
  const searchForm = el(
    'form',
    { className: 'cards-resources-search', role: 'search' },
    el('label', { for: searchId }, 'Search Resources'),
    el(
      'div',
      { className: 'cards-resources-search-row' },
      searchInput,
      el(
        'button',
        { type: 'submit', className: 'cards-resources-search-submit' },
        el('span', { className: 'cards-resources-visually-hidden' }, 'Search Resources'),
      ),
    ),
  );

  /* facets */
  const typeGroup = buildFacetGroup(`${uid}-type`, 'Resource Type');
  const brandGroup = buildFacetGroup(`${uid}-brand`, 'Brand');
  const showAll = el('button', {
    type: 'button',
    className: 'cards-resources-show-all',
    'aria-expanded': 'false',
    'aria-controls': `${uid}-brand-list`,
  }, 'Show All');
  brandGroup.fieldset.append(showAll);

  const facetInputs = { types: new Map(), brands: new Map() };
  const addValues = (values, group, key, prefix) => {
    values.forEach((value, i) => {
      const id = `${uid}-${prefix}-${i}`;
      const input = el('input', {
        type: 'checkbox', id, name: prefix, value,
      });
      const label = el('label', { for: id });
      const li = el('li', {}, input, label);
      group.ul.append(li);
      facetInputs[key].set(value, { input, label, li });
      input.addEventListener('change', () => {
        if (input.checked) state[key].add(value);
        else state[key].delete(value);
        state.page = 1;
        // eslint-disable-next-line no-use-before-define
        update();
      });
    });
  };
  const uniq = (key) => [...new Set(items.map((i) => i[key]).filter(Boolean))];
  addValues(uniq('type').sort(compareTypes), typeGroup, 'types', 'type');
  addValues(uniq('brand').sort(compareBrands), brandGroup, 'brands', 'brand');

  // "Refine by" is a plain heading on desktop and a collapsed toggle on mobile (like the source)
  const facetsId = `${uid}-facets`;
  const refineToggle = el('button', {
    type: 'button',
    className: 'cards-resources-refine-toggle',
    'aria-controls': facetsId,
  }, 'Refine by');
  const facets = el('div', { className: 'cards-resources-facets', id: facetsId });
  if (facetInputs.types.size) facets.append(typeGroup.group);
  if (facetInputs.brands.size) facets.append(brandGroup.group);
  const sidebar = el(
    'aside',
    { className: 'cards-resources-sidebar', 'aria-label': 'Refine results' },
    el('h2', { className: 'cards-resources-refine' }, refineToggle),
    facets,
  );
  const desktop = window.matchMedia('(width >= 768px)');
  const syncRefine = () => {
    refineToggle.disabled = desktop.matches;
    if (desktop.matches) refineToggle.removeAttribute('aria-expanded');
    else refineToggle.setAttribute('aria-expanded', String(sidebar.classList.contains('is-open')));
  };
  refineToggle.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
    syncRefine();
  });
  desktop.addEventListener('change', syncRefine);
  syncRefine();

  /* results */
  const countTop = el('p', {
    className: 'cards-resources-count', role: 'status', 'aria-live': 'polite', tabindex: '-1',
  });
  const countBottom = el('p', { className: 'cards-resources-count' });
  const navTop = el('nav', { className: 'cards-resources-pagination', 'aria-label': 'Resources pagination (top)' });
  const navBottom = el('nav', { className: 'cards-resources-pagination', 'aria-label': 'Resources pagination (bottom)' });
  // only the current page's cards are in the document; the rest stay detached until shown
  const list = el('ul', { className: 'cards-resources-list' });
  const empty = el('p', { className: 'cards-resources-empty', hidden: true }, 'No resources match your selection.');

  const results = el(
    'div',
    { className: 'cards-resources-results' },
    el('div', { className: 'cards-resources-results-bar' }, countTop, navTop),
    list,
    empty,
    el('div', { className: 'cards-resources-results-bar' }, countBottom, navBottom),
  );

  const layout = el('div', { className: 'cards-resources-layout' }, sidebar, results);
  block.replaceChildren(layout);

  // the source puts the search box beside the page title: when the default content right
  // before the block ends with an h1, pair both in a header row; otherwise keep it in the block
  const previous = block.closest('.cards-resources-wrapper')?.previousElementSibling;
  const title = previous?.classList.contains('default-content-wrapper')
    && previous.lastElementChild?.tagName === 'H1' ? previous.lastElementChild : null;
  if (title) {
    const header = el('div', { className: 'cards-resources-header' });
    title.replaceWith(header);
    header.append(title, searchForm);
  } else {
    block.prepend(searchForm);
  }

  const matchesKeyword = (item) => !state.keyword
    || item.title.includes(state.keyword) || item.text.includes(state.keyword);
  const matchesTypes = (item) => !state.types.size || state.types.has(item.type);
  const matchesBrands = (item) => !state.brands.size || state.brands.has(item.brand);

  function renderFacetCounts(key, field, pool) {
    const counts = new Map();
    pool.forEach((item) => counts.set(item[field], (counts.get(item[field]) || 0) + 1));
    let shown = 0;
    facetInputs[key].forEach(({ input, label, li }, value) => {
      const count = counts.get(value) || 0;
      label.textContent = `${value} (${count})`;
      const available = count > 0 || input.checked;
      if (available) shown += 1;
      const collapsed = key === 'brands' && !state.showAllBrands && shown > BRANDS_VISIBLE;
      li.hidden = !available || collapsed;
    });
    return shown;
  }

  function renderPagination(nav, page, pages) {
    const ul = el('ul');
    const add = (button) => ul.append(el('li', {}, button));
    if (pages > 1) {
      if (page > 1) {
        add(pageButton('«', 1, { 'aria-label': 'First page', className: 'cards-resources-page cards-resources-page-arrow' }));
        add(pageButton('‹', page - 1, { 'aria-label': 'Previous page', className: 'cards-resources-page cards-resources-page-arrow' }));
      }
      const centered = page - Math.floor(PAGE_WINDOW / 2);
      const start = Math.max(1, Math.min(centered, pages - PAGE_WINDOW + 1));
      const end = Math.min(pages, start + PAGE_WINDOW - 1);
      for (let p = start; p <= end; p += 1) {
        add(pageButton(String(p), p, {
          'aria-label': `Page ${p}`,
          'aria-current': p === page ? 'page' : undefined,
        }));
      }
      if (page < pages) {
        add(pageButton('›', page + 1, { 'aria-label': 'Next page', className: 'cards-resources-page cards-resources-page-arrow' }));
        add(pageButton('»', pages, { 'aria-label': 'Last page', className: 'cards-resources-page cards-resources-page-arrow' }));
      }
    }
    nav.replaceChildren(ul);
    nav.hidden = pages <= 1;
  }

  function update() {
    const byKeyword = items.filter(matchesKeyword);
    renderFacetCounts('types', 'type', byKeyword.filter(matchesBrands));
    const brandCount = renderFacetCounts('brands', 'brand', byKeyword.filter(matchesTypes));
    showAll.hidden = brandCount <= BRANDS_VISIBLE;
    showAll.textContent = state.showAllBrands ? 'Show Less' : 'Show All';
    showAll.setAttribute('aria-expanded', String(state.showAllBrands));

    const matches = byKeyword.filter((i) => matchesTypes(i) && matchesBrands(i));
    const total = matches.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), pages);
    const from = (state.page - 1) * PAGE_SIZE;
    list.replaceChildren(...matches.slice(from, from + PAGE_SIZE).map((item) => item.li));

    const countText = total
      ? `Results ${from + 1}-${Math.min(from + PAGE_SIZE, total)} of ${total}`
      : 'Results 0 of 0';
    countTop.textContent = countText;
    countBottom.textContent = countText;
    empty.hidden = total > 0;
    renderPagination(navTop, state.page, pages);
    renderPagination(navBottom, state.page, pages);
  }

  showAll.addEventListener('click', () => {
    state.showAllBrands = !state.showAllBrands;
    update();
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.keyword = searchInput.value.trim().toLowerCase();
    state.page = 1;
    update();
  });
  // clearing the field (Esc or the clear "x") resets the keyword
  searchInput.addEventListener('search', () => {
    if (!searchInput.value.trim() && state.keyword) {
      state.keyword = '';
      state.page = 1;
      update();
    }
  });

  results.addEventListener('click', (e) => {
    const button = e.target.closest('.cards-resources-page');
    if (!button) return;
    state.page = Number(button.dataset.page);
    update();
    countTop.focus({ preventScroll: true });
    block.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  update();
}
