import { loadFragment } from '../fragment/fragment.js';
import { getEffectiveDate, pickPromoFragment } from '../../scripts/promo-scheduler.js';

async function resolvePromoFragment(schedulerUrl) {
  let resp;
  try {
    resp = await fetch(schedulerUrl);
  } catch {
    return null;
  }
  if (!resp.ok) return null;
  const { data } = await resp.json();
  return pickPromoFragment(data, getEffectiveDate());
}

export default async function decorate(block) {
  // The block contains a link to the promo-scheduler JSON, e.g.:
  //   /fragments/promo-scheduler.json
  // We read that URL, run the scheduler, then replace the block with
  // the winning fragment's decorated content.
  const link = block.querySelector('a');
  const schedulerUrl = link ? link.getAttribute('href') : block.textContent.trim();

  if (!schedulerUrl) return;

  const fragmentPath = await resolvePromoFragment(schedulerUrl);
  if (!fragmentPath) return;

  const fragment = await loadFragment(fragmentPath);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.closest('.section').classList.add(...fragmentSection.classList);
      block.closest('.promo-banner').replaceWith(...fragment.childNodes);
    }
  }
}
