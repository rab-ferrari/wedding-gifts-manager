# Project Requirements

A self-hosted wedding gift list where guests give money via Pix (Brazilian
instant payment) directly to the couple, instead of using a commercial gift
registry that takes a cut of the funds. Static React app, no backend.

## Tech stack

- React + Vite (no `npm create vite` scaffold — hand-built structure)
- `react-router-dom`, using `HashRouter` (not `BrowserRouter`) for static-host
  compatibility (e.g. GitHub Pages, which has no server-side rewrite rules)
- `qrcode` npm package for client-side QR generation
- Plain CSS (no framework), dark theme
- Python 3 preprocessing script (no other backend) to generate Pix payment
  payloads ahead of time, run automatically before every dev/build/deploy

## Pages

Three routes, sharing a persistent top nav bar (Home / Gifts / About) and a
persistent bottom bar of external links (location/maps, WhatsApp, GitHub
source). Both bars render on every page, all icons themed via inline SVG so
they can pick up the theme's colors.

The app's root container sizes itself to the actual visible mobile
viewport, not just the desktop-equivalent full window height — on phones,
the browser's own address bar can show or hide depending on scroll
position, and a naive full-height layout sized against the wrong moment
leaves the bottom bar just out of view until the user scrolls. The layout
must hold both bars on screen from the very first paint, with no scrolling
required to reveal the bottom bar on any device.

### Home

A single, fixed-height screen (no scroll) between the two bars. A vertical
portrait photo fills all available height, capped to a max width, always
shown in full — never cropped — by scaling to fit rather than covering;
letterboxes (theme background visible on the sides) if the available space
doesn't match the photo's aspect ratio. The couple's names are overlaid on
the photo, single line, with the date directly beneath in matching style at
a smaller size; both use a heavy, multi-layer text shadow so they stay
legible over any part of the image.

### About

Also a single, fixed-height screen (no scroll). Two bordered boxes, stacked
vertically and centered as a group: one "About" (title + body text), one
"Privacy" (title + body text), both content-driven from the same content
file as everything else on the site.

### Gifts

The only scrollable page. A vertically stacked list of gift cards, one card
per gift (sorted by the gift's numeric `id`, ascending — never grouped or
combined). Each card:

- A square product-style image on the left, cropped to fill the square
  (cover, not letterboxed — unlike the Home page photo, filling the box
  matters more here than preserving the full original framing).
- A bordered box on the right containing the gift's name and price, stacked
  and centered as a unit, filling all remaining width next to the image
  (never centered across the whole card, so it can never visually overlap
  the image).
- The info box is styled to look like a button — a drop shadow and a
  slight upward offset at rest, deepening on hover, flattening on
  press/tap — since this is the site's primary interactive element and
  needs to read as tappable, especially on mobile where there's no hover
  state to otherwise hint at it.
- Hovering the info box shows a small tooltip hint.
- Clicking the info box opens a payment modal for that gift.

#### Claimed gifts

Each gift has a `claimed` boolean. A claimed gift's image gets a diagonal
ribbon watermark, and its info box is visibly dimmed and loses all
interactivity — no hover tooltip, no click handler, no keyboard focus, not
just a disabled-looking version of the normal box. The eventual purpose is
a future "mark as given" feature so two guests don't unknowingly buy the
same gift; in the meantime the field can be set manually in the data file.

#### Payment modal

Opens centered on screen, sized to comfortably fit its content rather than
a fixed pixel size (so it holds up across different window sizes and zoom
levels), capped at a reasonable max width and height, scrollable internally
only in extreme cases. Contains, top to bottom:

1. A QR code encoding the gift's Pix payment payload, generated client-side
   only at the moment the modal opens (not precomputed for every gift on
   page load).
2. A short, always-visible subtitle hint below the QR code (not just a
   hover tooltip, since touch devices have no hover state).
3. The gift's name, then its price directly below — same typographic
   treatment as the Gifts page card.

Hovering the QR code shows a tooltip hint; clicking it copies the gift's
Pix payload string to the clipboard, and the tooltip text swaps to a brief
confirmation message. Closes via an explicit close button, clicking outside
the modal content, or the Escape key — clicking inside the modal's content
never closes it.

## Content and data files

All interface text and external links are content-driven, never hardcoded
in components — editable without touching code:

- `texts.json` — every piece of UI copy in the app, keyed by section
  (titles, body text, hover hints, button/tooltip labels), all in Brazilian
  Portuguese to match the site's locale.
- `links.json` — external URLs (maps/location, WhatsApp, GitHub repo).
- `gifts_source.json` — the editable gift list: numeric `id`, `name`,
  `price`, `image` path, `claimed` boolean. No payment data.
- `gifts.json` — generated automatically from `gifts_source.json`; adds a
  ready-to-use Pix payload string to each gift. Never hand-edited.
- `icons/`, `images/`, `gifts/` — SVG icons, page images, and per-gift
  photos respectively, all referenced by relative path (not absolute) so
  the app works correctly when hosted from a non-root subpath.

## Pix payload generation

A Python script reads the receiver's Pix details (key, merchant name, city)
from a config file, plus `gifts_source.json`, and produces `gifts.json` with
a complete, spec-correct, checksum-validated Pix BR Code payload per gift —
ready to be turned into a QR code or copied as text, with no Pix-specific
logic needed anywhere in the frontend. This script:

- Runs automatically before every local dev run, production build, and
  deploy — never a separately-remembered manual step.
- Reads its config from a file that is never committed to version control,
  since it contains the real Pix key — anyone reproducing this app must
  supply their own.
- Sanitizes merchant name/city to the plain-ASCII, length-limited format
  the Pix spec requires, independent of how those fields are written
  elsewhere (e.g. with accents) for display purposes.

## Design language

Dark theme throughout — a warm near-black background (not pure black), an
aged-brass accent color, a serif display typeface for titles/names paired
with a plain sans-serif for body text and UI labels. Visual language should
read as understated/elegant wedding stationery rather than a generic dark
SaaS app.

## Deployment

Builds to a static bundle deployable to any static host; specifically
configured and documented for GitHub Pages, which requires:

- `HashRouter` instead of `BrowserRouter` (no server-side rewrite rules
  available on GitHub Pages, so any non-root route 404s on refresh/bookmark
  without it).
- A build-time base path matching the repository's subfolder, applied only
  in production (the local dev server still runs at root).
- Every asset reference (in source code and in `gifts.json`) using a
  relative path, never a leading-slash absolute path, so assets resolve
  correctly regardless of what subpath the app is actually served from.
