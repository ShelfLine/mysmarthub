// ==============================================================================
// CYBERSPECS LOCAL DEVELOPMENT SERVER & CLOUD API EMULATOR
// Zero-dependency Node.js server that runs the web app and /api/specs locally
// ==============================================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import specsHandler from './api/specs.js';
import scanHandler from './api/scan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Pre-load system-specs.json into api/specs cache if it exists on disk
try {
  const specsPath = path.join(__dirname, 'system-specs.json');
  if (fs.existsSync(specsPath)) {
    const raw = fs.readFileSync(specsPath, 'utf8').replace(/^\uFEFF/, '').trim();
    const specsData = JSON.parse(raw);
    const mockReq = { method: 'POST', body: specsData, headers: { host: `localhost:${PORT}` } };
    const mockRes = { setHeader: () => {}, status: () => ({ json: () => {} }) };
    await specsHandler(mockReq, mockRes);
    console.log(`[OK] Pre-loaded local hardware specs for: ${specsData.machineName} (${specsData.serialNumber})`);
  }
} catch (e) {
  console.warn('[!] Could not pre-seed system-specs.json:', e.message);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ps1': 'text/plain; charset=utf-8',
  '.bat': 'application/x-bat',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API Route: /api/specs
  if (pathname === '/api/specs') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      req.body = body;
      req.query = Object.fromEntries(parsedUrl.searchParams);
      
      const resShim = {
        setHeader: (k, v) => res.setHeader(k, v),
        status: (code) => {
          res.statusCode = code;
          return {
            json: (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            send: (data) => res.end(data),
            end: () => res.end()
          };
        }
      };

      await specsHandler(req, resShim);
    });
    return;
  }

  // 2. API Route: /api/scan or /scan.ps1 (Dynamic PowerShell script)
  if (pathname === '/api/scan' || pathname === '/scan.ps1') {
    const resShim = {
      setHeader: (k, v) => res.setHeader(k, v),
      status: (code) => {
        res.statusCode = code;
        return {
          send: (data) => res.end(data),
          json: (data) => res.end(JSON.stringify(data)),
          end: () => res.end()
        };
      }
    };
    await scanHandler(req, resShim);
    return;
  }

  // 3. Static Files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n==========================================================`);
  console.log(`  ⚡ CyberSpecs Local Server Running at: http://localhost:${PORT}`);
  console.log(`  🟢 Live Cloud API Endpoint: http://localhost:${PORT}/api/specs`);
  console.log(`  🌐 Streamed Script Endpoint: http://localhost:${PORT}/scan.ps1`);
  console.log(`==========================================================\n`);
});
