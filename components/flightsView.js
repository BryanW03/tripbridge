// components/flightsView.js – Flight search page
import { searchFlights, parseFlightOffer } from '../api/amadeusAPI.js';
import { saveFlight, getFavoriteFlights, removeFlight } from '../storage/favorites.js';
import { toast, esc, skeletonCards } from '../utils/domHelpers.js';
import { animateCards } from '../utils/animations.js';

// Common IATA codes for autocomplete hints
const POPULAR_ROUTES = [
  { origin: 'JFK', destination: 'LHR', label: 'New York → London' },
  { origin: 'LAX', destination: 'CDG', label: 'Los Angeles → Paris' },
  { origin: 'MIA', destination: 'CUN', label: 'Miami → Cancun' },
  { origin: 'ORD', destination: 'NRT', label: 'Chicago → Tokyo' },
  { origin: 'SDQ', destination: 'JFK', label: 'Santo Domingo → New York' },
  { origin: 'GRU', destination: 'MAD', label: 'São Paulo → Madrid' },
];

export async function renderFlights(container, params = {}) {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  container.innerHTML = `
    <h1 class="section-title">✈ Flight Search</h1>
    <p class="section-subtitle">Search real flights powered by Amadeus. Running in demo mode with simulated results.</p>

    <div class="card" style="margin-bottom:1.5rem">
      <div class="form-row">
        <div class="form-group">
          <label for="origin">From (IATA code)</label>
          <input type="text" id="origin" placeholder="e.g. SDQ" maxlength="3" style="text-transform:uppercase"
                 value="${esc(params.origin || 'SDQ')}" />
        </div>
        <div class="form-group">
          <label for="destination">To (IATA code)</label>
          <input type="text" id="destination" placeholder="e.g. JFK" maxlength="3" style="text-transform:uppercase"
                 value="${esc(params.destination || 'JFK')}" />
        </div>
        <div class="form-group">
          <label for="depDate">Departure Date</label>
          <input type="date" id="depDate" min="${today}" value="${nextWeek}" />
        </div>
        <div class="form-group">
          <label for="adults">Passengers</label>
          <select id="adults">
            ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${n===1?'selected':''}>${n} adult${n>1?'s':''}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" id="searchBtn">🔍 Search Flights</button>
        <span style="font-size:.82rem;color:var(--text-muted)">Demo mode – simulated results (add your Amadeus keys for live data)</span>
      </div>
    </div>

    <!-- Popular routes -->
    <div style="margin-bottom:1.5rem">
      <p style="font-size:.82rem;font-weight:600;color:var(--text-muted);margin-bottom:.5rem">POPULAR ROUTES</p>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem">
        ${POPULAR_ROUTES.map(r => `
          <button class="chip quick-route" data-origin="${r.origin}" data-dest="${r.destination}"
                  style="cursor:pointer;padding:.35rem .75rem">${r.label}</button>`).join('')}
      </div>
    </div>

    <div id="flight-results"></div>
  `;

  const resultsDiv = document.getElementById('flight-results');

  async function doSearch() {
    const origin      = document.getElementById('origin').value.trim().toUpperCase();
    const destination = document.getElementById('destination').value.trim().toUpperCase();
    const date        = document.getElementById('depDate').value;
    const adults      = document.getElementById('adults').value;

    if (!origin || origin.length !== 3) { toast('Enter a valid 3-letter origin code (e.g. SDQ)', 'error'); return; }
    if (!destination || destination.length !== 3) { toast('Enter a valid 3-letter destination code', 'error'); return; }
    if (!date) { toast('Select a departure date', 'error'); return; }

    resultsDiv.innerHTML = skeletonCards(5);

    try {
      const offers  = await searchFlights({ origin, destination, date, adults });
      const flights = offers.map(parseFlightOffer);
      renderResults(resultsDiv, flights, date);
    } catch (err) {
      resultsDiv.innerHTML = `
        <div class="error-state">
          <h3>Search failed</h3>
          <p>${esc(err.message)}</p>
          <button class="btn btn-primary" id="retryBtn">Retry</button>
        </div>`;
      document.getElementById('retryBtn')?.addEventListener('click', doSearch);
    }
  }

  document.getElementById('searchBtn').addEventListener('click', doSearch);

  // Quick routes
  container.querySelectorAll('.quick-route').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('origin').value      = btn.dataset.origin;
      document.getElementById('destination').value = btn.dataset.dest;
      doSearch();
    });
  });

  // Auto-search if params provided
  if (params.origin && params.destination) doSearch();
}

function renderResults(div, flights, date) {
  if (!flights.length) {
    div.innerHTML = `
      <div class="empty-state">
        <div class="emoji">✈️</div>
        <h3>No flights found</h3>
        <p>Try different dates or routes.</p>
      </div>`;
    return;
  }

  const savedIds = new Set(getFavoriteFlights().map(f => f.id));

  div.innerHTML = `
    <h2 class="section-title">${flights.length} flights found</h2>
    <div id="flight-cards">
      ${flights.map(f => flightCardHTML(f, savedIds.has(f.id))).join('')}
    </div>
  `;

  animateCards(div);

  div.addEventListener('click', e => {
    const saveBtn = e.target.closest('.save-flight');
    if (saveBtn) {
      const id   = saveBtn.dataset.id;
      const fObj = flights.find(f => f.id === id);
      if (!fObj) return;
      if (savedIds.has(id)) {
        removeFlight(id);
        savedIds.delete(id);
        saveBtn.textContent = '☆ Save';
        saveBtn.className = 'btn btn-ghost btn-sm save-flight';
        saveBtn.dataset.id = id;
        toast('Flight removed', 'info');
      } else {
        saveFlight(fObj);
        savedIds.add(id);
        saveBtn.textContent = '★ Saved';
        saveBtn.className = 'btn btn-accent btn-sm save-flight';
        saveBtn.dataset.id = id;
        toast('Flight saved!', 'success');
      }
    }
  });
}

function flightCardHTML(f, saved) {
  const stopLabel = f.stops === 0 ? 'Direct' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`;
  return `
    <div class="card flight-card" style="margin-bottom:1rem">
      <div class="flight-route">
        <div>
          <div class="iata">${esc(f.origin)}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${f.departure}</div>
        </div>
        <div class="route-line">
          <div class="stop-dot">${esc(stopLabel)}</div>
        </div>
        <div style="text-align:right">
          <div class="iata">${esc(f.destination)}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${f.arrival}</div>
        </div>
      </div>

      <div class="flight-meta">
        <span>⏱ ${esc(f.duration)}</span>
        <span>🛫 ${esc(f.airline)}</span>
        <span>🔢 ${esc(stopLabel)}</span>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
        <div>
          <div class="price">${esc(f.currency)} ${esc(f.price)}</div>
          <div class="airline">per person</div>
        </div>
        <div style="display:flex;gap:.5rem">
          <button class="btn ${saved ? 'btn-accent' : 'btn-ghost'} btn-sm save-flight" data-id="${esc(f.id)}">
            ${saved ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>
    </div>
  `;
}
