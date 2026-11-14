/*
 * Link attempts.
 *
 * Each attempt opens a temporary WhatsApp connection, waits for the user to
 * confirm on their phone, then turns the saved credentials into a SESSION_ID
 * and sends it to the user's own WhatsApp chat. The temporary files are
 * deleted afterwards. Nothing is kept on this server.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';

// The bot reads SESSION_ID as this prefix followed by base64 of creds.json.
const SESSION_PREFIX = 'Cyntron-X:~';

const TTL_MS = 5 * 60 * 1000;        // how long a link attempt stays open
const READY_TIMEOUT_MS = 30 * 1000;  // how long to wait for WhatsApp to give a code or QR
const KEEP_RESULT_MS = 2 * 60 * 1000; // how long a finished attempt stays readable
const WORK_DIR = path.join(os.tmpdir(), 'cyntron-x-pairing');

const waLogger = pino({ level: 'silent' });
const sessions = new Map();
let waVersion;

export class PairingError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Strips formatting and returns digits only, or null if it is not a usable number. */
export function normalizeNumber(input) {
  const digits = String(input ?? '').replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15 || digits.startsWith('0')) return null;
  return digits;
}

export function activeCount() {
  let n = 0;
  for (const s of sessions.values()) if (s.status === 'pending') n += 1;
  return n;
}

/** What the frontend is allowed to see. Never includes credentials. */
export function publicView(s) {
  const view = {
    id: s.id,
    mode: s.mode,
    status: s.status,
    expiresIn: Math.max(0, Math.ceil((s.expiresAt - Date.now()) / 1000))
  };
  if (s.status === 'pending' && s.mode === 'code') view.code = s.code;
  if (s.status === 'pending' && s.mode === 'qr') view.qr = s.qr;
  if (s.status === 'failed' || s.status === 'expired') view.message = s.message;
  if (s.status === 'linked') view.message = 'Linked. Your session ID was sent to your own WhatsApp chat.';
  return view;
}

export function getSession(id) {
  return sessions.get(id) || null;
}

/**
 * Starts a link attempt and resolves once the pairing code or first QR is ready.
 * mode: 'code' (needs number) or 'qr'.
 */
export async function createSession({ mode, number, maxActive }) {
  if (activeCount() >= maxActive) {
    throw new PairingError('BUSY', 'The pairing service is busy. Try again in a minute.', 503);
  }
  if (mode === 'code') {
    for (const s of sessions.values()) {
      if (s.status === 'pending' && s.number === number) {
        throw new PairingError('ALREADY_PENDING', 'A code was just requested for this number. Wait for it to expire or use it.', 429);
      }
    }
  }

  const id = randomBytes(16).toString('hex');
  const s = {
    id,
    mode,
    number: number || null,
    status: 'pending',
    code: null,
    qr: null,
    message: null,
    dir: path.join(WORK_DIR, id),
    sock: null,
    codeRequested: false,
    expiresAt: Date.now() + TTL_MS
  };
  s.ready = new Promise((resolve, reject) => { s.resolveReady = resolve; s.rejectReady = reject; });
  s.ready.catch(() => {}); // rejection is handled by the caller below
  sessions.set(id, s);

  s.ttlTimer = setTimeout(() => finish(s, 'expired', 'This link attempt expired. Start again.'), TTL_MS);
  const readyTimer = setTimeout(
    () => finish(s, 'failed', 'WhatsApp did not respond in time. Try again.'),
    READY_TIMEOUT_MS
  );

  try {
    await mkdir(s.dir, { recursive: true });
    await connect(s);
    await s.ready;
  } catch (err) {
    await finish(s, 'failed', s.message || 'Could not reach WhatsApp. Try again.');
    throw err instanceof PairingError
      ? err
      : new PairingError('WHATSAPP_UNAVAILABLE', s.message || 'Could not reach WhatsApp. Try again.', 502);
  } finally {
    clearTimeout(readyTimer);
  }
  return s;
}

async function getVersion() {
  if (waVersion) return waVersion;
  try {
    const { version } = await fetchLatestBaileysVersion();
    waVersion = version;
  } catch {
    // fall back to the version bundled with Baileys
  }
  return waVersion;
}

async function connect(s) {
  const { state, saveCreds } = await useMultiFileAuthState(s.dir);
  const version = await getVersion();
  if (s.status !== 'pending') return;

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, waLogger)
    },
    logger: waLogger,
    browser: Browsers.macOS('Chrome'),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    qrTimeout: 60 * 1000
  });
  s.sock = sock;
  s.saveCreds = saveCreds;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    if (s.sock !== sock || s.status !== 'pending') return;
    const { connection, lastDisconnect, qr } = update;

    try {
      if (qr) {
        if (s.mode === 'qr') {
          s.qr = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
          s.resolveReady();
        } else if (!s.codeRequested) {
          s.codeRequested = true;
          s.code = await sock.requestPairingCode(s.number);
          s.resolveReady();
        }
      }

      if (connection === 'open') {
        await deliver(s, sock);
        return;
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason === DisconnectReason.restartRequired) {
          // Normal right after the phone confirms: reconnect with the new credentials.
          await connect(s);
        } else if (!s.code && !s.qr) {
          // Closed before WhatsApp gave us anything to show.
          await finish(s, 'failed', 'Could not reach WhatsApp. Try again.');
        } else if (reason === DisconnectReason.timedOut) {
          await finish(s, 'expired', 'This link attempt expired. Start again.');
        } else {
          await finish(s, 'failed', 'WhatsApp closed the connection. Try again.');
        }
      }
    } catch (err) {
      console.error(`[pairing] ${s.id} ${s.mode} error: ${err?.message || err}`);
      await finish(s, 'failed', 'Something went wrong while linking. Try again.');
    }
  });
}

/** The phone confirmed the link: build the SESSION_ID and send it to the user. */
async function deliver(s, sock) {
  // Give Baileys a moment to finish writing the credentials.
  await delay(3000);
  await s.saveCreds();

  const creds = await readFile(path.join(s.dir, 'creds.json'), 'utf8');
  JSON.parse(creds); // throws if the file is incomplete
  const sessionId = SESSION_PREFIX + Buffer.from(creds, 'utf8').toString('base64');

  const self = jidNormalizedUser(sock.user.id);
  const sent = await sock.sendMessage(self, { text: sessionId });
  await sock.sendMessage(
    self,
    {
      text:
        '*Cyntron-X session ID*\n\n' +
        'The message above is your SESSION_ID. Copy all of it and set it as the SESSION_ID variable where you host your bot.\n\n' +
        'Keep it private. Anyone who has it can use your WhatsApp account. ' +
        'To cancel it, open Linked devices in WhatsApp and log this device out.'
    },
    { quoted: sent }
  );
  await delay(2000);

  console.log(`[pairing] ${s.id} linked via ${s.mode}`);
  await finish(s, 'linked', null);
}

/** Ends an attempt, closes its connection and deletes its temporary files. */
async function finish(s, status, message) {
  if (s.status !== 'pending') return;
  s.status = status;
  s.message = message;
  s.code = null;
  s.qr = null;
  clearTimeout(s.ttlTimer);
  s.rejectReady(new Error(message || status));

  const sock = s.sock;
  s.sock = null;
  try {
    // end() only closes the socket. It does not log the device out,
    // so a linked session stays valid for the user's bot.
    sock?.end(undefined);
  } catch { /* already closed */ }

  await rm(s.dir, { recursive: true, force: true }).catch(() => {});
  setTimeout(() => sessions.delete(s.id), KEEP_RESULT_MS).unref();
}

export async function shutdown() {
  await Promise.all([...sessions.values()].map((s) => finish(s, 'failed', 'The server restarted. Start again.')));
  await rm(WORK_DIR, { recursive: true, force: true }).catch(() => {});
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
