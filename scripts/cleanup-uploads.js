/**
 * Find (and optionally delete) uploaded media that no document references.
 *
 *   npm run cleanup:uploads              # dry run — lists what it would delete
 *   npm run cleanup:uploads -- --delete  # actually removes them
 *   npm run cleanup:uploads -- --delete --min-age-hours=1
 *
 * Files younger than the age threshold are always kept: an admin may be
 * mid-way through a form, with images on disk but not yet saved to Mongo.
 */
import path from "node:path";
import fs from "node:fs/promises";
import mongoose from "mongoose";

import Animal from "../models/Animal.js";
import Category from "../models/Category.js";

const DELETE = process.argv.includes("--delete");
const MIN_AGE_HOURS = Number(
    process.argv.find((a) => a.startsWith("--min-age-hours="))?.split("=")[1] ?? 24,
);

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "public/uploads");
const URL_PREFIX = process.env.UPLOAD_URL_PREFIX || "/uploads";

async function walk(dir, out = []) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(full, out);
        else if (entry.isFile() && entry.name !== ".gitkeep") out.push(full);
    }
    return out;
}

function toUrlPath(absolute) {
    const rel = path.relative(UPLOAD_DIR, absolute).split(path.sep).join("/");
    return `${URL_PREFIX}/${rel}`;
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI is not set.");
        process.exit(1);
    }

    await mongoose.connect(uri, {
        dbName: process.env.MONGODB_DB || undefined,
        bufferCommands: false,
    });

    const referenced = new Set();

    const animals = await Animal.find({}, { images: 1 }).lean();
    for (const a of animals) {
        for (const img of a.images ?? []) if (img?.path) referenced.add(img.path);
    }

    const categories = await Category.find({ image: { $ne: "" } }, { image: 1 }).lean();
    for (const c of categories) if (c.image) referenced.add(c.image);

    const onDisk = await walk(UPLOAD_DIR);
    const cutoff = Date.now() - MIN_AGE_HOURS * 3600_000;

    const orphans = [];
    let skippedYoung = 0;
    let bytes = 0;

    for (const absolute of onDisk) {
        const urlPath = toUrlPath(absolute);
        if (referenced.has(urlPath)) continue;

        const stat = await fs.stat(absolute);
        if (stat.mtimeMs > cutoff) {
            skippedYoung += 1;
            continue;
        }

        orphans.push(absolute);
        bytes += stat.size;
    }

    console.log(`referenced : ${referenced.size}`);
    console.log(`on disk    : ${onDisk.length}`);
    console.log(`too recent : ${skippedYoung} (kept, younger than ${MIN_AGE_HOURS}h)`);
    console.log(`orphans    : ${orphans.length} (${(bytes / 1024 / 1024).toFixed(1)} MB)`);

    for (const o of orphans) console.log(`  ${toUrlPath(o)}`);

    if (orphans.length > 0) {
        if (DELETE) {
            await Promise.all(orphans.map((o) => fs.rm(o, { force: true })));
            console.log(`\n✓ deleted ${orphans.length} file(s)`);
        } else {
            console.log("\nDry run — re-run with --delete to remove them.");
        }
    }

    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
