# Home Dashboard

A personalized minimal dashboard built with Astro, Tailwind CSS, and Node.js.

## Widgets

- **Clock** — NTP-synchronized clock with seconds display.
- **Traffic** — Live travel time and delay via TomTom Routing API (configurable route).
- **Weather** — Real-time temperature and conditions via Open-Meteo for two configurable cities, including Dutch warning codes.
- **Public Transport** — Live bus departures via OVapi for any configured stop pair.
- **Tech News** — Auto-rotating headlines from Tweakers.net with a QR code to open the article on your phone.
- **Spotify** — Now Playing integration via Spotify Web API.
- **System Status** — Uptime monitoring for configurable URLs, polled every 60 seconds.
- **Vacation Countdown** — Days until the next Dutch school holiday.

## Getting Started

Node.js 20+ required.

```bash
npm install
npm run dev
```

## Configuration (.env)

Create a `.env` file in the root directory:

```env
# Spotify (optional)
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
SPOTIFY_REFRESH_TOKEN=your_token

# Public Transport (OVapi)
OVAPI_START_CODE=30005112   # departure stop TPC code
OVAPI_END_CODE=53000011     # arrival stop TPC code

# Weather (Open-Meteo — no API key needed)
WEATHER_CITY1_NAME=Amsterdam
WEATHER_CITY1_LAT=52.3676
WEATHER_CITY1_LON=4.9041

WEATHER_CITY2_NAME=Rotterdam
WEATHER_CITY2_LAT=51.9225
WEATHER_CITY2_LON=4.4792

# Traffic (TomTom)
TOMTOM_API_KEY=your_tomtom_key
TRAFFIC_START_NAME=Amsterdam
TRAFFIC_START=52.3676,4.9041
TRAFFIC_END_NAME=Rotterdam
TRAFFIC_END=51.9225,4.4792

# Uptime monitor — comma-separated URLs (names extracted from hostname)
UPTIME_SITES=https://example.com,https://github.com
```

### Getting a Spotify Refresh Token

Run the helper script and follow the prompts:

```bash
npx tsx scripts/get-spotify-token.ts
```

It opens a browser, handles the OAuth flow, and prints the `SPOTIFY_REFRESH_TOKEN` to copy into `.env`.

### Getting a TomTom API Key

1. Create a free account at [developer.tomtom.com](https://developer.tomtom.com/).
2. Copy the default REST API key from your dashboard.
3. The free tier gives 2,500 requests/day — well within the 5-minute polling interval.

### Finding an OVapi Stop Code (TPC)

1. Go to [OVzoeker.nl](https://ovzoeker.nl), zoom in, and click your bus stop.
2. Copy the **haltenummer** from the popup.
3. Set it as `OVAPI_START_CODE` (and repeat for `OVAPI_END_CODE`).

Alternatively, use the [OVapi TPC Finder](https://william-sy.github.io/ovapi-tpc-finder/site/index.html).

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for VPS and Docker deployment instructions.
