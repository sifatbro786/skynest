import { requireAdmin, unauthorized, sameOrigin, forbidden } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Inquiry } from "@/models/index.js";
import { inquiryPatchSchema, objectId, fieldErrors } from "@/lib/validators";
import {
  ok,
  badRequest,
  notFound,
  fromDbError,
  readJson,
  readParams,
} from "@/lib/api";
import { serializeInquiry } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = inquiryPatchSchema;

/** PATCH /api/admin/inquiries/[id] — status and internal note only. */
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

  // The visitor's own fields are never editable from the inbox — an inquiry is
  // a record of what someone actually sent.
  const update = {};
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.adminNote !== undefined) update.adminNote = parsed.data.adminNote;

  if (Object.keys(update).length === 0) {
    return badRequest("কিছু পরিবর্তন করা হয়নি");
  }

  try {
    await dbConnect();
    const doc = await Inquiry.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!doc) return notFound("ইনকোয়ারি পাওয়া যায়নি");
    return ok({ inquiry: serializeInquiry(doc) });
  } catch (err) {
    return fromDbError(err, { label: "inquiry update" });
  }
}

/** DELETE /api/admin/inquiries/[id] */
export async function DELETE(request, context) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!sameOrigin(request)) return forbidden();

  const { id } = await readParams(context);
  if (!objectId.safeParse(id).success) return badRequest("Invalid id");

  try {
    await dbConnect();
    const result = await Inquiry.deleteOne({ _id: id });
    if (result.deletedCount === 0) return notFound("ইনকোয়ারি পাওয়া যায়নি");
    return ok({ deleted: id });
  } catch (err) {
    return fromDbError(err, { label: "inquiry delete" });
  }
}
