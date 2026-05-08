// exit_node.js - Complete working version for Render

// ===== CONFIGURATION - CHANGE THIS =====
const PSK = "skkddjssuecgb238shdu";  // Replace with your secret key
// =======================================

// Helper function to send JSON response
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Main request handler
async function handler(req) {
    // Only accept POST
    if (req.method !== 'POST') {
        return jsonResponse({ e: 'method_not_allowed' }, 405);
    }

    // Check PSK
    const authHeader = req.headers.get('authorization');
    const psk = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!psk || psk !== PSK) {
        return jsonResponse({ e: 'unauthorized' }, 401);
    }

    try {
        const body = await req.json();
        const { url, method = 'GET', headers = {}, body: reqBody } = body;

        // Loop guard - prevent fetching self
        const host = req.headers.get('host');
        if (url && host && (url.includes(host) || url.includes('onrender.com'))) {
            return jsonResponse({ e: 'loop_detected' }, 400);
        }

        // Make the real request
        const fetchHeaders = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...headers
        };

        const fetchOptions = {
            method: method.toUpperCase(),
            headers: fetchHeaders
        };

        if (reqBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            fetchOptions.body = typeof reqBody === 'string' ? reqBody : JSON.stringify(reqBody);
        }

        const response = await fetch(url, fetchOptions);
        const responseBody = await response.text();

        return jsonResponse({
            status: response.status,
            headers: Object.fromEntries(response.headers),
            body: responseBody
        }, 200);

    } catch (err) {
        return jsonResponse({ e: err.message }, 500);
    }
}

// HTTP server for Render
const PORT = process.env.PORT || 3000;
const http = require('http');

const server = http.createServer(async (req, res) => {
    // Build request object
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', async () => {
        try {
            const request = new Request(`http://${req.headers.host}${req.url}`, {
                method: req.method,
                headers: req.headers,
                body: body.length ? Buffer.concat(body) : undefined
            });
            
            const response = await handler(request);
            const responseBody = await response.text();
            
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(responseBody);
        } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ e: err.message }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`Exit node running on port ${PORT}`);
    console.log(`PSK configured: ${PSK === 'YOUR_STRONG_SECRET_HERE' ? '⚠️  USING PLACEHOLDER - CHANGE THIS!' : '✅ OK'}`);
});
