@AGENTS.md

# SkyNest Robiul

Luxury catalogue and lead-capture site for a Dhaka breeder of premium and
exotic pets (dogs, cats, exotic birds and pigeons, fancy ducks and fowls).
No cart, no payments: buyers inquire over a prefilled WhatsApp link or book
a farm visit. Owner: Khondakar Robiul, Shewrapara, Dhaka.

Build plan and phase status: `docs/PROJECT-PLAN.md`.

## Non-negotiables

- **JavaScript only.** Never create `.ts` or `.tsx` files.
- **No media SaaS.** No Cloudinary, S3 or UploadThing. Images are processed
  with `sharp` and written to local disk under `UPLOAD_DIR`
  (default `public/uploads/`); MongoDB stores the relative URL path.
- **Video is an embed**, not an upload. `Animal.videoUrl` holds a
  YouTube/Facebook link. Do not add mp4 upload.
- `package.json` has `"type": "module"` so the scripts in `scripts/` can
  import the Mongoose models directly.

## Next.js 16 specifics

This is not the Next.js in your training data. Check
`node_modules/next/dist/docs/` before using an unfamiliar API.

- `params`, `searchParams`, `cookies()`, `headers()` are **async**.
- `middleware.js` was renamed to **`proxy.js`** (Node runtime, not
  configurable). The export is `proxy`, not `middleware`.
- `revalidateTag(tag)` now needs a second argument (a `cacheLife` profile).
- `next lint` is gone — run `eslint` directly.
- Turbopack is the default for both `dev` and `build`.

## Layout

```
app/
  (public pages)
  admin/
    login/            ← outside the panel layout, no nav chrome
    (panel)/          ← route group: the authenticated admin shell
  api/admin/          ← every route here calls requireAdmin()
lib/                  ← db, env, auth, upload, validators, site config
models/               ← Mongoose schemas; import via models/index.js
scripts/              ← node scripts run with --env-file
docs/
```

## Conventions

- `@/` resolves to the project root (`jsconfig.json`). Use it in `app/` and
  `components/`.
- Inside `lib/` and `models/`, use **relative imports with the `.js`
  extension** — the `scripts/` are run by plain Node, which has neither the
  alias nor extensionless resolution.
- Import models from `models/index.js`, not the individual files. Mongoose
  resolves `ref` strings lazily, so a route that imports only `Animal` and
  then populates `category` throws `MissingSchemaError`.
- Server Components read through the model layer directly. Route handlers
  exist for mutations, uploads and client-driven filtering.
- **Every admin route handler and page calls `requireAdmin()`** from
  `lib/guard.js`. `proxy.js` is the cheap signature-only gate; it is never
  the only check, because a matcher change can silently drop coverage.
- Validate all input with the schemas in `lib/validators.js`. Use
  `fieldErrors(error)` to shape a response the forms can render.
- Contact details, brand strings and WhatsApp links come from `lib/site.js`
  — never hard-code a phone number or the owner's name in a component.
- Email templates live in `lib/email/templates/`; shared chrome and helpers in
  `lib/email/layout.js`.
- **All mail goes through `lib/mailer.js`.** Never instantiate nodemailer in a
  route. `sendMail()` is lazy-initialised and never throws — callers treat
  delivery as best-effort and a failed send must not fail the request.

## Admin panel vs public site

The design rules below describe the **public site**. The admin panel is a tool,
not a brochure, and deliberately does not follow them: body sans for headings,
fixed type sizes instead of the fluid editorial scale, boxed inputs with
visible borders, real card surfaces, and 12px sentence-case labels rather than
11px uppercase at 0.14em tracking.

That vocabulary lives in the `.ad-*` layer at the bottom of `app/globals.css`,
scoped under `.admin-root` (set by `AdminShell` and by the login page) so none
of it reaches the public site. Build admin screens from
`components/admin/ui.js` — `Card`, `Field`, `Input`, `Select`, `Button`,
`Alert`, `EmptyState`, `Pagination` — rather than restyling controls per page.

What the panel keeps from the brand: the palette, the 2–8px radii, and the ban
on gradients and glassmorphism.

Numerals: the public site renders Bangla digits (`toBanglaDigits`); the admin
panel renders Latin digits under Bangla labels (`formatCount`,
`formatDateLatin`), because counts, prices and dates there are scanned in
columns.

## Design rules (from the PRD — these are the client's hard requirements)

Forbidden: eyebrow/pill badges with em dashes, centered-everything layouts,
symmetric 3-card grids with identical shadows, gradients of any kind,
glassmorphism, count-up stat bars, generic AI copy ("elevate your…",
"unlock the power of…").

Required: asymmetric editorial grids, left-aligned structured content,
hairline rules, staggered showcase grids with 4:5 vertical frames, tight
radii (2–8px), Bangla-first copy with English technical labels.

Palette lives in `app/globals.css` and comes from the logo: sky blue
`#0B62A4` (primary accent — a **line** colour, not a fill), leaf green
`#2E7D32`, nest clay `#8D5B3A` (warm counterweight), sky linen `#F4F8FA`
(base), charcoal `#1A1D20` (text). The default Tailwind
blue/indigo/violet/purple/fuchsia scales are deleted in `@theme` on
purpose — if `bg-indigo-500` fails to compile, that is working as intended.

Type scale utilities: `text-display`, `text-headline`, `text-title`,
`text-lede`, `text-micro`. Primitives: `.shell`, `.grain`, `.rule`,
`.marker`, `.stroke-under`, `.frame`.

## Commands

```bash
npm run dev
npm run build
npm run lint

npm run seed -- --fresh                 # categories + demo animals + photos
npm run seed -- --fresh --no-photos     # ...with generated placeholders instead
npm run create-admin -- <email> '<pw>'  # add --reset to change a password
npm run cleanup:uploads                 # dry run; --delete to remove orphaned media
npm run verify-mail                     # SMTP config + handshake; --send to test
```

Seed photography: with `PEXELS_API_KEY` set, the seed downloads real breed
photos (searched by each entry's `photoQuery`), crops them 4:5 and writes them
to `UPLOAD_DIR` as WebP — the same pipeline as an admin upload, nothing
external at runtime. Without the key, or on any failure, it falls back to the
generated placeholder per image.

Admin passwords are **6 characters minimum** (`loginSchema` in
`lib/validators.js`, `MIN_PASSWORD` in `scripts/create-admin.js`). Brute-force
pressure is carried by the login route's IP rate limit and account lockout,
not by password length — if you change one of those two, change the other.

## Deployment notes

- The rate limiter in `lib/rate-limit.js` is in-memory, so PM2 must run in
  **fork mode** (one instance). In cluster mode each worker keeps its own
  counters and the effective limit multiplies.
- nginx must set `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
  or every request looks like `127.0.0.1` and all visitors share one rate
  limit bucket.
- `public/uploads/` is git-ignored and lives on the VPS disk. It must
  survive deploys — do not wipe it, and back it up separately from the code.
- SMTP credentials (`SMTP_*`, `ADMIN_EMAIL`) are required for inquiry
  notifications. Without them the app still runs and still saves inquiries —
  `sendMail()` reports `skipped` and the inbox shows the mail as not sent.

## Phase 9 cleanup pass (required before handover)

During the early phases `device_bash` was unavailable on the dev machine, so
files could not be deleted — a few things were replaced with component-based
alternatives instead of removing the superseded file (the admin chrome is a
component rather than a route-group layout for exactly this reason).

Before handover, sweep for orphans: superseded components, unused route
handlers, leftover `create-next-app` assets in `public/` (`next.svg`,
`vercel.svg`, `file.svg`, `globe.svg`, `window.svg`), and the empty
`README.md`. **Always run a fresh `grep -r` for the identifier before
deleting anything** — a file being old is not evidence that nothing imports
it.
