/** @type {import('next').NextConfig} */
const nextConfig = {
    // Mongoose + sharp must stay outside the bundler (native bindings / dynamic requires).
    serverExternalPackages: ["mongoose", "sharp"],

    // Uploads are already normalised to WebP by the upload engine (Phase 3),
    // so the built-in optimizer only has to handle resizing. Long TTL keeps
    // CPU off the VPS.
    images: {
        formats: ["image/webp"],
        minimumCacheTTL: 2678400, // 31 days
        qualities: [75, 90],
    },

    poweredByHeader: false,
    reactStrictMode: true,

    async headers() {
        return [
            // Uploaded media lives on disk and is served straight from /public.
            // Cache it hard — filenames are content-hashed by the upload engine.
            {
                source: "/uploads/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },

            // Baseline security headers for every response.
            {
                source: "/:path*",
                headers: SECURITY_HEADERS,
            },

            // The admin panel is never a search result and never a frame.
            {
                source: "/admin/:path*",
                headers: [
                    {
                        key: "X-Robots-Tag",
                        value: "noindex, nofollow, noarchive",
                    },
                    { key: "Cache-Control", value: "no-store, max-age=0" },
                ],
            },
        ];
    },
};

/**
 * Security headers.
 *
 * `Content-Security-Policy` is the one worth reading carefully.
 *
 * - `'unsafe-inline'` is in `script-src` because Next's App Router ships
 *   inline bootstrap and streaming scripts on every page. Removing it needs
 *   per-request nonces threaded through `proxy.js`, which turns every page
 *   dynamic — a real cost on a VPS for a brochure site. Listed here so the
 *   trade-off is a decision rather than an oversight.
 * - `'unsafe-eval'` is development only. Turbopack's HMR needs it; shipping
 *   it to production would hand an XSS a much larger weapon.
 * - `style-src` allows inline because Tailwind v4 and Framer Motion both
 *   write inline styles.
 * - `img-src` includes `data:` for the blur placeholders the upload engine
 *   generates, and `blob:` for the admin's pre-upload previews.
 * - `frame-src` is the YouTube/Facebook embed on an animal page. Nothing else
 *   may frame in, and `frame-ancestors 'none'` means nothing may frame us —
 *   that is the modern replacement for X-Frame-Options, kept alongside it for
 *   older browsers.
 *
 * HSTS is deliberately NOT set here. It belongs on the TLS terminator (nginx),
 * where it cannot be served over plain HTTP by accident, and a wrong
 * `max-age` on a domain is painful to undo. See docs/DEPLOY.md.
 */
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self'",
    "connect-src 'self'" + (isDev ? " ws: wss:" : ""),
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://www.facebook.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
    { key: "Content-Security-Policy", value: CSP },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        // Nothing on this site uses any of these. Denying them up front means
        // a future third-party script cannot quietly start.
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
];

export default nextConfig;
