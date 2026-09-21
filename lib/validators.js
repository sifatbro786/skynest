import { z } from "zod";
import { ANIMAL_STATUS, ANIMAL_GENDER, VACCINATION_STATUS } from "../models/Animal.js";
import { INQUIRY_KINDS, INQUIRY_STATUS, VISIT_SLOTS } from "../models/Inquiry.js";

/* ---------------------------------------------------------------- */
/* Primitives                                                        */
/* ---------------------------------------------------------------- */

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

/** BD mobile: 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX */
export const bdPhone = z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(?:\+?880|0)1[3-9]\d{8}$/.test(v), {
        message: "সঠিক মোবাইল নম্বর দিন (যেমন ০১৭XXXXXXXX)",
    });

/**
 * `z.coerce.boolean()` is a trap for form data — the string "false" coerces to
 * true. Parse the values HTML forms and JSON actually send.
 */
export const booleanish = z
    .any()
    .transform((v) =>
        typeof v === "boolean" ? v : ["true", "on", "1", "yes"].includes(String(v).toLowerCase()),
    );

const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal("")).default("");

/**
 * Empty form fields arrive as "" — treat that as "not provided".
 *
 * The blank must be normalised BEFORE coercion: `z.coerce.number()` turns both
 * "" and null into 0, which would silently store a zero price instead of
 * leaving it unset. Hence preprocess, with `z.null()` first in the union.
 */
const optionalNumber = (max = Number.MAX_SAFE_INTEGER) =>
    z.preprocess(
        (v) => (v === "" || v === null || v === undefined ? null : v),
        z.union([z.null(), z.coerce.number().min(0).max(max)]),
    );

/* ---------------------------------------------------------------- */
/* Admin auth                                                        */
/* ---------------------------------------------------------------- */

export const loginSchema = z.object({
    // Zod 4 runs the email check before string transforms, so normalise first
    // and pipe into the validator — otherwise " Owner@X.com " is rejected.
    email: z
        .string()
        .trim()
        .toLowerCase()
        .pipe(z.email({ message: "Enter a valid email" })),
    // 6 is the project minimum — single-owner catalogue site, no payments.
    // Brute-force pressure is handled by the IP rate limit and account lockout
    // in the login route rather than by password length.
    password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

/* ---------------------------------------------------------------- */
/* Category                                                          */
/* ---------------------------------------------------------------- */

const slugField = z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain a-z, 0-9 and -")
    .max(80);

/**
 * Field shapes WITHOUT defaults.
 *
 * `schema.partial()` does not strip `.default()` — a PATCH body of just
 * `{ name }` would still come back carrying `icon: ""`, `blurb: ""` and
 * `order: 0`, silently wiping those columns. So the create schema and the
 * patch schema are composed from these raw pieces instead.
 */
const categoryBase = {
    name: z.string().trim().min(1, "Bangla name is required").max(80),
    nameEn: z.string().trim().min(1, "English name is required").max(80),
    slug: slugField,
    parent: objectId.nullable(),
    icon: z.string().trim().max(40),
    image: z.string().trim().max(300),
    blurb: z.string().trim().max(240),
    order: z.coerce.number().int().min(0).max(999),
    isActive: booleanish,
};

export const categorySchema = z.object({
    ...categoryBase,
    slug: categoryBase.slug.optional(),
    parent: categoryBase.parent.optional(),
    icon: categoryBase.icon.optional().default(""),
    image: categoryBase.image.optional().default(""),
    blurb: categoryBase.blurb.optional().default(""),
    order: categoryBase.order.optional().default(0),
    isActive: categoryBase.isActive.optional().default(true),
});

/** Only the keys actually sent survive — nothing is reset by omission. */
export const categoryPatchSchema = z.object(categoryBase).partial();

/* ---------------------------------------------------------------- */
/* Animal                                                            */
/* ---------------------------------------------------------------- */

export const animalImageSchema = z.object({
    path: z
        .string()
        .trim()
        .regex(/^\/uploads\/[a-z0-9/_-]+\.(webp|jpg|jpeg|png)$/i, "Invalid path"),
    alt: optionalText(160),
    width: z.coerce.number().int().min(0).default(0),
    height: z.coerce.number().int().min(0).default(0),
    blur: z
        .string()
        .max(4000)
        .refine((v) => v === "" || v.startsWith("data:image/"), "Invalid blur data")
        .optional()
        .default(""),
});

/**
 * Raw animal fields, no defaults — same reason as categoryBase above:
 * `.partial()` keeps `.default()` alive, so a PATCH that only flips `status`
 * would otherwise blank the description, wipe the images array and reset the
 * price to unset.
 */
const animalBase = {
    title: z.string().trim().min(1, "শিরোনাম দিন").max(140),
    breed: z.string().trim().min(1, "Breed name is required").max(120),
    slug: slugField.max(90),
    category: objectId,
    subcategory: objectId.nullable(),
    priceMin: optionalNumber(100000000),
    priceMax: optionalNumber(100000000),
    priceOnRequest: booleanish,
    status: z.enum(ANIMAL_STATUS),
    gender: z.enum(ANIMAL_GENDER),
    ageMonths: optionalNumber(600),
    color: z.string().trim().max(80),
    vaccination: z.enum(VACCINATION_STATUS),
    vaccinationNote: z.string().trim().max(240),
    pedigree: z.string().trim().max(600),
    images: z.array(animalImageSchema).max(20),
    coverIndex: z.coerce.number().int().min(0),
    videoUrl: z.union([z.url({ message: "Enter a valid URL" }), z.literal("")]),
    description: z.string().trim().max(6000),
    careNotes: z.string().trim().max(2000),
    isFeatured: booleanish,
    isHero: booleanish,
    isPublished: booleanish,
};

/** Only meaningful when both keys are present — a PATCH may send neither. */
const coverInRange = (v) =>
    v.coverIndex === undefined ||
    v.images === undefined ||
    v.coverIndex === 0 ||
    v.coverIndex < v.images.length;

export const animalSchema = z
    .object({
        ...animalBase,
        slug: animalBase.slug.optional(),
        subcategory: animalBase.subcategory.optional(),
        priceOnRequest: animalBase.priceOnRequest.optional().default(false),
        status: animalBase.status.optional().default("available"),
        gender: animalBase.gender.optional().default("unknown"),
        color: animalBase.color.optional().default(""),
        vaccination: animalBase.vaccination.optional().default("na"),
        vaccinationNote: animalBase.vaccinationNote.optional().default(""),
        pedigree: animalBase.pedigree.optional().default(""),
        images: animalBase.images.optional().default([]),
        coverIndex: animalBase.coverIndex.optional().default(0),
        videoUrl: animalBase.videoUrl.optional().default(""),
        description: animalBase.description.optional().default(""),
        careNotes: animalBase.careNotes.optional().default(""),
        isFeatured: animalBase.isFeatured.optional().default(false),
        isHero: animalBase.isHero.optional().default(false),
        isPublished: animalBase.isPublished.optional().default(true),
    })
    .refine(coverInRange, {
        message: "Cover image index is out of range",
        path: ["coverIndex"],
    })
    .refine((v) => v.priceOnRequest || v.priceMin !== null, {
        message: "দাম দিন, অথবা “দাম জানতে যোগাযোগ” চিহ্নিত করুন",
        path: ["priceMin"],
    });

export const animalPatchSchema = z
    .object(animalBase)
    .partial()
    .refine(coverInRange, {
        message: "Cover image index is out of range",
        path: ["coverIndex"],
    });

/**
 * Create-only mapper: validated input → Mongoose document shape.
 * PATCH assigns key by key in the route so a partial price update does not
 * clobber the other two price fields.
 */
export function toAnimalDoc(input) {
    const { priceMin, priceMax, priceOnRequest, subcategory, slug, ...rest } = input;

    return {
        ...rest,
        ...(slug ? { slug } : {}),
        subcategory: subcategory || null,
        price: { min: priceMin, max: priceMax, onRequest: priceOnRequest },
    };
}

/* ---------------------------------------------------------------- */
/* Public: inquiries                                                 */
/* ---------------------------------------------------------------- */

const baseInquiry = {
    name: z.string().trim().min(2, "নাম লিখুন").max(80),
    phone: bdPhone,
    email: z
        .string()
        .trim()
        .toLowerCase()
        .optional()
        .default("")
        .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), {
            message: "সঠিক ইমেইল দিন",
        }),
    message: z.string().trim().max(2000).optional().default(""),
    source: optionalText(200),
    /** Honeypot — real users never fill this. */
    website: z.literal("").optional().default(""),
};

export const generalInquirySchema = z.object({
    ...baseInquiry,
    kind: z.literal("general"),
    message: z.string().trim().min(5, "কী জানতে চান লিখুন").max(2000),
});

export const animalInquirySchema = z.object({
    ...baseInquiry,
    kind: z.literal("animal"),
    animal: objectId,
});

export const visitInquirySchema = z.object({
    ...baseInquiry,
    kind: z.literal("visit"),
    animal: objectId.nullable().optional(),
    visitDate: z.coerce.date().refine((d) => d.getTime() > Date.now() - 86_400_000, {
        message: "ভবিষ্যতের তারিখ দিন",
    }),
    visitSlot: z.enum(VISIT_SLOTS),
});

export const inquirySchema = z.discriminatedUnion("kind", [
    generalInquirySchema,
    animalInquirySchema,
    visitInquirySchema,
]);

const inquiryUpdateBase = {
    status: z.enum(INQUIRY_STATUS),
    adminNote: z.string().trim().max(1000),
};

export const inquiryUpdateSchema = z.object({
    ...inquiryUpdateBase,
    adminNote: inquiryUpdateBase.adminNote.optional().default(""),
});

/**
 * Same default-survives-partial trap as the category and animal schemas:
 * a PATCH of just `{ status }` would otherwise carry `adminNote: ""` and
 * erase the note the owner typed a minute earlier.
 */
export const inquiryPatchSchema = z.object(inquiryUpdateBase).partial();

/* ---------------------------------------------------------------- */
/* Public: showcase listing query                                    */
/* ---------------------------------------------------------------- */

export const ANIMAL_SORTS = ["newest", "price-asc", "price-desc", "age-asc", "age-desc"];

/** Admin listing — adds draft/complete filters the public grid never needs. */
export const adminAnimalQuerySchema = z.object({
    q: z.string().trim().max(80).optional().default(""),
    category: z.string().trim().max(40).optional().default(""),
    subcategory: z.string().trim().max(40).optional().default(""),
    status: z.enum([...ANIMAL_STATUS, "all"]).default("all"),
    published: z.enum(["all", "true", "false"]).default("all"),
    missing: z.enum(["", "images", "price"]).default(""),
    sort: z.enum(["newest", "oldest", "price-asc", "price-desc", "title"]).default("newest"),
    page: z.coerce.number().int().min(1).max(500).default(1),
    limit: z.coerce.number().int().min(1).max(60).default(20),
});

export const adminInquiryQuerySchema = z.object({
    q: z.string().trim().max(80).optional().default(""),
    kind: z.enum([...INQUIRY_KINDS, "all"]).default("all"),
    status: z.enum([...INQUIRY_STATUS, "all"]).default("all"),
    page: z.coerce.number().int().min(1).max(500).default(1),
    limit: z.coerce.number().int().min(1).max(60).default(20),
});

export const listQuerySchema = z.object({
    q: z.string().trim().max(80).optional().default(""),
    category: z.string().trim().max(90).optional().default(""),
    subcategory: z.string().trim().max(90).optional().default(""),
    status: z.enum([...ANIMAL_STATUS, "all"]).default("all"),
    gender: z.enum([...ANIMAL_GENDER, "all"]).default("all"),
    sort: z.enum(ANIMAL_SORTS).default("newest"),
    page: z.coerce.number().int().min(1).max(500).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
});

/* ---------------------------------------------------------------- */
/* SEO meta                                                          */
/* ---------------------------------------------------------------- */

/**
 * A canonical is either an absolute http(s) URL or a site-relative path.
 *
 * Both are valid to Next — a relative value is resolved against
 * `metadataBase` — and both are things an owner legitimately types. What is
 * NOT accepted is a bare "example.com/page", which renders as a relative link
 * and silently canonicalises the page to a path that does not exist. Rejecting
 * it here is the only place that mistake is catchable.
 */
export const canonicalUrl = z
    .string()
    .trim()
    .max(400)
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), {
        message: "ক্যাননিক্যাল ঠিকানা / দিয়ে শুরু হবে, অথবা https:// দিয়ে",
    });

/**
 * Keywords arrive from the form as one comma-separated string and are stored
 * as an array. Normalising here rather than in the route means the API and any
 * future importer get the same treatment.
 *
 * Deduplicated case-insensitively and capped at 20. The cap is not arbitrary:
 * a keywords tag past roughly that length is the classic stuffing pattern, and
 * the field is already ignored by every major engine — see models/SeoMeta.js.
 */
export const keywordList = z
    .preprocess(
        (v) => (typeof v === "string" ? v.split(",") : Array.isArray(v) ? v : []),
        z.array(z.string()),
    )
    .transform((list) => {
        const seen = new Set();
        const out = [];
        for (const raw of list) {
            const word = String(raw).trim().replace(/\s+/g, " ");
            if (!word) continue;
            const key = word.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(word.slice(0, 60));
            if (out.length === 20) break;
        }
        return out;
    });

/**
 * One SEO row.
 *
 * The length caps are HARD limits, not the recommended ones. Google truncates
 * a title around 60 characters and a description around 160, but those are
 * pixel-width heuristics that change, and a 65-character title is a judgement
 * call rather than an error. The form shows the recommended range live; the
 * schema only stops values that are obviously wrong.
 */
export const seoMetaSchema = z.object({
    path: z.string().trim().min(1).max(120),
    title: z.string().trim().max(120).optional().default(""),
    description: z.string().trim().max(400).optional().default(""),
    canonical: canonicalUrl.optional().default(""),
    keywords: keywordList.optional().default([]),
    ogImage: z.string().trim().max(400).optional().default(""),
    noindex: booleanish.optional().default(false),
    nofollow: booleanish.optional().default(false),
});

/* ---------------------------------------------------------------- */
/* Helper                                                            */
/* ---------------------------------------------------------------- */

/**
 * Flattens a ZodError into `{ field: message }` for form rendering.
 * @param {import('zod').ZodError} error
 */
export function fieldErrors(error) {
    const out = {};
    for (const issue of error.issues) {
        const key = issue.path.join(".") || "_";
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}
