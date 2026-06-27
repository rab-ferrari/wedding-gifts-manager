# Wedding Gift List

A simple, self-hosted wedding gift list where guests give money via Pix
(Brazilian instant payment) directly to the couple — no platform fee, no
middleman. Built as a static React app (no backend required).

## Getting started

This project was hand-scaffolded (not via `npm create vite`) but uses a
completely standard Vite + React setup. To run it on your machine:

```bash
npm install
npm run dev      # starts the dev server, usually at http://localhost:5173
```

To build for production (outputs a static `dist/` folder you can deploy
anywhere — GitHub Pages, Netlify, Cloudflare Pages, etc.):

```bash
npm run build
npm run preview  # sanity-check the production build locally
```

## Project structure

```
public/assets/
  config.json          Pix receiver info (key, name, city) -- used by the
                        Python script below, not read by the React app directly
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
  generate_pix_payloads.py   Run this whenever gifts_source.json or config.json
                              changes, to regenerate gifts.json with fresh,
                              CRC-validated Pix payload strings.

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
    PriceTierCard.jsx        One card per distinct gift price ("price tier" --
                             see utils/priceTiers.js): carousel on the left,
                             gift name + price on the right. Owns the
                             "which gift in this tier is selected" state.
    GiftCarousel.jsx         Square main image + thumbnail strip with arrows
                             for browsing gifts within one price tier.
                             Controlled component (selection state lives in
                             PriceTierCard, passed down as props)
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
    priceTiers.js             Pure function grouping a flat gift list into
                              price tiers (all gifts sharing one price)
    clipboard.js               Thin wrapper around the async Clipboard API
  pages/
    HomePage.jsx             Hero photo (fills the space between the two bars,
                             never cropped) with the couple's names + date
                             overlaid
    AboutPage.jsx             Two centered boxes (about / privacy), fixed
                             height like Home -- no scroll
    GiftsPage.jsx             Loads gifts.json, groups into price tiers,
                             renders a vertically stacked PriceTierCard list.
                             Scrolls once the list is taller than the
                             available space (unlike Home/About, which are
                             fixed single screens)
  styles/
    theme.css                 Design tokens (colors, fonts, spacing) + base resets;
                              #root is a fixed-height (100vh), non-scrolling flex
                              column -- the content area (<main>, see Layout.jsx)
                              is what scrolls if a page's content runs long
    navbar.css                 Shared bar styles (top NavBar + bottom LinkBar)
    home.css                   Home page styles
    about.css                   About page styles (two-box layout)
    giftsPage.css                Gifts page layout (scrollable list, title)
    priceTierCard.css             PriceTierCard layout (carousel + info side by side)
    giftModal.css                  Payment modal layout (responsive width, not fixed)
    tooltip.css                     Shared tooltip bubble styling
    giftCarousel.css               GiftCarousel styles (square crop, thumbnails, arrows)
```

## Gift data and price tiers

The Gifts page groups every gift in `gifts.json` by price -- if two gifts
cost the same, they appear together in one card with a carousel, instead of
two separate cards. This grouping is called a "price tier" in the code
(`src/utils/priceTiers.js`); add/edit gifts freely in `gifts_source.json`
(see the Pix payload section below) and the page picks up shared prices
automatically, no manual grouping needed.

## Replacing placeholder assets

Everything currently renders with placeholder SVGs/images so the app works
end-to-end out of the box. To use your real assets, just overwrite the files
at the same paths -- no code changes needed:

- `public/assets/icons/{home,gift,about,maps,whatsapp,github}.svg`
- `public/assets/images/home_background_center.png` (expected ~1069x1600)
- `public/assets/texts.json` -- edit copy directly
- `public/assets/links.json` -- replace placeholder URLs with real ones

## Regenerating gifts.json

After editing `public/assets/gifts_source.json` or `public/assets/config.json`:

```bash
python3 scripts/generate_pix_payloads.py --base-dir public/assets
```

This overwrites `public/assets/gifts.json` with fresh, CRC-validated Pix
payloads ready for the Gifts page to consume.
