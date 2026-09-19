import { requireAdmin, unauthorized, sameOrigin, forbidden } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Category, Animal } from "@/models/index.js";
import { categoryPatchSchema, objectId, fieldErrors } from "@/lib/validators";
import { ok, badRequest, notFound, conflict, fromDbError, readJson, readParams } from "@/lib/api";
import { serializeCategory } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = categoryPatchSchema;

/** PATCH /api/admin/categories/[id] */
export async function PATCH(request, context) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();
    if (!sameOrigin(request)) return forbidden();

    const { id } = await readParams(context);
    if (!objectId.safeParse(id).success) return badRequest("Invalid id");

    const { ok: parsedBody, body } = await readJson(request);
    if (!parsedBody) return badRequest("Invalid JSON body");

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
        return badRequest("তথ্য ঠিকভাবে পূরণ করুন", fieldErrors(parsed.error));
    }

    try {
        await dbConnect();

        const doc = await Category.findById(id);
        if (!doc) return notFound("ক্যাটাগরি পাওয়া যায়নি");

        // A family with breeds under it cannot become a breed itself — that would
        // create the three-level tree the schema forbids, and the pre-validate
        // hook only checks upwards.
        if ("parent" in parsed.data && parsed.data.parent) {
            const childCount = await Category.countDocuments({ parent: doc._id });
            if (childCount > 0) {
                return conflict(
                    `এই ক্যাটাগরির অধীনে ${childCount}টি ব্রিড আছে, তাই এটিকে অন্য ক্যাটাগরির ভেতরে নেওয়া যাবে না।`,
                );
            }
        }

        for (const [key, value] of Object.entries(parsed.data)) {
            if (key === "parent") doc.parent = value || null;
            else doc[key] = value;
        }

        await doc.save();
        return ok({ category: serializeCategory(doc.toObject()) });
    } catch (err) {
        return fromDbError(err, { label: "category update" });
    }
}

/**
 * DELETE /api/admin/categories/[id]
 *
 * Refuses while anything still points at it. Deleting a category that animals
 * reference would leave documents with a dangling ObjectId that populate()
 * silently resolves to null — the listing would just stop showing them with
 * no error anywhere.
 */
export async function DELETE(request, context) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();
    if (!sameOrigin(request)) return forbidden();

    const { id } = await readParams(context);
    if (!objectId.safeParse(id).success) return badRequest("Invalid id");

    try {
        await dbConnect();

        const doc = await Category.findById(id).lean();
        if (!doc) return notFound("ক্যাটাগরি পাওয়া যায়নি");

        const [children, animals] = await Promise.all([
            Category.countDocuments({ parent: id }),
            Animal.countDocuments({ $or: [{ category: id }, { subcategory: id }] }),
        ]);

        if (children > 0) {
            return conflict(`আগে এর অধীনের ${children}টি ব্রিড সরাতে হবে।`, { children });
        }
        if (animals > 0) {
            return conflict(
                `${animals}টি প্রাণী এই ক্যাটাগরিতে আছে। আগে সেগুলো অন্য ক্যাটাগরিতে সরান।`,
                { animals },
            );
        }

        await Category.deleteOne({ _id: id });
        return ok({ deleted: id });
    } catch (err) {
        return fromDbError(err, { label: "category delete" });
    }
}
