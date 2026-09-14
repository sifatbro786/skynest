/**
 * Single source of truth for brand / contact details.
 * Anything a client might want to change without a code review lives here,
 * backed by env so staging and production can differ.
 */

const raw = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  phone: process.env.NEXT_PUBLIC_PHONE || "+8801XXXXXXXXX",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "8801XXXXXXXXX",
  email: process.env.NEXT_PUBLIC_EMAIL || "hello@skynestrobiul.com",
};

export const site = {
  name: "Skynest Robiul",
  tagline: "শখের সেরা কালেকশন",
  description:
    "দুর্লভ ও প্রিমিয়াম পাখি, ফ্যান্সি হাঁস-মুরগি, পেডিগ্রি বিড়াল ও কুকুরের এক্সক্লুসিভ কালেকশন। সরাসরি ফার্মে এসে দেখে নেওয়ার সুবিধা।",

  url: raw.url,
  email: raw.email,

  /** Display form, e.g. +880 1XXX-XXXXXX */
  phone: raw.phone,
  /** Digits only, country code included — required by wa.me */
  whatsapp: raw.whatsapp.replace(/\D/g, ""),

  address: {
    line: process.env.NEXT_PUBLIC_ADDRESS_LINE || "ঢাকা, বাংলাদেশ",
    mapUrl: process.env.NEXT_PUBLIC_MAP_URL || "",
  },

  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK || "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE || "",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM || "",
  },
};

/**
 * Build a wa.me deep link with a pre-filled Bangla message.
 * @param {string} [message]
 */
export function whatsappLink(message) {
  const base = `https://wa.me/${site.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink() {
  return `tel:${site.phone.replace(/[^\d+]/g, "")}`;
}
