/**
 * Shared between the admin route handler and the admin list page, so the
 * filter the API applies and the filter the page renders can never drift.
 */

export const ANIMAL_SORT_MAP = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-asc": { "price.min": 1, createdAt: -1 },
    "price-desc": { "price.min": -1, createdAt: -1 },
    title: { title: 1 },
};

/** Admin search is substring matching, not relevance — escape before regex. */
function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildAnimalFilter(params) {
    const filter = {};

    if (params.q) {
        const rx = new RegExp(escapeRegex(params.q), "i");
        filter.$or = [{ title: rx }, { breed: rx }, { color: rx }, { slug: rx }];
    }

    if (params.category) filter.category = params.category;
    if (params.subcategory) filter.subcategory = params.subcategory;
    if (params.status && params.status !== "all") filter.status = params.status;

    if (params.published && params.published !== "all") {
        filter.isPublished = params.published === "true";
    }

    if (params.missing === "images") filter.images = { $size: 0 };
    if (params.missing === "price") {
        filter["price.min"] = null;
        filter["price.onRequest"] = { $ne: true };
    }

    return filter;
}

export function sortFor(key) {
    return ANIMAL_SORT_MAP[key] ?? ANIMAL_SORT_MAP.newest;
}

/* ------------------------------------------------------------------ */
/* Public site                                                         */
/* ------------------------------------------------------------------ */

/**
 * The public listing is a different query from the admin one, and the
 * differences are not cosmetic — each of these was a live gap:
 *
 *  1. `buildAnimalFilter` only constrains `isPublished` when the caller passes
 *     a `published` param. `listQuerySchema` has no such field, so a public
 *     page reusing it would have shown every draft the owner had not finished
 *     writing. Here `isPublished: true` is hard-coded and not overridable.
 *
 *  2. `listQuerySchema` accepts `gender`, and `buildAnimalFilter` ignores it
 *     entirely — the filter would have rendered in the UI and done nothing.
 *
 *  3. `ANIMAL_SORT_MAP` has no `age-asc` / `age-desc`, but `ANIMAL_SORTS`
 *     offers both. `sortFor()` falls back to `newest` on an unknown key, so
 *     those two sorts silently did nothing. See PUBLIC_SORT_MAP below.
 *
 * Category and subcategory arrive as **slugs** on the public side (the URLs
 * are `/category/german-shepherd`, not an ObjectId), so the caller resolves
 * them first and passes ids in `refs`.
 *
 * @param {object} params parsed by `listQuerySchema`
 * @param {{ categoryId?: string|null, subcategoryId?: string|null }} [refs]
 */
export function buildPublicAnimalFilter(params, refs = {}) {
    const filter = { isPublished: true };

    if (params.q) {
        const rx = new RegExp(escapeRegex(params.q), "i");
        // `$or` is claimed here; every other clause below is a plain field, so
        // nothing else can collide with it.
        filter.$or = [{ title: rx }, { breed: rx }, { color: rx }];
    }

    if (refs.categoryId) filter.category = refs.categoryId;
    if (refs.subcategoryId) filter.subcategory = refs.subcategoryId;

    if (params.status && params.status !== "all") filter.status = params.status;
    if (params.gender && params.gender !== "all") filter.gender = params.gender;

    return filter;
}

/**
 * Public sorts, including the two age orders the admin map lacks.
 *
 * `ageMonths` is nullable, and Mongo sorts null before any number ascending.
 * That is the right answer for "youngest first" only by accident, so the
 * secondary `createdAt` key keeps the order stable rather than arbitrary when
 * a batch of animals all have no age recorded.
 */
export const PUBLIC_SORT_MAP = {
    newest: { createdAt: -1 },
    "price-asc": { "price.min": 1, createdAt: -1 },
    "price-desc": { "price.min": -1, createdAt: -1 },
    "age-asc": { ageMonths: 1, createdAt: -1 },
    "age-desc": { ageMonths: -1, createdAt: -1 },
};

export function publicSortFor(key) {
    return PUBLIC_SORT_MAP[key] ?? PUBLIC_SORT_MAP.newest;
}
