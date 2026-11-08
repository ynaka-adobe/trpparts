// Add each deal's categories, brand and dates to the /deals/ import snapshot.
// The source page renders the deals client-side from its offers API; the rendered cards in the
// snapshot (#offers-container > .promo-content) have no category data, so the records captured
// from that API (migration-work/deals-offers.json) are matched to the cards by position (titles
// checked) and written as data attributes the cards-deals parser reads:
//   data-categories (display names, "|" separated), data-brand, data-starts, data-ends (MM/DD/YYYY)
//
// usage: node tools/importer/enrich-deals-snapshot.cjs <snapshot.html> <deals-offers.json>
const fs = require('fs');

const [snapshotFile, offersFile] = process.argv.slice(2);

// facet values -> display names (source facets; the API spells one value two ways)
const CATEGORY_NAMES = {
  accessories: 'Accessories',
  aftertreatment: 'Aftertreatment',
  battery: 'Battery & Charging',
  chassis: 'Body, Cab, & Chassis',
  brakes: 'Brakes',
  bus: 'Bus & Trailer Accessories',
  cooling: 'Cooling System',
  drivetrain: 'Drivetrain',
  engine: 'Engine',
  exhaust: 'Exhaust & Intake',
  exhuast: 'Exhaust & Intake',
  fluids: 'Fluids, Lubricants, & Chemicals',
  fuel: 'Fuel & Ignition Systems',
  hardware: 'Hardware & Shop Supplies',
  hvac: 'HVAC Systems',
  lighting: 'Lighting & Wiring',
  service: 'Service',
  steering: 'Steering & Suspension',
  wheels: 'Wheels & Tires',
  qualifying: 'Qualifying Reward Offers',
  qbrakes: 'Qualifying Brakes Offers',
  qbattery: 'Qualifying Battery Offers',
  lto: 'Limited Time Offers',
  popular: 'Most Popular Offers',
  deepdiscount: 'Deeper Discounts',
  new: 'New Offers',
  stockup: 'Stock Up Offers',
  bundle: 'Bundled Offers',
  opc: 'OPC Exclusive',
  ev: 'EV & Hybrid Offers',
  amplified: 'Amplified Offers',
  usa: 'Made in the USA',
};
// the brand facet is carried as a category value
const BRANDS = { trp: 'TRP®' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// "2026-11-13T00:00:00Z" -> "11/13/2026" (date part only, no timezone shift)
const usDate = (iso) => {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-');
  return y && m && d ? `${m}/${d}/${y}` : '';
};
// compare titles as text: the snapshot holds HTML (entities, <sup>), the API plain text
const decode = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');
const norm = (s) => decode(s).replace(/â€“/g, '–').replace(/\s+/g, ' ').trim().toLowerCase();

const html = fs.readFileSync(snapshotFile, 'utf8');
const { Offers } = JSON.parse(fs.readFileSync(offersFile, 'utf8'));
if (/data-categories=/.test(html)) throw new Error('snapshot is already enriched');

let i = 0;
const out = html.replace(/<div class="promo-content[^"]*"([^>]*)>([\s\S]*?<h3 class="promo-title">([\s\S]*?)<\/h3>)/g, (all, rest, inner, title) => {
  const offer = Offers[i];
  if (!offer) throw new Error(`more cards than offers (card ${i})`);
  if (norm(title) !== norm(offer.ProductTitle)) throw new Error(`card ${i} title mismatch: "${norm(title)}" vs "${norm(offer.ProductTitle)}"`);
  i += 1;
  const values = (offer.Category || []).map((c) => c.toLowerCase());
  const categories = [...new Set(values.filter((c) => CATEGORY_NAMES[c]).map((c) => CATEGORY_NAMES[c]))];
  const unknown = values.filter((c) => !CATEGORY_NAMES[c] && !BRANDS[c]);
  if (unknown.length) console.warn(`card ${i - 1}: unmapped categories ${unknown.join(', ')}`);
  const brand = values.map((c) => BRANDS[c]).find(Boolean) || '';
  const attrs = ` data-categories="${esc(categories.join('|'))}" data-brand="${esc(brand)}"`
    + ` data-starts="${usDate(offer.RedeemStarting)}" data-ends="${usDate(offer.RedeemBy)}"`;
  return all.replace(`"${rest}>`, `"${rest}${attrs}>`);
});
if (i !== Offers.length) throw new Error(`matched ${i} cards for ${Offers.length} offers`);
fs.writeFileSync(snapshotFile, out);
console.log(`enriched ${i} deals in ${snapshotFile}`);
