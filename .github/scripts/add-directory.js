const fs = require('fs');

const payload = JSON.parse(process.env.PAYLOAD);

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function icon(cat) {
  const icons = {
    'Tax & Accounting': '📊',
    'Property & Housing': '🏠',
    'Legal': '⚖️',
    'Health & Wellness': '🧘',
    'Marketing & Creative': '🎨',
    'Recruitment': '💼',
    'Food & Retail': '🛒',
    'Professional Services': '🔧',
  };
  return icons[cat] || '🏢';
}

const entry = {
  name: payload.business_name,
  icon: icon(payload.category),
  cat: payload.category,
  city: payload.city,
  contact: payload.contact_person,
  desc: payload.description,
};
if (payload.website && payload.website !== 'N/A') entry.website = payload.website.startsWith('http') ? payload.website : 'https://' + payload.website;
if (payload.email) entry.email = payload.email;
if (payload.phone) entry.phone = payload.phone.replace(/^00/, '+').replace(/^\+?31\s?0?/, '+31 ').trim();
if (payload.whatsapp) entry.wa = payload.whatsapp.replace(/\D/g, '').replace(/^0/, '31');

const entryStr = JSON.stringify(entry);

let html = fs.readFileSync('directory.html', 'utf8');

const bizEnd = html.lastIndexOf('\n];');
if (bizEnd === -1) { console.error('Could not find BIZ array end'); process.exit(1); }
html = html.slice(0, bizEnd) + '\n  ' + entryStr + ',' + html.slice(bizEnd);

const countMatch = html.match(/<div class="n">(\d+)<\/div><div class="l">Businesses<\/div>/);
if (countMatch) {
  const newCount = parseInt(countMatch[1]) + 1;
  html = html.replace(countMatch[0], `<div class="n">${newCount}</div><div class="l">Businesses</div>`);
}

const cityMatches = [...html.matchAll(/"city":"([^"]+)"/g)];
const uniqueCities = new Set(cityMatches.map(m => m[1]));
const cityCountMatch = html.match(/<div class="n">(\d+)<\/div><div class="l">Cities<\/div>/);
if (cityCountMatch) {
  html = html.replace(cityCountMatch[0], `<div class="n">${uniqueCities.size}</div><div class="l">Cities</div>`);
}

fs.writeFileSync('directory.html', html);
console.log(`✅ Added ${payload.business_name} to directory.html`);
