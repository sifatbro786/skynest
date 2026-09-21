import mongoose from "mongoose";
import { registerModel } from "./register.js";

const { Schema } = mongoose;

/**
 * Per-route SEO overrides, one document per page.
 *
 * Deliberately an OVERRIDE layer and never the source of truth. Every public
 * page still ships a complete set of metadata in code; a row here replaces
 * individual fields on top of that. Three consequences worth keeping:
 *
 *  · An empty string means "not set", not "set to empty". A blank title falls
 *    through to the page's own default rather than publishing an empty
 *    `<title>`. `lib/seo.js` treats "" and undefined identically.
 *  · Deleting the whole collection returns the site to its code defaults with
 *    no page left broken, which is what makes this safe to hand to a
 *    non-technical owner.
 *  · If Mongo is unreachable, `resolveSeo()` returns the code defaults rather
 *    than throwing. Metadata must never be the reason a page 500s.
 *
 * `path` is the key and it is a ROUTE, not a URL: "/", "/showcase", "/about".
 * The single reserved value is `SEO_SITE_KEY` ("*"), which holds the
 * site-wide defaults every page inherits from. The set of allowed values is
 * closed — see SEO_PATHS in lib/seo.js — so a typo cannot create an orphan
 * row that is written to but never read.
 *
 * Dynamic routes (/showcase/[slug], /category/[slug]) are NOT stored here.
 * Their metadata is derived from the animal or category itself, which is
 * always more accurate than anything typed once and left to rot; they inherit
 * the site defaults below and nothing else.
 */
const SeoMetaSchema = new Schema(
    {
        path: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },

        /** Replaces the page's `<title>` verbatim — see the note in lib/seo.js
         *  about why an override bypasses the root layout's title template. */
        title: { type: String, trim: true, maxlength: 120, default: "" },

        description: { type: String, trim: true, maxlength: 400, default: "" },

        /** Absolute URL, or a site-relative path starting with "/". */
        canonical: { type: String, trim: true, maxlength: 400, default: "" },

        /** Kept because it was asked for. Google dropped it as a ranking
         *  signal in 2009 and Bing treats it as a spam signal when stuffed;
         *  the admin form says so rather than implying it does something. */
        keywords: { type: [String], default: [] },

        /** /uploads/seo/<file>.webp — the og:image and twitter:image. */
        ogImage: { type: String, trim: true, maxlength: 400, default: "" },

        noindex: { type: Boolean, default: false },
        nofollow: { type: Boolean, default: false },

        updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", default: null },
    },
    { timestamps: true },
);

SeoMetaSchema.index({ path: 1 }, { unique: true });

export default registerModel("SeoMeta", SeoMetaSchema);
