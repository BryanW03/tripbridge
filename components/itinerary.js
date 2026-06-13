// components/itinerary.js – Trip itinerary builder
import { toast, esc } from '../utils/domHelpers.js';
import { fadeIn } from '../utils/animations.js';

const STORAGE_KEY = 'tb_itinerary';

function loadTrip() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultTrip();
  } catch {
    return defaultTrip();
  }
}

function saveTrip(trip) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trip)); }
  catch { toast('Could not save – storage full', 'error'); }
}

function defaultTrip() {
  return {
    title: 'My Trip',
    days: [
      { id: Date.now(), label: 'Day 1', activities: [{ id: Date.now()+1, text: '' }] },
    ],
  };
}

export async function renderItinerary(container) {
  const trip = loadTrip();
  renderUI(container, trip);
  fadeIn(container);
}

function renderUI(container, trip) {
  container.innerHTML = `
    <div class="itinerary-header">
      <div style="flex:1">
        <label style="font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted)">Trip Name</label>
        <input type="text" class="trip-title-input" id="tripTitle" value="${esc(trip.title)}" placeholder="My Trip" maxlength="60" />
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="addDayBtn">+ Add Day</button>
        <button class="btn btn-ghost btn-sm" id="clearTripBtn">🗑 Clear</button>
        <button class="btn btn-accent btn-sm" id="exportBtn">📋 Copy</button>
      </div>
    </div>

    <div id="days-container">
      ${trip.days.map((day, di) => dayHTML(day, di)).join('')}
    </div>

    <p style="font-size:.8rem;color:var(--text-muted);margin-top:.5rem">
      ✅ Changes save automatically to your browser.
    </p>
  `;

  // Auto-save title
  document.getElementById('tripTitle').addEventListener('input', e => {
    trip.title = e.target.value;
    saveTrip(trip);
  });

  // Add day
  document.getElementById('addDayBtn').addEventListener('click', () => {
    const dayNum = trip.days.length + 1;
    const newDay = {
      id: Date.now(),
      label: `Day ${dayNum}`,
      activities: [{ id: Date.now() + 1, text: '' }],
    };
    trip.days.push(newDay);
    saveTrip(trip);
    const dc = document.getElementById('days-container');
    const div = document.createElement('div');
    div.innerHTML = dayHTML(newDay, trip.days.length - 1);
    dc.appendChild(div.firstElementChild);
    attachDayEvents(div.firstElementChild, trip, trip.days.length - 1);
    div.firstElementChild.scrollIntoView({ behavior: 'smooth' });
  });

  // Clear
  document.getElementById('clearTripBtn').addEventListener('click', () => {
    if (!confirm('Clear the entire itinerary?')) return;
    const fresh = defaultTrip();
    saveTrip(fresh);
    renderUI(container, fresh);
    toast('Itinerary cleared', 'info');
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', () => {
    const text = exportText(trip);
    navigator.clipboard?.writeText(text).then(() => toast('Copied to clipboard!', 'success'))
      .catch(() => {
        prompt('Copy your itinerary:', text);
      });
  });

  // Attach events for existing days
  document.querySelectorAll('.day-block').forEach((el, di) => {
    attachDayEvents(el, trip, di);
  });
}

function dayHTML(day, di) {
  return `
    <div class="day-block" data-di="${di}" id="day-${day.id}">
      <div class="day-header">
        <input type="text" class="day-label-input" value="${esc(day.label)}"
               placeholder="Day ${di + 1}" maxlength="40"
               style="font-weight:700;color:var(--brand);font-size:.95rem;border:none;border-bottom:2px dashed var(--border);background:transparent;outline:none;padding:.1rem 0;width:160px" />
        <div style="display:flex;gap:.4rem">
          <button class="btn btn-sm btn-ghost add-activity" data-di="${di}">+ Activity</button>
          ${di > 0 ? `<button class="btn btn-sm btn-danger remove-day" data-di="${di}">✕</button>` : ''}
        </div>
      </div>
      <div class="activities-list">
        ${day.activities.map(a => activityHTML(a, di)).join('')}
      </div>
    </div>
  `;
}

function activityHTML(a, di) {
  return `
    <div class="activity-item" data-aid="${a.id}">
      <span style="color:var(--text-muted);font-size:.85rem;padding-top:.5rem">•</span>
      <input type="text" class="activity-input" value="${esc(a.text)}"
             placeholder="Add an activity or note…" data-di="${di}" data-aid="${a.id}" />
      <button class="remove-btn remove-activity" data-di="${di}" data-aid="${a.id}" title="Remove">✕</button>
    </div>
  `;
}

function attachDayEvents(el, trip, di) {
  if (!el) return;

  // Day label
  el.querySelector('.day-label-input')?.addEventListener('input', e => {
    if (trip.days[di]) {
      trip.days[di].label = e.target.value;
      saveTrip(trip);
    }
  });

  // Add activity
  el.querySelector('.add-activity')?.addEventListener('click', () => {
    if (!trip.days[di]) return;
    const newAct = { id: Date.now(), text: '' };
    trip.days[di].activities.push(newAct);
    saveTrip(trip);
    const list = el.querySelector('.activities-list');
    const div = document.createElement('div');
    div.innerHTML = activityHTML(newAct, di);
    const actEl = div.firstElementChild;
    list.appendChild(actEl);
    attachActivityEvents(actEl, trip, di);
    actEl.querySelector('input')?.focus();
  });

  // Remove day
  el.querySelector('.remove-day')?.addEventListener('click', () => {
    if (!confirm(`Remove "${trip.days[di]?.label}"?`)) return;
    trip.days.splice(di, 1);
    saveTrip(trip);
    el.remove();
    toast('Day removed', 'info');
  });

  // Existing activities
  el.querySelectorAll('.activity-item').forEach(actEl => {
    attachActivityEvents(actEl, trip, di);
  });
}

function attachActivityEvents(actEl, trip, di) {
  const aid = Number(actEl.dataset.aid);

  actEl.querySelector('.activity-input')?.addEventListener('input', e => {
    const act = trip.days[di]?.activities.find(a => a.id === aid);
    if (act) { act.text = e.target.value; saveTrip(trip); }
  });

  actEl.querySelector('.remove-activity')?.addEventListener('click', () => {
    if (!trip.days[di]) return;
    trip.days[di].activities = trip.days[di].activities.filter(a => a.id !== aid);
    saveTrip(trip);
    actEl.remove();
  });
}

function exportText(trip) {
  let out = `🗺 ${trip.title}\n${'─'.repeat(40)}\n\n`;
  trip.days.forEach(day => {
    out += `📅 ${day.label}\n`;
    day.activities.forEach(a => {
      if (a.text.trim()) out += `  • ${a.text}\n`;
    });
    out += '\n';
  });
  return out.trim();
}
