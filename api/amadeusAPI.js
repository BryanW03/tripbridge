// api/amadeusAPI.js – Amadeus OAuth + Flight Search (Sandbox)
// 
// NOTE: Set your sandbox credentials below.
// Free sandbox at: https://developers.amadeus.com
// The sandbox returns simulated flight data — perfect for the assignment.
//
// IMPORTANT: In a production app, the token exchange would happen on a server.
// For this course project we handle it client-side as stated in the proposal.
// Never expose production keys in client code.

const CLIENT_ID     = 'YOUR_AMADEUS_CLIENT_ID';       // ← replace
const CLIENT_SECRET = 'YOUR_AMADEUS_CLIENT_SECRET';   // ← replace
const AUTH_URL      = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const FLIGHT_URL    = 'https://test.api.amadeus.com/v2/shopping/flight-offers';

let _token = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  // Check for demo mode
  if (CLIENT_ID === 'YOUR_AMADEUS_CLIENT_ID') {
    throw new Error('DEMO_MODE');
  }

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) throw new Error('Amadeus auth failed. Check your API credentials.');

  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _token;
}

export async function searchFlights({ origin, destination, date, adults = 1, max = 10 }) {
  let token;
  try {
    token = await getToken();
  } catch (err) {
    if (err.message === 'DEMO_MODE') {
      return getMockFlights(origin, destination, date);
    }
    throw err;
  }

  const params = new URLSearchParams({
    originLocationCode:      origin.toUpperCase(),
    destinationLocationCode: destination.toUpperCase(),
    departureDate:           date,
    adults:                  adults,
    max:                     max,
    currencyCode:            'USD',
  });

  const res = await fetch(`${FLIGHT_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.errors?.[0]?.detail || `Flight search failed (${res.status})`);
  }

  const json = await res.json();
  return json.data || [];
}

// ── Demo / Mock flights ─────────────────────────────────────
function getMockFlights(origin, destination, date) {
  const airlines = [
    { code: 'AA', name: 'American Airlines' },
    { code: 'DL', name: 'Delta Air Lines' },
    { code: 'UA', name: 'United Airlines' },
    { code: 'LH', name: 'Lufthansa' },
    { code: 'BA', name: 'British Airways' },
  ];

  return Array.from({ length: 8 }, (_, i) => {
    const airline = airlines[i % airlines.length];
    const price   = (180 + i * 47 + Math.floor(Math.random() * 80)).toFixed(2);
    const stops   = i % 3 === 0 ? 1 : 0;
    const deptH   = 6 + i * 2;
    const durH    = 5 + (i % 4);
    const arrH    = (deptH + durH) % 24;

    return {
      id: `MOCK-${i}`,
      source: 'GDS',
      itineraries: [{
        duration: `PT${durH}H${(i * 7) % 60}M`,
        segments: [
          stops === 0
            ? {
                departure:   { iataCode: origin.toUpperCase(),      at: `${date}T${String(deptH).padStart(2,'0')}:00:00` },
                arrival:     { iataCode: destination.toUpperCase(), at: `${date}T${String(arrH).padStart(2,'0')}:30:00` },
                carrierCode: airline.code,
                number:      String(100 + i * 11),
                numberOfStops: 0,
              }
            : {
                departure:   { iataCode: origin.toUpperCase(), at: `${date}T${String(deptH).padStart(2,'0')}:00:00` },
                arrival:     { iataCode: 'JFK',                at: `${date}T${String((deptH+3)%24).padStart(2,'0')}:00:00` },
                carrierCode: airline.code,
                number:      String(100 + i * 11),
                numberOfStops: 0,
              },
          ...(stops === 1 ? [{
                departure:   { iataCode: 'JFK',                at: `${date}T${String((deptH+4)%24).padStart(2,'0')}:30:00` },
                arrival:     { iataCode: destination.toUpperCase(), at: `${date}T${String(arrH).padStart(2,'0')}:30:00` },
                carrierCode: airline.code,
                number:      String(200 + i * 7),
                numberOfStops: 0,
              }] : []),
        ],
      }],
      price: { grandTotal: price, currency: 'USD' },
      validatingAirlineCodes: [airline.code],
      _airlineName: airline.name,
    };
  });
}

// Parse a flight offer into a simpler display object
export function parseFlightOffer(offer) {
  const seg0   = offer.itineraries[0].segments[0];
  const lastSeg = offer.itineraries[0].segments.at(-1);
  const stops  = offer.itineraries[0].segments.length - 1;
  const dur    = offer.itineraries[0].duration
    .replace('PT','').replace('H',' hr ').replace('M',' min');
  const deptRaw = seg0.departure.at;
  const arrRaw  = lastSeg.arrival.at;

  return {
    id:          offer.id,
    origin:      seg0.departure.iataCode,
    destination: lastSeg.arrival.iataCode,
    departure:   formatTime(deptRaw),
    arrival:     formatTime(arrRaw),
    duration:    dur,
    stops,
    price:       offer.price.grandTotal,
    currency:    offer.price.currency,
    airline:     offer._airlineName || offer.validatingAirlineCodes?.[0] || 'Unknown',
    code:        offer.validatingAirlineCodes?.[0] || '',
    raw:         offer,
  };
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
