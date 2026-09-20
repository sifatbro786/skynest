# Deploying SkyNest Robiul to a Hostinger VPS

Next.js 16 in standalone-less `next start` mode, behind nginx, kept alive by
PM2. No Docker, no CDN, no object storage — the PRD rules those out and the
site is small enough that they would be ceremony.

The one thing that makes this deploy different from a stock Next app is that
**uploaded media lives on the server's own disk**, under `public/uploads/`.
Everything below that is unusual exists to protect that directory.

---

## 1. Prerequisites on the VPS

```bash
node -v            # 20.x or newer — Next 16 requires it
npm i -g pm2
```

MongoDB can be Atlas or a local `mongod`. If it is local, bind it to
`127.0.0.1` and do not open the port; the app connects over loopback.

## 2. First deploy

```bash
cd /var/www
git clone <repo> skynest && cd skynest

cp .env.example .env.local     # then fill it in — see §3
npm ci
npm run build
npm run create-admin           # interactive; creates the first admin user
```

`npm ci`, not `npm install` — the lockfile is what was tested.

## 3. Environment

`.env.local` is never committed. `MONGODB_URI`, `AUTH_SECRET` and `SMTP_PASS`
are secrets; treat a leak of any of them as a full compromise and rotate.

`AUTH_SECRET` must be a long random string and must **differ from
development**. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`NEXT_PUBLIC_SITE_URL` must be the real `https://` origin. It is not
cosmetic — `sitemap.xml`, `robots.txt`, every canonical link, the JSON-LD
`@id`s and the Open Graph URLs are all built from it. Left as
`http://localhost:3000`, the site will publish a sitemap full of localhost
URLs and `robots.txt` will disallow everything (that guard is in
`app/robots.js` on purpose).

Verify mail before trusting it:

```bash
npm run verify-mail
```

## 4. PM2

```bash
pm2 start npm --name skynest -- start
pm2 save
pm2 startup        # prints a command to run as root; run it
```

`pm2 save` then `pm2 startup` — in that order, or the process list is not
restored after a reboot.

Useful afterwards:

```bash
pm2 logs skynest --lines 100
pm2 reload skynest        # zero-downtime; prefer over restart
pm2 monit
```

## 5. nginx

```nginx
server {
    listen 443 ssl http2;
    server_name skynestrobiul.com www.skynestrobiul.com;

    ssl_certificate     /etc/letsencrypt/live/skynestrobiul.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/skynestrobiul.com/privkey.pem;

    # HSTS lives here, not in next.config.mjs — it must never be served over
    # plain HTTP, and a wrong max-age on a domain is painful to undo. Start
    # short, raise it once you are sure TLS is stable, and only add
    # `preload` when you are certain.
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Photographs are large; the upload engine writes WebP originals.
    client_max_body_size 12M;

    # Serve uploaded media straight from disk. This never reaches Node.
    location /uploads/ {
        alias /var/www/skynest/public/uploads/;
        access_log off;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}

server {
    listen 80;
    server_name skynestrobiul.com www.skynestrobiul.com;
    return 301 https://$host$request_uri;
}
```

`X-Forwarded-For` matters: `clientIp()` reads it for the inquiry rate limiter.
Without it every visitor looks like `127.0.0.1` and the first eight inquiries
of the hour lock out everyone else.

The security headers (CSP, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`) come from `next.config.mjs` and pass through the proxy.
Do not duplicate them in nginx — `add_header` in a `location` block silently
drops every inherited header, which is how a site ends up with half a policy.

## 6. Uploads must survive a deploy

**This is the part that breaks a Next deploy on a VPS.** `public/uploads/` is
real user data — the entire photo library — sitting inside the repo tree. It
is gitignored, so a `git pull` leaves it alone, but anything that replaces the
working directory (a fresh clone into a new folder, a build script that wipes
`public/`, a rollback by re-clone) destroys it.

Keep the data outside the deploy tree and symlink it in:

```bash
mkdir -p /var/data/skynest/uploads
mv /var/www/skynest/public/uploads/* /var/data/skynest/uploads/ 2>/dev/null
rm -rf /var/www/skynest/public/uploads
ln -s /var/data/skynest/uploads /var/www/skynest/public/uploads
```

Then a deploy can never touch it. Both nginx's `alias` and Node's writes
follow the symlink.

Back it up on the same schedule as the database — a Mongo dump without the
images restores a catalogue of broken frames:

```bash
tar czf /var/backups/uploads-$(date +%F).tar.gz -C /var/data/skynest uploads
mongodump --uri="$MONGODB_URI" --gzip --archive=/var/backups/db-$(date +%F).gz
```

Orphaned files (images dropped from an animal and referenced by nothing) are
swept by `npm run cleanup:uploads`. It checks references before unlinking.
Run it manually after a big edit session; it is not on a timer on purpose.

## 7. Routine deploy

```bash
cd /var/www/skynest
git pull
npm ci
npm run build
pm2 reload skynest
```

`npm run build` before `pm2 reload`, never after — reloading onto a
half-written `.next` serves 500s for the length of the build.

## 8. After the first deploy — check these

- `https://…/sitemap.xml` lists real URLs, not `localhost`
- `https://…/robots.txt` allows `/` and disallows `/admin`
- `curl -sI https://… | grep -i content-security-policy` returns the policy
- an animal page's JSON-LD validates (search.google.com/test/rich-results)
- `/admin` redirects to the login page when signed out
- a test inquiry arrives by email **and** appears in the inbox
- an image uploaded through the admin survives `pm2 reload`
