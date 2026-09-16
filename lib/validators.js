import { z } from "zod";
import {
  ANIMAL_STATUS,
  ANIMAL_GENDER,
  VACCINATION_STATUS,
} from "../models/Animal.js";
import { INQUIRY_STATUS, VISIT_SLOTS } from "../models/Inquiry.js";

/* ---------------------------------------------------------------- */
/* Primitives                                                        */
/* ---------------------------------------------------------------- */

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

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
    typeof v === "boolean"
      ? v
      : ["true", "on", "1", "yes"].includes(String(v).toLowerCase())
  );

const optionalText = (max) =>
  z.string().trim().max(max).optional().or(z.literal("")).default("");

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
    z.union([z.null(), z.coerce.number().min(0).max(max)])
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

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Bangla name is required").max(80),
  nameEn: z.string().trim().min(1, "English name is required").max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain a-z, 0-9 and -")
    .max(80)
    .optional(),
  parent: objectId.nullable().optional(),
  icon: optionalText(40),
  image: optionalText(300),
  blurb: optionalText(240),
  order: z.coerce.number().int().min(0).max(999).default(0),
  isActive: booleanish.default(true),
});

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

export const animalSchema = z
  .object({
    title: z.string().trim().min(1, "শিরোনাম দিন").max(140),
    breed: z.string().trim().min(1, "Breed name is required").max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain a-z, 0-9 and -")
      .max(90)
      .optional(),

    category: objectId,
    subcategory: objectId.nullable().optional(),

    priceMin: optionalNumber(100000000),
    priceMax: optionalNumber(100000000),
    priceOnRequest: booleanish.default(false),

    status: z.enum(ANIMAL_STATUS).default("available"),
    gender: z.enum(ANIMAL_GENDER).default("unknown"),
    ageMonths: optionalNumber(600),

    color: optionalText(80),
    vaccination: z.enum(VACCINATION_STATUS).default("na"),
    vaccinationNote: optionalText(240),
    pedigree: optionalText(600),

    images: z.array(animalImageSchema).max(20).default([]),
    coverIndex: z.coerce.number().int().min(0).default(0),

    videoUrl: z
      .union([z.url({ message: "Enter a valid URL" }), z.literal("")])
      .optional()
      .default(""),

    description: optionalText(6000),
    careNotes: optionalText(2000),

    isFeatured: booleanish.default(false),
    isPublished: booleanish.default(true),
  })
  .refine((v) => v.coverIndex === 0 || v.coverIndex < v.images.length, {
    message: "Cover image index is out of range",
    path: ["coverIndex"],
  })
  .refine((v) => v.priceOnRequest || v.priceMin !== null, {
    message: "Set a price or mark it as price-on-request",
    path: ["priceMin"],
  });

/** Maps validated input onto the Mongoose document shape. */
export function toAnimalDoc(input) {
  const {
    priceMin,
    priceMax,
    priceOnRequest,
    subcategory,
    slug,
    ...rest
  } = input;

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
  visitDate: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now() - 86_400_000, {
      message: "ভবিষ্যতের তারিখ দিন",
    }),
  visitSlot: z.enum(VISIT_SLOTS),
});

export const inquirySchema = z.discriminatedUnion("kind", [
  generalInquirySchema,
  animalInquirySchema,
  visitInquirySchema,
]);

export const inquiryUpdateSchema = z.object({
  status: z.enum(INQUIRY_STATUS),
  adminNote: optionalText(1000),
});

/* ---------------------------------------------------------------- */
/* Public: showcase listing query                                    */
/* ---------------------------------------------------------------- */

export const ANIMAL_SORTS = [
  "newest",
  "price-asc",
  "price-desc",
  "age-asc",
  "age-desc",
];

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
