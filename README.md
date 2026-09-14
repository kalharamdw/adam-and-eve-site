# Adam & Eve

Single-page site for Adam & Eve — brand, creative and communications agency,
Colombo, trading as Greenleaves Ventures (Private) Limited.

Hand-written HTML, CSS and vanilla JavaScript. Vite bundles it; the output is
plain static files that any host will serve.

---

## Run it

```bash
npm install
npm run dev
```

Opens on <http://localhost:4321>.

```bash
npm run build     # writes dist/
npm run preview   # serves dist/ locally to check the real build
```

> **If `npm run dev` fails with `'E' is not recognized`** — a parent folder in
> your path contains an `&`, which `cmd.exe` treats as a command separator.
> `.npmrc` already sets `script-shell=powershell` to work around it. Moving the
> project to a path without `&` removes the problem entirely.

---

## Deploy

`npm run build` produces `dist/`. Upload that folder, or point a host at the
repo with:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20 or newer |

Works as-is on Netlify, Vercel, Cloudflare Pages, or any Apache/nginx docroot.
No server, no database, no environment variables.

---

## Layout

```
index.html          the whole page — every section, all copy
src/
  styles.css        design tokens, components, motion, accessibility fallbacks
  main.js           entry: fonts, UI behaviour, form, menu, choreography wiring
  motion.js         scroll choreography (Lenis + GSAP/ScrollTrigger)
  sheet.js          mobile menu sheet — spring, drag-to-dismiss, focus trap
  gestures.js       momentum projection, rubber-banding, velocity tracking
public/
  brand/            logo.svg, logo-light.svg (dark grounds), logo.png
  img/work/         five project photographs
  img/clients/      twenty client marks
  img/people/       two director portraits, three endorser portraits
  media/            hero showreel + poster frame
```

Everything in `public/` is copied to the site root as-is, so `/img/work/x.jpg`
in the markup resolves to `public/img/work/x.jpg` on disk.

---

## Two things still need you

**1. The contact form has no endpoint.** It validates in the browser, then
falls back to opening the visitor's mail client addressed to
`hello@adamandeve.lk`. To post it server-side instead, set the endpoint in
`index.html`:

```html
<form class="form" id="form" data-endpoint="https://formspree.io/f/XXXX" novalidate>
```

It will then `POST` JSON (`name`, `email`, `telephone`, `message`) and show
inline success and error states. Nothing else changes.

**2. The hero video is 130 MB.** `public/media/HeroVideo.mp4` is the original
showreel, dropped in unmodified as requested. Before going live it needs a
re-encode — a silent, web-sized loop. For reference, this command produced a
0.7 MB version during development:

```bash
ffmpeg -i HeroVideo.mp4 -an -vf "crop=1920:840:0:0,scale=1600:-2" -c:v libx264 -crf 28 -movflags +faststart hero.mp4
```

The `crop` removes the burned-in `adam&eve` watermark from the bottom right.
Replace the file in place and keep the name, or update the `<video src>` in
`index.html`. Also worth a `.webm` sibling for smaller delivery.

Two client marks in `public/img/clients/` (`crest-01.png`, `crest-02.png`) are
unidentified and carry generic alt text until someone names them, and
`nalanda-walk.png` has black bars baked into the artwork — it needs a clean
source file.

---

## How the motion is built

Read this before changing animation, or you will hit the same traps twice.

**Timing lives in one place.** `--t-micro` / `--t-standard` / `--t-cinematic`
and the three easing curves are declared in `:root` in `styles.css`.
`motion.js` reads those custom properties back out at runtime and registers the
identical curves as GSAP eases, so a CSS transition and a GSAP tween on the
same element move on the same curve. Change a value in `:root` and both follow.

**Never put a `transform` or `will-change: transform` on an ancestor of a
pinned section.** Either one creates a containing block, ScrollTrigger pins
with `position: fixed`, and the pinned content silently detaches from the
viewport. (No pins remain in the current build, but the rule holds if you add
one.)

**Never tween a `.reveal` element with GSAP.** GSAP folds the element's current
translate into its own transform model. A scroll tween created while a card was
still primed bakes the reveal's offset in permanently and rows overlap. The
scroll tweens target the inner `<a>`; the reveal owns the grid item. Keep those
two sets disjoint.

**Content is visible by default.** The hidden "primed" state only exists once
JS has run and added `.js-motion`, so a failed or blocked bundle still leaves
every word on the page. There is also a failsafe that reveals anything on
screen after 400 ms and everything after 3 s, whatever the triggers did.

**Three preference queries are honoured** — `prefers-reduced-motion`,
`prefers-reduced-transparency` and `prefers-contrast`. Reduced motion is a full
fallback: no transforms, no split text, no curtain, no custom cursor, and the
marquee becomes a static grid.
