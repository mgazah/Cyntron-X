const axios = require('axios');
const yts = require('yt-search');
const config = require('../../config');

/**
 * Universal Music / Song Downloader
 * Supports .play, .song, .music, .ytmp3, .yta, .audio
 */

async function fetchAudioFromYtPlay(query) {
  const res = await axios.get(`https://api.nexray.eu.cc/downloader/ytplay?q=${encodeURIComponent(query)}`, {
    timeout: 25000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (res.data?.status && res.data?.result?.download_url) {
    const r = res.data.result;
    const dl = await axios.get(r.download_url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://api.nexray.eu.cc/'
      },
      timeout: 60000,
      maxContentLength: 100 * 1024 * 1024
    });
    if (dl.data && dl.data.length > 5000) {
      return {
        buffer: Buffer.from(dl.data),
        title: r.title || query,
        duration: r.duration || '',
        thumbnail: r.thumbnail || '',
        channel: r.channel || ''
      };
    }
  }
  throw new Error('ytplay failed to return valid audio');
}

async function fetchAudioFromSpotify(query) {
  const res = await axios.get(`https://api.nexray.eu.cc/downloader/spotifyplay?q=${encodeURIComponent(query)}`, {
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (res.data?.status && res.data?.result?.download_url) {
    const r = res.data.result;
    const dl = await axios.get(r.download_url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: 100 * 1024 * 1024
    });
    if (dl.data && dl.data.length > 5000) {
      return {
        buffer: Buffer.from(dl.data),
        title: `${r.artist ? r.artist + ' - ' : ''}${r.title || query}`,
        duration: r.duration || '',
        thumbnail: r.thumbnail || '',
        channel: r.artist || ''
      };
    }
  }
  throw new Error('Spotify downloader failed');
}

async function execute(sock, msg, args, extra) {
  const chatId = extra?.from || msg.key?.remoteJid;
  if (!chatId) return;

  let query = args && args.length ? args.join(' ').trim() : '';
  if (!query) {
    const quoted = extra?.quoted;
    query = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
  }

  if (!query) {
    const prefix = config.prefix || '.';
    return extra?.reply ? extra.reply(
      `🎵 *MUSIC & SONG DOWNLOADER*\n\n` +
      `*Usage:*\n` +
      `• \`${prefix}play <song name or link>\`\n` +
      `• \`${prefix}song <song name or link>\`\n` +
      `• \`${prefix}music <song name>\`\n\n` +
      `*Examples:*\n` +
      `• \`${prefix}play Alan Walker Faded\`\n` +
      `• \`${prefix}play https://youtu.be/60ItHLz5WEA\``
    ) : null;
  }

  try {
    await sock.sendPresenceUpdate('recording', chatId);
  } catch {}

  try {
    await sock.sendMessage(chatId, { react: { text: '🎵', key: msg.key } });
  } catch {}

  let audioResult = null;
  let lastError = null;

  // Attempt 1: YTPlay Downloader
  try {
    audioResult = await fetchAudioFromYtPlay(query);
  } catch (err) {
    lastError = err;
    console.warn('[PLAY] YTPlay failed, trying Spotify fallback...', err.message);
  }

  // Attempt 2: Spotify Downloader Fallback
  if (!audioResult) {
    try {
      audioResult = await fetchAudioFromSpotify(query);
    } catch (err) {
      lastError = err;
      console.warn('[PLAY] Spotify fallback failed...', err.message);
    }
  }

  // Attempt 3: Search YouTube title first then retry
  if (!audioResult) {
    try {
      const search = await yts(query);
      const firstVid = search?.videos?.[0];
      if (firstVid?.title) {
        audioResult = await fetchAudioFromYtPlay(firstVid.title);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!audioResult || !audioResult.buffer) {
    try {
      await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
    } catch {}
    return extra?.reply ? extra.reply(`❌ *Could not download audio for:* _${query}_\n\nReason: ${lastError?.message || 'Download services currently unavailable'}`) : null;
  }

  const safeTitle = (audioResult.title || 'song').replace(/[<>:"/\\|?*]/g, '').trim().slice(0, 80) || 'song';

  try {
    await sock.sendMessage(chatId, {
      audio: audioResult.buffer,
      mimetype: 'audio/mpeg',
      fileName: `${safeTitle}.mp3`,
      ptt: false
    }, { quoted: msg });

    try {
      await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
    } catch {}
  } catch (err) {
    console.error('[PLAY] Send Error:', err.message);
    try {
      await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
    } catch {}
    if (extra?.reply) {
      await extra.reply(`❌ *Failed to send audio:* ${err.message}`);
    }
  }
}

module.exports = {
  name: 'play',
  aliases: ['song', 'music', 'ytmp3', 'yta', 'audio'],
  category: 'media',
  description: 'Play and download music/songs from YouTube or Spotify',
  usage: '.play <song name or URL>',
  execute
};
