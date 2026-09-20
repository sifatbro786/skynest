import { requireAdmin, unauthorized, sameOrigin, forbidden } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Animal } from "@/models/index.js";
import { animalPatchSchema, objectId, fieldErrors } from "@/lib/validators";
import { ok, badRequest, notFound, fromDbError, readJson, readParams } from "@/lib/api";
import { serializeAnimal } from "@/lib/serialize";
import { deleteUnreferencedImages } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/animals/[id] */
export async function GET(request, context) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    const { id } = await readParams(context);
    if (!objectId.safeParse(id).success) return badRequest("Invalid id");

    await dbConnect();
    const doc = await Animal.findById(id)
        .populate("category", "name nameEn slug")
        .populate("subcategory", "name nameEn slug")
        .lean();

    if (!doc) return notFound("প্রাণীটি পাওয়া যায়নি");
    return ok({ animal: serializeAnimal(doc) });
}

/** PATCH /api/admin/animals/[id] */
export async function PATCH(request, context) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();
    if (!sameOrigin(request)) return forbidden();

    const { id } = await readParams(context);
    if (!objectId.safeParse(id).success) return badRequest("Invalid id");

    const { ok: parsedBody, body } = await readJson(request);
    if (!parsedBody) return badRequest("Invalid JSON body");

    const parsed = animalPatchSchema.safeParse(body);
    if (!parsed.success) {
        return badRequest("তথ্য ঠিকভাবে পূরণ করুন", fieldErrors(parsed.error));
    }

    try {
        await dbConnect();

        const doc = await Animal.findById(id);
        if (!doc) return notFound("প্রাণীটি পাওয়া যায়নি");

        const previousImages = (doc.images ?? []).map((img) => img.path);

        // Assigned key by key so a partial price update does not clobber the
        // other two price fields.
        for (const [key, value] of Object.entries(parsed.data)) {
            if (key === "priceMin") doc.price.min = value;
            else if (key === "priceMax") doc.price.max = value;
            else if (key === "priceOnRequest") doc.price.onRequest = value;
            else if (key === "subcategory") doc.subcategory = value || null;
            else doc[key] = value;
        }

        await doc.save();

        // Images dropped from the form may now be unreferenced — but upload
        // filenames are content-hashed, so the same photo on another animal is
        // literally the same file. deleteUnreferencedImages checks before
        // unlinking; `npm run cleanup:uploads` is the safety net, not this.
        if (parsed.data.images) {
            const kept = new Set(doc.images.map((img) => img.path));
            const dropped = previousImages.filter((path) => !kept.has(path));
            if (dropped.length > 0) {
                await deleteUnreferencedImages(dropped, { excludeAnimalId: id }).catch((err) =>
                    console.error("[animals] orphan cleanup failed", err?.message),
                );
            }
        }

        return ok({ animal: serializeAnimal(doc.toObject()) });
    } catch (err) {
        return fromDbError(err, { label: "animal update" });
    }
}

/**
 * DELETE /api/admin/animals/[id]
 *
 * Removes the document first, then its media. If the unlink fails the record
 * is still gone and the files become orphans that `npm run cleanup:uploads`
 * sweeps — the reverse order would risk a live record pointing at deleted
 * images.
 */
export async function DELETE(request, context) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();
    if (!sameOrigin(request)) return forbidden();

    const { id } = await readParams(context);
    if (!objectId.safeParse(id).success) return badRequest("Invalid id");

    try {
        await dbConnect();

        const doc = await Animal.findById(id).select("images title").lean();
        if (!doc) return notFound("প্রাণীটি পাওয়া যায়নি");

        await Animal.deleteOne({ _id: id });

        const paths = (doc.images ?? []).map((img) => img.path).filter(Boolean);
        let removedImages = 0;
        if (paths.length > 0) {
            const result = await deleteUnreferencedImages(paths).catch((err) => {
                console.error("[animals] media cleanup failed", err?.message);
                return { deleted: 0 };
            });
            removedImages = result.deleted;
        }

        return ok({ deleted: id, removedImages });
    } catch (err) {
        return fromDbError(err, { label: "animal delete" });
    }
}
