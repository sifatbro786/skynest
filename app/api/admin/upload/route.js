import { requireAdmin, unauthorized } from "@/lib/guard";
import { processImages, deleteUploads, UploadError, UPLOAD_FOLDERS } from "@/lib/upload";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function json(body, status = 200) {
    return Response.json(body, { status, headers: NO_STORE });
}

/**
 * POST /api/admin/upload
 * multipart/form-data:
 *   files[]  — one or more images
 *   folder   — "animals" | "categories"
 *
 * Partial success is a real outcome here: an admin picking twelve photos from
 * a phone will occasionally include a HEIC the pipeline cannot read. The
 * response returns what succeeded alongside per-file errors so the form can
 * keep the good ones instead of failing the whole batch.
 */
export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    let form;
    try {
        form = await request.formData();
    } catch {
        return json({ ok: false, error: "Invalid multipart body" }, 400);
    }

    const folder = String(form.get("folder") || "animals");
    if (!UPLOAD_FOLDERS.includes(folder)) {
        return json({ ok: false, error: "Unknown folder" }, 400);
    }

    const files = [...form.getAll("files"), ...form.getAll("file")].filter(
        (f) => typeof f?.arrayBuffer === "function",
    );

    if (files.length === 0) {
        return json({ ok: false, error: "No files received" }, 400);
    }

    // Cheap guard before any buffer is allocated.
    const total = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const maxTotal = serverEnv.maxUploadBytes * 6;
    if (total > maxTotal) {
        return json(
            {
                ok: false,
                error: `Batch is too large (${Math.round(total / 1024 / 1024)}MB). Upload fewer files at a time.`,
            },
            413,
        );
    }

    try {
        const { files: saved, errors } = await processImages(files, folder);

        if (saved.length === 0) {
            return json({ ok: false, error: errors[0]?.error ?? "Upload failed", errors }, 400);
        }

        return json({ ok: true, files: saved, errors });
    } catch (err) {
        if (err instanceof UploadError) {
            return json({ ok: false, error: err.message }, err.status);
        }
        console.error("[upload] unexpected failure", err);
        return json({ ok: false, error: "Upload failed" }, 500);
    }
}

/**
 * DELETE /api/admin/upload
 * body: { path } | { paths: [] }
 *
 * Used when an admin removes an image from the form before saving. Idempotent:
 * a path that is already gone reports success.
 */
export async function DELETE(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorized();

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const paths = Array.isArray(body?.paths) ? body.paths : body?.path ? [body.path] : [];

    if (paths.length === 0) {
        return json({ ok: false, error: "No paths provided" }, 400);
    }
    if (paths.length > 24) {
        return json({ ok: false, error: "Too many paths" }, 400);
    }

    try {
        const deleted = await deleteUploads(paths);
        return json({ ok: true, deleted });
    } catch (err) {
        if (err instanceof UploadError) {
            return json({ ok: false, error: err.message }, err.status);
        }
        console.error("[upload] delete failed", err);
        return json({ ok: false, error: "Delete failed" }, 500);
    }
}
