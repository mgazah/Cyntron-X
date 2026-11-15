/**
 * song.js: YouTube Audio Downloader (OxBot song.php)
 * Aliases: .song, .play, .ytmp3, .music
 */

const axios = require('axios');
const https = require('https');

// ─── Config ──────────────────────────────────────────────────────────────

const OXBOT_API_KEY  = process.env.OXBOT_API_KEY || ' ';
const OXBOT_SONG_URL = 'https://lecay.oxbot.name.ng/api/song.php';

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20 });

// ═══════════════════════════════════════════════════════════════
// DOWNLOAD (one request: search + resolve + audio bytes)
// ═══════════════════════════════════════════════════════════════

async function fetchSong(query) {
    let res;
    try {
        res = await axios.get(OXBOT_SONG_URL, {
            params: { api_key: OXBOT_API_KEY, q: query },
            responseType: 'arraybuffer',
            timeout: 150000,
            maxContentLength: 100 * 1024 * 1024,
            httpsAgent,
            validateStatus: () => true,
        });
    } catch (err) {
        throw new Error(`Network error: ${err.code || err.message}`);
    }

    const buf  = Buffer.from(res.data);
    const type = res.headers['content-type'] || '';

    // Errors come back as JSON
    if (res.status >= 400 || type.includes('application/json')) {
        let msg = `HTTP ${res.status}`;
        try { msg = JSON.parse(buf.toString('utf-8')).error || msg; } catch {}
        if (res.status === 401) msg = 'API key invalid or expired';
        if (res.status === 429) msg = 'Daily API limit reached';
        throw new Error(msg);
    }

    if (buf.length < 5000) throw new Error(`Audio too small (${buf.length} bytes)`);

    const dec = (h) => { try { return decodeURIComponent(res.headers[h] || ''); } catch { return ''; } };
    const ext = (res.headers['x-audio-ext'] || 'm4a').toLowerCase();

    return {
        buf,
        title:     dec('x-title') || 'song',
        uploader:  dec('x-uploader'),
        thumbnail: res.headers['x-thumbnail'] || null,
        mimetype:  ext === 'mp3' ? 'audio/mpeg' : (ext === 'webm' || ext === 'opus') ? 'audio/ogg; codecs=opus' : 'audio/mp4',
        ext,
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXECUTE
// ═══════════════════════════════════════════════════════════════

async function execute(sock, msg, botData, args) {
    const chatId = msg.key.remoteJid;
    if (!chatId) return null;

    if (!args || args.length === 0) {
        return `*🎵 SONG DOWNLOADER*\n\n*.song <name or link>* — Download YouTube audio\n\n*Aliases:* .play  .ytmp3  .music`;
    }

    const query = args.join(' ').trim();

    try { await sock.sendPresenceUpdate('recording', chatId); } catch {}
    try { await sock.sendMessage(chatId, { react: { text: '⬇️', key: msg.key } }); } catch {}

    let song;
    try {
        song = await fetchSong(query);
        console.log(`[SONG] ✓ ${song.title.substring(0, 40)} (${(song.buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
        console.error('[SONG] Error:', err.message);
        try { await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } }); } catch {}
        return `❌ *Could not get that song*\n\n_${err.message}_`;
    }

    const safeTitle = song.title.replace(/[^\w\s\-()']/g, '').trim() || 'song';

    try {
        await sock.sendMessage(chatId, {
            audio: song.buf,
            mimetype: song.mimetype,
            fileName: `${safeTitle}.${song.ext}`,
            ptt: false,
        }, { quoted: msg });

        try { await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } }); } catch {}
        return null;
    } catch (err) {
        console.error('[SONG] Send Error:', err.message);
        try { await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } }); } catch {}
        return `❌ *Failed to send audio*\n\n_${err.message}_`;
    }
}

module.exports = {
    name:     'song',
    aliases:  ['play', 'ytmp3', 'music'],
    desc:     'Download song from YouTube (OxBot API)',
    category: 'downloader',
    execute,
};
