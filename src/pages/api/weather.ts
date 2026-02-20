export const prerender = false;

import type { APIRoute } from 'astro';

const LOCATIONS = {
    city1: {
        lat: parseFloat(import.meta.env.WEATHER_CITY1_LAT || '52.3676'),
        lon: parseFloat(import.meta.env.WEATHER_CITY1_LON || '4.9041')
    },
    city2: {
        lat: parseFloat(import.meta.env.WEATHER_CITY2_LAT || '51.9225'),
        lon: parseFloat(import.meta.env.WEATHER_CITY2_LON || '4.4792')
    },
};

// WMO Weather codes -> Dutch description, icon key, warning level
const WMO_MAP: Record<number, { desc: string; icon: string; level: string }> = {
    0: { desc: 'Helder', icon: 'sun', level: 'groen' },
    1: { desc: 'Overwegend helder', icon: 'sun', level: 'groen' },
    2: { desc: 'Half bewolkt', icon: 'cloud-sun', level: 'groen' },
    3: { desc: 'Bewolkt', icon: 'cloud', level: 'groen' },
    45: { desc: 'Mist', icon: 'mist', level: 'geel' },
    48: { desc: 'Rijpmist', icon: 'snowflake', level: 'geel' },
    51: { desc: 'Lichte motregen', icon: 'cloud-drizzle', level: 'groen' },
    53: { desc: 'Motregen', icon: 'cloud-drizzle', level: 'geel' },
    55: { desc: 'Zware motregen', icon: 'cloud-rain', level: 'geel' },
    56: { desc: 'Ijzel (licht)', icon: 'snowflake', level: 'oranje' },
    57: { desc: 'Ijzel', icon: 'snowflake', level: 'oranje' },
    61: { desc: 'Lichte regen', icon: 'cloud-rain', level: 'groen' },
    63: { desc: 'Regen', icon: 'cloud-rain', level: 'geel' },
    65: { desc: 'Zware regen', icon: 'cloud-storm', level: 'oranje' },
    66: { desc: 'IJsregen (licht)', icon: 'snowflake', level: 'oranje' },
    67: { desc: 'IJsregen', icon: 'snowflake', level: 'rood' },
    71: { desc: 'Lichte sneeuw', icon: 'cloud-snow', level: 'geel' },
    73: { desc: 'Sneeuw', icon: 'cloud-snow', level: 'geel' },
    75: { desc: 'Zware sneeuw', icon: 'cloud-snow', level: 'oranje' },
    77: { desc: 'Sneeuwkorrels', icon: 'cloud-snow', level: 'geel' },
    80: { desc: 'Lichte buien', icon: 'cloud-rain', level: 'groen' },
    81: { desc: 'Buien', icon: 'cloud-rain', level: 'geel' },
    82: { desc: 'Zware buien', icon: 'cloud-storm', level: 'oranje' },
    85: { desc: 'Lichte sneeuwbuien', icon: 'cloud-snow', level: 'geel' },
    86: { desc: 'Zware sneeuwbuien', icon: 'cloud-snow', level: 'oranje' },
    95: { desc: 'Onweer', icon: 'bolt', level: 'oranje' },
    96: { desc: 'Onweer + hagel', icon: 'bolt', level: 'oranje' },
    99: { desc: 'Zwaar onweer', icon: 'bolt', level: 'rood' },
};

const DEFAULT_WMO = { desc: 'Onbekend', icon: 'cloud', level: 'groen' };

// In-memory cache (TTL: 15 min)
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 900000;

async function fetchCity(lat: number, lon: number) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe/Amsterdam`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();

    const code = data.current.weather_code;
    const wmo = WMO_MAP[code] || DEFAULT_WMO;

    return {
        temp: data.current.temperature_2m,
        condition: wmo.desc,
        icon: wmo.icon,
        level: wmo.level,
        wind: data.current.wind_speed_10m,
    };
}

export const GET: APIRoute = async () => {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
        return new Response(JSON.stringify(cache.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const [city1Data, city2Data] = await Promise.all([
            fetchCity(LOCATIONS.city1.lat, LOCATIONS.city1.lon),
            fetchCity(LOCATIONS.city2.lat, LOCATIONS.city2.lon),
        ]);

        const result = {
            city1: city1Data,
            city2: city2Data
        };
        cache = { data: result, ts: Date.now() };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('Weather fetch error:', e);
        if (cache) {
            return new Response(JSON.stringify(cache.data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(JSON.stringify({
            city1: { temp: '--', condition: 'Offline', icon: 'cloud', level: 'groen', wind: 0 },
            city2: { temp: '--', condition: 'Offline', icon: 'cloud', level: 'groen', wind: 0 }
        }), { status: 200 });
    }
};
