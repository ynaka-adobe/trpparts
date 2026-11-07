// footer sections in authoring order
const SECTION_ROLES = ['start', 'end', 'legal', 'backtotop'];

/**
 * Fetches the footer fragment (local preview first, then the site root on DA/EDS).
 * Relative image paths are resolved against the fragment URL.
 * @returns {Promise<HTMLElement|null>}
 */
async function fetchFooter() {
  // the local preview serves fragments from /content; Edge Delivery serves them at the site
  // root, so only try /content locally (avoids a 404 on every production page view)
  let resp;
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    resp = await fetch('/content/footer.plain.html');
    if (!resp.ok) resp = await fetch('/footer.plain.html');
  } else {
    resp = await fetch('/footer.plain.html');
  }
  if (!resp.ok) return null;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = await resp.text();
  wrapper.querySelectorAll('img').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  return wrapper;
}

/**
 * Turns paragraphs made only of icon-image links into an icon row: each SVG becomes a
 * currentColor mask so it can take the link's hover color; the alt text labels the link.
 */
function decorateIconLinks(section) {
  section.querySelectorAll(':scope > p').forEach((p) => {
    const links = [...p.querySelectorAll('a')];
    const iconOnly = links.length > 0 && links.every((a) => {
      const img = a.querySelector('img');
      return img && /\.svg(\?|$)/i.test(img.src) && !a.textContent.trim();
    });
    if (!iconOnly) return;
    p.className = 'footer-social';
    links.forEach((a) => {
      const img = a.querySelector('img');
      const icon = document.createElement('span');
      icon.className = 'footer-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.style.maskImage = `url("${img.src}")`;
      a.setAttribute('aria-label', img.alt);
      img.replaceWith(icon);
    });
  });
}

function buildColumns(start, end) {
  const band = document.createElement('section');
  band.className = 'footer-top';
  const inner = document.createElement('div');
  inner.className = 'footer-top-inner';
  [start, end].filter(Boolean).forEach((section, i) => {
    section.className = `footer-col footer-col-${i === 0 ? 'start' : 'end'}`;
    decorateIconLinks(section);
    section.querySelectorAll(':scope > p:not(.footer-social) a').forEach((a) => a.classList.add('footer-link'));
    inner.append(section);
  });
  band.append(inner);
  return band;
}

function buildLegal(section) {
  const band = document.createElement('section');
  band.className = 'footer-legal';
  const inner = document.createElement('div');
  inner.className = 'footer-legal-inner';
  const copyright = section.querySelector(':scope > p');
  if (copyright) {
    copyright.className = 'footer-copyright';
    inner.append(copyright);
  }
  const list = section.querySelector(':scope > ul');
  if (list) {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Footer Navigation Menu');
    nav.append(list);
    inner.append(nav);
  }
  band.append(inner);
  return band;
}

/**
 * Builds the floating back-to-top control; it appears once the page has scrolled about
 * one viewport height and smooth-scrolls to the top without changing the URL.
 */
function buildBackToTop(section) {
  const link = section.querySelector('a');
  if (!link) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'footer-backtotop';
  const label = document.createElement('span');
  label.className = 'footer-backtotop-label';
  label.textContent = link.textContent.trim();
  const icon = document.createElement('span');
  icon.className = 'footer-backtotop-icon';
  icon.setAttribute('aria-hidden', 'true');
  link.textContent = '';
  link.title = label.textContent;
  link.append(icon, label);
  link.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  wrapper.append(link);
  const update = () => wrapper.classList.toggle('is-visible', window.scrollY >= window.innerHeight);
  window.addEventListener('scroll', update, { passive: true });
  update();
  return wrapper;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  if (!fragment) return;
  const sections = {};
  [...fragment.children].forEach((section, i) => { sections[SECTION_ROLES[i]] = section; });

  block.textContent = '';
  const inner = document.createElement('div');
  inner.className = 'footer-inner';
  if (sections.start || sections.end) inner.append(buildColumns(sections.start, sections.end));
  if (sections.legal) inner.append(buildLegal(sections.legal));
  block.append(inner);
  if (sections.backtotop) {
    // the floating control sits beside the footer content, as on the source
    const backToTop = buildBackToTop(sections.backtotop);
    if (backToTop) (block.closest('footer') || block).append(backToTop);
  }
}
