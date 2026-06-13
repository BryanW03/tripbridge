# TripBridge – Travel Companion App

**WDD 330 | Final Project**

A vanilla JavaScript ES Modules web app that consolidates travel planning into one interface: country info, visa guidance, flight search, currency conversion, and a trip itinerary builder.

---

## Project Structure

```
tripbridge/
├── index.html                  # Entry point
├── app.js                      # Initializes router and nav
├── router.js                   # Hash-based client-side router
├── sw.js                       # Service worker (offline support)
├── manifest.json               # PWA manifest
├── .eslintrc.json              # ESLint config
├── styles/
│   └── main.css               # All styles (design tokens, layout, components)
├── api/
│   ├── countriesAPI.js        # REST Countries v3 + localStorage cache
│   └── amadeusAPI.js          # Amadeus OAuth + flight search (sandbox)
├── components/
│   ├── homeView.js            # Home page with search
│   ├── countryCard.js         # Country profile page
│   ├── flightsView.js         # Flight search view
│   ├── currencyConverter.js   # Currency conversion widget
│   ├── itinerary.js           # Trip itinerary builder
│   └── favoritesView.js       # Saved countries & flights
├── storage/
│   └── favorites.js           # localStorage read/write
└── utils/
    ├── domHelpers.js          # Toast, debounce, escape helpers
    └── animations.js          # Fade/card animations
```

---

## External APIs

### Country Data (data/countries.json — local dataset)
- The REST Countries v3.1 API was **permanently deprecated** (it now
  returns an error telling clients to migrate). Its replacement (v5)
  requires a paid account and an API key sent as a Bearer token, which
  isn't viable for a free client-side student project.
- Instead, country data (name, flag emoji, capital, region, subregion,
  area, languages, currencies, borders, top-level domains) ships as a
  local JSON file (`data/countries.json`, ~100KB), sourced from the open
  `mledoze/countries` dataset (same shape REST Countries used).
- This is loaded once, cached in `localStorage`, and pre-cached by the
  service worker — so country lookups work even fully offline.

### Amadeus Travel API (developers.amadeus.com)
- Free sandbox tier — register at https://developers.amadeus.com
- Returns flight offers with price, airline, stops, duration
- Uses OAuth 2.0 client credentials (token auto-refreshes)
- **Demo mode**: App runs with simulated flight data if no keys are added

### Open Exchange Rates (open.er-api.com)
- Free, no key required, daily updates
- Used for the currency converter

---

## Setup

### Option 1 – Run with Live Server (recommended)
```bash
# Install VS Code Extension: Live Server
# Right-click index.html → Open with Live Server
```

### Option 2 – Any static file server
```bash
# Python
python3 -m http.server 5500

# Node (http-server)
npx http-server . -p 5500
```

### Option 3 – GitHub Pages
1. Push this folder to a GitHub repo
2. Settings → Pages → Source: main branch
3. Done — live at `https://yourusername.github.io/tripbridge/`

---

## Amadeus API Setup (optional)
1. Sign up at https://developers.amadeus.com
2. Create an app → copy Client ID and Secret
3. Open `api/amadeusAPI.js`
4. Replace `YOUR_AMADEUS_CLIENT_ID` and `YOUR_AMADEUS_CLIENT_SECRET`
5. The app will use live sandbox data instead of mock results

**Note**: The sandbox returns realistic but simulated flight data — fine for a course project.

---

## Features Implemented

| Feature | Status |
|---|---|
| Country search + profile cards | ✅ |
| Visa info guidance | ✅ |
| Flight search (Amadeus sandbox + demo mock) | ✅ |
| Currency converter (live rates) | ✅ |
| Trip itinerary builder | ✅ |
| Save/bookmark countries & flights | ✅ |
| localStorage persistence | ✅ |
| Service worker (offline shell) | ✅ |
| Skeleton loaders | ✅ |
| Error states + retry | ✅ |
| Responsive mobile/desktop | ✅ |
| CSS animations & transitions | ✅ |
| Hash-based router | ✅ |
| ESLint config | ✅ |
| PWA manifest | ✅ |

---

## Design Tokens

| Token | Value | Use |
|---|---|---|
| Brand blue | `#1F5C8B` | Nav, headings, buttons |
| Accent green | `#27AE60` | CTAs, prices, saved state |
| Background | `#F2F6FA` | Page background |
| Text | `#1A1A2E` | Body text |
| Danger | `#E74C3C` | Warnings, alerts |
| Body font | Inter | All text |
| Mono font | JetBrains Mono | Prices, IATA codes |
