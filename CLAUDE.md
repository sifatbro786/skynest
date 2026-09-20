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

That vocabulary lives in the `.pnl-*` layer in `app/globals.css`, scoped under
`.panel-root` (set by `AdminShell` and by the login page) so none of it reaches
the public site. Build admin screens from
`components/admin/ui.js` — `Card`, `Field`, `Input`, `Select`, `Button`,
`Alert`, `EmptyState`, `Pagination` — rather than restyling controls per page.

What the panel keeps from the brand: the palette, the 2–8px radii, and the ban
on gradients and glassmorphism.

Listing screens share one filter shape: a `Card` holding a labelled search box
and labelled `Select`s, with a "ফিল্টার সরান" button and a `useTransition`
pending indicator — `animal-filters.js` and `inquiry-filters.js`. Rows of chip
tabs are not the pattern; the inbox used to have two of them and they cost
more vertical space than the first result row underneath. Every filter writes
to the URL and resets `page` to 1.

> **⚠ Never name a class `ad-…`, `ads-…`, `advert…`, `sponsor…` or
> `banner-ad…`, anywhere in this project.**
>
> The panel layer used to be `.ad-*` (for "admin"), scoped under `.admin-root`.
> Every element carrying one of those classes was invisible in Chrome and fine
> in Firefox, with a clean console and no errors — because uBlock Origin's
> EasyList cosmetic filters match on the `ad-` prefix and inject
> `display: none !important`. From the browser's side nothing is wrong, so
> DevTools reports "No issues". It cost an afternoon to find. Hence `pnl-` and
> `panel-root`. The same warning is repeated in `app/globals.css` next to the
> layer itself.

Numerals: the public site renders Bangla digits (`toBanglaDigits`); the admin
panel renders Latin digits under Bangla labels (`formatCount`,
`formatDateLatin`), because counts, prices and dates there are scanned in
columns.

## Heading levels on public pages

Every public page needs exactly one `h1` and no skipped levels. Two props
exist purely for this and both have bitten already:

- `SectionHead` takes `as` (default `h2`). The **page title** instance passes
  `as="h1"`. Without it `/showcase`, `/about`, `/contact` and
  `/category/[slug]` all started at level 2.
- `AnimalGrid` takes `cardHeading` (default `h3`), forwarded to `AnimalCard`'s
  `as`. Where the grid follows the page `h1` directly — `/showcase`,
  `/category/[slug]` — it must be `h2`, or the document goes H1 → H3. Under a
  section `h2` (home, related animals) the default `h3` is correct.

Quick check, pasted into the browser console on any route:
`[...document.querySelectorAll('main h1,main h2,main h3')].map(h=>h.tagName)`

## Mongoose schemas change nothing until the dev server restarts

`mongoose.models` lives on the mongoose singleton, which survives Next's HMR.
The usual `models.X || model("X", schema)` guard therefore also means **an
edited schema is never picked up while the dev server is running** — and
Mongoose is strict by default, so a field the cached schema has never heard
of is dropped on `save()` **with no error**. The form posts it, the route
assigns it, the response looks fine, and the value is gone on reload. Adding
`isHero` cost exactly one round of that.

`models/register.js` fixes it: in development the old model is deleted and the
schema recompiled. All four models go through `registerModel(name, schema)` —
do not go back to the raw `models.X ||` form.

If a new field still does not persist, restart `npm run dev` before debugging
anything else.

## Section spacing (`components/site/ui.js`)

`cn` is `twMerge`, which resolves Tailwind conflicts **per breakpoint**. A base
class with an `lg:` variant is therefore NOT overridden by a caller's unprefixed
or `md:` class — they are different variants, so both survive and the `lg:` one
wins on desktop.

That is a real bug this project already shipped: `Section` carried
`lg:pb-24` in its base classes, the homepage hero passed `md:pb-0`, and the
hero kept 96px of bottom padding that nothing on the page could remove. It
read as a "huge gap" under the hero and looked like a grid problem.

So: **`Section`'s vertical padding stays symmetric (`py-*` only)**, and a
caller that wants a different bottom on desktop passes `lg:pb-*` explicitly —
see `visit-cta.js`, which writes `pb-24 md:pb-24 lg:pb-24` on purpose.

## Homepage composition

`app/page.js` is data only: one `getHomeData()`, the hero-pair selection, and
four components from `components/site/home/` — `hero`, `featured-animals`,
`category-rail`, `visit-cta`. Those take plain serialized props and never
touch Mongo, so they can be reordered or previewed without a connection.

**Which two animals appear in the hero is the owner's choice**, via the
`isHero` checkbox on the animal form (`models/Animal.js` → validators →
serializer → form; the PATCH route assigns generically so it needed no
change). Three rules live in `pickHeroPair()` in `app/page.js`:

- an animal with no cover photo is dropped, so the flag is a request rather
  than a guarantee — an empty grey box in the most prominent slot on the site
  is worse than no hero at all;
- fewer than two flagged tops up from `isFeatured`;
- the result is always exactly two or exactly zero, because one frame alone
  reads as a missing image rather than a deliberate single.

## Public forms

Both public forms post to `POST /api/inquiries`, a zod discriminated union on
`kind`. Build new ones from `components/site/form-ui.js` (`Field`, `inputCls`,
`FormErrorSummary`, `Honeypot`) rather than restyling inputs per page.

- **The honeypot must be read from the DOM.** `<Honeypot ref={...}/>` plus
  `website: potRef.current?.value ?? ""` in the payload. Rendering the hidden
  input and then hard-coding `website: ""` — which is what both forms did
  originally — makes it decorative: the body is built from React state, so a
  bot that fills every input still submits an empty `website`.
- **A 429 is a normal outcome**, not a crash. The route limits by IP (8/hr)
  and by phone-or-email (3/hr), and returns its own Bangla message. Show it
  and offer WhatsApp; never "try again" into a wall.
- **Errors come back as `{field: message}`** keyed by schema field. Render
  them inline _and_ in the focused summary. Any key that is not a field on
  the form (e.g. `animal`) must be promoted to the top-level message, or the
  summary renders a link to an anchor that does not exist.
- `kind: "animal"` is created **only** by the inline form on
  `/showcase/[slug]`. It sends the animal id; the route snapshots the title
  into `animalLabel` itself. Never send the label from the client.

## System pages

`not-found`, `error`, `global-error` and the two `loading` files are real
pages, not framework defaults. Four things about them are easy to get wrong:

- **`app/error.js` cannot catch a throw in `app/layout.js`.** The boundary
  lives inside the layout it would have to replace. That is what
  `app/global-error.js` is for — and because it replaces `<html>`/`<body>`,
  `globals.css` is not in its tree, so it is the **only** file in the project
  allowed to hard-code hex colours. Keep its imports near zero.
- **`app/admin/loading.js` must exist** even though it looks redundant.
  Without it the nearest boundary above `/admin` is the root one, and the
  owner watches a brochure skeleton flash before the dashboard.
- **Skeletons use the shared `.skel` class** (`app/globals.css`). One
  definition for both sides of the app — a skeleton is a placeholder shape,
  not brand surface, so it has no `pnl-` twin. It is a quiet opacity pulse on
  purpose: the travelling gradient shimmer is a banned PRD pattern.
- **`SiteFooter` takes `reserveActionBar`**, forwarded from `SiteShell`'s
  `actionBar`. The footer's bottom padding reserves `--actionbar-h` for the
  fixed mobile bar; on pages that pass `actionBar={false}` (`/contact`,
  `/terms`, `/privacy`, 404) reserving it anyway leaves 68px of dead space
  under the copyright line on every phone. The two flags must agree.

`/privacy` is written from the code, not a template: it states that no IP is
stored (`clientIp()` only feeds the in-memory rate limiter) and that there is
no analytics or tracking script anywhere. **Adding analytics, a pixel or a
chat widget makes that page false — update it in the same commit.**

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

## Orphan sweep — status

Done in phase 9. `public/` holds only `logo.jpg` and `uploads/`; the
`create-next-app` SVGs and the stray "Claude outputs" folder are gone, and
`README.md` is written.

One thing is still open and is a judgement call, not a cleanup:
`/public/uploads/*` was left **commented out** in `.gitignore`, so every
photograph added through the admin had been committing to git as a binary
blob. The rule is now active, but gitignore does not untrack what is already
tracked — run this once when convenient:

```bash
git rm -r --cached public/uploads
```

The files on disk are untouched; only git stops following them. Old blobs
stay in history, which is fine unless the repo has grown enough to matter.

The old note about `device_bash` being unavailable no longer applies, but the
rule it ended with still does: **always `grep -r` for an identifier before
deleting the file that defines it.** A file being old is not evidence that
nothing imports it.

## SEO surfaces (phase 9)

- `app/sitemap.js` builds from the same filters the pages use (`isPublished`,
  `isActive`), so it cannot advertise a URL that 404s. `lastModified` comes
  from the document, never `new Date()`.
- `app/robots.js` blocks **everything** unless `NODE_ENV=production` and
  `NEXT_PUBLIC_SITE_URL` is not localhost. A staging copy competing with the
  live site for the same Bangla queries is easier to prevent than to
  de-index. If robots.txt says `Disallow: /` on the real server, that env var
  is wrong.
- `lib/jsonld.js` — `PetStore` once on the homepage (everything else refers
  to it by `@id`), `Product` + `Offer` per animal, `BreadcrumbList` built from
  the trail the page actually renders. No `aggregateRating`, no `review`, and
  no `price` on a "দাম জানতে যোগাযোগ" listing: markup that disagrees with the
  page is worse than no rich result.
- Security headers are in `next.config.mjs`, with the CSP trade-offs written
  out above the policy. HSTS is deliberately nginx's job — see
  `docs/DEPLOY.md`.
