const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3001', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const VPN_CONNECTIONS = new Map();

function generateMaskedIP(serverId) {
  const hash = serverId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const octet1 = 10 + (Math.abs(hash) % 240);
  const octet2 = Math.abs(hash >> 8) % 256;
  const octet3 = Math.abs(hash >> 16) % 256;
  const octet4 = 1 + (Math.abs(hash >> 24) % 254);
  
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

function startStatsEmitter(ws, serverId) {
  const connection = VPN_CONNECTIONS.get(ws);
  if (!connection) return;

  let lastUpload = 0;
  let lastDownload = 0;
  let uploadSpeed = 0;
  let downloadSpeed = 0;

  const interval = setInterval(() => {
    if (ws.readyState !== 1) {
      clearInterval(interval);
      return;
    }

    const delta = Math.random() * 50000 + 1000;
    const newUpload = lastUpload + delta;
    const newDownload = lastDownload + delta * 3;

    uploadSpeed = (newUpload - lastUpload);
    downloadSpeed = (newDownload - lastDownload);

    lastUpload = newUpload;
    lastDownload = newDownload;

    connection.totalUploaded = newUpload;
    connection.totalDownloaded = newDownload;

    ws.send(JSON.stringify({
      type: 'stats',
      uploadSpeed: Math.floor(uploadSpeed),
      downloadSpeed: Math.floor(downloadSpeed),
      totalUploaded: Math.floor(newUpload),
      totalDownloaded: Math.floor(newDownload),
    }));
  }, 1000);

  connection.statsInterval = interval;
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const wss = new WebSocketServer({ server, path: '/vpn' });

  wss.on('connection', (ws) => {
    console.log('New VPN connection');
    VPN_CONNECTIONS.set(ws, {
      serverId: null,
      maskedIP: null,
      connectedAt: null,
      totalUploaded: 0,
      totalDownloaded:0,
      statsInterval: null,
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        const connection = VPN_CONNECTIONS.get(ws);

        if (data.type === 'connect') {
          const server = data.server;
          const maskedIP = generateMaskedIP(server.id);

          connection.serverId = server.id;
          connection.maskedIP = maskedIP;
          connection.connectedAt = Date.now();

          console.log(`Client connected to ${server.country} - ${server.city}, IP: ${maskedIP}`);

          ws.send(JSON.stringify({
            type: 'connected',
            ip: maskedIP,
            server: server,
            message: `Connected to ${server.city}, ${server.country}`,
          }));

          startStatsEmitter(ws, server.id);
        } 
        else if (data.type === 'disconnect') {
          if (connection.statsInterval) {
            clearInterval(connection.statsInterval);
          }
          VPN_CONNECTIONS.delete(ws);
          ws.close();
        }
        else if (data.type === 'request') {
          const { url, method, headers, body } = data;
          
          fetch(url, {
            method,
            headers: { ...headers, 'X-Forwarded-For': connection.maskedIP },
            body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
          })
          .then(response => {
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
              responseHeaders[key] = value;
            });

            response.arrayBuffer().then(buffer => {
              ws.send(JSON.stringify({
                type: 'response',
                requestId: data.requestId,
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                body: Array.from(new Uint8Array(buffer)),
              }));
            });
          })
          .catch(err => {
            ws.send(JSON.stringify({
              type: 'response',
              requestId: data.requestId,
              status: 502,
              statusText: 'Bad Gateway',
              headers: {},
              body: [],
              error: err.message,
            }));
          });
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      const connection = VPN_CONNECTIONS.get(ws);
      if (connection && connection.statsInterval) {
        clearInterval(connection.statsInterval);
      }
      VPN_CONNECTIONS.delete(ws);
      console.log('VPN connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      const connection = VPN_CONNECTIONS.get(ws);
      if (connection && connection.statsInterval) {
        clearInterval(connection.statsInterval);
      }
      VPN_CONNECTIONS.delete(ws);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket VPN server running on ws://${hostname}:${port}/vpn`);
  });
});
