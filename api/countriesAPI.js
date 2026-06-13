// api/countriesAPI.js – REST Countries v3 + cache
const BASE = 'https://restcountries.com/v3.1';
const CACHE_KEY = 'tb_countries_cache';
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

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

  const res = await fetch(`${BASE}/all?fields=name,cca3,flags,capital,region,subregion,population,languages,currencies,borders,tlds,independent`);
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

export function getPopulation(country) {
  return country.population?.toLocaleString() || 'N/A';
}

export function getCurrencyCodes(country) {
  if (!country.currencies) return [];
  return Object.keys(country.currencies);
}
