import 'dotenv/config';
import cors from 'cors';
import express from 'express';

import {
  PairingError,
  activeCount,
  createSession,
  getSession,
  normalizeNumber,
  publicView,
  shutdown
} from './pairing.js';

const PORT = Number(process.env.PORT) || 8080;
const MAX_ACTIVE = Number(process.env.MAX_ACTIVE_SESSIONS) || 20;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Render, Railway and similar hosts sit behind one proxy
app.use(express.json({ limit: '2kb' }));

app.use(cors({
  origin(origin, done) {
    // Requests with no Origin header (curl, the bot's .pair command) are not browser requests.
    if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) return done(null, true);
    // With nothing configured, allow pages served from this same machine so local testing just works.
    if (!ALLOWED_ORIGINS.length && LOCAL_ORIGIN.test(origin)) return done(null, true);
    return done(null, false);
  },
  methods: ['GET', 'POST']
}));

/* ---------- Rate limit: link attempts per IP ---------- */

const hits = new Map();
// Returns true if the request may go on. Otherwise it has already been answered.
function allow(req, res) {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - recent[0])) / 1000);
    res.set('Retry-After', String(retryAfter));
    sendError(res, 429, 'RATE_LIMITED', 'Too many attempts. Try again in a few minutes.');
    return false;
  }
  recent.push(now);
  hits.set(req.ip, recent);
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) {
    if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

/* ---------- Routes ---------- */

// Used by the site's "Bot online" pill and by host health checks.
app.get(['/', '/health'], (req, res) => {
  res.json({ status: 'ok', service: 'cyntron-x-pairing', active: activeCount() });
});

// Start a pairing-code link. Body: { "number": "2348012345678" }
app.post('/api/pair', async (req, res, next) => {
  try {
    const number = normalizeNumber(req.body?.number);
    if (!number) {
      return sendError(res, 400, 'INVALID_NUMBER', 'Enter the full number with country code, digits only.');
    }
    if (!allow(req, res)) return;
    const s = await createSession({ mode: 'code', number, maxActive: MAX_ACTIVE });
    res.status(201).json(publicView(s));
  } catch (err) {
    next(err);
  }
});

// Start a QR link. No body.
app.post('/api/qr', async (req, res, next) => {
  try {
    if (!allow(req, res)) return;
    const s = await createSession({ mode: 'qr', maxActive: MAX_ACTIVE });
    res.status(201).json(publicView(s));
  } catch (err) {
    next(err);
  }
});

// Poll a link attempt. status: pending | linked | expired | failed
app.get('/api/session/:id', (req, res) => {
  const s = /^[a-f0-9]{32}$/.test(req.params.id) ? getSession(req.params.id) : null;
  if (!s) return sendError(res, 404, 'NOT_FOUND', 'This link attempt was not found or has expired.');
  res.set('Cache-Control', 'no-store');
  res.json(publicView(s));
});

// Same shape the bot's .pair command already calls: GET /code?number=...
app.get('/code', async (req, res) => {
  try {
    const number = normalizeNumber(req.query.number);
    if (!number) return res.status(400).json({ code: 'Invalid number' });
    if (!allow(req, res)) return;
    const s = await createSession({ mode: 'code', number, maxActive: MAX_ACTIVE });
    res.json({ code: s.code });
  } catch {
    res.status(503).json({ code: 'Service Unavailable' });
  }
});

app.use((req, res) => sendError(res, 404, 'NOT_FOUND', 'No such endpoint.'));

app.use((err, req, res, next) => {
  if (err instanceof PairingError) return sendError(res, err.status, err.code, err.message);
  if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large') {
    return sendError(res, 400, 'BAD_REQUEST', 'The request body is not valid JSON.');
  }
  console.error('[server] unexpected error:', err?.message || err);
  sendError(res, 500, 'SERVER_ERROR', 'Something went wrong. Try again.');
});

/* ---------- Start ---------- */

const server = app.listen(PORT, '0.0.0.0', (err) => {
  // Express 5 calls this with an error when the port cannot be opened.
  if (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${PORT} is already used by another program, so the pairing API did not start.`);
      console.error('[server] Stop that program, or pick another port, for example: PORT=8090 npm run dev');
    } else {
      console.error(`[server] Could not start on port ${PORT}: ${err.message}`);
    }
    process.exit(1);
  }
  console.log(`[server] pairing API listening on port ${PORT}`);
  if (!ALLOWED_ORIGINS.length) {
    console.warn('[server] ALLOWED_ORIGINS is empty: only pages on localhost can call this API. Set it to your site URL before deploying.');
  }
});

// One failed link attempt must not take the whole service down.
process.on('unhandledRejection', (err) => console.error('[server] unhandled rejection:', err?.message || err));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close();
    await shutdown();
    process.exit(0);
  });
}
