/* cards-deals: dated deal list with search, Category/Brand facets and sorting
   (source: /deals/ section.parts-list-content) */

/** source facet order: product categories, then offer groups */
const CATEGORY_ORDER = [
  'Accessories',
  'Aftertreatment',
  'Battery & Charging',
  'Body, Cab, & Chassis',
  'Brakes',
  'Bus & Trailer Accessories',
  'Cooling System',
  'Drivetrain',
  'Engine',
  'Exhaust & Intake',
  'Fluids, Lubricants, & Chemicals',
  'Fuel & Ignition Systems',
  'Hardware & Shop Supplies',
  'HVAC Systems',
  'Lighting & Wiring',
  'Service',
  'Steering & Suspension',
  'Wheels & Tires',
  'Qualifying Reward Offers',
  'Qualifying Brakes Offers',
  'Qualifying Battery Offers',
  'Limited Time Offers',
  'Most Popular Offers',
  'Deeper Discounts',
  'New Offers',
  'Stock Up Offers',
  'Bundled Offers',
  'OPC Exclusive',
  'EV & Hybrid Offers',
  'Amplified Offers',
  'Made in the USA',
];

const SORTS = [
  ['', 'Default'],
  ['discount-desc', 'Discount: Highest to Lowest'],
  ['discount-asc', 'Discount: Lowest to Highest'],
  ['title-asc', 'A to Z'],
  ['title-desc', 'Z to A'],
  ['expiring', 'Expiring Soon'],
];

const LIMIT_LINE = /Redemption Limit/i;
const VALID_LINE = /^Valid through\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i;
const AMOUNT_LINE = /^\$\s*([\d,.]+)\s*OFF$/i;
const TAG_LINE = /^Category:/i;
const DATE = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;

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

/** "MM/DD/YYYY" -> local Date at the start of that day (or null) */
function parseDate(text) {
  const match = text?.match(DATE);
  if (!match) return null;
  const [, m, d, y] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

const splitList = (text) => text.split(',').map((v) => v.trim()).filter(Boolean);

// known names first, longest first: some contain commas ("Body, Cab, & Chassis")
const KNOWN_CATEGORIES = [...CATEGORY_ORDER].sort((a, b) => b.length - a.length);

/** "Body, Cab, & Chassis, Brakes, Other" -> ["Body, Cab, & Chassis", "Brakes", "Other"] */
const knownPrefix = (text) => KNOWN_CATEGORIES.find((name) => text.toLowerCase()
  .startsWith(name.toLowerCase()) && /^\s*(,|$)/.test(text.slice(name.length)));

function splitCategories(text) {
  const names = [];
  let rest = text.trim();
  while (rest) {
    const known = knownPrefix(rest);
    const comma = rest.indexOf(',');
    let end = comma === -1 ? rest.length : comma;
    if (known) end = known.length;
    const name = known || rest.slice(0, end).trim();
    if (name) names.push(name);
    rest = rest.slice(end).replace(/^\s*,\s*/, '').trim();
  }
  return names;
}

/** "Category: a, b | Brand: c | Starts: MM/DD/YYYY" */
function parseTagLine(text) {
  const tags = { categories: [], brands: [], start: null };
  text.split('|').forEach((part) => {
    const [, key = '', value = ''] = part.match(/^\s*([^:]+):\s*(.*?)\s*$/) || [];
    const name = key.trim().toLowerCase();
    if (name === 'category') tags.categories = splitCategories(value);
    else if (name === 'brand') tags.brands = splitList(value);
    else if (name === 'starts') tags.start = parseDate(value);
  });
  return tags;
}

/** lines of the authored row: block-level children of every cell */
function rowLines(row) {
  return [...row.children].flatMap((cell) => {
    if (cell.children.length) return [...cell.children];
    const text = cell.textContent.trim();
    return text ? [el('p', {}, text)] : [];
  });
}

/**
 * Turns one authored row into a deal card and returns its search/filter/sort data.
 * Lines are recognized by pattern, so optional ones can be left out.
 * @param {Element} row
 * @param {number} index authored position (Default sort)
 */
function buildDeal(row, index) {
  let heading = null;
  let limit = null;
  let valid = null;
  let end = null;
  let amount = null;
  let amountValue = 0;
  let tags = { categories: [], brands: [], start: null };
  const extras = [];

  rowLines(row).forEach((line) => {
    const text = line.textContent.replace(/\s+/g, ' ').trim();
    if (/^H[1-6]$/.test(line.tagName) && !heading) {
      heading = line;
    } else if (TAG_LINE.test(text)) {
      tags = parseTagLine(text);
    } else if (!amount && AMOUNT_LINE.test(text)) {
      const [, value] = text.match(AMOUNT_LINE);
      amountValue = Number.parseFloat(value.replace(/,/g, '')) || 0;
      amount = el(
        'p',
        { className: 'cards-deals-amount' },
        el('span', { className: 'cards-deals-amount-value' }, el('sup', {}, '$'), value),
        ' ',
        el('span', { className: 'cards-deals-amount-off' }, 'OFF'),
      );
    } else if (!valid && VALID_LINE.test(text)) {
      valid = line;
      end = parseDate(text);
    } else if (!limit && LIMIT_LINE.test(text)) {
      limit = line;
    } else if (text || line.querySelector('img, picture')) {
      extras.push(line);
    }
  });

  const title = (heading?.textContent || '').replace(/\s+/g, ' ').trim();
  const info = el('div', { className: 'cards-deals-info' });
  if (heading) {
    const h3 = el('h3', { className: 'cards-deals-title' });
    h3.append(...heading.childNodes);
    info.append(h3);
  }
  extras.forEach((p) => {
    p.classList.add('cards-deals-text');
    info.append(p);
  });
  [[limit, 'cards-deals-limit'], [valid, 'cards-deals-valid']].forEach(([line, className]) => {
    if (!line) return;
    line.classList.add(className);
    info.append(line);
  });

  const li = el('li', { className: 'cards-deals-card' }, info);
  if (amount) li.append(amount);

  return {
    li,
    index,
    title,
    search: [title, ...tags.categories].join(' ').toLowerCase(),
    amount: amountValue,
    end,
    // the deal stays valid through the whole end day (local time)
    until: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : null,
    start: tags.start,
    categories: tags.categories,
    brands: tags.brands,
  };
}

const isActive = (deal, now) => (!deal.until || now < deal.until)
  && (!deal.start || now >= deal.start);

function compareCategories(a, b) {
  const ia = CATEGORY_ORDER.indexOf(a);
  const ib = CATEGORY_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  return a.localeCompare(b, 'en');
}

const byTitle = (a, b) => a.title.localeCompare(b.title, 'en', { numeric: true });
const byIndex = (a, b) => a.index - b.index;
const COMPARATORS = {
  'discount-desc': (a, b) => b.amount - a.amount || byIndex(a, b),
  'discount-asc': (a, b) => a.amount - b.amount || byIndex(a, b),
  'title-asc': (a, b) => byTitle(a, b) || byIndex(a, b),
  'title-desc': (a, b) => byTitle(b, a) || byIndex(a, b),
  // deals without a date go last
  expiring: (a, b) => (a.end?.getTime() ?? Infinity) - (b.end?.getTime() ?? Infinity)
    || byIndex(a, b),
};

function buildFacetGroup(id, label, values, onChange) {
  const optionsId = `${id}-options`;
  const toggle = el('button', {
    type: 'button',
    className: 'cards-deals-facet-toggle',
    'aria-expanded': 'false',
    'aria-controls': optionsId,
  }, label);
  const ul = el('ul');
  const fieldset = el(
    'fieldset',
    { className: 'cards-deals-facet-options', id: optionsId, hidden: true },
    el('legend', { className: 'cards-deals-visually-hidden' }, label),
    ul,
  );
  const inputs = values.map((value, i) => {
    const inputId = `${id}-${i}`;
    const input = el('input', {
      type: 'checkbox', id: inputId, name: id, value,
    });
    input.addEventListener('change', onChange);
    ul.append(el('li', {}, input, el('label', { for: inputId }, value)));
    return input;
  });
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    fieldset.hidden = expanded;
  });
  const group = el('div', { className: 'cards-deals-facet' }, toggle, fieldset);
  return { group, inputs };
}

const checkedValues = (inputs) => new Set(inputs.filter((i) => i.checked).map((i) => i.value));
const specials = (n) => `${n} ${n === 1 ? 'Special' : 'Specials'}`;

export default function decorate(block) {
  instance += 1;
  const uid = `cards-deals-${instance}`;
  const deals = [...block.children].map(buildDeal);
  const now = () => new Date();

  const current = deals.filter((d) => isActive(d, now()));
  if (!current.length) {
    block.replaceChildren(el('p', { className: 'cards-deals-empty' }, 'No current deals.'));
    return;
  }

  /* search */
  const searchId = `${uid}-search`;
  const searchInput = el('input', {
    type: 'search', id: searchId, name: 'deal-search', placeholder: 'Search', autocomplete: 'off',
  });
  const searchForm = el(
    'form',
    { className: 'cards-deals-search', role: 'search' },
    el('label', { for: searchId, className: 'cards-deals-visually-hidden' }, 'Search deals'),
    searchInput,
    el(
      'button',
      { type: 'submit', className: 'cards-deals-search-submit' },
      el('span', { className: 'cards-deals-visually-hidden' }, 'Search'),
    ),
  );

  /* facets: only values used by a current deal */
  // eslint-disable-next-line no-use-before-define
  const onFacetChange = () => update(true);
  const values = (key) => [...new Set(current.flatMap((d) => d[key]))];
  const categoryGroup = buildFacetGroup(`${uid}-category`, 'Category', values('categories').sort(compareCategories), onFacetChange);
  const brandGroup = buildFacetGroup(`${uid}-brand`, 'Brand', values('brands').sort((a, b) => a.localeCompare(b, 'en')), onFacetChange);
  const facets = el('div', { className: 'cards-deals-facets' });
  if (categoryGroup.inputs.length) facets.append(categoryGroup.group);
  if (brandGroup.inputs.length) facets.append(brandGroup.group);

  const clear = el('button', { type: 'button', className: 'cards-deals-clear' }, 'Clear Filters');

  /* sidebar: count, mobile Filter toggle, search + facets + clear */
  const count = el('h2', { className: 'cards-deals-count' });
  const status = el('p', {
    className: 'cards-deals-visually-hidden', role: 'status', 'aria-live': 'polite',
  });
  const panelId = `${uid}-filters`;
  const panel = el('div', { className: 'cards-deals-panel', id: panelId }, searchForm, facets, clear);
  const filterToggle = el('button', {
    type: 'button',
    className: 'cards-deals-filter-toggle',
    'aria-expanded': 'false',
    'aria-controls': panelId,
  }, 'Filter');
  const sidebar = el(
    'div',
    { className: 'cards-deals-sidebar', role: 'region', 'aria-label': 'Filter deals' },
    count,
    status,
    filterToggle,
    panel,
  );
  filterToggle.addEventListener('click', () => {
    const open = !sidebar.classList.contains('is-open');
    sidebar.classList.toggle('is-open', open);
    filterToggle.setAttribute('aria-expanded', String(open));
  });

  /* results: Sort By + list (only matching cards are in the document) */
  const sortId = `${uid}-sort`;
  const sort = el('select', { id: sortId, name: 'deal-sort' });
  SORTS.forEach(([value, label]) => sort.append(el('option', { value }, label)));
  const list = el('ul', { className: 'cards-deals-list' });
  const empty = el('p', { className: 'cards-deals-empty', hidden: true }, 'No deals match your selection.');
  const results = el(
    'div',
    { className: 'cards-deals-results' },
    el(
      'div',
      { className: 'cards-deals-sort' },
      el('label', { for: sortId }, 'Sort By:'),
      sort,
    ),
    list,
    empty,
  );

  block.replaceChildren(el('div', { className: 'cards-deals-layout' }, sidebar, results));

  let keyword = '';
  function update(announce = false) {
    const at = now();
    const categories = checkedValues(categoryGroup.inputs);
    const brands = checkedValues(brandGroup.inputs);
    const matches = deals.filter((d) => isActive(d, at)
      && (!keyword || d.search.includes(keyword))
      && (!categories.size || d.categories.some((c) => categories.has(c)))
      && (!brands.size || d.brands.some((b) => brands.has(b))));
    matches.sort(COMPARATORS[sort.value] || byIndex);
    list.replaceChildren(...matches.map((d) => d.li));
    empty.hidden = matches.length > 0;
    count.textContent = specials(matches.length);
    if (announce) status.textContent = count.textContent;
  }

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    keyword = searchInput.value.replace(/\s+/g, ' ').trim().toLowerCase();
    update(true);
  });
  // clearing the field (Esc or the clear "x") resets the keyword
  searchInput.addEventListener('search', () => {
    if (!searchInput.value.trim() && keyword) {
      keyword = '';
      update(true);
    }
  });
  sort.addEventListener('change', () => update(true));
  clear.addEventListener('click', () => {
    keyword = '';
    searchInput.value = '';
    [...categoryGroup.inputs, ...brandGroup.inputs].forEach((input) => { input.checked = false; });
    sort.value = '';
    update(true);
  });

  update();
}
