export const prerender = false;

import type { APIRoute } from 'astro';
import { XMLParser } from 'fast-xml-parser';

// In-memory cache (TTL: 5 min)
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 300000;

const parser = new XMLParser({ ignoreAttributes: false });

export const GET: APIRoute = async () => {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
        return new Response(JSON.stringify(cache.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const res = await fetch('https://tweakers.net/feeds/nieuws.xml', {
            signal: AbortSignal.timeout(5000)
        });
        const xml = await res.text();

        const feed = parser.parse(xml);
        const rawItems: any[] = feed?.rss?.channel?.item ?? [];

        const items = rawItems.slice(0, 10).map((item: any) => {
            let timeStr = '';
            if (item.pubDate) {
                const date = new Date(item.pubDate);
                const day = date.toLocaleDateString('nl-NL', { weekday: 'short' });
                const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                timeStr = `${day} ${time}`;
            }
            return { title: String(item.title ?? ''), time: timeStr, link: String(item.link ?? '') };
        }).filter((item: { title: string }) => item.title);

        const result = { headlines: items };
        cache = { data: result, ts: Date.now() };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        if (cache) {
            return new Response(JSON.stringify(cache.data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(JSON.stringify({ headlines: [{ title: 'News unavailable', time: '--:--' }] }), { status: 200 });
    }
};
