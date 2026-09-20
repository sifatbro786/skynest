import mongoose from "mongoose";
import { registerModel } from "./register.js";
import { uniqueSlug } from "../lib/slug.js";

const { Schema } = mongoose;

/**
 * Two levels only: a family (Dogs, Cats, Exotic Birds…) and its breeds
 * (German Shepherd, Girabaz…). Deeper nesting is rejected in pre-validate —
 * the showcase filter UI is built around exactly two levels.
 */
const CategorySchema = new Schema(
    {
        /** Bangla display name, e.g. "কুকুর" */
        name: { type: String, required: true, trim: true, maxlength: 80 },

        /** English name used for slugs and admin search, e.g. "Dogs" */
        nameEn: { type: String, required: true, trim: true, maxlength: 80 },

        slug: { type: String, required: true, lowercase: true, trim: true },

        parent: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            default: null,
            index: true,
        },

        /** lucide-react icon name — top-level families only */
        icon: { type: String, trim: true, default: "" },

        /** /uploads/categories/<file>.webp */
        image: { type: String, trim: true, default: "" },

        blurb: { type: String, trim: true, maxlength: 240, default: "" },

        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parent: 1, order: 1, name: 1 });
CategorySchema.index({ isActive: 1, parent: 1 });

CategorySchema.virtual("isFamily").get(function isFamily() {
    return this.parent === null || this.parent === undefined;
});

CategorySchema.pre("validate", async function normalise(next) {
    try {
        if (this.parent) {
            const parentDoc = await this.constructor.findById(this.parent).select("parent").lean();

            if (!parentDoc) {
                return next(new Error("Parent category does not exist."));
            }
            if (parentDoc.parent) {
                return next(new Error("Categories are limited to two levels (family → breed)."));
            }
            if (String(this._id) === String(this.parent)) {
                return next(new Error("A category cannot be its own parent."));
            }
        }

        // Only generate when there is no slug. Regenerating on a rename would
        // silently change a live public URL (/category/dogs → /category/hounds)
        // and break every link to it. An admin who wants a new slug sets one
        // explicitly; zod validates the shape and the unique index catches clashes.
        if (!this.slug) {
            this.slug = await uniqueSlug(this.constructor, this.nameEn || this.name, {
                excludeId: this._id,
            });
        }

        return next();
    } catch (err) {
        return next(err);
    }
});

CategorySchema.set("toJSON", { virtuals: true });
CategorySchema.set("toObject", { virtuals: true });

export default registerModel("Category", CategorySchema);
