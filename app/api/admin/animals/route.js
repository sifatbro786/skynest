import { requireAdmin, unauthorized, sameOrigin, forbidden } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Animal } from "@/models/index.js";
import { animalSchema, adminAnimalQuerySchema, toAnimalDoc, fieldErrors } from "@/lib/validators";
import { json, ok, badRequest, fromDbError, readJson } from "@/lib/api";
import { serializeAnimal } from "@/lib/serialize";
import { buildAnimalFilter, sortFor } from "@/lib/animal-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/animals */
export async function GET(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    const parsed = adminAnimalQuerySchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!parsed.success) {
        return badRequest("Invalid query", fieldErrors(parsed.error));
    }

    const params = parsed.data;
    const filter = buildAnimalFilter(params);

    await dbConnect();

    const [items, total] = await Promise.all([
        Animal.find(filter)
            .sort(sortFor(params.sort))
            .skip((params.page - 1) * params.limit)
            .limit(params.limit)
            .populate("category", "name nameEn slug")
            .populate("subcategory", "name nameEn slug")
            .lean(),
        Animal.countDocuments(filter),
    ]);

    return ok({
        animals: items.map(serializeAnimal),
        total,
        page: params.page,
        limit: params.limit,
        pages: Math.max(1, Math.ceil(total / params.limit)),
    });
}

/** POST /api/admin/animals */
export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();
    if (!sameOrigin(request)) return forbidden();

    const { ok: parsedBody, body } = await readJson(request);
    if (!parsedBody) return badRequest("Invalid JSON body");

    const parsed = animalSchema.safeParse(body);
    if (!parsed.success) {
        return badRequest("তথ্য ঠিকভাবে পূরণ করুন", fieldErrors(parsed.error));
    }

    try {
        await dbConnect();
        // new + save so pre-validate generates the slug and clamps coverIndex.
        const doc = new Animal(toAnimalDoc(parsed.data));
        await doc.save();
        return json({ ok: true, animal: serializeAnimal(doc.toObject()) }, 201);
    } catch (err) {
        return fromDbError(err, { label: "animal create" });
    }
}
