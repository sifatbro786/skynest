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
 * @param {number|null|undefined} months
 */
export function formatAge(months) {
  const value = Number(months);
  if (!Number.isFinite(value) || value < 0) return "—";

  const years = Math.floor(value / 12);
  const rest = value % 12;

  const parts = [];
  if (years > 0) parts.push(`${toBanglaDigits(years)} বছর`);
  if (rest > 0 || years === 0) parts.push(`${toBanglaDigits(rest)} মাস`);
  return parts.join(" ");
}

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

export function truncate(text, max = 160) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}
