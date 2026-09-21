import { requireAdmin, unauthorized, sameOrigin, forbidden } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { SeoMeta } from "@/models/index.js";
import { seoMetaSchema, fieldErrors } from "@/lib/validators";
import { ok, badRequest, fromDbError, readJson } from "@/lib/api";
import { serializeSeoMeta } from "@/lib/serialize";
import { SEO_PAGES, SEO_PATHS, SEO_SITE_KEY, invalidateSeoCache } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/seo
 *
 * Returns a row for EVERY editable route, including ones never saved, filled
 * from `serializeSeoMeta(null, path)`. The panel then has no "does this exist
 * yet" branch and no create-vs-update distinction — there is one shape, and
 * saving is always an upsert.
 */
export async function GET() {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    await dbConnect();

    const docs = await SeoMeta.find({ path: { $in: SEO_PATHS } }).lean();
    const byPath = new Map(docs.map((d) => [d.path, d]));

    return ok({
        pages: SEO_PAGES,
        site: serializeSeoMeta(byPath.get(SEO_SITE_KEY), SEO_SITE_KEY),
        rows: SEO_PAGES.map((p) => serializeSeoMeta(byPath.get(p.path), p.path)),
    });
}

/**
 * PUT /api/admin/seo — upsert one row.
 *
 * PUT rather than POST, and the path travels in the BODY rather than in the
 * URL. A route path contains slashes, so `/api/admin/seo/showcase` would need
 * either a catch-all segment or URL-encoding, and both make "/" (the homepage)
 * an awkward special case. One endpoint, one key in the body, no encoding.
 *
 * The path is checked against `SEO_PATHS` before anything is written. Zod
 * validates the SHAPE of the string; only this list decides whether the route
 * is one the site actually reads — without it a typo would save happily and
 * then be ignored forever, which is the worst kind of "saved successfully".
 */
export async function PUT(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();
    if (!sameOrigin(request)) return forbidden();

    const { ok: parsedBody, body } = await readJson(request);
    if (!parsedBody) return badRequest("Invalid JSON body");

    const parsed = seoMetaSchema.safeParse(body);
    if (!parsed.success) {
        return badRequest("তথ্য ঠিকভাবে পূরণ করুন", fieldErrors(parsed.error));
    }

    const { path, ...fields } = parsed.data;
    if (!SEO_PATHS.includes(path)) {
        return badRequest("এই পেজটি সম্পাদনা করা যায় না", { path: "অজানা পেজ" });
    }

    // The site-wide row has no title, no canonical and no robots flags of its
    // own: a canonical that applied to every page would point them all at one
    // URL, a site-wide title would override every page's own, and a site-wide
    // noindex is a switch nobody should be one mis-click away from.
    if (path === SEO_SITE_KEY) {
        fields.title = "";
        fields.canonical = "";
        fields.noindex = false;
        fields.nofollow = false;
    }

    try {
        await dbConnect();

        const doc = await SeoMeta.findOneAndUpdate(
            { path },
            { $set: { ...fields, path, updatedBy: admin.id } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
        ).lean();

        // Without this the owner saves, reloads the public page, sees the old
        // title for up to a minute and saves again. See the TTL note in lib/seo.js.
        invalidateSeoCache();

        return ok({ row: serializeSeoMeta(doc, path) });
    } catch (err) {
        return fromDbError(err, { label: "seo save" });
    }
}
