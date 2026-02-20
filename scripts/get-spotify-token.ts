/*
  Spotify Refresh Token Getter
  1. Add your Client ID and Secret to .env
  2. Run: npx tsx scripts/get-spotify-token.ts
  3. A browser will open. Log in and authorize.
  4. The script captures the callback automatically.
*/
import 'dotenv/config';
import http from 'http';
import { exec } from 'child_process';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env');
    process.exit(1);
}

const scopes = 'user-read-currently-playing user-read-playback-state';
const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

async function exchangeCode(code: string): Promise<void> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI
        })
    });

    const data: any = await response.json();

    if (data.error) {
        console.error('\nError:', data.error, data.error_description);
    } else {
        console.log('\nSuccess! Add this to your .env file:\n');
        console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://127.0.0.1:${PORT}`);

    if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Authorization denied</h1><p>You can close this tab.</p>');
            console.error('\nAuthorization denied:', error);
            server.close();
            process.exit(1);
        }

        if (code) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Got it!</h1><p>Check your terminal for the refresh token. You can close this tab.</p>');
            await exchangeCode(code);
            server.close();
            process.exit(0);
        }
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\nLocal server started on http://127.0.0.1:${PORT}`);
    console.log('Opening browser for Spotify authorization...\n');

    // Open browser (Windows)
    exec(`start "" "${authUrl}"`);
});
