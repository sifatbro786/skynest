import { cache } from "react";

import { dbConnect } from "./db.js";
import { SeoMeta } from "../models/index.js";
import { site } from "./site.js";

/**
 * Per-route SEO overrides: the closed route list, the cache, and the resolver
 * every `generateMetadata` on the public site goes through.
 *
 * The contract in one line: **code defines the metadata, the database may
 * replace individual fields of it, and a failure at any point falls back to
 * the code.** Nothing here is allowed to throw into a page render.
 */

/** The reserved key holding the site-wide defaults every page inherits. */
export const SEO_SITE_KEY = "*";

/**
 * The routes an admin can edit, in the order the panel lists them.
 *
 * Closed on purpose. An open text field for the path looks more flexible and
 * is worse: a typo ("/About") writes a row that is saved, listed, and never
 * read by anything, and the owner's conclusion is "the SEO settings don't
 * work". Adding a page here is a one-line change by whoever adds the route.
 *
 * Dynamic routes are absent by design — see the note in models/SeoMeta.js.
 */
export const SEO_PAGES = [
    { path: "/", label: "হোম", hint: "সাইটের প্রথম পাতা" },
    { path: "/showcase", label: "কালেকশন", hint: "সব প্রাণীর তালিকা" },
    { path: "/about", label: "আমাদের সম্পর্কে", hint: "" },
    { path: "/contact", label: "যোগাযোগ ও ভিজিট", hint: "" },
    { path: "/terms", label: "শর্তাবলি", hint: "" },
    { path: "/privacy", label: "গোপনীয়তা নীতি", hint: "" },
];

export const SEO_PATHS = [SEO_SITE_KEY, ...SEO_PAGES.map((p) => p.path)];

const BASE = site.url.replace(/\/$/, "");

/* ------------------------------------------------------------------ */
/* Cache                                                               */
/* ------------------------------------------------------------------ */

/**
 * Two layers, and they do different jobs.
 *
 * `cache()` (React) dedupes within a single render pass. Next calls
 * `generateMetadata` and the page component separately, so without it every
 * request that reads SEO would query twice.
 *
 * The module-level TTL is what stops a query per *request*. These rows change
 * a few times a year and are read on every page view; 60s of staleness after
 * a save is invisible, and `invalidateSeoCache()` is called by the write route
 * so in practice it is zero.
 *
 * ⚠ This is a single-process cache. The app is a single Node instance on one
 * VPS (see the PRD), so that holds. Behind more than one instance, a save
 * would take up to TTL to appear on the others — at which point this becomes
 * Redis or a shorter TTL, not a bug to debug.
 */
const TTL_MS = 60_000;
let cached = { at: 0, rows: null };

export function invalidateSeoCache() {
    cached = { at: 0, rows: null };
}

async function loadRows() {
    const now = Date.now();
    if (cached.rows && now - cached.at < TTL_MS) return cached.rows;

    try {
        await dbConnect();
        const docs = await SeoMeta.find({ path: { $in: SEO_PATHS } }).lean();

        const rows = {};
        for (const doc of docs) rows[doc.path] = doc;

        cached = { at: now, rows };
        return rows;
    } catch (err) {
        // Metadata is never worth a 500. Serve the code defaults and say so
        // once in the log rather than per request.
        console.error("[seo] override load failed, using code defaults", err?.message ?? err);
        cached = { at: now, rows: {} };
        return {};
    }
}

/** Per-request memoised read of every override row. */
export const getSeoRows = cache(loadRows);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** "" and undefined are both "not set" — see models/SeoMeta.js. */
const pick = (...values) => values.find((v) => typeof v === "string" && v.trim() !== "")?.trim();

function absoluteUrl(value) {
    if (!value) return undefined;
    if (/^https?:\/\//i.test(value)) return value;
    return `${BASE}${value.startsWith("/") ? "" : "/"}${value}`;
}

/* ------------------------------------------------------------------ */
/* Resolver                                                            */
/* ------------------------------------------------------------------ */

/**
 * Builds a Next.js `Metadata` object for one route.
 *
 * @param {string} path      a value from SEO_PATHS, or a concrete dynamic
 *                           route like "/showcase/blue-macaw" — anything not
 *                           in the list simply has no page row and inherits
 *                           the site defaults, which is what dynamic pages do.
 * @param {object} fallback  the metadata this page would ship without the
 *                           database: { title, description, canonical,
 *                           keywords, ogImage, ogType, images }.
 */
export async function pageMetadata(path, fallback = {}) {
    const rows = await getSeoRows();
    const defaults = rows[SEO_SITE_KEY] ?? {};
    const page = rows[path] ?? {};

    const title = pick(page.title, fallback.title);
    const description = pick(page.description, fallback.description, defaults.description);
    const canonical = pick(page.canonical, fallback.canonical, path);

    // Page keywords replace the site list rather than extending it. Merging
    // the two is how every page ends up with the same thirty terms, which is
    // the shape search engines learned to discount.
    const keywords = page.keywords?.length
        ? page.keywords
        : (fallback.keywords ?? defaults.keywords ?? []);

    /**
     * Share-image precedence, and the middle step is the one that matters:
     *
     *   1. the admin's override for this exact route
     *   2. whatever the PAGE derived — an animal's own cover photograph
     *   3. the site-wide card
     *
     * Putting the site card above (2) was the first version and it was wrong:
     * every animal page would have shared the generic logo card instead of a
     * picture of the animal, which is the entire reason those links get
     * clicked in a WhatsApp thread. The site card is the last resort, never
     * the default.
     */
    const overrideImage = pick(page.ogImage);
    const ogImage = overrideImage ?? (fallback.images ? null : pick(fallback.ogImage, defaults.ogImage));

    const noindex = Boolean(page.noindex ?? false);
    const nofollow = Boolean(page.nofollow ?? false);

    /**
     * `absolute` on purpose. The root layout carries
     * `template: "%s · SkyNest Robiul"`, and an admin who types a meta title
     * is typing the string they expect to see in the search result — silently
     * appending the site name to it would push a carefully-measured 58
     * characters past Google's truncation point. The page's own fallback
     * title still goes through the template, because that one was written
     * knowing the template exists.
     */
    const titleValue = page.title?.trim()
        ? { absolute: page.title.trim() }
        : (fallback.title ?? undefined);

    const images = ogImage
        ? [{ url: absoluteUrl(ogImage), width: 1200, height: 630, alt: title ?? site.name }]
        : (fallback.images ?? undefined);

    return {
        ...(titleValue ? { title: titleValue } : {}),
        ...(description ? { description } : {}),
        ...(keywords.length ? { keywords } : {}),
        alternates: { canonical },
        robots: {
            index: !noindex,
            follow: !nofollow,
            googleBot: { index: !noindex, follow: !nofollow },
        },
        openGraph: {
            type: fallback.ogType ?? "website",
            url: canonical,
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            ...(images ? { images } : {}),
        },
        twitter: {
            card: images ? "summary_large_image" : "summary",
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            ...(images ? { images: images.map((i) => i.url ?? i) } : {}),
        },
    };
}

/**
 * The site-wide row alone, for the root layout and the sitemap.
 * Returns plain values, not a Metadata object.
 */
export async function siteDefaults() {
    const rows = await getSeoRows();
    const row = rows[SEO_SITE_KEY] ?? {};
    return {
        description: pick(row.description) ?? site.description,
        keywords: row.keywords ?? [],
        ogImage: pick(row.ogImage),
        ogImageUrl: absoluteUrl(pick(row.ogImage)),
    };
}

/**
 * Paths an admin has marked `noindex`.
 *
 * The sitemap uses this. A URL that is listed in sitemap.xml *and* serves
 * `robots: noindex` is a contradiction Search Console reports as an error —
 * it is the single most common way a working noindex looks broken.
 */
export async function noindexedPaths() {
    const rows = await getSeoRows();
    return new Set(
        Object.values(rows)
            .filter((r) => r.noindex && r.path !== SEO_SITE_KEY)
            .map((r) => r.path),
    );
}
