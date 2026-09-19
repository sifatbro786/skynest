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
| 5.5 | Admin polish    | ✅ `.ad-*` panel layer, shared `components/admin/ui.js`, table listing, sticky form rails, Latin numerals, SMTP health check |
| 6   | Design system   | Editorial primitives, header/footer, sticky mobile action bar, Framer Motion patterns                                |
| 7   | Public pages    | `/`, `/showcase`, `/showcase/[slug]`, `/category/[categorySlug]`, `/about`, `/contact`                               |
| 8   | Lead capture    | Prefilled WhatsApp deep links, visit-booking modal, inquiry API with validation + honeypot + rate limit              |
| 9   | SEO & deploy    | Metadata/OG, sitemap, robots, JSON-LD, security headers, nginx/PM2 notes, uploads persistence                        |

## Design rules (non-negotiable, from the PRD)

Forbidden: eyebrow/pill badges with em dashes, everything-centred layouts,
symmetric 3-card grids with identical shadows, purple/indigo gradients,
glassmorphism, generic AI copy ("elevate your…", "unlock the power of…").

Required: asymmetric editorial grids, left-aligned structured content, staggered
/ masonry showcase with 4:5 vertical hero frames, warm tactile palette
(linen `#F9F6F0`, charcoal `#1A1D20`, gold `#C59B27`, olive `#2D4030`),
Bangla-first copy with English technical labels.

## Status

Phases 1–5 complete, plus the 5.5 admin polish pass. **Next up: phase 6 —
design system**, which is the prerequisite for phase 7's public pages
(header/footer, editorial primitives, sticky mobile action bar, Framer Motion
patterns). Phases 8 and 9 follow.

Note that phase 6 is the *public* design system. The admin panel's own layer
is already in place and deliberately does not follow the editorial rules — see
"Admin panel vs public site" in `CLAUDE.md`.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI and AUTH_SECRET
npm run dev
```
