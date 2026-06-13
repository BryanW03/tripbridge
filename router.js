// router.js – Simple hash-based client-side router
import { renderHome }      from './components/homeView.js';
import { renderFlights }   from './components/flightsView.js';
import { renderCurrency }  from './components/currencyConverter.js';
import { renderItinerary } from './components/itinerary.js';
import { renderFavorites } from './components/favoritesView.js';
import { renderCountry }   from './components/countryCard.js';

const ROUTES = {
  '/':           renderHome,
  '/flights':    renderFlights,
  '/currency':   renderCurrency,
  '/itinerary':  renderItinerary,
  '/favorites':  renderFavorites,
  '/country':    renderCountry,   // /country?code=USA
};

function getHash() {
  return location.hash.replace('#', '') || '/';
}

function getPath(hash) {
  return hash.split('?')[0] || '/';
}

function getParams(hash) {
  const qs = hash.includes('?') ? hash.split('?')[1] : '';
  return Object.fromEntries(new URLSearchParams(qs));
}

async function navigate() {
  const hash   = getHash();
  const path   = getPath(hash);
  const params = getParams(hash);
  const app    = document.getElementById('app');

  // Highlight nav link
  document.querySelectorAll('.nav-link').forEach(a => {
    const route = a.dataset.route;
    const active =
      (route === 'home'      && path === '/') ||
      (route === 'flights'   && path === '/flights') ||
      (route === 'currency'  && path === '/currency') ||
      (route === 'itinerary' && path === '/itinerary') ||
      (route === 'favorites' && path === '/favorites');
    a.classList.toggle('active', active);
  });

  // Close mobile nav
  document.getElementById('navLinks')?.classList.remove('open');

  const render = ROUTES[path] || renderHome;

  // Show skeleton
  app.innerHTML = `<div class="grid-3">${Array(6).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>`;

  try {
    await render(app, params);
  } catch (err) {
    app.innerHTML = `
      <div class="error-state">
        <h3>Something went wrong</h3>
        <p>${err.message || 'Unexpected error. Please try again.'}</p>
        <button class="btn btn-primary" onclick="location.hash='/'">Go Home</button>
      </div>`;
  }
}

export const router = {
  init() {
    window.addEventListener('hashchange', navigate);
    navigate();
  },
  go(path) {
    location.hash = path;
  },
};
