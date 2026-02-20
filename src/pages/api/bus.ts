export const prerender = false;

import type { APIRoute } from 'astro';

// Use new start/end code env vars, fallback to old one for backward compatibility
const START_CODE = import.meta.env.OVAPI_START_CODE || import.meta.env.OVAPI_STOP_CODE || '30005112';
const END_CODE = import.meta.env.OVAPI_END_CODE || '53000011';

interface Pass {
    LinePublicNumber: string;
    DestinationName50: string;
    ExpectedArrivalTime: string;
    TargetArrivalTime: string;
    TripStopStatus: string;
}

// In-memory cache (TTL: 120s)
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 120000;

export const GET: APIRoute = async () => {
    // Return cached data if fresh
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
        return new Response(JSON.stringify(cache.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
        });
    }

    try {
        // Fetch start stop data (contains passes and stop info)
        const resStart = await fetch(`http://v0.ovapi.nl/tpc/${START_CODE}`, { signal: AbortSignal.timeout(5000) });
        const dataStart = await resStart.json();
        const stopStartData = dataStart[START_CODE];

        if (!stopStartData || !stopStartData.Passes) {
            return new Response(JSON.stringify({ error: 'No data found for start stop' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const startName = stopStartData.Stop?.TimingPointName || 'Start';

        // Fetch end stop data just for the name (if provided)
        let endName = 'End';
        if (END_CODE) {
            try {
                const resEnd = await fetch(`http://v0.ovapi.nl/tpc/${END_CODE}`, { signal: AbortSignal.timeout(5000) });
                const dataEnd = await resEnd.json();
                endName = dataEnd[END_CODE]?.Stop?.TimingPointName || 'End';
            } catch (err) {
                console.error('Failed to fetch end stop name', err);
            }
        }

        const passes = Object.values(stopStartData.Passes) as Pass[];

        // Sort by departure. We no longer hardcode Line 62 or "Enschede" destination,
        // because the start/end TPC codes usually define the platform and direction explicitly.
        const busDepartures = passes
            .sort((a: Pass, b: Pass) => new Date(a.ExpectedArrivalTime).getTime() - new Date(b.ExpectedArrivalTime).getTime());

        const now = Date.now();

        const formatDeparture = (bus: Pass) => {
            const arrivalTime = new Date(bus.ExpectedArrivalTime).getTime();
            const minutes = Math.max(0, Math.floor((arrivalTime - now) / 60000));
            return {
                line: bus.LinePublicNumber,
                destination: bus.DestinationName50,
                time: bus.ExpectedArrivalTime,
                minutes,
                status: bus.TripStopStatus
            };
        };

        const result: any = {
            startName,
            endName
        };

        if (busDepartures.length >= 1) {
            result.current = formatDeparture(busDepartures[0]);
            result.minutes = result.current.minutes;
            result.line = result.current.line;
        }
        if (busDepartures.length >= 2) {
            result.next = formatDeparture(busDepartures[1]);
        }

        if (!result.current) {
            result.error = 'No upcoming bus found';
        }

        // Cache the result
        cache = { data: result, ts: Date.now() };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (e) {
        console.error('Bus fetch error:', e);
        return new Response(JSON.stringify({ error: 'Failed to fetch bus data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
