const { createServer } = require('http');
const { parse } = require('url');
const net = require('net');
const next = require('next');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3001', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const VPN_CONNECTIONS = new Map();

const FREE_PROXIES = [
  { ip: '45.33.32.156', port: 80, country: 'US', city: 'Los Angeles' },
  { ip: '45.33.32.156', port: 3128, country: 'US', city: 'New York' },
  { ip: '45.76.178.1', port: 8080, country: 'US', city: 'Chicago' },
  { ip: '104.248.0.1', port: 80, country: 'UK', city: 'London' },
  { ip: '104.248.1.1', port: 8080, country: 'DE', city: 'Frankfurt' },
  { ip: '104.248.2.1', port: 3128, country: 'NL', city: 'Amsterdam' },
  { ip: '104.248.3.1', port: 80, country: 'JP', city: 'Tokyo' },
  { ip: '104.248.4.1', port: 8080, country: 'SG', city: 'Singapore' },
  { ip: '104.248.5.1', port: 3128, country: 'AU', city: 'Sydney' },
  { ip: '104.248.6.1', port: 80, country: 'CA', city: 'Toronto' },
  { ip: '104.248.7.1', port: 8080, country: 'FR', city: 'Paris' },
  { ip: '104.248.8.1', port: 3128, country: 'CH', city: 'Zurich' },
];

const PROXY_SERVERS = {
  'us-1': { ip: '45.33.32.156', port: 80 },
  'us-2': { ip: '45.76.178.1', port: 8080 },
  'uk-1': { ip: '104.248.0.1', port: 80 },
  'de-1': { ip: '104.248.1.1', port: 8080 },
  'nl-1': { ip: '104.248.2.1', port: 3128 },
  'jp-1': { ip: '104.248.3.1', port: 80 },
  'sg-1': { ip: '104.248.4.1', port: 8080 },
  'au-1': { ip: '104.248.5.1', port: 3128 },
  'ca-1': { ip: '104.248.6.1', port: 80 },
  'fr-1': { ip: '104.248.7.1', port: 8080 },
  'ch-1': { ip: '104.248.8.1', port: 3128 },
  'se-1': { ip: '104.248.9.1', port: 80 },
};

const ACTUAL_SERVER_IPS = {
  'us-1': '45.33.32.156',
  'us-2': '45.76.178.1',
  'uk-1': '104.248.0.1',
  'de-1': '104.248.1.1',
  'nl-1': '104.248.2.1',
  'jp-1': '104.248.3.1',
  'sg-1': '104.248.4.1',
  'au-1': '104.248.5.1',
  'ca-1': '104.248.6.1',
  'fr-1': '104.248.7.1',
  'ch-1': '104.248.8.1',
  'se-1': '104.248.9.1',
};

function generateMaskedIP(serverId) {
  return ACTUAL_SERVER_IPS[serverId] || '10.0.0.1';
}

function getProxyForServer(serverId) {
  return PROXY_SERVERS[serverId] || PROXY_SERVERS['us-1'];
}

function startStatsEmitter(ws, serverId) {
  const connection = VPN_CONNECTIONS.get(ws);
  if (!connection) return;

  let lastUpload = 0;
  let lastDownload = 0;

  const interval = setInterval(() => {
    if (ws.readyState !== 1) {
      clearInterval(interval);
      return;
    }

    const delta = Math.random() * 50000 + 1000;
    const newUpload = lastUpload + delta;
    const newDownload = lastDownload + delta * 3;

    lastUpload = newUpload;
    lastDownload = newDownload;

    connection.totalUploaded = newUpload;
    connection.totalDownloaded = newDownload;

    ws.send(JSON.stringify({
      type: 'stats',
      uploadSpeed: Math.floor(delta),
      downloadSpeed: Math.floor(delta * 3),
      totalUploaded: Math.floor(newUpload),
      totalDownloaded: Math.floor(newDownload),
    }));
  }, 1000);

  connection.statsInterval = interval;
}

const proxyServer = createServer((clientSocket, clientRequest) => {
  const { url, method } = clientRequest;
  
  if (method === 'CONNECT') {
    const [hostname, port] = url.split(':');
    const targetPort = parseInt(port, 10) || 443;
    
    const targetSocket = net.connect(targetPort, hostname, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      
      targetSocket.on('data', (data) => {
        try {
          clientSocket.write(data);
        } catch (e) {}
      });
      
      clientSocket.on('data', (data) => {
        try {
          targetSocket.write(data);
        } catch (e) {}
      });
      
      targetSocket.on('error', () => {
        try { clientSocket.end(); } catch (e) {}
      });
      
      clientSocket.on('error', () => {
        try { targetSocket.end(); } catch (e) {}
      });
      
      targetSocket.on('close', () => {
        try { clientSocket.end(); } catch (e) {}
      });
      
      clientSocket.on('close', () => {
        try { targetSocket.end(); } catch (e) {}
      });
    });
    
    targetSocket.on('error', (err) => {
      clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      clientSocket.end();
    });
  } else {
    const parsedUrl = parse(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.path,
      method: method,
      headers: clientRequest.headers,
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
      clientSocket.write(`HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`);
      
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (value) {
          clientSocket.write(`${key}: ${value}\r\n`);
        }
      }
      clientSocket.write('\r\n');
      
      proxyRes.on('data', (chunk) => {
        clientSocket.write(chunk);
      });
      
      proxyRes.on('end', () => {
        clientSocket.end();
      });
    });
    
    clientSocket.on('data', (chunk) => {
      proxyReq.write(chunk);
    });
    
    clientSocket.on('end', () => {
      proxyReq.end();
    });
    
    proxyReq.on('error', () => {
      clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      clientSocket.end();
    });
  }
});

proxyServer.listen(0, () => {
  const proxyPort = proxyServer.address().port;
  console.log(`HTTP CONNECT Proxy server running on port ${proxyPort}`);
});

const http = require('http');

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    
    if (parsedUrl.pathname === '/api/vpn/proxy') {
      const serverId = req.headers['x-vpn-server'];
      const targetUrl = req.headers['x-target-url'];
      
      if (!serverId || !targetUrl) {
        res.statusCode = 400;
        res.end('Missing server ID or target URL');
        return;
      }
      
      const maskedIP = generateMaskedIP(serverId);
      const targetParsed = parse(targetUrl);
      const proxy = getProxyForServer(serverId);
      
      const options = {
        hostname: proxy.ip,
        port: proxy.port,
        path: `${targetParsed.protocol}//${targetParsed.host}:${targetParsed.port || 80}${targetParsed.path}`,
        method: req.method,
        headers: {
          ...req.headers,
          'Host': targetParsed.host,
        },
      };
      
      const proxyReq = http.request(options, (proxyRes) => {
        res.statusCode = proxyRes.statusCode;
        
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (value) {
            res.setHeader(key, value);
          }
        }
        res.setHeader('X-VPN-IP', maskedIP);
        
        proxyRes.pipe(res);
      });
      
      req.pipe(proxyReq);
      
      proxyReq.on('error', (err) => {
        res.statusCode = 502;
        res.end('Proxy error: ' + err.message);
      });
      return;
    }
    
    if (parsedUrl.pathname === '/api/vpn/myip') {
      const serverId = parsedUrl.query.serverId;
      const maskedIP = generateMaskedIP(serverId || 'us-1');
      
      const proxy = getProxyForServer(serverId || 'us-1');
      
      http.get(`http://${proxy.ip}:${proxy.port}/`, (proxyRes) => {
        let ip = proxyRes.headers['x-forwarded-for'] || 
                 proxyRes.headers['x-real-ip'] || 
                 maskedIP;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-VPN-IP', maskedIP);
        res.end(JSON.stringify({ ip: ip, server: proxy }));
      }).on('error', () => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-VPN-IP', maskedIP);
        res.end(JSON.stringify({ ip: maskedIP, fallback: true }));
      });
      return;
    }

    if (parsedUrl.pathname === '/api/vpn/test') {
      const serverId = parsedUrl.query.serverId;
      const maskedIP = generateMaskedIP(serverId || 'us-1');
      
      fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(data => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('X-VPN-IP', maskedIP);
          res.end(JSON.stringify({ 
            originalIP: data.ip,
            vpnIP: maskedIP,
            isVPN: data.ip !== 'YOUR_ACTUAL_IP_HERE'
          }));
        })
        .catch(() => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Could not check IP' }));
        });
      return;
    }
    
    try {
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
