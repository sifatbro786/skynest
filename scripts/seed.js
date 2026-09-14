/**
 * Seed categories + demo animals, with generated placeholder photography.
 *
 *   npm run seed            # refuses if data already exists
 *   npm run seed -- --fresh # wipes categories + animals first
 *
 * Admin users and inquiries are never touched.
 */
import path from "node:path";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import sharp from "sharp";

import Category from "../models/Category.js";
import Animal from "../models/Animal.js";

const FRESH = process.argv.includes("--fresh");

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "public/uploads");
const URL_PREFIX = process.env.UPLOAD_URL_PREFIX || "/uploads";
const SEED_DIRNAME = "animals";

/* ---------------------------------------------------------------- */
/* Category tree                                                     */
/* ---------------------------------------------------------------- */

const TREE = [
    {
        name: "কুকুর",
        nameEn: "Dogs",
        icon: "Dog",
        order: 1,
        blurb: "পেডিগ্রি লাইনের গার্ড ও কম্প্যানিয়ন ব্রিড।",
        children: [
            ["জার্মান শেফার্ড", "German Shepherd"],
            ["ফ্রেঞ্চ বুলডগ", "French Bulldog"],
            ["সাইবেরিয়ান হাস্কি", "Siberian Husky"],
            ["গোল্ডেন রিট্রিভার", "Golden Retriever"],
        ],
    },
    {
        name: "বিড়াল",
        nameEn: "Cats",
        icon: "Cat",
        order: 2,
        blurb: "লম্বা কোট ও শো-কোয়ালিটি বিড়ালের কালেকশন।",
        children: [
            ["পার্সিয়ান", "Persian"],
            ["মেইন কুন", "Maine Coon"],
            ["ব্রিটিশ শর্টহেয়ার", "British Shorthair"],
            ["বেঙ্গল", "Bengal"],
        ],
    },
    {
        name: "এক্সোটিক পাখি ও কবুতর",
        nameEn: "Exotic Birds & Pigeons",
        icon: "Bird",
        order: 3,
        blurb: "ম্যাকাও, ককাটু থেকে হাই-ফ্লাইং দেশি কবুতর।",
        children: [
            ["ম্যাকাও", "Macaw"],
            ["ককাটু", "Cockatoo"],
            ["প্যারাকিট", "Parakeet"],
            ["গিরাবাজ", "Girabaz Pigeon"],
            ["টাম্বলার", "Tumbler Pigeon"],
            ["সিরাজি", "Sirazi Pigeon"],
        ],
    },
    {
        name: "ফ্যান্সি হাঁস ও মুরগি",
        nameEn: "Fancy Ducks & Fowls",
        icon: "Feather",
        order: 4,
        blurb: "ম্যান্ডারিন, কল ডাক ও ফ্যান্সি ফাউল ব্রিড।",
        children: [
            ["ম্যান্ডারিন ডাক", "Mandarin Duck"],
            ["কল ডাক", "Call Duck"],
            ["ব্রাহমা", "Brahma Chicken"],
            ["সিল্কি", "Silkie Chicken"],
            ["পোলিশ", "Polish Chicken"],
        ],
    },
    {
        name: "অন্যান্য এক্সোটিক পেট",
        nameEn: "Other Exotic Pets",
        icon: "Rabbit",
        order: 5,
        blurb: "ফ্যান্সি র‍্যাবিট ও গিনিপিগ।",
        children: [
            ["ফ্যান্সি র‍্যাবিট", "Fancy Rabbit"],
            ["গিনিপিগ", "Guinea Pig"],
        ],
    },
];

/* ---------------------------------------------------------------- */
/* Demo animals                                                      */
/* ---------------------------------------------------------------- */

const ANIMALS = [
    {
        title: "শো-লাইন জার্মান শেফার্ড পাপি",
        breed: "German Shepherd",
        family: "Dogs",
        sub: "German Shepherd",
        price: [85000, 120000],
        status: "available",
        gender: "male",
        ageMonths: 4,
        color: "Black & Tan",
        vaccination: "done",
        vaccinationNote: "DHPPi + Rabies সম্পন্ন",
        pedigree: "Import sire (Czech working line), 3 generation pedigree paper সহ",
        featured: true,
        description:
            "শক্ত হাড়ের গঠন, গাঢ় পিগমেন্টেশন আর ঠান্ডা মেজাজ — গার্ড ও ফ্যামিলি দুই কাজেই মানানসই। ফার্মে এসে বাবা-মা দুটোই দেখে নিতে পারবেন।",
        careNotes: "দিনে দুইবার খাবার, সপ্তাহে দুইবার ব্রাশিং।",
    },
    {
        title: "ব্লু ফ্রেঞ্চ বুলডগ",
        breed: "French Bulldog",
        family: "Dogs",
        sub: "French Bulldog",
        price: [150000, 190000],
        status: "reserved",
        gender: "female",
        ageMonths: 6,
        color: "Blue Fawn",
        vaccination: "done",
        description: "কম্প্যাক্ট বডি, চওড়া বুক আর পরিষ্কার ব্লু কোট। ফ্ল্যাটে রাখার জন্য আদর্শ।",
    },
    {
        title: "পিওর সাইবেরিয়ান হাস্কি জোড়া",
        breed: "Siberian Husky",
        family: "Dogs",
        sub: "Siberian Husky",
        price: [95000, null],
        status: "available",
        gender: "pair",
        ageMonths: 11,
        color: "Agouti & White",
        vaccination: "partial",
        vaccinationNote: "প্রথম ডোজ সম্পন্ন, বুস্টার বাকি",
        description: "নীল চোখ, ডাবল কোট। ব্রিডিং জোড়া হিসেবে নেওয়া যাবে।",
    },
    {
        title: "ডল-ফেস পার্সিয়ান বিড়াল",
        breed: "Persian",
        family: "Cats",
        sub: "Persian",
        price: [22000, 35000],
        status: "available",
        gender: "female",
        ageMonths: 7,
        color: "Silver Chinchilla",
        vaccination: "done",
        featured: true,
        description: "ঘন আন্ডারকোট, শান্ত স্বভাব। লিটার ট্রেইনড এবং ঘরের পরিবেশে বড় হয়েছে।",
        careNotes: "প্রতিদিন কোট ব্রাশ করতে হবে।",
    },
    {
        title: "মেইন কুন কিটেন",
        breed: "Maine Coon",
        family: "Cats",
        sub: "Maine Coon",
        price: [65000, 85000],
        status: "available",
        gender: "male",
        ageMonths: 5,
        color: "Brown Tabby",
        vaccination: "done",
        pedigree: "TICA registered parents",
        description: "বড় গড়নের জাত, কানে লিংক টিপ স্পষ্ট। পরিবারের সাথে মিশুক।",
    },
    {
        title: "ব্রিটিশ শর্টহেয়ার — ব্লু",
        breed: "British Shorthair",
        family: "Cats",
        sub: "British Shorthair",
        price: [48000, null],
        status: "sold",
        gender: "male",
        ageMonths: 9,
        color: "Solid Blue",
        vaccination: "done",
        description: "গোলগাল মুখ, ঘন প্লাশ কোট। ঠান্ডা ও ধৈর্যশীল স্বভাব।",
    },
    {
        title: "ব্লু অ্যান্ড গোল্ড ম্যাকাও",
        breed: "Blue & Gold Macaw",
        family: "Exotic Birds & Pigeons",
        sub: "Macaw",
        price: [450000, 520000],
        status: "available",
        gender: "unknown",
        ageMonths: 18,
        color: "Blue & Gold",
        vaccination: "na",
        featured: true,
        description:
            "হ্যান্ড-রেইজড, কথা বলার ট্রেনিং শুরু হয়েছে। DNA সেক্সিং রিপোর্ট সহ দেওয়া হবে।",
        careNotes: "বড় ফ্লাইট কেজ ও দৈনিক আউট-অফ-কেজ সময় প্রয়োজন।",
    },
    {
        title: "আম্ব্রেলা ককাটু",
        breed: "Umbrella Cockatoo",
        family: "Exotic Birds & Pigeons",
        sub: "Cockatoo",
        price: [280000, null],
        status: "available",
        gender: "female",
        ageMonths: 24,
        color: "White",
        vaccination: "na",
        description: "শান্ত এবং মানুষের সাথে অভ্যস্ত। ক্রেস্ট ফুল ও পরিষ্কার।",
    },
    {
        title: "চ্যাম্পিয়ন লাইন গিরাবাজ জোড়া",
        breed: "Girabaz Pigeon",
        family: "Exotic Birds & Pigeons",
        sub: "Girabaz Pigeon",
        price: [18000, 28000],
        status: "available",
        gender: "pair",
        ageMonths: 14,
        color: "Lal Sada",
        vaccination: "na",
        featured: true,
        description: "টানা উড়ার রেকর্ড আছে এমন লাইনের বাচ্চা। খেলার মাঠে পরীক্ষা করে নিতে পারবেন।",
    },
    {
        title: "ম্যান্ডারিন ডাক জোড়া",
        breed: "Mandarin Duck",
        family: "Fancy Ducks & Fowls",
        sub: "Mandarin Duck",
        price: [26000, null],
        status: "available",
        gender: "pair",
        ageMonths: 10,
        color: "Natural",
        vaccination: "na",
        description: "পূর্ণ রঙ ধরেছে, পুকুর বা বড় এনক্লোজারের জন্য উপযুক্ত।",
    },
    {
        title: "ব্রাহমা কক — লাইট",
        breed: "Brahma Chicken",
        family: "Fancy Ducks & Fowls",
        sub: "Brahma Chicken",
        price: [6500, 9000],
        status: "available",
        gender: "male",
        ageMonths: 8,
        color: "Light",
        vaccination: "done",
        description: "ভারি গড়ন, পালকযুক্ত পা। শো ও ব্রিডিং দুটোর জন্যই ভালো।",
    },
    {
        title: "হল্যান্ড লপ ফ্যান্সি র‍্যাবিট",
        breed: "Fancy Rabbit",
        family: "Other Exotic Pets",
        sub: "Fancy Rabbit",
        price: [4500, 7000],
        status: "available",
        gender: "female",
        ageMonths: 3,
        color: "Broken Orange",
        vaccination: "na",
        description: "ছোট গড়ন, ঝুলে থাকা কান। বাচ্চাদের জন্য নিরাপদ ও শান্ত।",
    },
];

/* ---------------------------------------------------------------- */
/* Placeholder photography                                           */
/* ---------------------------------------------------------------- */

const SWATCHES = [
    ["#2d4030", "#c59b27"],
    ["#a9532f", "#2d4030"],
    ["#1a1d20", "#c59b27"],
    ["#4a6350", "#a9532f"],
];

/**
 * Purely geometric so it needs no fonts installed on the host. Deliberately
 * not grey "lorem" boxes — these read as intentional art direction while the
 * real photography is being shot.
 */
function placeholderSvg(seed, width = 1200, height = 1500) {
    const [ink, accent] = SWATCHES[seed % SWATCHES.length];
    const cx = width * (0.32 + ((seed * 13) % 40) / 100);
    const cy = height * (0.36 + ((seed * 7) % 24) / 100);
    const r = width * (0.3 + ((seed * 11) % 14) / 100);
    const horizon = height * (0.62 + ((seed * 5) % 16) / 100);

    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#f1ebdf"/>
  <rect x="0" y="${horizon}" width="${width}" height="${height - horizon}" fill="${ink}" opacity="0.92"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${accent}" opacity="0.85"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="#f9f6f0" opacity="0.14"/>
  <rect x="0" y="${horizon - 6}" width="${width}" height="3" fill="#f9f6f0" opacity="0.5"/>
</svg>`);
}

async function writePlaceholder(slug, index) {
    const dir = path.join(UPLOAD_DIR, SEED_DIRNAME);
    await fs.mkdir(dir, { recursive: true });

    const filename = `seed-${slug}-${index + 1}.webp`;
    const width = 1200;
    const height = 1500;

    const master = await sharp(placeholderSvg(index + slug.length, width, height))
        .webp({ quality: 78 })
        .toBuffer();

    await fs.writeFile(path.join(dir, filename), master);

    const tiny = await sharp(master).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();

    return {
        path: `${URL_PREFIX}/${SEED_DIRNAME}/${filename}`,
        width,
        height,
        blur: `data:image/webp;base64,${tiny.toString("base64")}`,
    };
}

async function clearSeedImages() {
    const dir = path.join(UPLOAD_DIR, SEED_DIRNAME);
    let entries = [];
    try {
        entries = await fs.readdir(dir);
    } catch {
        return;
    }
    await Promise.all(
        entries
            .filter((name) => name.startsWith("seed-"))
            .map((name) => fs.rm(path.join(dir, name), { force: true })),
    );
}

/* ---------------------------------------------------------------- */

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error(
            "MONGODB_URI is not set.\n" +
                "Run via `npm run seed` (which loads .env.local) or export it manually.",
        );
        process.exit(1);
    }

    await mongoose.connect(uri, {
        dbName: process.env.MONGODB_DB || undefined,
        bufferCommands: false,
    });
    console.log("→ connected");

    const existing =
        (await Category.estimatedDocumentCount()) + (await Animal.estimatedDocumentCount());

    if (existing > 0 && !FRESH) {
        console.error(
            `Refusing to seed: ${existing} category/animal document(s) already exist.\n` +
                "Re-run with --fresh to wipe them: npm run seed -- --fresh",
        );
        await mongoose.disconnect();
        process.exit(1);
    }

    if (FRESH) {
        await Promise.all([Category.deleteMany({}), Animal.deleteMany({})]);
        await clearSeedImages();
        console.log("→ wiped categories, animals and seed images");
    }

    // Categories -----------------------------------------------------
    const byNameEn = new Map();

    for (const family of TREE) {
        const parent = await new Category({
            name: family.name,
            nameEn: family.nameEn,
            icon: family.icon,
            blurb: family.blurb,
            order: family.order,
        }).save();
        byNameEn.set(family.nameEn, parent);

        let order = 1;
        for (const [name, nameEn] of family.children) {
            const child = await new Category({
                name,
                nameEn,
                parent: parent._id,
                order: order++,
            }).save();
            byNameEn.set(nameEn, child);
        }
    }
    console.log(`→ ${byNameEn.size} categories`);

    // Animals --------------------------------------------------------
    let created = 0;

    for (const item of ANIMALS) {
        const family = byNameEn.get(item.family);
        const sub = byNameEn.get(item.sub);
        if (!family) throw new Error(`Unknown family: ${item.family}`);

        const doc = new Animal({
            title: item.title,
            breed: item.breed,
            category: family._id,
            subcategory: sub?._id ?? null,
            price: {
                min: item.price?.[0] ?? null,
                max: item.price?.[1] ?? null,
                onRequest: !item.price?.[0],
            },
            status: item.status,
            gender: item.gender,
            ageMonths: item.ageMonths ?? null,
            color: item.color ?? "",
            vaccination: item.vaccination ?? "na",
            vaccinationNote: item.vaccinationNote ?? "",
            pedigree: item.pedigree ?? "",
            description: item.description ?? "",
            careNotes: item.careNotes ?? "",
            isFeatured: Boolean(item.featured),
            isPublished: true,
        });

        // Slug is generated in pre-validate, so image names need it first.
        await doc.validate();

        const images = [];
        for (let i = 0; i < 3; i += 1) {
            images.push({
                ...(await writePlaceholder(doc.slug, i)),
                alt: `${item.breed} — ${item.title}`,
            });
        }
        doc.images = images;

        await doc.save();
        created += 1;
    }

    console.log(`→ ${created} animals with ${created * 3} placeholder images`);
    console.log(`→ images written to ${path.join(UPLOAD_DIR, SEED_DIRNAME)}`);

    await mongoose.disconnect();
    console.log("✓ seed complete");
}

main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
