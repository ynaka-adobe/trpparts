import { createOptimizedPicture } from '../../scripts/aem.js';

function encode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function rtf(text, color, size, tracking = 'expndtw0') {
  const escaped = text.replace(/\r\n?/g, '\n').replace(/[\\{}\n\u0080-\uFFFF]/g, (char) => {
    if (char === '\n') return '\\line ';
    if ('\\{}'.includes(char)) return `\\${char}`;
    const code = char.charCodeAt(0);
    return `\\u${code > 32767 ? code - 65536 : code}?`;
  });
  const [red, green, blue] = color;
  return `{\\rtf1\\ansi{\\fonttbl{\\f0 Arial;}}{\\colortbl;\\red${red}\\green${green}\\blue${blue};}\\f0\\b\\cf1\\fs${size}\\${tracking} ${escaped}}`;
}

function nestedText(text, color, fontSize, inputSize, outputSize) {
  const hex = color.map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `is(CEM/?layer=0&text=${encode(rtf(text, color, fontSize))}`
    + `&textAttr=288%2Cnorm%2CfixedRes%2Cnowrap&size=${encode(inputSize)}`
    + `&effect=-1&op_grow=3&color=0x${hex}&blendMode=norm&opac=100&op_blur=0`
    + `&pos=0%2C0&layer=comp&wid=${outputSize[0]}&hei=${outputSize[1]}&fit=stretch%2C1)`;
}

function offerURL(asset, [line1, line2, smallNum, largeNum, expiry]) {
  const black = [0, 0, 0];
  const red = [229, 28, 16];
  const layers = ['layer=0&src=CEM/trp-offer-background&size=500,667&origin=0,0'];
  const image = (layer, source, size, position) => {
    layers.push(`layer=${layer}&src=${source}&anchor=0,0&size=${size}&pos=${position}`);
  };
  const text = (layer, value, color, fontSize, size, position, renderer = 'textPs') => {
    layers.push(`layer=${layer}&${renderer}=${encode(rtf(value, color, fontSize, 'expnd2'))}`
      + `&textAttr=72,norm,fixedRes,wrap&anchor=0,0&size=${size}&pos=${position}`);
  };
  image(1, nestedText('SPECIAL OFFER', black, 80, '1560,240', [1560, 360]), '390,90', '60,78');
  text(2, line1, black, 32, '195,24', '61,170');
  text(3, line2, black, 32, '195,43', '299,154');
  image(4, nestedText('$', red, 50, '72,128', [72, 192]), '18,48', '61,193');
  // Two digits need the wider input canvas to avoid Scene7 cropping the second digit.
  const wideDiscount = smallNum.length > 1;
  const smallWidth = wideDiscount ? 500 : 256;
  image(
    5,
    nestedText(smallNum, red, 178, `${smallWidth},400`, [smallWidth, 600]),
    wideDiscount ? '125,150' : '64,150',
    '78,184',
  );
  image(6, nestedText('OFF', red, 44, '200,128', [200, 192]), '50,48', wideDiscount ? '193,194' : '132,194');
  image(7, nestedText('$', red, 50, '72,128', [72, 192]), '18,48', '267,193');
  image(8, nestedText(largeNum, red, 178, '500,440', [500, 660]), '125,165', '283,184');
  image(9, nestedText('OFF', red, 44, '200,128', [200, 192]), '50,48', '392,194');
  image(10, encode(asset), '500,230', '50,350');
  text(11, expiry, [255, 255, 255], 22, '215,24', '278,638', 'text');
  return `https://s7d9.scene7.com/is/image/CEM/trp-offer-background?${layers.join('&')}`
    + '&layer=comp&wid=500&hei=667&fmt=png&qlt=95';
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row, index) => {
    const cells = [...row.children];
    let composite = false;
    let malformed = false;
    if (!row.querySelector('picture, img')) {
      const asset = cells[0]?.textContent.trim();
      const fields = cells[1]?.textContent.split('|').map((part) => part.trim());
      if (cells.length !== 2 || !asset || fields?.length !== 5 || fields.some((field) => !field)) {
        console.error(`cards-offers: row ${index + 1} requires an asset and five nonempty pipe-delimited fields.`);
        malformed = true;
      } else {
        const original = cells.map((cell) => [...cell.childNodes]);
        const [line1] = fields;
        const img = document.createElement('img');
        img.alt = line1;
        img.width = 500;
        img.height = 667;
        img.loading = 'lazy';
        img.addEventListener('error', () => {
          console.error(`cards-offers: Scene7 image failed for row ${index + 1} (${asset}).`);
          cells.forEach((cell, cellIndex) => {
            cell.replaceChildren(...original[cellIndex]);
            cell.className = 'cards-offers-card-body';
            cell.hidden = false;
          });
        }, { once: true });
        img.src = offerURL(asset, fields);
        cells[0].replaceChildren(img);
        cells[1].replaceChildren();
        composite = true;
      }
    }
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      if (div.querySelector('picture, img') && div.textContent.trim() === '') div.className = 'cards-offers-card-image';
      else div.className = 'cards-offers-card-body';
    });

    // drop empty body cells so the tile is image-only
    li.querySelectorAll('.cards-offers-card-body').forEach((body) => {
      if (!malformed && !body.textContent.trim() && !body.querySelector('picture, img')) {
        if (composite) body.hidden = true;
        else body.remove();
      }
    });

    // a single link in the body makes the whole tile clickable (wraps the image)
    const body = li.querySelector('.cards-offers-card-body');
    const links = body ? [...body.querySelectorAll('a[href]')] : [];
    const image = li.querySelector('.cards-offers-card-image');
    if (links.length === 1 && image && !image.querySelector('a')) {
      const [link] = links;
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.className = 'cards-offers-link';
      if (link.title) anchor.title = link.title;
      anchor.setAttribute('aria-label', link.textContent.trim() || image.querySelector('img')?.alt || '');
      anchor.append(...image.childNodes);
      image.append(anchor);
      // a bare-link body is only the tile's target, not visible copy
      if (body.textContent.trim() === link.textContent.trim()) body.remove();
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
