// components/homeView.js – Home page with country search
import { searchCountries, getPopularCountries, getLanguages, getCurrencies } from '../api/countriesAPI.js';
import { isCountrySaved, saveCountry, removeCountry } from '../storage/favorites.js';
import { toast, debounce, esc, skeletonGrid } from '../utils/domHelpers.js';
import { animateCards } from '../utils/animations.js';

export async function renderHome(container) {
  container.innerHTML = `
    <section class="hero">
      <span class="hero-eyebrow">Your travel companion</span>
      <h1>Plan smarter.<br>Explore farther.</h1>
      <p>Search any country for visa info, currency, and local details — then find flights, convert money, and build your trip.</p>
      <div class="search-bar">
        <input type="search" id="countrySearch" placeholder="Search any country…" autocomplete="off" aria-label="Search countries" />
        <button class="btn btn-primary" id="searchBtn">Search</button>
      </div>
    </section>

    <div id="results-area">
      <h2 class="section-title">Popular Destinations</h2>
      <div id="country-grid" class="grid-3">${skeletonGrid(12)}</div>
    </div>
  `;

  // Load popular countries
  try {
    const countries = await getPopularCountries();
    renderCountryGrid(document.getElementById('country-grid'), countries);
  } catch (err) {
    document.getElementById('country-grid').innerHTML = `
      <div class="error-state" style="grid-column:1/-1">
        <h3>Couldn't load countries</h3>
        <p>${esc(err.message)}</p>
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>`;
  }

  // Search handling
  const input   = document.getElementById('countrySearch');
  const heading = document.querySelector('#results-area .section-title');

  const doSearch = debounce(async (q) => {
    const grid = document.getElementById('country-grid');
    if (!q.trim()) {
      heading.textContent = 'Popular Destinations';
      grid.innerHTML = skeletonGrid(12);
      const countries = await getPopularCountries();
      renderCountryGrid(grid, countries);
      return;
    }
    grid.innerHTML = skeletonGrid(6);
    heading.textContent = `Results for "${q}"`;
    try {
      const results = await searchCountries(q);
      if (!results.length) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="emoji">🔍</div>
            <h3>No countries found</h3>
            <p>Try another name, capital, or country code.</p>
          </div>`;
        return;
      }
      renderCountryGrid(grid, results);
    } catch (err) {
      grid.innerHTML = `<div class="error-state" style="grid-column:1/-1">
        <h3>Search failed</h3><p>${esc(err.message)}</p></div>`;
    }
  }, 350);

  input.addEventListener('input', e => doSearch(e.target.value));
  document.getElementById('searchBtn').addEventListener('click', () => doSearch(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(input.value); });
}

function renderCountryGrid(grid, countries) {
  grid.innerHTML = countries.map(c => countryCardHTML(c)).join('');
  animateCards(grid);
  attachCardEvents(grid);
}

function countryCardHTML(c) {
  const saved   = isCountrySaved(c.cca3);
  const capital = (c.capital || ['N/A'])[0];
  const langs   = getLanguages(c);
  const curr    = getCurrencies(c);
  const pop     = c.population?.toLocaleString() || 'N/A';
  const flag    = c.flags?.emoji || '🏳';

  return `
    <article class="card country-card" data-code="${esc(c.cca3)}" tabindex="0" aria-label="${esc(c.name.common)}">
      <div class="flag">${flag}</div>
      <h3>${esc(c.name.common)}</h3>
      <div class="meta">
        <span>🏙 ${esc(capital)}</span>
        <span>🌍 ${esc(c.region)}</span>
        <span>👥 ${pop}</span>
        <span>🗣 ${esc(langs.split(',')[0])}</span>
        <span>💰 ${esc(curr.split(',')[0])}</span>
      </div>
      <div class="actions">
        <button class="btn btn-primary btn-sm view-country" data-code="${esc(c.cca3)}">View Details</button>
        <button class="btn btn-sm ${saved ? 'btn-accent' : 'btn-ghost'} save-country"
                data-code="${esc(c.cca3)}" aria-label="${saved ? 'Remove from saved' : 'Save country'}">
          ${saved ? '★ Saved' : '☆ Save'}
        </button>
      </div>
    </article>
  `;
}

function attachCardEvents(grid) {
  grid.addEventListener('click', e => {
    // View details
    const viewBtn = e.target.closest('.view-country');
    if (viewBtn) {
      location.hash = `#/country?code=${viewBtn.dataset.code}`;
      return;
    }

    // Card click (not on button)
    const card = e.target.closest('.country-card');
    if (card && !e.target.closest('button')) {
      location.hash = `#/country?code=${card.dataset.code}`;
      return;
    }

    // Save button
    const saveBtn = e.target.closest('.save-country');
    if (saveBtn) {
      e.stopPropagation();
      const code = saveBtn.dataset.code;
      const allCountries = window._tbCountries;

      // We need the full country object — re-fetch from cache is instant
      import('../api/countriesAPI.js').then(({ getCountryByCode }) => {
        getCountryByCode(code).then(country => {
          if (!country) return;
          const alreadySaved = isCountrySaved(code);
          if (alreadySaved) {
            removeCountry(code);
            saveBtn.className = 'btn btn-sm btn-ghost save-country';
            saveBtn.textContent = '☆ Save';
            toast('Removed from saved', 'info');
          } else {
            saveCountry(country);
            saveBtn.className = 'btn btn-sm btn-accent save-country';
            saveBtn.textContent = '★ Saved';
            toast(`${country.name.common} saved!`, 'success');
          }
        });
      });
    }
  });

  // Keyboard support
  grid.querySelectorAll('.country-card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        location.hash = `#/country?code=${card.dataset.code}`;
      }
    });
  });
}
