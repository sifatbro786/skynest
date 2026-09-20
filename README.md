# SkyNest Robiul

A catalogue and lead-capture site for a Dhaka breeder of premium and exotic
pets — dogs, cats, exotic birds and pigeons, fancy ducks and fowl.

There is no cart, no online payment and no customer account, by design.
Buyers browse, then reach the farm by WhatsApp, phone or the inquiry form, and
the sale happens in person.

**Stack:** Next.js 16 (App Router, JavaScript only), Tailwind v4, Framer
Motion, MongoDB + Mongoose, sharp for image processing. Self-hosted on a
Hostinger VPS behind nginx and PM2.

## Run it locally

```bash
npm ci
cp .env.example .env.local     # fill in MONGODB_URI and AUTH_SECRET
npm run dev
```

Then seed some data and create a login:

```bash
npm run seed -- --fresh        # demo catalogue; needs PEXELS_API_KEY for photos
npm run create-admin           # interactive
```

The public site is at `/`, the admin panel at `/admin`.

## Scripts

| Command                   | What it does                                            |
| ------------------------- | ------------------------------------------------------- |
| `npm run dev`             | Dev server (Turbopack)                                   |
| `npm run build`           | Production build                                         |
| `npm start`               | Serve the build                                          |
| `npm run lint`            | ESLint                                                   |
| `npm run seed`            | Seed the catalogue; `-- --fresh` wipes first             |
| `npm run create-admin`    | Create or update an admin user                           |
| `npm run verify-mail`     | Check the whole SMTP path end to end                     |
| `npm run cleanup:uploads` | Delete uploaded images no animal references              |

## Where things are

```
app/                  routes; app/admin/** is the panel
components/site/      public components (home/ holds the homepage sections)
components/admin/     panel components — a separate vocabulary on purpose
lib/                  db, env, auth, upload, validators, site config, jsonld
models/               Mongoose schemas — import via models/index.js
scripts/              node scripts, run with --env-file
docs/                 PROJECT-PLAN.md (phases, decisions), DEPLOY.md
```

## Before you change anything

Read **`CLAUDE.md`**. It is short and every entry in it is a bug that already
happened once — the ad-blocker class-name trap, the `twMerge` per-breakpoint
padding trap, the Mongoose schema cache that silently drops new fields in dev,
the heading-level props, and the honeypot that was decorative for two forms.

`docs/PROJECT-PLAN.md` has the phase history and the design rules the client
signed off on. The design rules are hard requirements, not preferences.

## Deploying

See **`docs/DEPLOY.md`**. The one thing that is easy to get wrong: uploaded
media lives on the server's own disk under `public/uploads/`, so the deploy
has to be arranged not to destroy it.
