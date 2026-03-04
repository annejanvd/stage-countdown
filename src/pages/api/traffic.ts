export const prerender = false;

import type { APIRoute } from 'astro';

// TomTom Routing API requires an API key
const TOMTOM_API_KEY = import.meta.env.TOMTOM_API_KEY;

// Default coordinates: Oldenzaal (Start) to Hengelo (End)
const ROUTE_START = import.meta.env.TRAFFIC_START || '52.3133,6.9294';
const ROUTE_END = import.meta.env.TRAFFIC_END || '52.2658,6.7923';

// In-memory cache (TTL: 5 min) 
// TomTom Free Tier is 2500 req/day (approx 1.7 req/min max)
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 300000;

export const GET: APIRoute = async () => {
    if (!TOMTOM_API_KEY) {
        return new Response(JSON.stringify({ error: 'Missing TOMTOM_API_KEY' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (cache && Date.now() - cache.ts < CACHE_TTL) {
        return new Response(JSON.stringify(cache.data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
            }
        });
    }

    try {
        // TomTom Routing API v8
        const url = `https://api.tomtom.com/routing/1/calculateRoute/${ROUTE_START}:${ROUTE_END}/json?key=${TOMTOM_API_KEY}&traffic=true&travelMode=car`;

        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error(`TomTom API returned ${res.status}`);

        const data = await res.json();

        if (!data.routes || data.routes.length === 0) {
            throw new Error('No routes returned');
        }

        const summary = data.routes[0].summary;

        // Travel time is returned in seconds
        const travelTimeMinutes = Math.round(summary.travelTimeInSeconds / 60);
        const trafficDelayMinutes = Math.round(summary.trafficDelayInSeconds / 60);

        const result = {
            travelTimeMinutes,
            trafficDelayMinutes,
            distanceKm: (summary.lengthInMeters / 1000).toFixed(1),
            hasDelay: trafficDelayMinutes > 0
        };

        cache = { data: result, ts: Date.now() };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
            }
        });

    } catch (e) {
        console.error('Traffic API error:', e);
        return new Response(JSON.stringify({ error: 'Failed to fetch traffic data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
