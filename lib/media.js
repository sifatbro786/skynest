import { Animal, Category, SeoMeta } from "../models/index.js";
import { deleteUploads } from "./upload.js";

/**
 * Deletes uploaded files ONLY if nothing else still points at them.
 *
 * This check is not optional. Upload filenames carry a content hash, so the
 * same photo uploaded to two animals resolves to the *same file on disk*.
 * Removing an image from one animal and unlinking it blindly would leave the
 * other animal with a broken <img> and no error anywhere.
 *
 * @param {string[]} paths           candidate URL paths
 * @param {{ excludeAnimalId?: string }} [opts]
 * @returns {Promise<{ deleted: number, kept: string[] }>}
 */
export async function deleteUnreferencedImages(paths, opts = {}) {
    const candidates = [...new Set((paths ?? []).filter(Boolean))];
    if (candidates.length === 0) return { deleted: 0, kept: [] };

    const animalFilter = { "images.path": { $in: candidates } };
    if (opts.excludeAnimalId) animalFilter._id = { $ne: opts.excludeAnimalId };

    const [animalRefs, categoryRefs, seoRefs] = await Promise.all([
        Animal.find(animalFilter).select("images.path").lean(),
        Category.find({ image: { $in: candidates } })
            .select("image")
            .lean(),
        // Share cards from the SEO panel. Today nothing routes an og:image
        // through this function — the panel's remove button only clears the
        // field — but this is the "is anything still pointing at this file"
        // question, and answering it from two of the three models that can
        // point at one is how the next caller loses an image.
        SeoMeta.find({ ogImage: { $in: candidates } })
            .select("ogImage")
            .lean(),
    ]);

    const stillUsed = new Set();
    for (const animal of animalRefs) {
        for (const img of animal.images ?? []) {
            if (candidates.includes(img.path)) stillUsed.add(img.path);
        }
    }
    for (const category of categoryRefs) {
        if (category.image) stillUsed.add(category.image);
    }
    for (const row of seoRefs) {
        if (row.ogImage) stillUsed.add(row.ogImage);
    }

    const removable = candidates.filter((path) => !stillUsed.has(path));
    if (removable.length === 0) {
        return { deleted: 0, kept: [...stillUsed] };
    }

    const deleted = await deleteUploads(removable);
    return { deleted, kept: [...stillUsed] };
}
