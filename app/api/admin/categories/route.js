import { requireAdmin, unauthorized, sameOrigin, forbidden } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Category } from "@/models/index.js";
import { categorySchema, fieldErrors } from "@/lib/validators";
import { json, ok, badRequest, fromDbError, readJson } from "@/lib/api";
import { serializeCategory } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/categories — flat list, families first, then breeds. */
export async function GET() {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    await dbConnect();

    const categories = await Category.find({}).sort({ parent: 1, order: 1, nameEn: 1 }).lean();

    return ok({ categories: categories.map(serializeCategory) });
}

/** POST /api/admin/categories */
export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();
    if (!sameOrigin(request)) return forbidden();

    const { ok: parsedBody, body } = await readJson(request);
    if (!parsedBody) return badRequest("Invalid JSON body");

    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
        return badRequest("তথ্য ঠিকভাবে পূরণ করুন", fieldErrors(parsed.error));
    }

    try {
        await dbConnect();
        // new + save (not create/insertMany) so the pre-validate hook runs and
        // enforces the two-level depth rule.
        const doc = new Category({ ...parsed.data, parent: parsed.data.parent || null });
        await doc.save();
        return json({ ok: true, category: serializeCategory(doc.toObject()) }, 201);
    } catch (err) {
        return fromDbError(err, { label: "category create" });
    }
}
