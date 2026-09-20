import { site } from "@/lib/site";

const BASE = site.url.replace(/\/$/, "");

/**
 * robots.txt
 *
 * `/admin` and `/api` are disallowed because nothing under them is public —
 * not as a security measure. The guard is `proxy.js` plus `requireAdmin()` on
 * every route; robots.txt is a request, and a crawler that ignores it still
 * meets the real lock. Listing them here only keeps them out of the index.
 *
 * `/styleguide` is dev-only and 404s in production unless
 * `ENABLE_STYLEGUIDE=true`, but it is listed so that a staging deploy with the
 * flag on does not end up indexed.
 *
 * A non-production deploy blocks everything. A staging copy of a catalogue
 * competing with the real site for the same Bangla queries is a genuine
 * problem, and it is easier to prevent here than to de-index later.
 */
export default function robots() {
    const isProduction =
        process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
    const publicSite = isProduction && !BASE.includes("localhost");

    if (!publicSite) {
        return { rules: [{ userAgent: "*", disallow: "/" }] };
    }

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin", "/admin/", "/api/", "/styleguide"],
            },
        ],
        sitemap: `${BASE}/sitemap.xml`,
        host: BASE,
    };
}
