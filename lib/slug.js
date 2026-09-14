import { toSlug, randomToken } from "./utils.js";

/**
 * Collision-safe slug generation.
 *
 * Titles are Bangla-first, so `toSlug` usually has to fall back to the English
 * breed name (or a random token). That makes collisions likely, not rare —
 * hence the explicit loop instead of trusting a unique index to throw.
 *
 * @param {import('mongoose').Model} Model
 * @param {string} source          text to slugify
 * @param {object} [opts]
 * @param {import('mongoose').Types.ObjectId|string} [opts.excludeId] ignore this doc when checking
 * @param {string} [opts.field]    slug field name, defaults to "slug"
 * @returns {Promise<string>}
 */
export async function uniqueSlug(Model, source, opts = {}) {
    const { excludeId, field = "slug" } = opts;
    const base = toSlug(source);

    for (let attempt = 0; attempt < 6; attempt += 1) {
        const candidate = attempt === 0 ? base : `${base}-${randomToken(4)}`;

        const query = { [field]: candidate };
        if (excludeId) query._id = { $ne: excludeId };

        const clash = await Model.exists(query);
        if (!clash) return candidate;
    }

    // Six collisions on a 32^4 keyspace means something is wrong upstream;
    // fall back to a token that cannot realistically collide.
    return `${base}-${randomToken(10)}`;
}

export { toSlug };
