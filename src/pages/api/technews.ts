export const prerender = false;

import type { APIRoute } from 'astro';

// In-memory cache (TTL: 5 min)
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 300000;

export const GET: APIRoute = async () => {
    // Return cached data if fresh
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
        return new Response(JSON.stringify(cache.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const res = await fetch('http://feeds.feedburner.com/tweakers/nieuws', {
            signal: AbortSignal.timeout(5000)
        });
        const xml = await res.text();

        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let i = 0;

        while ((match = itemRegex.exec(xml)) !== null && i < 10) {
            const itemContent = match[1];
            const titleMatch = itemContent.match(/<title>([^<]+)<\/title>/);
            const dateMatch = itemContent.match(/<pubDate>([^<]+)<\/pubDate>/);

            if (titleMatch) {
                let timeStr = '';
                if (dateMatch) {
                    const date = new Date(dateMatch[1]);
                    const day = date.toLocaleDateString('nl-NL', { weekday: 'short' });
                    const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                    timeStr = `${day} ${time}`;
                }

                items.push({
                    title: titleMatch[1],
                    time: timeStr
                });
                i++;
            }
        }

        const result = { headlines: items };
        cache = { data: result, ts: Date.now() };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        // Return stale cache if available
        if (cache) {
            return new Response(JSON.stringify(cache.data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(JSON.stringify({ headlines: [{ title: 'News unavailable', time: '--:--' }] }), { status: 200 });
    }
};
