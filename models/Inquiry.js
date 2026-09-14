import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const INQUIRY_KINDS = ["general", "visit", "animal"];
export const INQUIRY_STATUS = ["new", "contacted", "scheduled", "closed"];
export const VISIT_SLOTS = ["morning", "afternoon", "evening"];

const InquirySchema = new Schema(
    {
        kind: { type: String, enum: INQUIRY_KINDS, required: true },

        name: { type: String, required: true, trim: true, maxlength: 80 },
        phone: { type: String, required: true, trim: true, maxlength: 20 },
        email: { type: String, trim: true, lowercase: true, default: "" },
        message: { type: String, trim: true, maxlength: 2000, default: "" },

        animal: { type: Schema.Types.ObjectId, ref: "Animal", default: null },
        /** Snapshot so the inbox stays readable after an animal is deleted */
        animalLabel: { type: String, trim: true, default: "" },

        visitDate: { type: Date, default: null },
        visitSlot: { type: String, enum: [...VISIT_SLOTS, null], default: null },

        status: { type: String, enum: INQUIRY_STATUS, default: "new" },
        adminNote: { type: String, trim: true, maxlength: 1000, default: "" },

        /** Page the form was submitted from — useful for attribution */
        source: { type: String, trim: true, maxlength: 200, default: "" },
        userAgent: { type: String, trim: true, maxlength: 200, default: "" },
    },
    { timestamps: true },
);

// Inbox: newest open items first
InquirySchema.index({ status: 1, createdAt: -1 });
// Dedup / lookup by caller
InquirySchema.index({ phone: 1, createdAt: -1 });
// "Who asked about this animal"
InquirySchema.index({ animal: 1, createdAt: -1 });
// Upcoming farm visits
InquirySchema.index({ kind: 1, visitDate: 1 });

export default models.Inquiry || model("Inquiry", InquirySchema);
