import { createOptimizedPicture } from '../../scripts/aem.js';
import { createModal } from '../modal/modal.js';

/**
 * Turns an authored video link (YouTube watch/short/embed or Vimeo) into an embeddable URL.
 * Returns null for anything that isn't a recognised video URL.
 * @param {string} href
 * @returns {string|null}
 */
export function toEmbedUrl(href) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '');
  let id;
  if (host === 'youtu.be') [, id] = url.pathname.split('/');
  else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    if (url.pathname.startsWith('/embed/')) [, , id] = url.pathname.split('/');
    else if (url.pathname.startsWith('/shorts/')) [, , id] = url.pathname.split('/');
    else id = url.searchParams.get('v');
  }
  if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;

  if (host.endsWith('vimeo.com')) {
    const vimeoId = url.pathname.split('/').filter(Boolean).pop();
    if (/^\d+$/.test(vimeoId)) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
  }
  return null;
}

export async function openVideo(embedUrl, title) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cards-video-player';
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.title = title || 'Video';
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  wrapper.append(iframe);
  const { showModal } = await createModal([wrapper]);
  showModal();
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-video-card-image';
      else div.className = 'cards-video-card-body';
    });

    const links = [...li.querySelectorAll('a[href]')];
    const videoLink = links.find((a) => toEmbedUrl(a.href));
    const embedUrl = videoLink ? toEmbedUrl(videoLink.href) : null;
    if (embedUrl) {
      li.classList.add('cards-video-has-video');
      const body = li.querySelector('.cards-video-card-body');
      const title = (body?.querySelector('h2, h3, h4, strong, p')?.firstChild?.textContent || '').trim();
      const handler = (e) => {
        e.preventDefault();
        openVideo(embedUrl, title);
      };
      videoLink.classList.remove('button');
      videoLink.classList.add('cards-video-link');
      videoLink.addEventListener('click', handler);

      // the thumbnail also opens the video
      const image = li.querySelector('.cards-video-card-image');
      if (image && !image.querySelector('a')) {
        const thumbButton = document.createElement('button');
        thumbButton.type = 'button';
        thumbButton.className = 'cards-video-thumbnail';
        thumbButton.setAttribute('aria-label', title ? `Play video: ${title}` : 'Play video');
        thumbButton.append(...image.childNodes);
        thumbButton.addEventListener('click', handler);
        image.append(thumbButton);
      } else if (image) {
        image.querySelectorAll('a').forEach((a) => a.addEventListener('click', handler));
      }
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}
