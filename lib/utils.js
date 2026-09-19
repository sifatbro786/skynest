import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/* Slugs                                                               */
/* ------------------------------------------------------------------ */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/**
 * Titles are Bangla-first, and Bangla characters do not survive a Latin
 * slugifier. Strategy: keep Latin/digit runs, drop everything else, and fall
 * back to a short random token so a fully-Bangla title still gets a usable,
 * stable URL (the model keeps it unique).
 *
 * @param {string} input
 * @returns {string}
 */
export function toSlug(input) {
    const base = String(input || "")
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 70)
        .replace(/-$/, "");

    return base || `item-${randomToken(6)}`;
}

export function randomToken(length = 8) {
    const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i += 1) {
        out += alphabet[bytes[i] % alphabet.length];
    }
    return out;
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/**
 * @param {number|null|undefined} amount
 * @param {{ bangla?: boolean }} [opts]
 */
export function formatBDT(amount, opts = {}) {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
        return "মূল্য জানতে যোগাযোগ করুন";
    }
    const formatted = new Intl.NumberFormat(opts.bangla ? "bn-BD" : "en-IN", {
        maximumFractionDigits: 0,
    }).format(Number(amount));
    return `৳ ${formatted}`;
}

/**
 * Price range display. Falls back to a single value or the "ask" copy.
 */
export function formatPriceRange(min, max, opts = {}) {
    const hasMin = min !== null && min !== undefined && min !== "";
    const hasMax = max !== null && max !== undefined && max !== "";

    if (hasMin && hasMax && Number(min) !== Number(max)) {
        return `${formatBDT(min, opts)} – ${formatBDT(max, opts)}`;
    }
    if (hasMin) return formatBDT(min, opts);
    if (hasMax) return formatBDT(max, opts);
    return formatBDT(null);
}

/**
 * Age is stored in months. Rendered Bangla-first: "২ বছর ৩ মাস".
 *
 * `{ latin: true }` keeps the Bangla words but switches the figures to Latin
 * digits — the admin panel reads numbers far more than it reads them aloud.
 *
 * @param {number|null|undefined} months
 * @param {{ latin?: boolean }} [opts]
 */
export function formatAge(months, opts = {}) {
    const value = Number(months);
    if (!Number.isFinite(value) || value < 0) return "—";

    const digits = opts.latin ? (n) => String(n) : toBanglaDigits;
    const years = Math.floor(value / 12);
    const rest = value % 12;

    const parts = [];
    if (years > 0) parts.push(`${digits(years)} বছর`);
    if (rest > 0 || years === 0) parts.push(`${digits(rest)} মাস`);
    return parts.join(" ");
}

/**
 * Bangla date. The timezone is pinned to Asia/Dhaka on purpose — the VPS runs
 * in UTC, so an unpinned formatter renders a different day on the server than
 * in the browser for anything after 6pm local.
 */
export function formatDate(value, opts = {}) {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("bn-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Dhaka",
        ...opts,
    }).format(date);
}

/**
 * Admin-side date: Bangla month name, Latin figures — "19 সেপ্টেম্বর 2026".
 *
 * The `-u-nu-latn` extension swaps only the numbering system, so the copy
 * stays Bangla while dates, counts and prices line up in a column. Timezone
 * is pinned for the same reason as `formatDate`.
 */
export function formatDateLatin(value, opts = {}) {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("bn-BD-u-nu-latn", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Dhaka",
        ...opts,
    }).format(date);
}

/** Latin-digit count with thousands separators, for admin tables. */
export function formatCount(value) {
    const n = Number(value);
    return Number.isFinite(n) ? new Intl.NumberFormat("en-US").format(n) : "0";
}

export const VISIT_SLOT_LABELS = {
    morning: "সকাল",
    afternoon: "দুপুর",
    evening: "বিকেল",
};

export function toBanglaDigits(value) {
    return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

/** Strip anything that could escape the uploads directory. */
export function safeFileStem(name) {
    return (
        String(name || "")
            .replace(/\.[^.]+$/, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 48) || "media"
    );
}

/**
 * Sanitises a post-login `?next=` destination.
 *
 * `//evil.com` is a protocol-relative URL that browsers treat as absolute, so
 * a `startsWith("/")` check alone is an open redirect. Backslashes are
 * normalised to slashes by some browsers, so those are rejected too.
 *
 * @param {unknown} value
 * @returns {string} a safe same-site admin path
 */
export function safeAdminPath(value) {
    const raw = typeof value === "string" ? value : "";

    // Must be the admin root or a path beneath it — "/adminevil" is not.
    if (raw !== "/admin" && !raw.startsWith("/admin/")) return "/admin";

    if (raw.startsWith("//") || raw.includes("\\")) return "/admin";
    if (raw.includes("://")) return "/admin";
    // ".." normalises out of /admin once the router resolves it.
    if (raw.includes("..")) return "/admin";
    if (raw.startsWith("/admin/login")) return "/admin";

    return raw;
}

export function truncate(text, max = 160) {
    const value = String(text || "").trim();
    if (value.length <= max) return value;
    return `${value.slice(0, max - 1).trimEnd()}…`;
}
