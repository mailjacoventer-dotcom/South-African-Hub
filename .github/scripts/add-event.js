const fs = require('fs');

const payload = JSON.parse(process.env.PAYLOAD);

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return { day: '?', month: '?' };
  return {
    day: d.getDate(),
    month: d.toLocaleString('en', { month: 'short' })
  };
}

const eventSlug = slug(payload.event_name);
const date = formatDate(payload.date || payload.event_date || '');
const tagMap = {
  'Community': 'community',
  'Networking': 'networking',
  'Workshop': 'workshop',
  'Sport': 'sport',
  'Online': 'online',
};
const tagClass = tagMap[payload.type || payload.event_type] || 'community';
const ticketUrl = payload.ticket_url || payload.tickets || '#';
const imgSrc = payload.banner_image || payload.photo || '';
const city = payload.city || '';
const time = payload.time || '';
const venue = payload.venue || '';
const price = payload.price || '';
const organiser = payload.organiser_email || payload.email || '';

let ev = fs.readFileSync('events.html', 'utf8');

const newCard = `
    <div class="event-card" data-type="own" data-id="${eventSlug}" data-kaartjies="${ticketUrl}" data-organiser="${organiser}">
      <div class="event-banner" onclick="openEventDetail(this.closest('.event-card'))" style="cursor:pointer">
        ${imgSrc ? `<img src="${imgSrc}" alt="${payload.event_name}" class="loaded">` : `<div style="background:var(--navy);height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px">📅</div>`}
        <div class="event-banner-hover"><span>🎟️ Get Tickets</span></div>
      </div>
      <div class="event-top" style="cursor:pointer" onclick="openEventDetail(this.closest('.event-card'))">
        <div class="event-date"><div class="day">${date.day}</div><div class="month">${date.month}</div></div>
        <div class="event-divider"></div>
        <div><div class="event-city">${city}</div><div class="event-time">${time}</div></div>
      </div>
      <div class="event-body" style="cursor:pointer" onclick="if(event.target.tagName!=='BUTTON')openEventDetail(this.closest('.event-card'))">
        <span class="event-tag tag-${tagClass}">${payload.type || payload.event_type || 'Community'}</span>
        <div class="event-title">${payload.event_name}</div>
        <div class="event-desc">${payload.description || ''}</div>
        <div class="event-details">
          ${venue ? `<div class="event-detail">📍 ${venue}</div>` : ''}
          ${time ? `<div class="event-detail">🚪 ${time}</div>` : ''}
          ${price ? `<div class="event-detail">🎟️ ${price}</div>` : ''}
        </div>
        <button class="btn-rsvp" onclick="window.open('${ticketUrl}','_blank')">Get Tickets →</button>
      </div>
    </div>
`;

ev = ev.replace(/(\s*<\/div>\s*\n\s*<div style="margin-top:48px">)/, newCard + '\n\n  </div>\n\n  <div style="margin-top:48px">');

const evCountMatch = ev.match(/<div class="n">(\d+)<\/div><div class="l">Upcoming events?<\/div>/);
if (evCountMatch) {
  const newCount = parseInt(evCountMatch[1]) + 1;
  ev = ev.replace(evCountMatch[0], `<div class="n">${newCount}</div><div class="l">Upcoming events</div>`);
}

const cityMatches = [...ev.matchAll(/class="event-city">([^<]+)</g)];
const uniqueCities = new Set(cityMatches.map(m => m[1].trim()));
const cityCountMatch = ev.match(/<div class="n">(\d+)<\/div><div class="l">Cities<\/div>/);
if (cityCountMatch) {
  ev = ev.replace(cityCountMatch[0], `<div class="n">${uniqueCities.size}</div><div class="l">Cities</div>`);
}

fs.writeFileSync('events.html', ev);
console.log(`✅ Added ${payload.event_name} to events.html`);

let idx = fs.readFileSync('index.html', 'utf8');

const newSlide = `
        <!-- ${payload.event_name} -->
        <a href="events.html#${eventSlug}" class="carousel-slide">
          <div class="slide-banner" style="background-image:url('${imgSrc}');background-size:cover;background-position:center"></div>
          <div class="slide-overlay"></div>
          <div class="slide-content">
            <span class="slide-tag ${tagClass}">${payload.type || 'Community'}</span>
            <div class="slide-date-row">
              <div class="slide-date-block"><div class="day">${date.day}</div><div class="month">${date.month}</div></div>
              <div class="slide-date-sep"></div>
              <div class="slide-city">${city}</div>
            </div>
            <div class="slide-title">${payload.event_name}</div>
            <div class="slide-meta">${venue}${time ? ' · ' + time : ''}${price ? ' · ' + price : ''}</div>
            <span class="slide-cta">Get Tickets →</span>
          </div>
        </a>

      </div>`;

idx = idx.replace(/\n      <\/div>\n\n    <!-- Arrows -->/, newSlide + '\n\n    <!-- Arrows -->');

fs.writeFileSync('index.html', idx);
console.log(`✅ Added ${payload.event_name} slide to index.html carousel`);
