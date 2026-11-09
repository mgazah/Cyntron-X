# ⚡ CYNTRON-X ⚡

**WhatsApp MD bot built on Baileys 7.x — 237 commands across 17 categories**

<p align="left">
  <img alt="Version" src="https://img.shields.io/badge/VERSION-2.8.8-blue?style=for-the-badge">
  <img alt="Node" src="https://img.shields.io/badge/NODE-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img alt="Library" src="https://img.shields.io/badge/BAILEYS-7.0.0--rc13-25D366?style=for-the-badge&logo=whatsapp&logoColor=white">
  <img alt="Archived" src="https://img.shields.io/badge/ARCHIVED-NO-00FF88?style=for-the-badge">
</p>

Cyntron-X is a multi-device WhatsApp bot: a single Node.js process that pairs with WhatsApp over Baileys, loads every command from `commands/`, and exposes a small web server (`PORT`) for uptime checks and pairing helpers.

---

## ✨ What's inside

| Area | Details |
|---|---|
| Commands | **237** across 17 categories |
| Utils / engine | 33 modules in `utils/` |
| Entry point | `index.js` · loader `handler.js` |
| Runtime | Node.js **>= 18** |
| Session | `SESSION_ID` env var (`Cyntron-X:~<base64>`) |

### Command categories

| Category | Count | Category | Count |
|---|---|---|---|
| admin | 56 | owner | 47 |
| general | 39 | media | 22 |
| fun | 20 | textmaker | 19 |
| tools | 18 | anime | 7 |
| utility | 5 | convert | 2 |
| reaction | 2 | religeon | 2 |
| ai | 1 | ephoto | 1 |
| ephoto360 | 1 | movies | 1 |
| sports | 1 | | |

### Included capabilities

- **Group administration** — anti-link, anti-tag, anti-spam, anti-bot, anti-view-once, anti-delete, mute/unmute, promote/demote, welcome & goodbye, warnings
- **Owner controls** — self/public mode, prefix, autoreact, autostatus, autotyping, broadcast, restart, update
- **Media & downloaders** — TikTok, Instagram, Facebook, YouTube, play/song, sticker maker, image tools
- **Text makers** — neon, hacker, glitch, fire, ice, matrix and 14 more ephoto styles
- **AI & utilities** — chatbot, GPT helpers, translate, weather, sports scores, QR, hashing, converters

---

## 🚀 Quick start

```bash
git clone https://github.com/mgazah/Cyntron-X.git
cd Cyntron-X
npm install --legacy-peer-deps
cp .env.example .env      # then paste your SESSION_ID
npm start
```

`npm start` runs `node index.js`. Use `npm run dev` for nodemon.

### Required environment

| Variable | Required | Purpose |
|---|---|---|
| `SESSION_ID` | ✅ | WhatsApp pairing session, format `Cyntron-X:~<base64>` |
| `PREFIX` | — | Command prefix (default `.`) |
| `PORT` | — | HTTP port for hosts that inject one |
| `IMGBB_API_KEY` | — | Image uploads used by some commands |
| `NVIDIA_API_KEY` | — | AI commands that call NVIDIA endpoints |
| `TELEGRAM_TOKEN` | — | `telegramsticker` and Telegram helpers |
| `GROQ_API_KEY` | — | `transcribe` (speech-to-text via Groq) |
| `OPENWEATHER_API_KEY` | — | `weather` command |

Never commit `.env`, `auth/`, or session folders — they are git-ignored.

---

## ☁️ Deployment

Deploy configs are already in the repo: `Procfile` (Heroku), `app.json` (Heroku button), `render.yaml` (Render), `railway.json` (Railway), `cx-platform.json` (CypherX Host).

| Platform | How |
|---|---|
| **Render** | New → Blueprint → point at this repo (`render.yaml`) |
| **Railway** | New project → Deploy from GitHub (`railway.json`) |
| **Heroku** | `heroku create && git push heroku main`, set `SESSION_ID` |
| **Koyeb / Replit / panel** | Start command `node index.js`, Node 18+ |

Set `SESSION_ID` **before** the first boot, otherwise the process exits waiting for a pairing code.

---

## 📁 Repository layout

```
Cyntron-X/
├── index.js            # bootstrap, pairing, web server
├── handler.js          # message pipeline + command dispatch
├── database.js         # JSON-backed store
├── config.js           # owner, prefix, defaults, messages
├── launcher.js         # interactive launcher
├── commands/           # 237 commands in 17 categories
├── utils/              # helpers, converters, anti-delete, sticker engine
├── database/           # runtime JSON state (users, groups, warnings)
├── data/               # menu & font settings
├── assets/             # menu images
├── Procfile · app.json · render.yaml · railway.json
└── README_launcher.md  # extra launcher/deploy notes
```

---

## ⚠️ Security notes

- Hardcoded API keys were removed from the source and replaced with env lookups: Telegram (`config.js`, `commands/general/telegramsticker.js`), Groq (`commands/general/transcribe.js`), imgbb (`commands/tools/imgbb.js`), NVIDIA (`utils/nvidia.js`), OpenWeather (`commands/utility/weather.js`). Supply your own via `.env`.
- **Revoke the old keys** — they were embedded in earlier copies of this source and are considered public.
- Rotate any credential that was ever pasted into a chat, commit, or gist.
- `.env`, `auth/`, session folders and `node_modules/` are git-ignored.
- `Cyntron-X.zip` is the packaged source snapshot kept at the repo root for one-click deploys.

---

## 👑 Credits

| | |
|---|---|
| Owner | UNSTOPPABLE |
| Bot name | Cyntron-X |
| GitHub | [github.com/mgazah](https://github.com/mgazah) |
| Library | [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) |

> Built by unstoppable · made in Kenya 🇰🇪
