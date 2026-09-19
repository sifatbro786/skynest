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

| #   | Phase           | Scope                                                                                                                |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Foundation      | next.config, Tailwind v4 design tokens, fonts, `lib/db`, `lib/env`, `lib/site`, folder layout                        |
| 2   | Data layer      | Mongoose models (Category, Animal, Inquiry, AdminUser), indexes, slugs, zod validators, seed script                  |
| 3   | Upload engine   | `/api/admin/upload` — FormData parsing, mime/size guards, sharp → WebP variants, safe paths, delete + orphan cleanup |
| 4   | Admin auth      | bcrypt password, jose JWT in httpOnly cookie, `proxy.js` guard, login rate limit, admin bootstrap script             |
| 5   | Admin dashboard | Stats via aggregation pipeline, Animals CRUD, Categories manager, Inquiries inbox                                    |
| 5.5 | Admin polish    | ✅ `.pnl-*` panel layer, shared `components/admin/ui.js`, table listing, sticky form rails, Latin numerals, SMTP health check |
| 6   | Design system   | ✅ Editorial primitives, header/footer, sticky mobile action bar, Framer Motion patterns, `/styleguide`              |
| 7   | Public pages    | ✅ `/`, `/showcase`, `/showcase/[slug]`, `/category/[categorySlug]`, `/about`, `/contact` (+ inquiry form)      |
| 7.5 | System pages    | ✅ `/terms`, `/privacy`, `not-found`, `error`, `global-error`, public + admin `loading`, footer legal strip |
| 8   | Lead capture    | 🔸 WhatsApp deep links + inquiry form done (phase 6/7) · animal-page inline form left · visit-booking modal optional |
| 9   | SEO & deploy    | Metadata/OG, sitemap, robots, JSON-LD, security headers, nginx/PM2 notes, uploads persistence                        |

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

Phases 1–7 complete, plus the 5.5 admin polish and the 7.5 system-pages pass.
**Next up: phase 8 — the animal-page inline inquiry form**, then phase 9.

Phase 8 is mostly absorbed: prefilled WhatsApp deep links shipped with the
phase 6 action bar, and `/contact` carries the real inquiry form against the
existing API. One piece genuinely still matters — the inline form on
`/showcase/[slug]`. It is the **only** way an inquiry with `kind: "animal"`
can ever be created, and the admin inbox already ships a "প্রাণী সম্পর্কে"
tab that stays permanently empty without it. The visit-booking modal is the
optional part: `/contact` already books visits.

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

`/styleguide` renders the public system live: tokens with measured contrast
ratios, the type scale, every component, the motion tokens and the
accessibility checklist. Dev-only — it 404s in production unless
`ENABLE_STYLEGUIDE=true`.

**Before launch:** the prose on `/about` is a working draft with no dates,
counts or certifications in it deliberately. Replace it with the owner's own
words. The visiting hours on `/contact` are placeholders too. `/terms` and
`/privacy` need a lawyer's read. The test inquiry "টেস্ট — Claude" is still
sitting in the admin inbox and should be deleted.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI and AUTH_SECRET
npm run dev
```
