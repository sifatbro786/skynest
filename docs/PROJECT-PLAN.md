# Skynest Robiul — build plan

Stack: Next.js 16 (App Router, JavaScript only) · Tailwind v4 · Framer Motion ·
MongoDB/Mongoose · sharp + local VPS disk for media. No external CDN or
payment gateway — the site captures leads via WhatsApp and farm-visit bookings.

## Conventions

- **JavaScript only.** No `.ts` / `.tsx` anywhere.
- `@/` resolves to the project root (`jsconfig.json`).
- Next 16: `params`, `searchParams`, `cookies()`, `headers()` are all **async**.
- Route protection lives in `proxy.js` (Next 16 renamed `middleware` → `proxy`,
  Node runtime only).
- Server Components fetch through the model layer directly; Route Handlers exist
  for mutations, uploads and client-driven filtering.
- Uploaded media never enters git. Paths stored in Mongo are relative
  (`/uploads/animals/…`), resolved against `UPLOAD_URL_PREFIX`.

## Phases

| #   | Phase           | Scope                                                                                                                         |
| --- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Foundation      | next.config, Tailwind v4 design tokens, fonts, `lib/db`, `lib/env`, `lib/site`, folder layout                                 |
| 2   | Data layer      | Mongoose models (Category, Animal, Inquiry, AdminUser), indexes, slugs, zod validators, seed script                           |
| 3   | Upload engine   | `/api/admin/upload` — FormData parsing, mime/size guards, sharp → WebP variants, safe paths, delete + orphan cleanup          |
| 4   | Admin auth      | bcrypt password, jose JWT in httpOnly cookie, `proxy.js` guard, login rate limit, admin bootstrap script                      |
| 5   | Admin dashboard | Stats via aggregation pipeline, Animals CRUD, Categories manager, Inquiries inbox                                             |
| 5.5 | Admin polish    | ✅ `.pnl-*` panel layer, shared `components/admin/ui.js`, table listing, sticky form rails, Latin numerals, SMTP health check |
| 6   | Design system   | ✅ Editorial primitives, header/footer, sticky mobile action bar, Framer Motion patterns, `/styleguide`                       |
| 7   | Public pages    | ✅ `/`, `/showcase`, `/showcase/[slug]`, `/category/[categorySlug]`, `/about`, `/contact` (+ inquiry form)                    |
| 7.5 | System pages    | ✅ `/terms`, `/privacy`, `not-found`, `error`, `global-error`, public + admin `loading`, footer legal strip                   |
| 8   | Lead capture    | ✅ WhatsApp deep links, `/contact` form, inline animal form on `/showcase/[slug]`, shared form primitives                     |
| 9   | SEO & deploy    | ✅ sitemap, robots, JSON-LD, security headers, `docs/DEPLOY.md`, `.env.example`, README, orphan sweep                         |

## Design rules (non-negotiable, from the PRD)

Forbidden: eyebrow/pill badges with em dashes, everything-centred layouts,
symmetric 3-card grids with identical shadows, purple/indigo gradients,
glassmorphism, generic AI copy ("elevate your…", "unlock the power of…").

Required: asymmetric editorial grids, left-aligned structured content, staggered
/ masonry showcase with 4:5 vertical hero frames, tight radii (2–8px),
Bangla-first copy with English technical labels.

Palette: the gold/olive scheme above was superseded once the logo arrived. The
live values are sky blue `#0B62A4`, leaf green `#2E7D32`, nest clay `#8D5B3A`,
sky linen `#F4F8FA` and charcoal `#1A1D20` — defined in `app/globals.css` and
rendered with measured contrast ratios at `/styleguide`. Blue is a **line**
colour (links, rules, focus rings), never a large fill.

## Status

All phases complete. What remains before launch is content and one git
housekeeping step, both listed under **Before launch** below.

### 9 SEO & deploy (done)

- `app/sitemap.js` / `app/robots.js`. The sitemap builds from the same
  filters the pages use, so it cannot list a URL that 404s, and
  `lastModified` comes from the document rather than build time. robots.txt
  blocks everything unless `NODE_ENV=production` **and**
  `NEXT_PUBLIC_SITE_URL` is not localhost — a staging copy competing with the
  live site for the same Bangla queries is easier to prevent than to
  de-index.
- `lib/jsonld.js` — `PetStore` once on the homepage, `Product` + `Offer` per
  animal, `BreadcrumbList` from the trail the page actually renders. No
  invented ratings or reviews, and no price on a "দাম জানতে যোগাযোগ" listing.
- Security headers in `next.config.mjs`: CSP, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, plus
  `X-Robots-Tag: noindex` on `/admin`. The CSP's `'unsafe-inline'` is a
  documented trade-off (App Router ships inline bootstrap scripts; nonces
  would make every page dynamic) and `'unsafe-eval'` is dev-only. HSTS is
  nginx's job.
- `docs/DEPLOY.md` — nginx, PM2, TLS, and the part that actually breaks a
  Next deploy on a VPS: keeping `public/uploads/` alive across deploys via a
  symlink to `/var/data`.

Three gaps found during the sweep and fixed:

- **`.env.example` did not exist.** `.gitignore` had `!.env.example` ready
  for it, but the file was never there — so a fresh clone or VPS deploy had
  no template at all, and the first line of any deploy guide was impossible.
- **`npm run verify-mail` was not a script.** `scripts/verify-mail.js`
  existed and was referenced in the docs; nothing wired it into
  `package.json`.
- **`/public/uploads/*` was commented out in `.gitignore`**, so every
  photograph added through the admin was being committed as a binary blob.
  Now active — see **Before launch**.

### 8 lead capture (done)

All three inquiry kinds can now actually be created:

- `general` and `visit` — `/contact`.
- `animal` — the inline form on `/showcase/[slug]`. This was the gap: the
  schema branch and the admin inbox's "প্রাণী" tab both existed with nothing
  able to produce that kind. It posts only `animal` (the id); the route
  snapshots `animalLabel` server-side, so a forged label cannot reach the
  inbox and a dead id returns 400 instead of saving a lead pointing nowhere.
- The form is hidden on a **sold** listing, which shows the category instead.
  Collecting "I want this one" for something already gone helps nobody.

Two things came out of building it:

- `components/site/form-ui.js` — `Field`, `inputCls`, `FormErrorSummary`,
  `Honeypot`, shared by both forms. They post to the same endpoint and get the
  same `{field: message}` map back; two private copies would have drifted.
- **The honeypot was dead.** Both forms rendered a hidden `website` input and
  then hard-coded `website: ""` into the payload — which is built from React
  state, not the DOM, so a bot that filled every input still sailed through.
  It is now read through a ref. Worth remembering for any future form here.

The visit-booking modal is deliberately not built: `/contact` already books
visits, and a modal would be a second path to the same schema.

### 7.5 system pages (done)

Every route the framework can reach on its own now has a real page instead of
a default:

- `app/not-found.js` — names the likely cause (a sold animal, a renamed
  category) rather than blaming the URL, and routes onward to `/showcase`.
- `app/error.js` — public error boundary. Shows the digest, ends with the
  phone number. Does **not** catch a throw in the root layout.
- `app/global-error.js` — does. Replaces `<html>`/`<body>`, so it is the one
  file allowed to hard-code hex colours: a stylesheet that failed to load is
  one reason this screen might be showing.
- `app/loading.js` / `app/admin/loading.js` — shaped skeletons on the `.skel`
  class. The admin one exists specifically so the public skeleton never
  flashes inside the panel.
- `/terms` and `/privacy` — written from the code, not a template. The
  privacy page states there is no IP storage (`clientIp()` only feeds the
  in-memory rate limiter), no analytics and no tracking scripts, because
  that is what the codebase actually does. **If that ever changes — adding
  analytics, a pixel, a chat widget — `/privacy` is wrong and must be updated
  in the same commit.** Both pages are drafts, not legal advice.

### Homepage hero

Rebuilt to lead with photography. It used to be a text column plus a stats
rail — a showcase whose front page showed none of the collection. Now the left
column carries the marker, headline, lede and CTAs with the facts on a hairline
below, and the right column carries two real listings: a 4:5 frame and a square
one pushed 64px down, each a link, each captioned with its price.

Three things in it are load-bearing rather than stylistic:

- The home query fetches **eight** featured animals. The hero takes the first
  two that have a cover photo; the grid below shows the rest. Nothing appears
  twice on one screen.
- The hero pair is hidden entirely when fewer than two animals have covers —
  a fresh install would otherwise render two empty grey boxes.
- `priority` belongs to **one** image: the hero's first frame, which is the
  LCP element. The hero logo lost it (the header already preloads the same
  file, and a second priority instance at a different width emitted a second
  `<link rel=preload>`), and the featured cards only take it back when the
  hero has no photographs to show.

DOM order is words → photographs → facts, so on a phone the hook is the first
thing under the fold. From `lg` the photographs span both grid rows on the
right and the facts return under the text.

`/styleguide` renders the public system live: tokens with measured contrast
ratios, the type scale, every component, the motion tokens and the
accessibility checklist. Dev-only — it 404s in production unless
`ENABLE_STYLEGUIDE=true`.

**Before launch:** run `git rm -r --cached public/uploads` once to untrack
the media that was being committed (files on disk are untouched). Then: the
prose on `/about` is a working draft with no dates,
counts or certifications in it deliberately. Replace it with the owner's own
words. The visiting hours on `/contact` are placeholders too. `/terms` and
`/privacy` need a lawyer's read. Two test inquiries — "টেস্ট — Claude" and
"টেস্ট — phase 8" — are sitting in the admin inbox and should be deleted.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI and AUTH_SECRET
npm run dev
```
