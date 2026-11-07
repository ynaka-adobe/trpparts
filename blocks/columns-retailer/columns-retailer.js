const RETAILER_PATH = '/retailers/';
const DISTANCES = ['500', '300', '100'];

let formId = 0;

/**
 * Builds the retailer address search (address input + submit + distance radios)
 * that the source site renders next to the "Nearby" link.
 * @param {HTMLAnchorElement} nearbyLink authored link to the retailer locator
 * @returns {HTMLFormElement}
 */
function buildRetailerSearch(nearbyLink) {
  formId += 1;
  const id = `columns-retailer-${formId}`;
  const action = new URL(nearbyLink.getAttribute('href'), window.location.href);

  const form = document.createElement('form');
  form.className = 'columns-retailer-search';
  form.method = 'get';
  form.action = action.origin === window.location.origin ? action.pathname : RETAILER_PATH;
  form.setAttribute('role', 'search');

  const row = document.createElement('div');
  row.className = 'columns-retailer-search-row';

  nearbyLink.classList.add('columns-retailer-nearby');
  row.append(nearbyLink);

  const label = document.createElement('label');
  label.className = 'columns-retailer-visually-hidden';
  label.htmlFor = `${id}-address`;
  label.textContent = 'Search Address';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = `${id}-address`;
  input.name = 'searchAddress';
  input.placeholder = 'Enter an address...';
  input.autocomplete = 'off';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'columns-retailer-submit';
  submit.setAttribute('aria-label', 'Search');

  row.append(label, input, submit);

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'columns-retailer-distance';
  const legend = document.createElement('legend');
  legend.textContent = 'Search Distance';
  fieldset.append(legend);
  DISTANCES.forEach((value, idx) => {
    const option = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'distance';
    radio.value = value;
    if (idx === 0) radio.checked = true;
    option.append(radio, ` ${value} mi.`);
    // whitespace between the inline-block labels matches the source spacing
    fieldset.append(option, ' ');
  });

  form.append(row, fieldset);
  return form;
}

export default function decorate(block) {
  const cols = [...(block.firstElementChild?.children || [])];
  block.classList.add(`columns-retailer-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      col.classList.add('columns-retailer-col');

      const pic = col.querySelector('picture');
      if (pic && col.children.length === 1) col.classList.add('columns-retailer-img-col');

      // a link to the retailer locator turns its column into the "Where To Buy" search panel
      const nearbyLink = [...col.querySelectorAll('a[href]')]
        .find((a) => /\/retailers/i.test(a.getAttribute('href')));
      if (!nearbyLink) return;

      col.classList.add('columns-retailer-search-col');
      const linkParent = nearbyLink.closest('p');
      nearbyLink.classList.remove('button');
      const form = buildRetailerSearch(nearbyLink);
      if (linkParent && linkParent.parentElement === col) {
        linkParent.replaceWith(form);
      } else {
        col.append(form);
      }
      // decorateButtons may have wrapped the link in a button container
      col.querySelectorAll('.button-container:empty, p:empty').forEach((el) => el.remove());
    });
  });
}
