
// This is a temporary local server to test the /api/proxy endpoint
// Run this with: bun scripts/test-proxy.js

const PORT = 3001;

console.log(`Starting local proxy server on http://localhost:${PORT}...`);

const server = Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === '/api/proxy') {
            const targetUrl = url.searchParams.get('url');

            if (!targetUrl) {
                return new Response(JSON.stringify({ error: 'Missing "url" parameter' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }

            console.log(`[Proxy] Fetching: ${targetUrl}`);

            try {
                const response = await fetch(targetUrl, {
                    method: req.method,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                    body: req.method !== 'GET' ? await req.blob() : undefined,
                });

                // Copy headers
                const headers = new Headers(response.headers);
                headers.set('Access-Control-Allow-Origin', '*');
                headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                headers.set('Access-Control-Allow-Headers', '*');

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers,
                });
            } catch (error) {
                console.error(`[Proxy Error] ${error.message}`);
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }
        }

        return new Response('Not Found', { status: 404 });
    },
});
