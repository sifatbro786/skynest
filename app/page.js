import { dbConnect } from "@/lib/db";
import { Animal, Category } from "@/models/index.js";
import { serializeAnimal, serializeCategory } from "@/lib/serialize";
import { JsonLd, organizationLd } from "@/lib/jsonld";
import SiteShell from "@/components/site/site-shell";
import Hero from "@/components/site/home/hero";
import FeaturedAnimals from "@/components/site/home/featured-animals";
import CategoryRail from "@/components/site/home/category-rail";
import VisitCta from "@/components/site/home/visit-cta";

export const dynamic = "force-dynamic";

export const metadata = {
    alternates: { canonical: "/" },
};

/**
 * Everything the homepage shows, in one trip to the database.
 *
 * This file is the only place on the page that knows about Mongo. The four
 * sections below are presentational and take plain serialized props, so they
 * can be reordered, reused or previewed without dragging a connection along.
 */
async function getHomeData() {
    await dbConnect();

    const [heroDocs, featuredDocs, families, counts, total] = await Promise.all([
        // Owner's pick for the hero. Newest first, and a couple spare in case
        // one of them has no photograph.
        Animal.find({ isPublished: true, isHero: true })
            .sort({ createdAt: -1 })
            .limit(4)
            .lean(),
        // Eight, not six: the hero may take two of these as a fallback, and the
        // grid below still wants a full set.
        Animal.find({ isPublished: true, isFeatured: true })
            .sort({ createdAt: -1 })
            .limit(8)
            .lean(),
        Category.find({ parent: null, isActive: true })
            .sort({ order: 1, nameEn: 1 })
            .lean(),
        Animal.aggregate([
            { $match: { isPublished: true } },
            { $group: { _id: "$category", n: { $sum: 1 } } },
        ]),
        Animal.countDocuments({ isPublished: true }),
    ]);

    // A brand new install has nothing flagged. Falling back to newest keeps
    // the page from rendering headings over empty rows, which reads as broken
    // rather than as "nothing here yet".
    let featured = featuredDocs;
    if (featured.length === 0) {
        featured = await Animal.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();
    }

    const countBy = {};
    for (const row of counts) {
        if (row?._id) countBy[String(row._id)] = row.n;
    }

    return {
        hero: heroDocs.map(serializeAnimal),
        featured: featured.map(serializeAnimal),
        families: families.map(serializeCategory),
        countBy,
        total,
    };
}

/**
 * Picks the two photographs for the hero.
 *
 * Owner's `isHero` picks win. Anything without a cover is dropped first — an
 * animal with no photograph would render an empty grey box in the most
 * prominent slot on the site, so the flag is a request, not a guarantee.
 *
 * The result is always exactly two or exactly zero. One frame alone reads as
 * a missing image rather than as a deliberate single, so the hero hides its
 * whole picture column instead.
 */
function pickHeroPair(flagged, featured) {
    const hasCover = (a) => Boolean(a.cover?.path);
    const picks = flagged.filter(hasCover).slice(0, 2);
    if (picks.length === 2) return picks;

    // Top up from featured rather than showing a lone frame.
    const seen = new Set(picks.map((a) => a.id));
    for (const animal of featured) {
        if (picks.length === 2) break;
        if (seen.has(animal.id) || !hasCover(animal)) continue;
        picks.push(animal);
        seen.add(animal.id);
    }

    return picks.length === 2 ? picks : [];
}

export default async function Home() {
    const { hero, featured, families, countBy, total } = await getHomeData();

    const heroPair = pickHeroPair(hero, featured);
    const heroIds = new Set(heroPair.map((a) => a.id));
    const gridFeatured = featured.filter((a) => !heroIds.has(a.id)).slice(0, 6);

    return (
        <SiteShell>
            {/* The business, described once for the whole site. Every other
                page references it by @id rather than repeating it. */}
            <JsonLd data={organizationLd()} />

            <Hero pair={heroPair} total={total} />
            <FeaturedAnimals
                animals={gridFeatured}
                priority={heroPair.length === 0}
            />
            <CategoryRail families={families} countBy={countBy} />
            <VisitCta />
        </SiteShell>
    );
}
