// components/currencyConverter.js – Real-time currency conversion
// Uses open.er-api.com (free, no key needed, updated daily)

const RATE_API   = 'https://open.er-api.com/v6/latest/';
const CACHE_KEY  = 'tb_rates_cache';
const CACHE_TTL  = 1000 * 60 * 60 * 4; // 4 hours

import { toast, esc } from '../utils/domHelpers.js';
import { getHomeCurrency, setHomeCurrency } from '../storage/favorites.js';
import { fadeIn } from '../utils/animations.js';

const CURRENCIES = [
  'USD','EUR','GBP','JPY','AUD','CAD','CHF','CNY','SEK','NZD',
  'MXN','SGD','HKD','NOK','KRW','TRY','RUB','INR','BRL','ZAR',
  'DOP','COP','CLP','ARS','PEN','VES','CRC','HNL','GTQ','BOB',
  'PYG','UYU','PAB','NIO','JMD','TTD','BBD','BSD','BZD','HTG',
  'THB','IDR','MYR','PHP','VND','BDT','PKR','LKR','NPR','MMK',
  'AED','SAR','QAR','KWD','BHD','OMR','JOD','EGP','MAD','TND',
  'NGN','GHS','KES','UGX','TZS','ETB','XOF','XAF','CDF','ZMW',
];

export async function renderCurrency(container, params = {}) {
  const homeCurr = getHomeCurrency();
  const fromInit = params.from || homeCurr;
  const toInit   = params.to   || (fromInit === 'USD' ? 'EUR' : 'USD');

  container.innerHTML = `
    <h1 class="section-title">💱 Currency Converter</h1>
    <p class="section-subtitle">Real-time exchange rates updated daily.</p>

    <div class="card currency-widget">
      <div class="form-row" style="margin-bottom:1rem">
        <div class="currency-field">
          <label for="amount">Amount</label>
          <input type="number" id="amount" value="100" min="0" step="0.01" placeholder="100" />
        </div>
      </div>

      <div class="currency-row">
        <div class="currency-field">
          <label for="fromCurr">From</label>
          <select id="fromCurr">${currencyOptions(fromInit)}</select>
        </div>
        <button class="swap-btn" id="swapBtn" title="Swap currencies" aria-label="Swap currencies">⇄</button>
        <div class="currency-field">
          <label for="toCurr">To</label>
          <select id="toCurr">${currencyOptions(toInit)}</select>
        </div>
      </div>

      <div id="convert-result" style="margin-top:1.25rem">
        <div class="skeleton skeleton-text" style="width:200px;height:40px"></div>
      </div>

      <hr class="divider" />
      <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" id="convertBtn">Convert</button>
        <button class="btn btn-ghost btn-sm" id="setHomeBtn">Set ${esc(fromInit)} as home currency</button>
      </div>
    </div>

    <div style="margin-top:1.5rem">
      <h2 class="section-title" style="font-size:1.05rem">Quick Reference – Common pairs for <span id="baseCurrLabel">${esc(fromInit)}</span></h2>
      <div id="rate-table" class="grid-3">${Array(6).fill('<div class="skeleton skeleton-card" style="height:80px"></div>').join('')}</div>
    </div>
  `;

  fadeIn(container);

  // Initial convert
  await doConvert();

  async function doConvert() {
    const from   = document.getElementById('fromCurr').value;
    const to     = document.getElementById('toCurr').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const result = document.getElementById('convert-result');

    result.innerHTML = `<div class="skeleton skeleton-text" style="width:200px;height:40px;border-radius:8px"></div>`;

    try {
      const rates = await getRates(from);
      const rate  = rates[to];
      if (!rate) throw new Error(`Rate for ${to} not available`);
      const converted = (amount * rate).toFixed(2);

      result.innerHTML = `
        <div class="convert-result">
          <div style="font-size:.88rem;color:var(--text-muted);margin-bottom:.35rem">
            ${amount.toLocaleString()} ${esc(from)} =
          </div>
          <div class="amount">${Number(converted).toLocaleString()} ${esc(to)}</div>
          <div class="rate-note">1 ${esc(from)} = ${rate.toFixed(4)} ${esc(to)} · Rates update daily</div>
        </div>`;

      // Rate table for common currencies
      const common = ['USD','EUR','GBP','JPY','CAD','AUD'].filter(c => c !== from);
      document.getElementById('rate-table').innerHTML = common.map(c => {
        const r = rates[c];
        return r ? `
          <div class="card" style="padding:.85rem">
            <div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:600;color:var(--accent)">
              ${(r).toFixed(4)}
            </div>
            <div style="font-size:.82rem;color:var(--text-muted)">1 ${esc(from)} → ${esc(c)}</div>
          </div>` : '';
      }).join('');

      document.getElementById('baseCurrLabel').textContent = from;
    } catch (err) {
      result.innerHTML = `<div class="error-state"><h3>Conversion failed</h3><p>${esc(err.message)}</p></div>`;
    }
  }

  document.getElementById('convertBtn').addEventListener('click', doConvert);
  document.getElementById('amount').addEventListener('input', () => {
    clearTimeout(window._cvTimer);
    window._cvTimer = setTimeout(doConvert, 500);
  });
  document.getElementById('fromCurr').addEventListener('change', doConvert);
  document.getElementById('toCurr').addEventListener('change',   doConvert);

  document.getElementById('swapBtn').addEventListener('click', () => {
    const fc = document.getElementById('fromCurr');
    const tc = document.getElementById('toCurr');
    const tmp = fc.value;
    fc.value = tc.value;
    tc.value = tmp;
    doConvert();
  });

  document.getElementById('setHomeBtn').addEventListener('click', () => {
    const from = document.getElementById('fromCurr').value;
    setHomeCurrency(from);
    toast(`${from} set as your home currency`, 'success');
    document.getElementById('setHomeBtn').textContent = `✓ ${from} is home currency`;
  });
}

function currencyOptions(selected) {
  return CURRENCIES.map(c =>
    `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`
  ).join('');
}

async function getRates(base) {
  const cacheKey = `${CACHE_KEY}_${base}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const { ts, rates } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return rates;
    }
  } catch { /* ignore */ }

  const res = await fetch(`${RATE_API}${base}`);
  if (!res.ok) throw new Error(`Exchange rate API error (${res.status})`);
  const json = await res.json();
  if (json.result !== 'success') throw new Error('Could not fetch exchange rates');

  const rates = json.rates;
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), rates }));
  } catch { /* quota */ }

  return rates;
}
