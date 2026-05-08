// At the VERY TOP - change this immediately!
const PSK = "Raymond15#secret";  // Replace with your secret

// Then paste the ENTIRE original script content here
// (the handler function, etc.)

// At the VERY BOTTOM - add this wrapper for Render:
const PORT = process.env.PORT || 3000;

// Create HTTP server for Render
import * as http from 'http';

const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
    // Convert Node request to web-standard Request
    const url = `http://${req.headers.host}${req.url}`;
    const request = new Request(url, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined
    });
    
    const response = await handler(request, { waitUntil: () => {} });
    
    res.writeHead(response.status, Object.fromEntries(response.headers));
    const body = await response.text();
    res.end(body);
});

server.listen(PORT, () => {
    console.log(`Exit node running on port ${PORT}`);
});
