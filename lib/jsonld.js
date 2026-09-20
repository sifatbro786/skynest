import { site } from "@/lib/site";

const BASE = site.url.replace(/\/$/, "");

/** Absolute URL for a site-relative path; schema.org wants absolute. */
export function abs(path = "/") {
    if (!path) return BASE;
    if (/^https?:\/\//i.test(path)) return path;
    return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The business itself, emitted once on the homepage.
 *
 * `PetStore` rather than the generic `LocalBusiness`: it is a real
 * schema.org type and it is what the farm actually is, which is the whole
 * point of the markup.
 *
 * `areaServed` and `priceRange` are omitted on purpose. Both are commonly
 * faked in this markup, and a wrong `priceRange` shown in a result is worse
 * for a breeder than no price at all — the site's own copy says prices are
 * indicative and settled in conversation.
 */
export function organizationLd() {
    return {
        "@context": "https://schema.org",
        "@type": "PetStore",
        "@id": `${BASE}/#business`,
        name: site.name,
        alternateName: site.ownerEn,
        url: BASE,
        logo: abs(site.logo),
        image: abs(site.logo),
        description: site.description,
        telephone: site.phone,
        ...(site.email ? { email: site.email } : {}),
        address: {
            "@type": "PostalAddress",
            streetAddress: site.address.lineEn,
            addressLocality: "Dhaka",
            addressCountry: "BD",
        },
        ...(Object.values(site.social).filter(Boolean).length > 0
            ? { sameAs: Object.values(site.social).filter(Boolean) }
            : {}),
    };
}

/** schema.org availability for each of the three listing states. */
const AVAILABILITY = {
    available: "https://schema.org/InStock",
    reserved: "https://schema.org/PreOrder",
    sold: "https://schema.org/SoldOut",
};

/**
 * One animal as a `Product` with an `Offer`.
 *
 * Two deliberate omissions:
 *
 * - **No `aggregateRating` or `review`.** There are none. Inventing them is
 *   the single most common way this markup gets a site penalised, and it
 *   would also be a lie in a storefront that has no reviews.
 * - **No `price` when the listing says "দাম জানতে যোগাযোগ করুন".** An offer
 *   without a price is valid markup; an offer with a made-up one is not.
 *
 * When a range is set, `lowPrice`/`highPrice` are used rather than a single
 * `price`, because that is what the page shows and a search result that
 * disagrees with the page is worse than no rich result.
 */
export function animalLd(animal) {
    const url = abs(`/showcase/${animal.slug}`);
    const images = (animal.images ?? [])
        .map((img) => img?.path)
        .filter(Boolean)
        .slice(0, 6)
        .map(abs);

    const { min, max, onRequest } = animal.price ?? {};
    const hasRange = !onRequest && min != null && max != null && max !== min;
    const hasSingle = !onRequest && !hasRange && (min ?? max) != null;

    const offer = {
        "@type": "Offer",
        url,
        availability: AVAILABILITY[animal.status] ?? AVAILABILITY.available,
        priceCurrency: "BDT",
        seller: { "@id": `${BASE}/#business` },
        ...(hasRange ? { lowPrice: min, highPrice: max } : {}),
        ...(hasSingle ? { price: min ?? max } : {}),
    };

    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${url}#product`,
        name: animal.title,
        url,
        ...(images.length > 0 ? { image: images } : {}),
        ...(animal.description ? { description: animal.description } : {}),
        category: animal.category?.nameEn || animal.category?.name || undefined,
        ...(animal.color ? { color: animal.color } : {}),
        additionalProperty: [
            prop("Breed", animal.breed),
            prop("Gender", animal.gender !== "unknown" ? animal.gender : ""),
            prop("Age (months)", animal.ageMonths != null ? String(animal.ageMonths) : ""),
        ].filter(Boolean),
        offers: offer,
    };
}

function prop(name, value) {
    if (!value) return null;
    return { "@type": "PropertyValue", name, value };
}

/**
 * Breadcrumbs, from the same trail the page renders.
 *
 * Built from the visible breadcrumb rather than from the URL: markup that
 * describes a path the visitor cannot see is the definition of a mismatch,
 * and Google treats it as one.
 *
 * @param {Array<[string, string]>} trail `[name, path]` pairs, in order.
 */
export function breadcrumbLd(trail) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map(([name, path], i) => ({
            "@type": "ListItem",
            position: i + 1,
            name,
            item: abs(path),
        })),
    };
}

/**
 * Renders a JSON-LD block.
 *
 * `JSON.stringify` output is escaped for `</script>` before it reaches the
 * DOM. The data here is admin-authored, not visitor-authored, but an animal
 * title is still free text in a database and one `</script>` in it would end
 * the tag early and drop raw markup into the page.
 */
export function JsonLd({ data }) {
    const json = JSON.stringify(data).replace(/</g, "\\u003c");
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
