import { fetchPlaceholders } from '../../scripts/aem.js';

const AUTOPLAY_MS = 6000;

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;

  block.querySelectorAll('.carousel-hero-slide').forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a').forEach((link) => {
      if (active) link.removeAttribute('tabindex');
      else link.setAttribute('tabindex', '-1');
    });
  });

  block.querySelectorAll('.carousel-hero-indicator button').forEach((button, idx) => {
    if (idx === slideIndex) button.setAttribute('disabled', 'true');
    else button.removeAttribute('disabled');
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-hero-slide');
  if (!slides.length) return;
  let realIndex = slideIndex;
  if (slideIndex < 0) realIndex = slides.length - 1;
  if (slideIndex >= slides.length) realIndex = 0;
  const activeSlide = slides[realIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-hero-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
  updateActiveSlide(block, realIndex);
}

function startAutoplay(block) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let timer;
  const stop = () => { clearInterval(timer); timer = undefined; };
  const start = () => {
    stop();
    timer = setInterval(() => {
      showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
    }, AUTOPLAY_MS);
  };
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', start);
  start();
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-hero-indicator button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const indicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(indicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.carousel-hero-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.carousel-hero-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  // keep state in sync when the user swipes/scrolls the track directly
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-hero-slide').forEach((slide) => observer.observe(slide));
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-hero-${carouselId}-slide-${slideIndex}`;
  slide.classList.add('carousel-hero-slide');

  [...row.children].forEach((cell) => {
    const isImage = cell.querySelector('picture, img') && !cell.querySelector('h1, h2, h3, h4, h5, h6, p a');
    cell.classList.add(isImage ? 'carousel-hero-slide-image' : 'carousel-hero-slide-content');
    // the first slide image is the LCP candidate; later slides start hidden
    cell.querySelectorAll('img').forEach((img) => {
      img.loading = slideIndex === 0 ? 'eager' : 'lazy';
      img.fetchPriority = slideIndex === 0 ? 'high' : 'low';
    });
    slide.append(cell);
  });

  const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading && heading.id) slide.setAttribute('aria-labelledby', heading.id);

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.id = `carousel-hero-${carouselId}`;
  const rows = [...block.querySelectorAll(':scope > div')];
  const isSingleSlide = rows.length < 2;

  // labels only serve slide controls; skip the lookup so a single slide renders sooner
  const placeholders = isSingleSlide ? {} : await fetchPlaceholders();
  const { carousel: roleDescription } = placeholders;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', roleDescription || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-hero-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-hero-slides');

  let indicators;
  if (!isSingleSlide) {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    indicators = document.createElement('ol');
    indicators.classList.add('carousel-hero-indicators');
    nav.append(indicators);
    block.append(nav);

    const navButtons = document.createElement('div');
    navButtons.classList.add('carousel-hero-navigation');
    navButtons.innerHTML = `
      <button type="button" class="carousel-hero-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="carousel-hero-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;
    container.append(navButtons);
  }

  rows.forEach((row, idx) => {
    slidesWrapper.append(createSlide(row, idx, carouselId));
    if (indicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-hero-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      indicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);
  updateActiveSlide(block, 0);

  if (!isSingleSlide) {
    bindEvents(block);
    startAutoplay(block);
  }
}
