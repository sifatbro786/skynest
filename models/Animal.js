import mongoose from "mongoose";
import { uniqueSlug } from "../lib/slug.js";

const { Schema, model, models } = mongoose;

export const ANIMAL_STATUS = ["available", "reserved", "sold"];
export const ANIMAL_GENDER = ["male", "female", "pair", "unknown"];
export const VACCINATION_STATUS = ["done", "partial", "pending", "na"];

/**
 * Media lives on the VPS disk. Only the relative path is stored
 * (e.g. /uploads/animals/persian-cat-01.webp) — intrinsic dimensions are kept
 * so next/image can reserve layout space without a filesystem probe.
 */
const ImageSchema = new Schema(
    {
        path: { type: String, required: true, trim: true },
        alt: { type: String, trim: true, default: "" },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        /** ~300 byte inline WebP for next/image blurDataURL */
        blur: { type: String, default: "" },
    },
    { _id: false },
);

const AnimalSchema = new Schema(
    {
        /** Bangla display title */
        title: { type: String, required: true, trim: true, maxlength: 140 },

        /** English breed / subtitle — also the slug source */
        breed: { type: String, required: true, trim: true, maxlength: 120 },

        slug: { type: String, required: true, lowercase: true, trim: true },

        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        subcategory: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },

        price: {
            min: { type: Number, min: 0, default: null },
            max: { type: Number, min: 0, default: null },
            onRequest: { type: Boolean, default: false },
        },

        status: { type: String, enum: ANIMAL_STATUS, default: "available" },
        gender: { type: String, enum: ANIMAL_GENDER, default: "unknown" },

        /** Stored in months; rendered as "২ বছর ৩ মাস" */
        ageMonths: { type: Number, min: 0, max: 600, default: null },

        /** Colour or mutation, e.g. "Blue Opaline", "কালো-সাদা" */
        color: { type: String, trim: true, maxlength: 80, default: "" },

        vaccination: { type: String, enum: VACCINATION_STATUS, default: "na" },
        vaccinationNote: { type: String, trim: true, maxlength: 240, default: "" },

        pedigree: { type: String, trim: true, maxlength: 600, default: "" },

        images: { type: [ImageSchema], default: [] },
        /** Index into `images` used as the cover. Clamped in pre-validate. */
        coverIndex: { type: Number, default: 0, min: 0 },

        videoUrl: { type: String, trim: true, default: "" },

        description: { type: String, trim: true, maxlength: 6000, default: "" },
        careNotes: { type: String, trim: true, maxlength: 2000, default: "" },

        isFeatured: { type: Boolean, default: false },
        isPublished: { type: Boolean, default: true },
        publishedAt: { type: Date, default: null },

        views: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true },
);

/* ---------------------------------------------------------------- */
/* Indexes — shaped around the three real read paths                 */
/* ---------------------------------------------------------------- */

AnimalSchema.index({ slug: 1 }, { unique: true });

// Showcase listing: published + optional category + optional status, newest first
AnimalSchema.index({ isPublished: 1, category: 1, status: 1, createdAt: -1 });

// Home page featured rail
AnimalSchema.index({ isPublished: 1, isFeatured: 1, createdAt: -1 });

// Breed-level filtering
AnimalSchema.index({ isPublished: 1, subcategory: 1, createdAt: -1 });

// Sort-by controls
AnimalSchema.index({ isPublished: 1, "price.min": 1 });
AnimalSchema.index({ isPublished: 1, ageMonths: 1 });

// Search. default_language "none" so the English stemmer does not mangle
// Bangla tokens; Mongo allows exactly one text index per collection.
AnimalSchema.index(
    { title: "text", breed: "text", color: "text", description: "text" },
    {
        name: "animal_search",
        default_language: "none",
        weights: { title: 10, breed: 8, color: 4, description: 1 },
    },
);

/* ---------------------------------------------------------------- */

AnimalSchema.virtual("cover").get(function cover() {
    if (!this.images || this.images.length === 0) return null;
    return this.images[Math.min(this.coverIndex || 0, this.images.length - 1)];
});

AnimalSchema.virtual("isSold").get(function isSold() {
    return this.status === "sold";
});

AnimalSchema.pre("validate", async function normalise(next) {
    try {
        if (!this.slug) {
            this.slug = await uniqueSlug(this.constructor, this.breed || this.title, {
                excludeId: this._id,
            });
        }

        // Keep the cover pointer inside the array after image removals.
        const count = this.images?.length ?? 0;
        if (count === 0) this.coverIndex = 0;
        else if (this.coverIndex > count - 1) this.coverIndex = count - 1;

        // A price range stored backwards silently breaks the sort index.
        const { min, max } = this.price ?? {};
        if (min != null && max != null && max < min) {
            this.price.max = min;
            this.price.min = max;
        }

        if (this.isPublished && !this.publishedAt) this.publishedAt = new Date();
        if (!this.isPublished) this.publishedAt = null;

        return next();
    } catch (err) {
        return next(err);
    }
});

AnimalSchema.set("toJSON", { virtuals: true });
AnimalSchema.set("toObject", { virtuals: true });

export default models.Animal || model("Animal", AnimalSchema);
