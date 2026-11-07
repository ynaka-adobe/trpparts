// desktop header layout starts above the source site's 64em (1024px) mobile breakpoint
const isDesktop = window.matchMedia('(width >= 1025px)');

// nav sections in authoring order
const SECTION_ROLES = ['utility', 'account', 'main', 'search'];

/**
 * Fetches the nav fragment (local preview first, then the site root on DA/EDS) and
 * normalizes the markup Document Authoring produces: list items whose inline content is
 * wrapped in a <p> are unwrapped, and relative image/picture sources are resolved against
 * the fragment URL (so they also work on pages below the site root).
 * @returns {Promise<HTMLElement|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  wrapper.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
  wrapper.querySelectorAll('img').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
    img.loading = 'eager';
  });
  wrapper.querySelectorAll('source[srcset]').forEach((source) => {
    source.srcset = source.getAttribute('srcset').split(',')
      .map((candidate) => {
        const [src, ...descriptor] = candidate.trim().split(/\s+/);
        return [new URL(src, resp.url).href, ...descriptor].join(' ');
      })
      .join(', ');
  });
  return wrapper;
}

/**
 * True when a link should toggle the account panel instead of navigating: an in-page hash,
 * or the same page the account form submits to (a no-JS fallback that survives authoring).
 */
function isAccountLink(link, accountAction) {
  const href = link.getAttribute('href') || '';
  if (href.startsWith('#')) return true;
  if (!accountAction) return false;
  const path = (url) => new URL(url, window.location.href).pathname.replace(/\/$/, '');
  return path(link.href) === path(accountAction);
}

function createIcon(name) {
  const span = document.createElement('span');
  span.className = `icon icon-${name}`;
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function textOf(node) {
  return [...node.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent.trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Animates a collapsible element between 0 and its content height.
 * @param {Element} el collapsible element
 * @param {boolean} open target state
 */
function setCollapsed(el, open) {
  el.style.height = open ? `${el.scrollHeight}px` : '';
}

function panelOf(root, toggle) {
  const id = toggle.getAttribute('aria-controls');
  return (id && root.querySelector(`#${id}`)) || toggle.nextElementSibling;
}

/**
 * Opens or closes a click-toggled panel. Closed panels stay rendered off-screen but inert;
 * every toggle controlling the same panel reflects its state.
 */
function setExpanded(root, toggle, open) {
  const panel = panelOf(root, toggle);
  if (!panel) return;
  panel.classList.toggle('is-open', open);
  panel.inert = !open;
  root.querySelectorAll(`[aria-controls="${panel.id}"]`).forEach((t) => t.setAttribute('aria-expanded', open ? 'true' : 'false'));
}

function closeToggles(root, exceptPanel) {
  root.querySelectorAll('[data-toggle]').forEach((toggle) => {
    if (panelOf(root, toggle) !== exceptPanel) setExpanded(root, toggle, false);
  });
}

function bindToggle(root, toggle) {
  toggle.dataset.toggle = '';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const panel = panelOf(root, toggle);
    const open = !panel.classList.contains('is-open');
    closeToggles(root, panel);
    setExpanded(root, toggle, open);
  });
}

/**
 * Replaces an authored link (used as a toggle, e.g. href="#...") with a native button
 * carrying the same classes and content.
 * @returns {HTMLButtonElement}
 */
function toButton(link) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = link.className;
  button.append(...link.childNodes);
  link.replaceWith(button);
  return button;
}

/**
 * Builds the click-to-open pickers (e.g. region, language) from list items shaped
 * "Label <strong>Current</strong> [img] <ul>options</ul>".
 */
function buildPickers(list, root) {
  const pickers = document.createElement('div');
  pickers.className = 'nav-pickers';
  [...list.children].forEach((li, i) => {
    const options = li.querySelector(':scope > ul');
    const picker = document.createElement('div');
    picker.className = 'nav-picker';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nav-picker-trigger';
    trigger.setAttribute('aria-haspopup', 'true');
    const label = document.createElement('span');
    label.className = 'nav-picker-label';
    label.textContent = textOf(li);
    const current = document.createElement('span');
    current.className = 'nav-picker-current';
    current.textContent = li.querySelector(':scope > strong')?.textContent.trim() || '';
    // inline spacing between parts matches the source trigger
    trigger.append(label, ' ', current, ' ');
    const flag = li.querySelector(':scope > picture, :scope > img');
    if (flag) trigger.append(flag, ' ');
    picker.append(trigger);
    if (options) {
      options.className = 'nav-picker-list';
      options.id = `nav-picker-${i}`;
      trigger.setAttribute('aria-controls', options.id);
      picker.append(options);
      bindToggle(root, trigger);
    }
    pickers.append(picker);
  });
  return pickers;
}

/**
 * Builds the account (login) form from a section shaped "<h3>Title</h3> <ul>field labels</ul>
 * <p><strong><a href=action>Submit</a></strong></p> <p>links</p>".
 */
function buildAccountPanel(section) {
  const panel = document.createElement('div');
  panel.className = 'nav-account';
  panel.id = 'nav-account';
  const submitLink = section.querySelector('strong > a');
  const form = document.createElement('form');
  form.method = 'post';
  if (submitLink) form.action = submitLink.href;
  const title = section.querySelector('h1, h2, h3, h4');
  if (title) {
    title.className = 'nav-account-title';
    form.append(title);
  }
  section.querySelectorAll(':scope > ul > li').forEach((li, i) => {
    const text = li.textContent.trim();
    const field = document.createElement('div');
    field.className = 'nav-account-field';
    const label = document.createElement('label');
    label.textContent = text;
    label.htmlFor = `nav-account-field-${i}`;
    const input = document.createElement('input');
    input.id = label.htmlFor;
    const lower = text.toLowerCase();
    if (lower.includes('password')) input.type = 'password';
    else if (lower.includes('email')) input.type = 'email';
    else input.type = 'text';
    [input.name] = text.split(/\s+/);
    input.required = true;
    field.append(label, input);
    form.append(field);
  });
  if (submitLink) {
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'nav-account-submit';
    submit.textContent = submitLink.textContent.trim();
    form.append(submit);
    submitLink.closest('p').remove();
  }
  panel.append(form);
  section.querySelectorAll(':scope > p').forEach((p) => {
    p.className = 'nav-account-links';
    panel.append(p);
  });
  return panel;
}

/**
 * Turns a link with a hash href into a button that toggles the account panel.
 * @returns {HTMLButtonElement}
 */
function bindAccountToggle(root, link) {
  const button = toButton(link);
  button.setAttribute('aria-controls', 'nav-account');
  bindToggle(root, button);
  return button;
}

function buildUtility(section, accountSection, accountAction, root) {
  const bar = document.createElement('div');
  bar.className = 'nav-utility';
  const inner = document.createElement('div');
  inner.className = 'nav-utility-inner';
  const list = section.querySelector(':scope > ul');
  if (list) inner.append(buildPickers(list, root));
  const icons = ['cart', 'credit-card'];
  section.querySelectorAll(':scope > p > a').forEach((a, i) => {
    a.className = `nav-cta nav-cta-${i + 1}`;
    a.prepend(createIcon(icons[i] || 'cart'), ' ');
    inner.append(a);
    if (accountSection && isAccountLink(a, accountAction)) {
      bindAccountToggle(root, a);
      inner.append(buildAccountPanel(accountSection));
    }
  });
  bar.append(inner);
  return bar;
}

/**
 * Builds the mobile tools (icon links, account toggle, hamburger) from the paragraphs
 * that follow the brand link.
 */
function buildTools(paragraphs, accountAction, root) {
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const icons = ['compass', 'credit-card'];
  let iconIndex = 0;
  paragraphs.forEach((p) => {
    const link = p.querySelector('a');
    if (link) {
      const label = document.createElement('span');
      label.className = 'nav-tool-label';
      label.textContent = link.textContent.trim();
      link.textContent = '';
      link.className = 'nav-tool';
      link.append(createIcon(icons[iconIndex] || 'compass'), label);
      iconIndex += 1;
      tools.append(link);
      if (isAccountLink(link, accountAction)) bindAccountToggle(root, link);
      return;
    }
    // a text-only paragraph labels the hamburger
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-hamburger';
    button.setAttribute('aria-controls', 'nav-sections');
    button.setAttribute('aria-expanded', 'false');
    const bars = document.createElement('span');
    bars.className = 'nav-hamburger-icon';
    bars.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'nav-tool-label';
    label.textContent = p.textContent.trim();
    button.append(bars, label);
    tools.append(button);
  });
  return tools;
}

function toggleMenu(nav, forceOpen = null) {
  const button = nav.querySelector('button.nav-hamburger');
  const sections = nav.querySelector('.nav-sections');
  if (!button || !sections) return;
  const open = forceOpen !== null ? forceOpen : button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  sections.classList.toggle('is-open', open);
  if (!isDesktop.matches) sections.inert = !open;
}

function setDropExpanded(drop, open) {
  const link = drop.querySelector(':scope > a');
  const sub = drop.querySelector(':scope > .nav-dropdown');
  link?.setAttribute('aria-expanded', open ? 'true' : 'false');
  drop.classList.toggle('is-open', open);
  if (sub && !isDesktop.matches) setCollapsed(sub, open);
}

function buildMain(section, accountAction, root) {
  const bar = document.createElement('div');
  bar.className = 'nav-main';
  const inner = document.createElement('div');
  inner.className = 'nav-main-inner';
  const paragraphs = [...section.querySelectorAll(':scope > p')];
  const brandP = paragraphs.find((p) => p.querySelector('a img'));
  if (brandP) {
    const brandLink = brandP.querySelector('a');
    brandLink.className = 'nav-brand';
    inner.append(brandLink);
  }
  const toolPs = paragraphs.filter((p) => p !== brandP);
  if (toolPs.length) inner.append(buildTools(toolPs, accountAction, root));
  const list = section.querySelector(':scope > ul');
  if (list) {
    const sections = document.createElement('div');
    sections.className = 'nav-sections';
    sections.id = 'nav-sections';
    list.className = 'nav-list';
    [...list.children].forEach((li) => {
      li.className = 'nav-item';
      const link = li.querySelector(':scope > a');
      const sub = li.querySelector(':scope > ul');
      if (!sub) return;
      li.classList.add('nav-drop');
      sub.className = 'nav-dropdown';
      // long dropdowns render as a multi-column megamenu
      if (sub.children.length > 8) li.classList.add('nav-drop-mega');
      [...sub.children].forEach((subLi) => {
        const subLink = subLi.querySelector('a');
        // a sub item pointing at its own trigger page is the mobile-only overview link
        if (subLink && link && subLink.href === link.href) subLi.classList.add('nav-overview');
      });
      if (!link) return;
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      // desktop: hover/focus opens (CSS); aria mirrors the state
      li.addEventListener('mouseenter', () => { if (isDesktop.matches) link.setAttribute('aria-expanded', 'true'); });
      li.addEventListener('mouseleave', () => { if (isDesktop.matches) link.setAttribute('aria-expanded', 'false'); });
      li.addEventListener('focusin', () => { if (isDesktop.matches) link.setAttribute('aria-expanded', 'true'); });
      li.addEventListener('focusout', (e) => {
        if (isDesktop.matches && !li.contains(e.relatedTarget)) link.setAttribute('aria-expanded', 'false');
      });
      // mobile: tapping the row expands/collapses it (the overview link navigates)
      link.addEventListener('click', (e) => {
        if (isDesktop.matches) return;
        e.preventDefault();
        setDropExpanded(li, !li.classList.contains('is-open'));
      });
    });
    sections.append(list);
    inner.append(sections);
  }
  bar.append(inner);
  return bar;
}

/**
 * Builds search forms from list items shaped
 * "<a href=action?fixed=v&field=>Label</a> <em>placeholder</em> [<ul>select options</ul>]".
 */
function buildSearch(section) {
  const bar = document.createElement('div');
  bar.className = 'nav-search';
  const inner = document.createElement('div');
  inner.className = 'nav-search-inner';
  const fields = document.createElement('div');
  fields.className = 'nav-search-fields';
  fields.id = 'nav-search-fields';
  const toggleText = section.querySelector(':scope > p')?.textContent.trim();
  if (toggleText) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-search-toggle';
    toggle.textContent = toggleText;
    toggle.setAttribute('aria-controls', fields.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      setCollapsed(fields, open);
    });
    inner.append(toggle);
  }
  section.querySelectorAll(':scope > ul > li').forEach((li, i) => {
    const link = li.querySelector(':scope > a');
    if (!link) return;
    const url = new URL(link.href);
    const params = [...url.searchParams.entries()];
    const [fieldName] = params.pop() || ['q'];
    const form = document.createElement('form');
    form.className = 'nav-search-form';
    form.method = 'get';
    form.action = `${url.origin}${url.pathname}`;
    params.forEach(([name, value]) => {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = name;
      hidden.value = value;
      form.append(hidden);
    });
    const id = `nav-search-field-${i}`;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = link.textContent.trim();
    const control = document.createElement('div');
    control.className = 'nav-search-control';
    const options = li.querySelector(':scope > ul');
    if (options) {
      const select = document.createElement('select');
      select.id = id;
      select.name = fieldName;
      [...options.children].forEach((opt, j) => {
        const option = document.createElement('option');
        option.textContent = opt.textContent.trim();
        option.value = j === 0 ? '' : option.textContent;
        select.append(option);
      });
      select.addEventListener('change', () => { if (select.value) form.submit(); });
      control.classList.add('nav-search-select');
      control.append(select);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = id;
      input.name = fieldName;
      input.placeholder = li.querySelector('em')?.textContent.trim() || '';
      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.setAttribute('aria-label', `${label.textContent} search button`);
      submit.append(createIcon('magnifier'));
      control.append(input, submit);
    }
    form.append(label, control);
    fields.append(form);
  });
  inner.append(fields);
  bar.append(inner);
  return bar;
}

/**
 * Resets mobile-only state (menu, accordions, search expander) when crossing the breakpoint.
 */
function resetLayout(nav) {
  closeToggles(nav);
  toggleMenu(nav, false);
  // the closed mobile menu is inert; on desktop the nav list is always interactive
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) navSections.inert = !isDesktop.matches;
  nav.querySelectorAll('.nav-drop').forEach((drop) => {
    setDropExpanded(drop, false);
    const sub = drop.querySelector(':scope > .nav-dropdown');
    if (sub) sub.style.height = '';
  });
  const searchToggle = nav.querySelector('.nav-search-toggle');
  if (searchToggle) {
    searchToggle.setAttribute('aria-expanded', 'false');
    nav.querySelector('.nav-search-fields').style.height = '';
  }
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;
  const sections = {};
  [...fragment.children].forEach((section, i) => { sections[SECTION_ROLES[i]] = section; });

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  // the account form's submit link identifies which links toggle the login panel
  const accountAction = sections.account?.querySelector('strong > a')?.href;
  if (sections.utility) {
    nav.append(buildUtility(sections.utility, sections.account, accountAction, nav));
  }
  if (sections.main) nav.append(buildMain(sections.main, accountAction, nav));
  if (sections.search) nav.append(buildSearch(sections.search));

  nav.querySelector('button.nav-hamburger')?.addEventListener('click', () => toggleMenu(nav));

  // click-toggled panels close on outside click and Escape
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-picker, .nav-account, [data-toggle]')) closeToggles(nav);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    closeToggles(nav);
    if (!isDesktop.matches) toggleMenu(nav, false);
  });
  isDesktop.addEventListener('change', () => resetLayout(nav));
  resetLayout(nav);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
