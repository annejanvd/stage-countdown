export const prerender = false;

import type { APIRoute } from 'astro';

const envSites = import.meta.env.UPTIME_SITES || 'https://cloudflare.com,https://github.com';
const sites = envSites.split(',').map((raw: string) => {
    const url = raw.trim();
    try {
        const hostname = new URL(url).hostname;
        return { name: hostname.replace(/^www\./, ''), url };
    } catch {
        return { name: url, url };
    }
}).filter((s: { url: string }) => s.url);

// In-memory cache (TTL: 60s)
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 60000;

export const GET: APIRoute = async () => {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
        return new Response(JSON.stringify(cache.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const results = await Promise.all(
        sites.map(async (site: { name: string; url: string }) => {
            try {
                const start = Date.now();
                const res = await fetch(site.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
                return { name: site.name, up: res.ok, ms: Date.now() - start };
            } catch {
                return { name: site.name, up: false, ms: 0 };
            }
        })
    );

    cache = { data: results, ts: Date.now() };

    return new Response(JSON.stringify(results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
