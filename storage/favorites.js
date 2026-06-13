// storage/favorites.js – Save/remove/list from localStorage
const KEY_COUNTRIES = 'tb_fav_countries';
const KEY_FLIGHTS   = 'tb_fav_flights';

// ── Countries ───────────────────────────────────────────────
export function getFavoriteCountries() {
  try { return JSON.parse(localStorage.getItem(KEY_COUNTRIES) || '[]'); }
  catch { return []; }
}

export function saveCountry(country) {
  const list = getFavoriteCountries();
  if (!list.find(c => c.cca3 === country.cca3)) {
    list.push({
      cca3: country.cca3,
      name: country.name.common,
      flag: country.flags?.emoji || country.flags?.png || '',
      capital: (country.capital || ['N/A'])[0],
      region: country.region,
    });
    _write(KEY_COUNTRIES, list);
    return true;
  }
  return false; // already saved
}

export function removeCountry(cca3) {
  const list = getFavoriteCountries().filter(c => c.cca3 !== cca3);
  _write(KEY_COUNTRIES, list);
}

export function isCountrySaved(cca3) {
  return getFavoriteCountries().some(c => c.cca3 === cca3);
}

// ── Flights ─────────────────────────────────────────────────
export function getFavoriteFlights() {
  try { return JSON.parse(localStorage.getItem(KEY_FLIGHTS) || '[]'); }
  catch { return []; }
}

export function saveFlight(flight) {
  const list = getFavoriteFlights();
  if (!list.find(f => f.id === flight.id)) {
    list.push(flight);
    _write(KEY_FLIGHTS, list);
    return true;
  }
  return false;
}

export function removeFlight(id) {
  const list = getFavoriteFlights().filter(f => f.id !== id);
  _write(KEY_FLIGHTS, list);
}

// ── Home/currency preference ─────────────────────────────────
export function getHomeCurrency() {
  return localStorage.getItem('tb_home_currency') || 'USD';
}

export function setHomeCurrency(code) {
  localStorage.setItem('tb_home_currency', code);
}

// ── Private ─────────────────────────────────────────────────
function _write(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch { /* quota exceeded */ }
}
