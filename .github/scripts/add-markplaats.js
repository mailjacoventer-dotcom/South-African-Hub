const fs = require('fs');

const payload = JSON.parse(process.env.PAYLOAD);

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function encodeWA(phone, item) {
  const num = phone.replace(/\D/g, '').replace(/^0/, '31');
  const msg = encodeURIComponent(`Hi, I'm interested in your ${item} listed on southafricanhub.nl`);
  return `https://wa.me/${num}?text=${msg}`;
}

const WA_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

const itemSlug = slug(payload.item);
const waHref = encodeWA(payload.whatsapp || payload.seller_phone || '', payload.item);
const imgSrc = payload.photo_1 || '';
const price = payload.price || 'Free';
const isFree = price.toLowerCase() === 'free' || price === '0' || price === '€0';
const badgeClass = isFree ? 'badge-free' : 'badge-sale';
const badgeText = isFree ? 'Free' : 'For Sale';
const deliveryIcon = (payload.delivery || '').toLowerCase().includes('post') ? '📬' : '🚗';

let mp = fs.readFileSync('markplaats.html', 'utf8');

const newCard = `
    <div class="listing-card" data-id="${itemSlug}" data-type="${isFree ? 'free' : 'sale'}" data-cat="${payload.category || 'Other'}">
      <div class="card-img-carousel" id="carousel-${itemSlug}">
        <img src="${imgSrc}" alt="${payload.item}" class="active">
        <span class="card-badge ${badgeClass}" style="position:absolute;top:10px;left:10px;z-index:2">${badgeText}</span>
        <span class="card-cat-badge" style="position:absolute;top:10px;right:10px;z-index:2">${payload.category || 'Other'}</span>
        <div class="card-img-dots" id="dots-${itemSlug}"></div>
      </div>
      <div class="card-body">
        <div class="card-title">${payload.item}</div>
        <div class="card-desc">${payload.description || ''}</div>
        <div class="card-footer">
          <span class="card-price">${price}</span>
          <div class="card-meta"><span class="card-city">📍 ${payload.city}</span><span class="card-age">Today</span></div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:8px;margin-bottom:4px">${deliveryIcon} ${payload.delivery || 'Collection only'}</div>
        <a class="wa-btn" href="${waHref}" target="_blank">${WA_SVG} WhatsApp Seller</a>
      </div>
    </div>
`;

mp = mp.replace(/(\s*<\/div>\s*\n\s*\n\s*<!-- POST CTA)/, newCard + '\n\n  </div>\n\n<!-- POST CTA');

const listingMatch = mp.match(/<div class="n">(\d+)<\/div><div class="l">Active listings?<\/div>/);
if (listingMatch) {
  const newCount = parseInt(listingMatch[1]) + 1;
  mp = mp.replace(listingMatch[0], `<div class="n">${newCount}</div><div class="l">Active listings</div>`);
}

if (isFree) {
  const freeMatch = mp.match(/<div class="n">(\d+)<\/div><div class="l">Free items?<\/div>/);
  if (freeMatch) {
    const newFree = parseInt(freeMatch[1]) + 1;
    mp = mp.replace(freeMatch[0], `<div class="n">${newFree}</div><div class="l">Free items</div>`);
  }
}

const cityMatches = [...mp.matchAll(/card-city[^>]*>📍 ([^<]+)</g)];
const uniqueCities = new Set(cityMatches.map(m => m[1].trim()));
const cityMatch = mp.match(/<div class="n">(\d+)<\/div><div class="l">Cities?<\/div>/);
if (cityMatch) {
  mp = mp.replace(cityMatch[0], `<div class="n">${uniqueCities.size}</div><div class="l">Cities</div>`);
}

fs.writeFileSync('markplaats.html', mp);
console.log(`✅ Added ${payload.item} to markplaats.html`);

let idx = fs.readFileSync('index.html', 'utf8');

const newPreviewCard = `    <a href="markplaats.html#${itemSlug}" class="mp-card-preview">
      <div class="mp-img" style="padding:0;overflow:hidden"><img src="${imgSrc}" alt="${payload.item}" style="width:100%;height:100%;object-fit:cover"><span class="mp-badge ${isFree ? 'free' : 'sale'}">${badgeText}</span></div>
      <div class="mp-body-preview"><div class="mp-title-preview">${payload.item}</div><div class="mp-footer-preview"><span class="mp-price">${price}</span><span class="mp-city-preview">📍 ${payload.city}</span></div></div>
    </a>`;

idx = idx.replace(/(\s*<\/div>\s*\n<\/section>\s*\n\s*<!-- LISTING CTA)/, '\n' + newPreviewCard + '\n  </div>\n</section>\n\n<!-- LISTING CTA');

fs.writeFileSync('index.html', idx);
console.log(`✅ Added ${payload.item} preview to index.html`);
