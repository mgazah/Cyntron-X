# Cyntron-X pairing site

Static frontend for linking a WhatsApp number to Cyntron-X. Plain HTML, CSS and JS, with no build step.

## Run locally

```bash
npx serve pairing-site
```

## Deploy on Vercel

1. Import the repo in Vercel.
2. Set **Root Directory** to `pairing-site`.
3. Framework preset: **Other**. Leave the build command and output directory empty.

## Pairing server address

The site calls the pairing server in `../pairing-server`. Its address is the `API_BASE_URL` line at the top of `script.js`:

```js
var API_BASE_URL = 'http://localhost:8090';
```

Change it to your deployed server URL before going live. It must be `https` once the site is on Vercel, and the server's `ALLOWED_ORIGINS` must include the site's URL.

Design previews (no server needed): add `?preview=code`, `?preview=qr` or `?preview=linked` to the URL.
