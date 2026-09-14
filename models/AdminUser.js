import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const ADMIN_ROLES = ["owner", "editor"];

const AdminUserSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 120,
        },

        /** Never returned by default — must be explicitly selected. */
        passwordHash: { type: String, required: true, select: false },

        name: { type: String, trim: true, maxlength: 80, default: "" },
        role: { type: String, enum: ADMIN_ROLES, default: "owner" },
        isActive: { type: Boolean, default: true },

        /**
         * Bumping this invalidates every issued JWT for the user — used on
         * password change and on "sign out everywhere".
         */
        tokenVersion: { type: Number, default: 0 },

        lastLoginAt: { type: Date, default: null },

        /** Login throttling state (see Phase 4). */
        failedAttempts: { type: Number, default: 0 },
        lockedUntil: { type: Date, default: null },
    },
    { timestamps: true },
);

AdminUserSchema.index({ email: 1 }, { unique: true });

AdminUserSchema.methods.isLocked = function isLocked() {
    return Boolean(this.lockedUntil && this.lockedUntil.getTime() > Date.now());
};

export default models.AdminUser || model("AdminUser", AdminUserSchema);
