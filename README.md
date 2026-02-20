# Home Dashboard

A personalized minimal dashboard built with Astro, Tailwind CSS, and Node.js. 

It features:
- **Clock & Date:** NTP-synchronized highly accurate clock.
- **Weather:** Real-time temperature and conditions via Open-Meteo (with generic Dutch descriptions and warning codes) for two configurable cities.
- **Public Transport:** Live bus departures using OVapi for any configured route.
- **Tech News:** Auto-rotating latest headlines from Tweakers.net.
- **Spotify:** "Now Playing" integration.
- **System Status:** Uptime monitoring for selected websites.
- **Vacation Countdown:** Days left until upcoming holidays.

## 🚀 Getting Started

Ensure you have Node.js 20+ installed.

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## ⚙️ Configuration (.env)

Create a `.env` file in the root directory based on the following template.

```env
# Spotify Credentials (Optional but required for the Spotify widget)
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
SPOTIFY_REFRESH_TOKEN=your_token

# Bus (OVapi)
# Stop where you depart (e.g., 30005112)
OVAPI_START_CODE=30005112
# Stop where you arrive (e.g., 53000011)
OVAPI_END_CODE=53000011

# Weather (Open-Meteo)
# City 1 (Left Bottom Box)
WEATHER_CITY1_NAME=Amsterdam
WEATHER_CITY1_LAT=52.3676
WEATHER_CITY1_LON=4.9041

# City 2 (Middle Bottom Box)
WEATHER_CITY2_NAME=Rotterdam
WEATHER_CITY2_LAT=51.9225
WEATHER_CITY2_LON=4.4792

# Uptime Monitor
# Comma-separated list of URLs to monitor (names will be extracted automatically)
UPTIME_SITES=https://example.com,https://github.com
```

### 📍 Finding your OVapi Stop Code (TPC)

To change the bus stop for your dashboard, you need the Timing Point Code (TPC). 

**How to find it:**
1. Go to **[OVzoeker.nl](https://ovzoeker.nl)**
2. Zoom in on your city and click on the bus stop you want to monitor.
3. In the popup over the stop, look for the **haltenummer** (a multi-digit number, e.g., `43221470`).
4. Copy this number and paste it into your `.env` file as `OVAPI_START_CODE`. Repeat for your destination to get `OVAPI_END_CODE`.

Alternatively, you can use the [OVapi TPC Finder tool](https://william-sy.github.io/ovapi-tpc-finder/site/index.html).

## 🌍 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on how to put this dashboard on a live server (VPS or Railway).
