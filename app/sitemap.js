import { dbConnect } from "@/lib/db";
import { Animal, Category } from "@/models/index.js";
import { site } from "@/lib/site";
import { noindexedPaths } from "@/lib/seo";

export const dynamic = "force-dynamic";

const BASE = site.url.replace(/\/$/, "");

/**
 * The sitemap is generated from the same filters the public pages use, so it
 * can never advertise a URL that 404s: `isPublished` for animals and
 * `isActive` for categories — exactly what `buildPublicAnimalFilter` and the
 * category route check.
 *
 * `/styleguide` is omitted deliberately. It is dev-only and already 404s in
 * production unless `ENABLE_STYLEGUIDE=true`; listing it would either leak an
 * internal page or advertise a 404.
 *
 * `/admin` and `/api` are absent for the same reason they are in robots.txt —
 * nothing under them is public.
 *
 * `lastModified` comes from the document, not from `new Date()`. A sitemap
 * that claims every page changed at build time teaches crawlers to ignore the
 * field.
 *
 * Static pages an admin has marked `noindex` in the SEO panel are filtered
 * out. A URL that is listed here *and* serves `robots: noindex` is a
 * contradiction Search Console reports as an error, and it is the single most
 * common way a working noindex looks broken to the person who set it.
 */
export default async function sitemap() {
    await dbConnect();

    const [animals, categories, hidden] = await Promise.all([
        Animal.find({ isPublished: true })
            .select("slug updatedAt")
            .sort({ updatedAt: -1 })
            .limit(5000)
            .lean(),
        Category.find({ isActive: true }).select("slug updatedAt").lean(),
        noindexedPaths(),
    ]);

    const newestAnimal = animals[0]?.updatedAt ?? new Date();

    const staticPages = [
        { url: `${BASE}/`, changeFrequency: "daily", priority: 1, lastModified: newestAnimal },
        {
            url: `${BASE}/showcase`,
            changeFrequency: "daily",
            priority: 0.9,
            lastModified: newestAnimal,
        },
        { url: `${BASE}/about`, changeFrequency: "yearly", priority: 0.5 },
        { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.7 },
        { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.2 },
        { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ];

    return [
        ...staticPages.filter((page) => !hidden.has(page.url.slice(BASE.length) || "/")),

        ...categories.map((c) => ({
            url: `${BASE}/category/${c.slug}`,
            lastModified: c.updatedAt ?? undefined,
            changeFrequency: "weekly",
            priority: 0.8,
        })),

        ...animals.map((a) => ({
            url: `${BASE}/showcase/${a.slug}`,
            lastModified: a.updatedAt ?? undefined,
            changeFrequency: "weekly",
            priority: 0.7,
        })),
    ];
}
