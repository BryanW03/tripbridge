// utils/domHelpers.js – Shared DOM utilities

// ── Toast notifications ──────────────────────────────────────
export function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(el);

  setTimeout(() => el.remove(), 3100);
}

// ── Navigation ───────────────────────────────────────────────
export function initNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  toggle?.addEventListener('click', () => links?.classList.toggle('open'));
}

// ── Skeleton helpers ─────────────────────────────────────────
export function skeletonGrid(count = 6) {
  return `<div class="grid-3">${Array(count).fill(
    '<div class="skeleton skeleton-card"></div>'
  ).join('')}</div>`;
}

export function skeletonCards(count = 3) {
  return Array(count).fill(`
    <div class="card" style="margin-bottom:1rem">
      <div class="skeleton skeleton-text w-60"></div>
      <div class="skeleton skeleton-text w-80" style="margin-top:.5rem"></div>
      <div class="skeleton skeleton-text w-40" style="margin-top:.5rem"></div>
    </div>
  `).join('');
}

// ── Safe HTML escape ─────────────────────────────────────────
export function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── Format date for display ──────────────────────────────────
export function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}

// ── Debounce ─────────────────────────────────────────────────
export function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Scroll to top of main ───────────────────────────────────
export function scrollTop() {
  document.getElementById('app')?.scrollIntoView({ behavior:'smooth' });
}
