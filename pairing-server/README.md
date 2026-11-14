# Cyntron-X pairing server

Small Node.js API that the pairing site (`../pairing-site`) talks to. It asks WhatsApp for a pairing code or QR code, waits for the user to confirm on their phone, then sends the user's `SESSION_ID` to their own WhatsApp chat.

It needs a host that keeps a process running (Render, Railway, a VPS). It will not work on Vercel.

## Run locally

```bash
cd pairing-server
npm install
cp .env.example .env
npm start
```

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | Port to listen on |
| `ALLOWED_ORIGINS` | empty | Comma-separated sites allowed to call the API from a browser, e.g. your Vercel URL |
| `MAX_ACTIVE_SESSIONS` | `20` | Link attempts allowed in progress at once |
| `RATE_LIMIT_MAX` | `5` | Link attempts one IP address can start in 10 minutes |

## Endpoints

Errors always look like `{ "error": { "code": "...", "message": "..." } }`.

### `GET /health`

```json
{ "status": "ok", "service": "cyntron-x-pairing", "active": 0 }
```

### `POST /api/pair`

Body: `{ "number": "2348012345678" }` (country code included, no leading 0).

```json
{ "id": "9f2c...", "mode": "code", "status": "pending", "expiresIn": 300, "code": "ABCD1234" }
```

### `POST /api/qr`

No body. `qr` is a PNG data URL to put straight into an `<img>`.

```json
{ "id": "9f2c...", "mode": "qr", "status": "pending", "expiresIn": 300, "qr": "data:image/png;base64,..." }
```

### `GET /api/session/:id`

Poll this every 2 to 3 seconds after starting a link.

| `status` | Meaning |
|---|---|
| `pending` | Waiting for the phone. In QR mode `qr` changes about once a minute, so redraw it. |
| `linked` | Done. The `SESSION_ID` was sent to the user's own WhatsApp chat. |
| `expired` | Five minutes passed. Start again. |
| `failed` | Something went wrong. `message` says what to show. |

### `GET /code?number=...`

Returns `{ "code": "ABCD1234" }`. This is the shape the bot's `.pair` command already calls, so `PAIR_API` can point at this server.

## Error codes

| HTTP | `code` | When |
|---|---|---|
| 400 | `INVALID_NUMBER` | Number missing, too short or long, or starts with 0 |
| 400 | `BAD_REQUEST` | Body is not valid JSON |
| 404 | `NOT_FOUND` | Unknown link attempt or endpoint |
| 429 | `RATE_LIMITED` | Too many attempts from one IP |
| 429 | `ALREADY_PENDING` | A code is already live for that number |
| 502 | `WHATSAPP_UNAVAILABLE` | WhatsApp could not be reached or did not answer |
| 503 | `BUSY` | Too many link attempts in progress |

## Deploy on Render

1. New Web Service from this repo.
2. Root Directory: `pairing-server`.
3. Build command: `npm install`. Start command: `npm start`.
4. Health check path: `/health`.
5. Set `ALLOWED_ORIGINS` to your Vercel site URL.

## Security notes

- The `SESSION_ID` gives full access to a WhatsApp account. The API never returns it; it only goes to the user's own chat.
- Temporary credential files live in the system temp folder and are deleted when a link attempt ends.
- Codes and session IDs are never written to the logs.
