// components/countryCard.js – Country profile page
import { getCountryByCode, getLanguages, getCurrencies, getPopulation, getCurrencyCodes } from '../api/countriesAPI.js';
import { saveCountry, removeCountry, isCountrySaved } from '../storage/favorites.js';
import { toast, esc } from '../utils/domHelpers.js';
import { fadeIn } from '../utils/animations.js';

export async function renderCountry(container, params) {
  const code = (params.code || '').toUpperCase();
  if (!code) { location.hash = '#/'; return; }

  container.innerHTML = `<div class="card" style="padding:2rem">${skeletonProfile()}</div>`;

  let country;
  try {
    country = await getCountryByCode(code);
  } catch (err) {
    container.innerHTML = `<div class="error-state">
      <h3>Couldn't load country</h3><p>${esc(err.message)}</p>
      <a href="#/" class="btn btn-primary">← Back</a></div>`;
    return;
  }

  if (!country) {
    container.innerHTML = `<div class="error-state">
      <h3>Country not found</h3><p>No data for code: ${esc(code)}</p>
      <a href="#/" class="btn btn-primary">← Back</a></div>`;
    return;
  }

  const saved     = isCountrySaved(code);
  const flag      = country.flags?.emoji || '🏳';
  const capital   = (country.capital || ['N/A'])[0];
  const langs     = getLanguages(country);
  const curr      = getCurrencies(country);
  const pop       = getPopulation(country);
  const tld       = (country.tlds || ['N/A'])[0];
  const borders   = country.borders || [];
  const currCodes = getCurrencyCodes(country);

  container.innerHTML = `
    <a href="#/" class="back-btn">← Back to search</a>

    <div class="card country-profile" style="margin-bottom:1.5rem">
      <div>
        <div class="flag-big">${flag}</div>
        <h2>${esc(country.name.common)}</h2>
        <p style="color:var(--text-muted);font-size:.88rem;margin-bottom:1rem">${esc(country.name.official)}</p>

        <div class="profile-grid">
          <div class="profile-item">
            <label>Capital</label>
            <span>${esc(capital)}</span>
          </div>
          <div class="profile-item">
            <label>Region</label>
            <span>${esc(country.region)} · ${esc(country.subregion || '')}</span>
          </div>
          <div class="profile-item">
            <label>Area</label>
            <span>${esc(pop)}</span>
          </div>
          <div class="profile-item">
            <label>Languages</label>
            <span>${esc(langs)}</span>
          </div>
          <div class="profile-item">
            <label>Currency</label>
            <span>${esc(curr)}</span>
          </div>
          <div class="profile-item">
            <label>Top-level domain</label>
            <span>${esc(tld)}</span>
          </div>
          <div class="profile-item">
            <label>ISO Code</label>
            <span class="chip">${esc(country.cca3)}</span>
          </div>
          <div class="profile-item">
            <label>Status</label>
            <span>${country.independent ? '🟢 Independent' : '🔵 Dependent territory'}</span>
          </div>
        </div>

        <div style="margin-top:1.25rem;display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn ${saved ? 'btn-accent' : 'btn-ghost'} btn-sm" id="saveBtn">
            ${saved ? '★ Saved' : '☆ Save country'}
          </button>
          <a href="#/flights" class="btn btn-primary btn-sm">✈ Search Flights</a>
          ${currCodes.length ? `<a href="#/currency?from=USD&to=${esc(currCodes[0])}" class="btn btn-ghost btn-sm">💱 Convert Currency</a>` : ''}
        </div>
      </div>

      <div>
        <!-- Visa info card -->
        <div class="card" style="margin-bottom:1rem;background:var(--bg)">
          <h3 style="font-size:1rem;margin-bottom:.75rem;color:var(--brand)">📋 Visa Information</h3>
          ${visaInfoHTML(country)}
        </div>

        <!-- Borders -->
        ${borders.length ? `
        <div class="card" style="background:var(--bg)">
          <h3 style="font-size:1rem;margin-bottom:.75rem;color:var(--brand)">🗺 Bordering Countries</h3>
          <div style="display:flex;flex-wrap:wrap;gap:.4rem">
            ${borders.map(b => `<a href="#/country?code=${esc(b)}" class="chip" style="cursor:pointer">${esc(b)}</a>`).join('')}
          </div>
        </div>` : ''}
      </div>
    </div>
  `;

  fadeIn(container);

  // Save button
  document.getElementById('saveBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('saveBtn');
    const alreadySaved = isCountrySaved(code);
    if (alreadySaved) {
      removeCountry(code);
      btn.textContent = '☆ Save country';
      btn.className = 'btn btn-ghost btn-sm';
      toast('Removed from saved', 'info');
    } else {
      saveCountry(country);
      btn.textContent = '★ Saved';
      btn.className = 'btn btn-accent btn-sm';
      toast(`${country.name.common} saved!`, 'success');
    }
  });
}

function visaInfoHTML(country) {
  // Since we don't have a real visa API, we provide structured guidance
  const name = country.name.common;
  const embassySearch = encodeURIComponent(`${name} visa requirements`);
  return `
    <p style="font-size:.88rem;color:var(--text-muted);margin-bottom:.75rem">
      Visa requirements vary by your nationality. Always verify with the official embassy before traveling.
    </p>
    <div style="display:flex;flex-direction:column;gap:.5rem;font-size:.88rem">
      <div>🏛 <strong>Official source:</strong>
        <a href="https://www.google.com/search?q=${embassySearch}" target="_blank" rel="noopener"
           style="color:var(--brand);text-decoration:underline">Check embassy requirements →</a>
      </div>
      <div>📞 <strong>Tip:</strong> Contact your country's embassy or consulate for ${esc(name)} at least 6 weeks before travel.</div>
      <div>🔖 <strong>Common requirements:</strong> valid passport (6+ months), return ticket, proof of funds, accommodation details.</div>
    </div>
  `;
}

function skeletonProfile() {
  return `
    <div class="skeleton skeleton-text" style="width:40%;height:60px;margin-bottom:1rem"></div>
    <div class="skeleton skeleton-text w-60"></div>
    <div class="skeleton skeleton-text w-80"></div>
    <div class="skeleton skeleton-text w-40"></div>
  `;
}
