import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";
import { serverEnv } from "./env.js";
import { safeFileStem } from "./utils.js";

/**
 * VPS-local media pipeline. No CDN, no SaaS — everything lands on disk under
 * UPLOAD_DIR and is served straight from /public by Next (and by nginx in
 * production, see docs/DEPLOY.md).
 */

export const UPLOAD_FOLDERS = ["animals", "categories"];

const MAX_DIMENSION = 2000; // longest edge after resize
const WEBP_QUALITY = 82;
const BLUR_WIDTH = 16;
const MAX_FILES_PER_REQUEST = 12;

/** Magic-byte signatures. `file.type` is attacker-controlled — never trust it. */
const SIGNATURES = [
    { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    {
        mime: "image/png",
        test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
    },
    {
        mime: "image/webp",
        test: (b) =>
            b.subarray(0, 4).toString("ascii") === "RIFF" &&
            b.subarray(8, 12).toString("ascii") === "WEBP",
    },
    {
        mime: "image/avif",
        test: (b) =>
            b.subarray(4, 8).toString("ascii") === "ftyp" &&
            ["avif", "avis", "mif1", "heic"].includes(b.subarray(8, 12).toString("ascii")),
    },
];

export class UploadError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = "UploadError";
        this.status = status;
    }
}

/* ---------------------------------------------------------------- */
/* Paths                                                             */
/* ---------------------------------------------------------------- */

/**
 * Absolute path of the uploads root.
 *
 * `turbopackIgnore` on purpose. Turbopack's output tracing sees a non-literal
 * path and assumes it must bundle whatever it might point at — which here is
 * `public/uploads/`, i.e. every photo the owner has ever uploaded, copied into
 * the server build. This path is resolved at RUNTIME against the VPS working
 * directory and `UPLOAD_DIR`; there is nothing for the bundler to include.
 */
export function uploadRoot() {
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), serverEnv.uploadDir);
}

function assertFolder(folder) {
    if (!UPLOAD_FOLDERS.includes(folder)) {
        throw new UploadError(`Unknown upload folder: ${folder}`);
    }
    return folder;
}

/**
 * Guarantees a resolved path stays inside the uploads root. This is the only
 * thing standing between a crafted `path` field and `fs.rm("/etc/passwd")`.
 */
function assertInsideRoot(absolute) {
    const root = uploadRoot();
    const rel = path.relative(root, absolute);
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
        throw new UploadError("Path escapes the uploads directory", 400);
    }
    return absolute;
}

/**
 * `/uploads/animals/x.webp` → absolute disk path, validated.
 * @param {string} urlPath
 */
export function urlPathToDisk(urlPath) {
    const prefix = serverEnv.uploadUrlPrefix;
    const value = String(urlPath || "");

    if (!value.startsWith(`${prefix}/`)) {
        throw new UploadError("Path is outside the uploads prefix", 400);
    }
    if (value.includes("\0") || value.includes("..")) {
        throw new UploadError("Illegal path", 400);
    }

    const relative = value.slice(prefix.length + 1);
    // Runtime path, not a bundler input — see uploadRoot().
    return assertInsideRoot(path.resolve(/*turbopackIgnore: true*/ uploadRoot(), relative));
}

export function diskToUrlPath(absolute) {
    const rel = path.relative(uploadRoot(), assertInsideRoot(absolute));
    return `${serverEnv.uploadUrlPrefix}/${rel.split(path.sep).join("/")}`;
}

/* ---------------------------------------------------------------- */
/* Processing                                                        */
/* ---------------------------------------------------------------- */

function sniffMime(buffer) {
    if (buffer.length < 16) return null;
    return SIGNATURES.find((s) => s.test(buffer))?.mime ?? null;
}

/**
 * Normalises one uploaded image to WebP on disk.
 *
 * - EXIF orientation is applied then stripped (sharp drops metadata by
 *   default), so no GPS coordinates from a phone camera leak into /public.
 * - Longest edge capped at 2000px; next/image handles responsive sizes from
 *   this master, so we store one file per image rather than four variants.
 * - Filename carries a content hash, which is what makes the immutable
 *   Cache-Control header in next.config.mjs correct.
 *
 * @param {File} file
 * @param {string} folder
 * @returns {Promise<{ path: string, width: number, height: number, blur: string, alt: string }>}
 */
export async function processImage(file, folder) {
    assertFolder(folder);

    if (typeof file?.arrayBuffer !== "function") {
        throw new UploadError("Not a file");
    }
    if (file.size === 0) {
        throw new UploadError("Empty file");
    }
    if (file.size > serverEnv.maxUploadBytes) {
        const mb = Math.round(serverEnv.maxUploadBytes / 1024 / 1024);
        throw new UploadError(`File is larger than ${mb}MB`, 413);
    }

    const input = Buffer.from(await file.arrayBuffer());

    const mime = sniffMime(input);
    if (!mime) {
        // Covers the SVG case too: an SVG is a script-execution vector and never
        // matches a raster signature, so it is rejected here.
        throw new UploadError("Unsupported image type (JPEG, PNG, WebP or AVIF)");
    }

    let pipeline;
    let meta;
    try {
        pipeline = sharp(input, { failOn: "error", limitInputPixels: 100_000_000 });
        meta = await pipeline.metadata();
    } catch {
        throw new UploadError("File is not a readable image");
    }

    if (!meta.width || !meta.height) {
        throw new UploadError("Could not read image dimensions");
    }

    const { data: output, info } = await pipeline
        .rotate()
        .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toBuffer({ resolveWithObject: true });

    const hash = crypto.createHash("sha256").update(output).digest("hex").slice(0, 10);

    const stem = safeFileStem(file.name || "image");
    const filename = `${stem}-${hash}.webp`;

    // Runtime path, not a bundler input — see uploadRoot().
    const dir = path.join(/*turbopackIgnore: true*/ uploadRoot(), folder);
    await fs.mkdir(dir, { recursive: true });

    const absolute = assertInsideRoot(path.join(dir, filename));

    // Content-addressed: if the identical image is uploaded twice, reuse it.
    const exists = await fs
        .access(absolute)
        .then(() => true)
        .catch(() => false);

    if (!exists) {
        await fs.writeFile(absolute, output);
    }

    const blur = await makeBlurDataUrl(output);

    return {
        path: diskToUrlPath(absolute),
        width: info.width,
        height: info.height,
        blur,
        alt: "",
    };
}

/** Tiny inline placeholder for next/image `blurDataURL` (~300 bytes). */
export async function makeBlurDataUrl(buffer) {
    try {
        const tiny = await sharp(buffer)
            .resize({ width: BLUR_WIDTH })
            .webp({ quality: 40 })
            .toBuffer();
        return `data:image/webp;base64,${tiny.toString("base64")}`;
    } catch {
        return "";
    }
}

/**
 * Processes a batch with bounded concurrency — a small VPS will not survive
 * twelve simultaneous sharp pipelines on a 4000px DSLR JPEG.
 */
export async function processImages(files, folder, concurrency = 3) {
    if (files.length === 0) throw new UploadError("No files received");
    if (files.length > MAX_FILES_PER_REQUEST) {
        throw new UploadError(`Maximum ${MAX_FILES_PER_REQUEST} files per upload`);
    }

    const results = [];
    const errors = [];
    let cursor = 0;

    async function worker() {
        while (cursor < files.length) {
            const index = cursor;
            cursor += 1;
            const file = files[index];
            try {
                results.push({ index, ...(await processImage(file, folder)) });
            } catch (err) {
                errors.push({
                    index,
                    name: file?.name || `file ${index + 1}`,
                    error: err instanceof UploadError ? err.message : "Processing failed",
                });
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));

    results.sort((a, b) => a.index - b.index);
    return {
        files: results.map(({ index, ...rest }) => rest),
        errors: errors.sort((a, b) => a.index - b.index),
    };
}

/* ---------------------------------------------------------------- */
/* Deletion                                                          */
/* ---------------------------------------------------------------- */

/**
 * Removes a file by its public URL path. Missing files are not an error —
 * deletion must stay idempotent so a failed admin save can be retried.
 */
export async function deleteUpload(urlPath) {
    const absolute = urlPathToDisk(urlPath);
    await fs.rm(absolute, { force: true });
    return true;
}

export async function deleteUploads(urlPaths = []) {
    const settled = await Promise.allSettled(urlPaths.map(deleteUpload));
    return settled.filter((r) => r.status === "fulfilled").length;
}
