export const prerender = false;

import type { APIRoute } from 'astro';
import dgram from 'node:dgram';

export const GET: APIRoute = async () => {
    try {
        const ntpServer = 'ntp1.hetzner.de';

        const time = await new Promise<number>((resolve, reject) => {
            const client = dgram.createSocket('udp4');
            const packet = Buffer.alloc(48);
            packet[0] = 0x1B;

            const timeout = setTimeout(() => {
                try { client.close(); } catch { }
                reject(new Error('NTP timeout'));
            }, 1000);

            client.on('message', (msg) => {
                clearTimeout(timeout);
                try { client.close(); } catch { }

                const seconds = msg.readUInt32BE(40);
                const fraction = msg.readUInt32BE(44);
                const ms = (seconds - 2208988800) * 1000 + (fraction / 4294967296) * 1000;
                resolve(ms);
            });

            client.on('error', (err) => {
                clearTimeout(timeout);
                try { client.close(); } catch { }
                reject(err);
            });

            try {
                client.send(packet, 0, 48, 123, ntpServer);
            } catch (err) {
                clearTimeout(timeout);
                try { client.close(); } catch { }
                reject(err);
            }
        });

        return new Response(JSON.stringify({ ts: time }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('NTP sync failed:', e);
        return new Response(JSON.stringify({ ts: Date.now() }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
