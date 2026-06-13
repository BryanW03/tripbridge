// components/favoritesView.js – Saved countries & flights
import { getFavoriteCountries, removeCountry, getFavoriteFlights, removeFlight } from '../storage/favorites.js';
import { toast, esc } from '../utils/domHelpers.js';
import { animateCards } from '../utils/animations.js';
import { fadeIn } from '../utils/animations.js';

export async function renderFavorites(container) {
  const countries = getFavoriteCountries();
  const flights   = getFavoriteFlights();

  container.innerHTML = `
    <h1 class="section-title">★ Saved</h1>

    <div class="tabs">
      <button class="tab-btn active" data-tab="countries">Countries (${countries.length})</button>
      <button class="tab-btn" data-tab="flights">Flights (${flights.length})</button>
    </div>

    <div id="tab-countries" class="tab-panel">
      ${renderCountries(countries)}
    </div>
    <div id="tab-flights" class="tab-panel" style="display:none">
      ${renderFlights(flights)}
    </div>
  `;

  fadeIn(container);

  // Tabs
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      container.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      document.getElementById(`tab-${btn.dataset.tab}`).style.display = '';
    });
  });

  // Country remove events
  container.querySelectorAll('.remove-country').forEach(btn => {
    btn.addEventListener('click', () => {
      removeCountry(btn.dataset.code);
      btn.closest('.card')?.remove();
      toast('Country removed', 'info');
      // Update tab count
      const remaining = getFavoriteCountries().length;
      container.querySelector('[data-tab="countries"]').textContent = `Countries (${remaining})`;
      if (!remaining) {
        document.getElementById('tab-countries').innerHTML = emptyCountries();
      }
    });
  });

  // Flight remove events
  container.querySelectorAll('.remove-flight').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFlight(btn.dataset.id);
      btn.closest('.card')?.remove();
      toast('Flight removed', 'info');
      const remaining = getFavoriteFlights().length;
      container.querySelector('[data-tab="flights"]').textContent = `Flights (${remaining})`;
      if (!remaining) {
        document.getElementById('tab-flights').innerHTML = emptyFlights();
      }
    });
  });

  animateCards(container);
}

function renderCountries(countries) {
  if (!countries.length) return emptyCountries();
  return `<div class="grid-3">${countries.map(c => `
    <div class="card country-card">
      <div class="flag">${esc(c.flag)}</div>
      <h3>${esc(c.name)}</h3>
      <div class="meta">
        <span>🏙 ${esc(c.capital || 'N/A')}</span>
        <span>🌍 ${esc(c.region || '')}</span>
      </div>
      <div class="actions">
        <a href="#/country?code=${esc(c.cca3)}" class="btn btn-primary btn-sm">View</a>
        <button class="btn btn-ghost btn-sm remove-country" data-code="${esc(c.cca3)}">✕ Remove</button>
      </div>
    </div>
  `).join('')}</div>`;
}

function renderFlights(flights) {
  if (!flights.length) return emptyFlights();
  return flights.map(f => `
    <div class="card flight-card" style="margin-bottom:1rem">
      <div class="flight-route">
        <div>
          <div class="iata">${esc(f.origin)}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${esc(f.departure)}</div>
        </div>
        <div class="route-line">
          <div class="stop-dot">${f.stops === 0 ? 'Direct' : `${f.stops} stop(s)`}</div>
        </div>
        <div style="text-align:right">
          <div class="iata">${esc(f.destination)}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${esc(f.arrival)}</div>
        </div>
      </div>
      <div class="flight-meta">
        <span>⏱ ${esc(f.duration)}</span>
        <span>🛫 ${esc(f.airline)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="price">${esc(f.currency)} ${esc(f.price)}</div>
        <button class="btn btn-ghost btn-sm remove-flight" data-id="${esc(f.id)}">✕ Remove</button>
      </div>
    </div>
  `).join('');
}

function emptyCountries() {
  return `<div class="empty-state">
    <div class="emoji">🌍</div>
    <h3>No saved countries</h3>
    <p>Browse countries and tap <strong>Save</strong> to bookmark them here.</p>
    <a href="#/" class="btn btn-primary" style="margin-top:1rem">Explore Countries</a>
  </div>`;
}

function emptyFlights() {
  return `<div class="empty-state">
    <div class="emoji">✈️</div>
    <h3>No saved flights</h3>
    <p>Search for flights and save the ones you like.</p>
    <a href="#/flights" class="btn btn-primary" style="margin-top:1rem">Search Flights</a>
  </div>`;
}
