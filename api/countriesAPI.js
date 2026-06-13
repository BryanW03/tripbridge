// api/countriesAPI.js – Local country dataset
//
// NOTE: The REST Countries v3.1 API was permanently deprecated (returns
// {"success":false, "errors":[{"message":"This API version has been
// deprecated..."}]}). Its replacement (v5) requires a paid account + API
// key (Bearer token), which isn't viable for a free client-side student
// project.
//
// Instead we ship a local dataset (data/countries.json, ~100KB) sourced
// from the open "mledoze/countries" project (same shape as REST Countries
// v3.1: name, cca3, flags.emoji, capital, region, subregion, languages,
// currencies, borders, tlds, independent). This is loaded once, cached in
// memory, and also gets cached by the service worker for offline use —
// which actually matches the proposal's "country data cache" goal even
// better than hitting a live API on every load.

const DATA_URL = 'data/countries.json';
const CACHE_KEY = 'tb_countries_cache';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours (local file rarely changes)

let _allCountries = null;

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* quota */ }
}

export async function getAllCountries() {
  if (_allCountries) return _allCountries;

  const cached = loadCache();
  if (cached) { _allCountries = cached; return cached; }

  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load country data.');
  const data = await res.json();
  _allCountries = data;
  saveCache(data);
  return data;
}

export async function searchCountries(query) {
  if (!query.trim()) return [];
  const all = await getAllCountries();
  const q = query.toLowerCase();
  return all.filter(c =>
    c.name.common.toLowerCase().includes(q) ||
    c.name.official.toLowerCase().includes(q) ||
    (c.capital || []).some(cap => cap.toLowerCase().includes(q)) ||
    c.cca3.toLowerCase().includes(q)
  ).slice(0, 18);
}

export async function getCountryByCode(code) {
  const all = await getAllCountries();
  return all.find(c => c.cca3 === code.toUpperCase()) || null;
}

export async function getPopularCountries() {
  const popular = ['USA','FRA','JPN','DEU','MEX','BRA','GBR','ITA','ESP','AUS','CAN','THA'];
  const all = await getAllCountries();
  return popular.map(code => all.find(c => c.cca3 === code)).filter(Boolean);
}

// Format helpers
export function getCurrencies(country) {
  if (!country.currencies) return 'N/A';
  return Object.entries(country.currencies)
    .map(([code, c]) => `${c.name} (${c.symbol || code})`)
    .join(', ');
}

export function getLanguages(country) {
  if (!country.languages) return 'N/A';
  return Object.values(country.languages).join(', ');
}

// The local dataset has "area" (km²) instead of "population".
// We keep the function name for backward compatibility but display area.
export function getPopulation(country) {
  if (!country.area) return 'N/A';
  return `${country.area.toLocaleString()} km²`;
}

export function getCurrencyCodes(country) {
  if (!country.currencies) return [];
  return Object.keys(country.currencies);
}
