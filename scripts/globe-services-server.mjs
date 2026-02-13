import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.GLOBE_SERVICES_PORT || 4020);
const WEATHER_MODE = String(process.env.GLOBE_WEATHER_MODE || 'fixture').toLowerCase();
const FIXTURE_SUPPORTED = true;
const WEATHER_TYPES = new Set(['clouds', 'precipitation', 'temperature', 'radar', 'snow']);

// Deterministic 1x1 PNG fixture payloads by weather type.
const PNG_FIXTURES = Object.freeze({
  clouds: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5Wm1cAAAAASUVORK5CYII=', 'base64'),
  precipitation: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5Wm1cAAAAASUVORK5CYII=', 'base64'),
  temperature: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5Wm1cAAAAASUVORK5CYII=', 'base64'),
  radar: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5Wm1cAAAAASUVORK5CYII=', 'base64'),
  snow: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5Wm1cAAAAASUVORK5CYII=', 'base64')
});

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const json = (res, status, payload) => {
  setCors(res);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(payload));
};

const sendPng = (res, pngBuffer, cacheSeconds = 300) => {
  setCors(res);
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Cache-Control': `public, max-age=${cacheSeconds}`,
    'Content-Length': String(pngBuffer.length)
  });
  res.end(pngBuffer);
};

const weatherPathRegex = /^\/api\/globe\/weather\/([a-z-]+)\/(\d+)\/(\d+)\/(\d+)\.png$/;

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  let fullUrl;
  try {
    fullUrl = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${PORT}`}`);
  } catch {
    json(res, 400, { success: false, error: 'BAD_URL' });
    return;
  }
  const pathname = fullUrl.pathname;

  if (pathname === '/api/globe/weather/status' && req.method === 'GET') {
    json(res, 200, {
      success: true,
      data: {
        service: 'Relay Globe Services',
        mode: WEATHER_MODE,
        fixtureSupported: FIXTURE_SUPPORTED,
        fixtureDeterministic: WEATHER_MODE === 'fixture',
        weatherTypes: [...WEATHER_TYPES].map((type) => ({ type, available: true })),
        profileIsolation: 'WORLD_ONLY_EXPECTED'
      }
    });
    return;
  }

  const weatherMatch = pathname.match(weatherPathRegex);
  if (weatherMatch && req.method === 'GET') {
    const weatherType = String(weatherMatch[1] || '').toLowerCase();
    const requestedMode = String(fullUrl.searchParams.get('mode') || WEATHER_MODE).toLowerCase();
    if (!WEATHER_TYPES.has(weatherType)) {
      json(res, 404, { success: false, error: 'UNKNOWN_WEATHER_TYPE', weatherType });
      return;
    }
    if (requestedMode !== 'fixture') {
      json(res, 501, {
        success: false,
        error: 'NON_FIXTURE_MODE_NOT_IMPLEMENTED',
        mode: requestedMode
      });
      return;
    }

    const png = PNG_FIXTURES[weatherType] || PNG_FIXTURES.clouds;
    res.setHeader('X-Relay-Weather-Type', weatherType);
    res.setHeader('X-Relay-Weather-Mode', requestedMode);
    sendPng(res, png, 300);
    return;
  }

  json(res, 404, { success: false, error: 'NOT_FOUND' });
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`[GLOBE-SERVICES] listening http://127.0.0.1:${PORT} mode=${WEATHER_MODE} fixtureSupported=${FIXTURE_SUPPORTED}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

