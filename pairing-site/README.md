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

## Status

UI only. `requestPairingCode()` and `requestQrCode()` in `script.js` are stubs that the pairing API will replace.

Design previews: add `?preview=code`, `?preview=qr` or `?preview=online` to the URL.
