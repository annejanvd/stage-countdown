export const prerender = false;

import type { APIRoute } from 'astro';

const client_id = import.meta.env.SPOTIFY_CLIENT_ID;
const client_secret = import.meta.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = import.meta.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;

// In-memory token cache
let tokenCache: { access_token: string; expires_at: number } | null = null;
let songCache: { data: any; ts: number } | null = null;
const SONG_CACHE_TTL = 120000;

const getAccessToken = async () => {
    // Return cached token if still valid (with 60s buffer)
    if (tokenCache && Date.now() < tokenCache.expires_at - 60000) {
        return tokenCache.access_token;
    }

    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token,
        }),
    });

    const data = await response.json();
    tokenCache = {
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in * 1000),
    };
    return data.access_token;
};

const getNowPlaying = async (access_token: string) => {
    return fetch(NOW_PLAYING_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
};

export const GET: APIRoute = async () => {
    if (!client_id || !client_secret || !refresh_token) {
        return new Response(JSON.stringify({ isPlaying: false, message: 'Missing credentials' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        if (songCache && Date.now() - songCache.ts < SONG_CACHE_TTL) {
            return new Response(JSON.stringify(songCache.data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const access_token = await getAccessToken();
        const response = await getNowPlaying(access_token);

        if (response.status === 204 || response.status > 400) {
            return new Response(JSON.stringify({ isPlaying: false }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const song = await response.json();

        if (!song.item) {
            return new Response(JSON.stringify({ isPlaying: false }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = {
            isPlaying: song.is_playing,
            title: song.item.name,
            artist: song.item.artists.map((_artist: any) => _artist.name).join(', '),
            album: song.item.album.name,
            albumArt: song.item.album.images?.[0]?.url,
            url: song.item.external_urls.spotify
        };

        songCache = { data: result, ts: Date.now() };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=30'
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ isPlaying: false, message: 'Error fetching data' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
