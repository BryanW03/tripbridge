// components/footer.js – Site footer with dynamic content
// Renders once into #footer and keeps a couple of bits alive (clock, tips)

// ─────────────────────────────────────────────────────────────
// 🎥 DEMO VIDEO LINK
// Paste your YouTube / Loom / Drive link below (must start with
// http:// or https://). Leave it as an empty string '' to hide
// the button completely.
// ─────────────────────────────────────────────────────────────
const DEMO_VIDEO_URL = '';

const TRAVEL_TIPS = [
  'Pack a portable charger — airport outlets are always taken.',
  'Take a photo of your luggage before you fly. It helps with claims if it\'s lost.',
  'Roll your clothes instead of folding — saves up to 30% suitcase space.',
  'Download offline maps before you land in a new city.',
  'Many countries require your passport to be valid 6 months past your travel date.',
  'Notify your bank before traveling abroad to avoid card freezes.',
  'Tuesdays and Wednesdays are statistically the cheapest days to fly.',
  'Keep a digital copy of your passport and visas in cloud storage.',
  'Local SIM cards are often cheaper than international roaming plans.',
  'Carry a printed copy of hotel addresses — useful when offline.',
  'Layovers under 45 minutes are riskier for international connections.',
  'Museums are often free on the first Sunday of the month in many countries.',
];

function getRandomTip() {
  return TRAVEL_TIPS[Math.floor(Math.random() * TRAVEL_TIPS.length)];
}

export function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  const year = new Date().getFullYear();
  const hasVideo = DEMO_VIDEO_URL.trim().startsWith('http');

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-col footer-brand">
        <div class="footer-logo">
          <span class="brand-icon">🌐</span>
          <span class="brand-text">TripBridge</span>
        </div>
        <p class="footer-tagline">Plan smarter. Explore farther.</p>
        <p class="footer-clock" id="footerClock" aria-live="off"></p>
        ${hasVideo ? `
          <a href="${DEMO_VIDEO_URL}" target="_blank" rel="noopener" class="footer-video-btn">
            ▶ Watch project demo
          </a>` : ''}
      </div>

      <nav class="footer-col footer-links" aria-label="Footer navigation">
        <h4>Explore</h4>
        <ul>
          <li><a href="#/">Home</a></li>
          <li><a href="#/flights">Flights</a></li>
          <li><a href="#/currency">Currency</a></li>
          <li><a href="#/itinerary">My Trip</a></li>
          <li><a href="#/favorites">Saved</a></li>
        </ul>
      </nav>

      <div class="footer-col footer-tip">
        <h4>✨ Travel Tip</h4>
        <p id="footerTip" aria-live="polite">${getRandomTip()}</p>
        <button class="footer-tip-btn" id="newTipBtn" aria-label="Show another travel tip">↻ New tip</button>
      </div>
    </div>

    <div class="footer-bottom">
      <p>© ${year} TripBridge — Built for WDD 330</p>
      <p class="footer-credit">Country data, flight, and currency info update automatically.</p>
    </div>
  `;

  // Live clock
  const clockEl = document.getElementById('footerClock');
  const updateClock = () => {
    if (!clockEl) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    clockEl.textContent = `🕒 Local time: ${time}`;
  };
  updateClock();
  setInterval(updateClock, 30000);

  // New tip button
  document.getElementById('newTipBtn')?.addEventListener('click', () => {
    const tipEl = document.getElementById('footerTip');
    if (!tipEl) return;
    let next = getRandomTip();
    // avoid repeating the same tip twice in a row
    while (next === tipEl.textContent && TRAVEL_TIPS.length > 1) {
      next = getRandomTip();
    }
    tipEl.style.opacity = '0';
    setTimeout(() => {
      tipEl.textContent = next;
      tipEl.style.opacity = '1';
    }, 150);
  });
}
