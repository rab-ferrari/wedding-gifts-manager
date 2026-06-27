# Wedding Gift List

A simple, self-hosted wedding gift list where guests give money via Pix
(Brazilian instant payment) directly to the couple — no platform fee, no
middleman. Built as a static React app (no backend required). BEWARE: the
app was vibe-coded (all of the web-related source code, and most of the
preprocessing), with human inputs being mostly requirements, CI/CD and
infrastructure.

## Getting started

This project was hand-scaffolded (not via `npm create vite`) but uses a
completely standard Vite + React setup. `npm run dev` and `npm run build`
both run the Python preprocessing script first (see "Pix payload
preprocessing" below), so `gifts.json` is always regenerated from
`gifts_source.json` before the app starts or builds — you don't need to
run the script separately.

```bash
npm install
npm run dev      # regenerates gifts.json, then starts the dev server
                 # (usually at http://localhost:5173)
```

To build for production (outputs a static `dist/` folder):

```bash
npm run build
npm run preview  # sanity-check the production build locally
```

## Deployment

This app is configured to deploy directly to GitHub Pages, though the
`dist/` output from `npm run build` is a plain static bundle that works
on any static host (Netlify, Cloudflare Pages, etc.) — the GitHub
Pages-specific pieces below (`HashRouter`, the `base` config, relative
asset paths) are harmless elsewhere too, so no extra setup is needed to
deploy somewhere else instead.

### One-time setup

1. Install the deploy dependency (already in `package.json`, just needs installing):
```bash
   npm install
```
2. Set the `"homepage"` field in `package.json` to your actual GitHub Pages
   URL, e.g. `"https://your-username.github.io/your-repo-name"`.
3. Set the `base` path in `vite.config.js` (see below) to match your
   repository name.
4. Re-create `scripts/config.json` locally with your real Pix details
   following the template file `scripts/config.template.json`
   (see "Pix payload preprocessing" below) — it's gitignored and won't
   come from a fresh clone or fork.

### Deploy

```bash
npm run deploy
```

This runs the Python preprocessing script, builds the production bundle
into `dist/`, and pushes it to the repository's `gh-pages` branch via the
`gh-pages` package.

### Why these specific changes were needed

GitHub Pages serves project sites from a subpath
(`username.github.io/repo-name/`), not the domain root, and has no
server-side rewrite rules — both of which standard Vite/React defaults
assume away. Three changes address this:

- **`base` in `vite.config.js`** — Vite needs to know what subpath the
  built assets will be served from so it can generate correct asset
  URLs. Since the local dev server *does* run at the root, `vite.config.js`
  picks the right base path depending on context (`serve` = local dev,
  `build` = production):
```javascript
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  export default defineConfig(({ command }) => ({
    plugins: [react()],
    // root locally, repo subfolder in production
    base: command === 'serve' ? '/' : '/your-repo-name/',
  }))
```
  Replace `your-repo-name` with your actual repository name.

- **`HashRouter` instead of `BrowserRouter`** — `BrowserRouter` relies on
  the server recognizing every app route (e.g. `/gifts`) and always
  returning `index.html` so React Router can take over client-side.
  GitHub Pages has no such rewrite rule, so refreshing or bookmarking
  any route but the root 404s. `HashRouter` keeps all routing after a
  `#` (e.g. `/#/gifts`), which the browser never sends to the server at
  all, so this can't happen. The tradeoff is a `#` in every URL — a
  non-issue for a site mostly reached via a single shared link.

- **Relative asset paths** — with a `base` path in play, an absolute
  path like `/assets/icons/home.svg` resolves against the domain root
  and skips the repo subfolder entirely, breaking on GitHub Pages even
  though it works locally (where the root and the subpath happen to be
  the same thing). Every asset reference in the source code and in
  `gifts.json` uses a relative path instead (`assets/icons/home.svg`,
  no leading slash), so it resolves correctly relative to wherever the
  page is actually served from.

## Project structure

public/assets/
  gifts_source.json     Editable gift list: id, name, price, image, claimed
                        (no Pix payload yet)
  gifts.json            Generated: gifts_source.json + a valid Pix payload per gift
  texts.json             All interface copy, keyed by section (home_title, nav_home, etc.)
  links.json             External URLs: maps, whatsapp, github
  icons/                 SVG icons (home, gift, about, maps, whatsapp, github)
  images/                Page images (currently: home_background_center.png)
  gifts/                 Per-gift photos (referenced by gifts.json -> image)
  qrcodes/               Unused -- QR codes are generated client-side from
                          each gift's pixPayload string (see GiftModal.jsx /
                          useQrCode.js), not pre-rendered as image files

scripts/
  generate_pix_payloads.py   Run automatically by `npm run dev` / `npm run
                              build` / `npm run deploy` whenever
                              gifts_source.json or config.json changes, to
                              regenerate gifts.json with fresh,
                              CRC-validated Pix payload strings.
  config.json                 Pix receiver info (key, name, city). Gitignored
                              -- not present on a fresh clone or fork; see
                              "Pix payload preprocessing" below to create it.

src/
  main.jsx                React entry point
  App.jsx                 Router setup (Home / Gifts / About) + global providers
  context/
    SiteDataContext.jsx    Loads texts.json + links.json once, shares via context
  components/
    Layout.jsx              Top NavBar + scrollable content area + bottom
                             LinkBar -- all three render on every page
    NavBar.jsx               Top navigation (Home / Gifts / About)
    LinkBar.jsx              Bottom bar of external links (maps/whatsapp/github);
                             self-contained (reads links.json itself), shares
                             navbar.css with NavBar, rendered site-wide by Layout
    Icon.jsx                 Inlines SVG markup so icons can be themed with CSS
    GiftCard.jsx              One card per gift: square image on the left,
                             gift name + price in a bordered box on the
                             right. Owns "is the payment modal open" for
                             this gift; dims and disables click/hover
                             entirely when the gift is claimed.
    GiftModal.jsx             Pix payment popup: lazily-generated QR code
                             (only once opened, see hooks/useQrCode.js),
                             click-to-copy the Pix payload, gift name + price
    Tooltip.jsx               Small reusable hover-tooltip wrapper, used for
                             the "Dar presente" / "Copiar código PIX" hints
  hooks/
    useInlineSvg.js          Fetches raw SVG markup for Icon.jsx
    useGifts.js               Loads gifts.json once (page-local to Gifts,
                              unlike texts/links which are app-wide)
    useQrCode.js               Generates a gift's QR code data URL, but only
                              once GiftModal actually opens for it -- not
                              eagerly for every gift on page load
  utils/
    clipboard.js               Thin wrapper around the async Clipboard API
  pages/
    HomePage.jsx             Hero photo (fills the space between the two bars,
                             never cropped) with the couple's names + date
                             overlaid
    AboutPage.jsx             Two centered boxes (about / privacy), fixed
                             height like Home -- no scroll
    GiftsPage.jsx             Loads gifts.json, renders one GiftCard per
                             gift, vertically stacked. Scrolls once the
                             list is taller than the available space
                             (unlike Home/About, which are fixed single
                             screens)
  styles/
    theme.css                 Design tokens (colors, fonts, spacing) + base resets;
                              #root is a fixed-height (100vh), non-scrolling flex
                              column -- the content area (<main>, see Layout.jsx)
                              is what scrolls if a page's content runs long
    navbar.css                 Shared bar styles (top NavBar + bottom LinkBar)
    home.css                   Home page styles
    about.css                   About page styles (two-box layout)
    giftsPage.css                Gifts page layout (scrollable list, title)
    giftCard.css                  GiftCard layout (image + info box side by side)
    giftModal.css                  Payment modal layout (responsive width, not fixed)
    tooltip.css                     Shared tooltip bubble styling

## Gift data

Each gift in `gifts.json` gets its own card on the Gifts page -- no
grouping by price or anywhere else. Add/edit gifts freely in
`gifts_source.json` (see "Pix payload preprocessing" below); each entry
maps directly to one `GiftCard`.

Cards are displayed sorted by `id`, ascending. `id` is always a plain
JSON number (`1`, `2`, `3`, ...), not a string -- keep new entries
numeric so the sort keeps working correctly.

An earlier version of this page grouped gifts that shared the same price
into a single card with a carousel to browse between them. Beta testing
found the carousel unintuitive, so it was replaced with the simpler
one-card-per-gift structure here. That carousel UI/logic is preserved on
a separate git branch rather than deleted outright, in case it's useful
again later.

## Replacing placeholder assets

Everything currently renders with placeholder SVGs/images so the app works
end-to-end out of the box. To use your real assets, just overwrite the files
at the same paths -- no code changes needed:

- `public/assets/icons/{home,gift,about,maps,whatsapp,github}.svg`
- `public/assets/images/home_background_center.png` (expected ~1069x1600)
- `public/assets/texts.json` -- edit copy directly
- `public/assets/links.json` -- replace placeholder URLs with real ones

## Pix payload preprocessing

`gifts.json` is generated, not hand-edited -- it's `gifts_source.json`
plus a valid, CRC-validated Pix payload string computed for each gift
from your receiver details. This regeneration runs automatically as
part of `npm run dev`, `npm run build`, and `npm run deploy`, but you can
also run it manually:

```bash
python3 scripts/generate_pix_payloads.py --base-dir public/assets
```

### Setting up `scripts/config.json`

This file holds your real Pix key, name, and city, and is gitignored —
it will not exist after a fresh clone or fork, and should never be
committed. You can either create it yourself at `scripts/config.json`
or edit and rename the existing `scripts/config.template.json` that
already contains the required structure.

```json
{
  "pixKey": "your-pix-key-here",
  "merchantName": "YOUR NAME",
  "merchantCity": "YOUR CITY"
}
```

Without this file, the preprocessing script (and therefore `npm run dev`
/ `build` / `deploy`) will fail -- this is intentional, since it means
nobody can accidentally generate or deploy payloads pointing at the
placeholder data still present in this repo.
