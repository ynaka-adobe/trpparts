import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  sampleRUM,
  readBlockConfig,
  toClassName,
  toCamelCase,
} from './aem.js';
import {
  isUePreviewHost,
  loadTarget,
  applyTargetHeroMboxIfConfigured,
} from './target.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // skip when the heading or image already belongs to an authored block
  const inBlock = (el) => el.closest('main > div > div[class]');
  if (h1 && picture && !inBlock(h1) && !inBlock(picture)
    // eslint-disable-next-line no-bitwise
    && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    if (!main.querySelector('.hero')) buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates all sections in a container element.
 * @param {Element} main The container element
 */
function decorateSections(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.classList.contains('richtext')) {
        e.removeAttribute('class');
        if (!defaultContent) {
          const wrapper = document.createElement('div');
          wrapper.classList.add('default-content-wrapper');
          wrappers.push(wrapper);
          defaultContent = true;
        }
      } else if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(e);
    });

    // Add wrapped content back
    wrappers.forEach((wrapper) => section.append(wrapper));
    section.classList.add('section');
    section.dataset.sectionStatus = 'initialized';
    section.style.display = 'none';

    // Process section metadata
    const sectionMeta = section.querySelector('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      Object.keys(meta).forEach((key) => {
        if (key === 'style') {
          const styles = meta.style
            .split(',')
            .filter((style) => style)
            .map((style) => toClassName(style.trim()));
          styles.forEach((style) => section.classList.add(style));
        } else {
          section.dataset[toCamelCase(key)] = meta[key];
        }
      });
      sectionMeta.parentNode.remove();
    }
  });
}

/**
 * Adds a "Home › {breadcrumb title or page title}" breadcrumb at the top of the first section
 * (the second one when the page opens with a banner: a block-only or colored section)
 * (pages with metadata breadcrumbs: true).
 * @param {Element} main The container element
 */
function buildBreadcrumbs(main) {
  let first = main.querySelector(':scope > div');
  if (!first) return;
  // a leading banner keeps the trail below it: a section holding only a banner block (hero,
  // carousel, promo banner) or a colored band (background section style, e.g. a red header with
  // the page title). A page that opens with a plain list block (TRP Downloads) keeps it on top.
  const bannerOnly = [...first.children].every((el) => el.matches('div[class]'))
    && Boolean(first.querySelector(':scope > [class*="hero"], :scope > [class*="carousel"], :scope > [class*="banner"]'));
  const styles = toClassName(first.querySelector(':scope > .section-metadata')?.textContent || '');
  const coloredBand = /(^|-)(red|dark|light|highlight)(-|$)/.test(styles);
  if ((bannerOnly || coloredBand) && first.nextElementSibling) first = first.nextElementSibling;
  // the trail label can differ from the page title (metadata breadcrumb-title, e.g. "Media")
  const title = getMetadata('breadcrumb-title') || getMetadata('og:title')
    || main.querySelector('h1')?.textContent || document.title;
  const nav = document.createElement('nav');
  nav.className = 'breadcrumbs';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const list = document.createElement('ol');
  const home = document.createElement('li');
  const homeLink = document.createElement('a');
  homeLink.href = '/';
  homeLink.textContent = 'Home';
  home.append(homeLink);
  list.append(home);
  // parent folders become middle crumbs (/about-us/warranty/ -> "About Us"); the local preview
  // serves pages under /content, which is not part of the trail
  const folders = window.location.pathname.replace(/^\/content(?=\/)/, '')
    .split('/').filter(Boolean).slice(0, -1);
  // year folders only group archived pages (/media-center/2026/...) and have no page of their own
  const crumbs = folders.map((folder, i) => ({ folder, href: `/${folders.slice(0, i + 1).join('/')}/` }))
    .filter(({ folder }) => !/^\d{4}$/.test(folder));
  const parentLabel = getMetadata('breadcrumb-parent');
  crumbs.forEach(({ folder, href }, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = (i === crumbs.length - 1 && parentLabel)
      || folder.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    li.append(a);
    list.append(li);
  });
  const current = document.createElement('li');
  current.setAttribute('aria-current', 'page');
  current.textContent = title.trim();
  list.append(current);
  nav.append(list);
  first.prepend(nav);
}

/**
 * Media archive articles: the source floats some product photos right of the text and centers
 * the other images. Authored images carry no alignment, so the page metadata "image-float" lists
 * the floated ones by position among the article's images (e.g. "1").
 * @param {Element} main The container element
 */
function decorateArticleImages(main) {
  if (!document.body.classList.contains('media-article')) return;
  // the site-wide "main img { width: auto }" leaves an image without a size until it loads; its
  // own width (Edge Delivery sets width/height) reserves the space so the text doesn't shift
  main.querySelectorAll('.default-content-wrapper img[width][height]').forEach((img) => {
    img.style.width = `${img.getAttribute('width')}px`;
  });
  const floated = getMetadata('image-float').split(',').map((n) => Number(n.trim())).filter(Boolean);
  if (!floated.length) return;
  const images = [...(main.querySelector(':scope > div')?.querySelectorAll('img') || [])];
  floated.forEach((n) => {
    const picture = images[n - 1]?.closest('.default-content-wrapper picture');
    picture?.classList.add('image-right');
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateArticleImages(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  doc.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    doc.body.dataset.breadcrumbs = true;
    if (main) buildBreadcrumbs(main);
  }
  if (main) {
    // the first image in main is the LCP candidate: raise its priority before decoration
    main.querySelector('img')?.setAttribute('fetchpriority', 'high');
    decorateMain(main);
    doc.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  sampleRUM.enhance();

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  import('../tools/sidekick/aem-genai-variations.js');
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadSidekick() {
  if (document.querySelector('aem-sidekick')) {
    import('./sidekick.js');
    return;
  }

  document.addEventListener('sidekick-ready', () => {
    import('./sidekick.js');
  });
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  await loadTarget();
  await applyTargetHeroMboxIfConfigured();
  loadDelayed();
  loadSidekick();
}

// UE Editor support before page load
if (isUePreviewHost()) {
  // eslint-disable-next-line import/no-unresolved
  await import(`${window.hlx.codeBasePath}/ue/scripts/ue.js`).then(({ default: ue }) => ue());
}

loadPage();

(function da() {
  const { searchParams } = new URL(window.location.href);

  const lp = searchParams.get('dapreview');
  // eslint-disable-next-line import/no-unresolved
  if (lp) import('https://da.live/scripts/dapreview.js').then((mod) => mod.default(loadPage));

  const exp = searchParams.get('daexperiment');
  // eslint-disable-next-line import/no-unresolved
  if (exp) import('https://da.live/nx/public/plugins/exp/exp.js');
}());
