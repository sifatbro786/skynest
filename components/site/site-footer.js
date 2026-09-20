import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { site, telLink, whatsappLink } from "@/lib/site";

const EXPLORE = [
    { href: "/showcase", label: "সম্পূর্ণ কালেকশন" },
    { href: "/about", label: "আমাদের সম্পর্কে" },
    { href: "/contact", label: "যোগাযোগ ও ভিজিট" },
];

const LEGAL = [
    { href: "/terms", label: "শর্তাবলি" },
    { href: "/privacy", label: "গোপনীয়তা নীতি" },
];

const SOCIAL = [
    { key: "facebook", label: "Facebook", icon: Facebook },
    { key: "youtube", label: "YouTube", icon: Youtube },
    { key: "instagram", label: "Instagram", icon: Instagram },
];

/**
 * Site footer.
 *
 * A 5/3/4 grid rather than three equal columns — the PRD rules out the
 * symmetric three-card arrangement, and the brand block genuinely needs more
 * room than a list of four links.
 *
 * Phase 10 put it on ink, closing the bracket the header opens. On the
 * homepage the band above it is ink too, so the CTA and the footer read as
 * one closing block instead of as a band resting on a footer.
 *
 * The colour work is all in `.on-ink` (globals.css), which rebinds
 * `--color-ink`, `--color-ink-soft`, `--color-ink-mute`, `--color-line` and
 * `--color-brand` — so every utility below is still the light-ground one and
 * resolves to its dark value by itself. That is why converting this file was
 * three lines and not ninety. Note that `text-brand` here IS
 * `--color-brand-on-ink`; the raw brand blue is 2.6:1 on this ground.
 *
 * `relative isolate` on the root is not decoration. The woven texture is a
 * `::before` at `z-index: -1`, and a negative-z child paints BEHIND its
 * parent's own background unless that parent establishes a stacking context —
 * so without `isolate` the weave is simply invisible, with no error anywhere
 * to say why. `.band` carries both for the same reason; the footer is not a
 * band, so it carries them itself.
 *
 * The oversized wordmark at the bottom is `aria-hidden` and clipped by the
 * footer's own `overflow-hidden`. It is the page's full stop — the thing that
 * makes the scroll end rather than merely stop — and it carries no
 * information the name above it has not already given.
 *
 * The bottom padding is not a round number: it reserves `--actionbar-h` plus
 * the iOS safe area so the last row of the footer is never sitting under the
 * fixed action bar on a phone.
 */
export default function SiteFooter() {
    const social = SOCIAL.filter((s) => site.social[s.key]);

    return (
        <footer className="on-ink weave relative isolate mt-auto overflow-hidden border-t border-white/10 bg-ink-band">
            <div className="shell pb-[calc(var(--actionbar-h)+2rem+env(safe-area-inset-bottom))] pt-14 lg:pb-14">
                <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12">
                    {/* ---------- brand ---------- */}
                    <div className="lg:col-span-5">
                        <div className="flex items-center gap-3">
                            <Image
                                src={site.logo}
                                alt=""
                                width={96}
                                height={96}
                                className="h-11 w-11 shrink-0 object-contain"
                            />
                            <span className="leading-tight">
                                <span className="block font-display text-base text-linen">
                                    {site.name}
                                </span>
                                <span className="text-micro block uppercase text-ink-mute">
                                    {site.taglineEn}
                                </span>
                            </span>
                        </div>

                        <p className="measure mt-6 text-sm leading-relaxed text-ink-soft">
                            {site.description}
                        </p>

                        {social.length > 0 ? (
                            <ul className="mt-7 flex items-center gap-2">
                                {social.map((s) => (
                                    <li key={s.key}>
                                        <a
                                            href={site.social[s.key]}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={s.label}
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-xs border border-white/20 text-ink-soft transition-colors hover:border-linen hover:bg-white/8 hover:text-linen"
                                        >
                                            <s.icon size={17} strokeWidth={1.6} aria-hidden />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>

                    {/* ---------- explore ---------- */}
                    <nav aria-label="ফুটার মেনু" className="lg:col-span-3">
                        <h2 className="text-micro uppercase text-ink-mute">ঘুরে দেখুন</h2>
                        <ul className="mt-5 space-y-3.5">
                            {EXPLORE.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-ink-soft transition-colors hover:text-brand"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* ---------- contact ---------- */}
                    <div className="lg:col-span-4">
                        <h2 className="text-micro uppercase text-ink-mute">যোগাযোগ</h2>
                        <ul className="mt-5 space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <Phone
                                    size={16}
                                    strokeWidth={1.6}
                                    aria-hidden
                                    className="mt-0.5 shrink-0 text-ink-mute"
                                />
                                <span>
                                    <a
                                        href={telLink()}
                                        className="tnum text-linen transition-colors hover:text-brand"
                                    >
                                        {site.phone}
                                    </a>
                                    <a
                                        href={whatsappLink(
                                            `আসসালামু আলাইকুম। ${site.name}-এর কালেকশন সম্পর্কে জানতে চাই।`
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 block text-xs text-ink-mute transition-colors hover:text-brand"
                                    >
                                        WhatsApp-এ বার্তা দিন
                                    </a>
                                </span>
                            </li>

                            <li className="flex items-start gap-3">
                                <MapPin
                                    size={16}
                                    strokeWidth={1.6}
                                    aria-hidden
                                    className="mt-0.5 shrink-0 text-ink-mute"
                                />
                                <span className="text-ink-soft">
                                    {site.address.line}
                                    <span className="mt-0.5 block text-xs text-ink-mute">
                                        {site.address.lineEn}
                                    </span>
                                    {site.address.mapUrl ? (
                                        <a
                                            href={site.address.mapUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="link-quiet mt-1.5 inline-block text-xs"
                                        >
                                            ম্যাপে দেখুন
                                        </a>
                                    ) : null}
                                </span>
                            </li>

                            {site.email ? (
                                <li className="flex items-start gap-3">
                                    <Mail
                                        size={16}
                                        strokeWidth={1.6}
                                        aria-hidden
                                        className="mt-0.5 shrink-0 text-ink-mute"
                                    />
                                    <a
                                        href={`mailto:${site.email}`}
                                        className="wrap-anywhere text-ink-soft transition-colors hover:text-brand"
                                    >
                                        {site.email}
                                    </a>
                                </li>
                            ) : null}
                        </ul>
                    </div>
                </div>

                {/* Legal strip. Separate from the explore nav above on
                    purpose — terms and privacy are obligations, not places
                    anyone is being invited to browse, and mixing them into
                    the same list makes both harder to scan. */}
                <div className="mt-14 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-white/10 pt-6 text-xs text-ink-mute">
                    <p className="tnum">
                        © {new Date().getFullYear()} {site.name}
                        <span className="ml-3 hidden sm:inline">
                            স্বত্বাধিকারী — {site.owner}
                        </span>
                    </p>

                    <nav aria-label="নীতিমালা">
                        {/* min-h-6 + gap-6, not bare 12px text: WCAG 2.5.8
                            wants a 24px target on a standalone link, and two
                            of them sitting 16px apart fails it on a phone. */}
                        <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
                            {LEGAL.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="inline-flex min-h-6 items-center transition-colors hover:text-linen"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <p className="sm:hidden">স্বত্বাধিকারী — {site.owner}</p>
                </div>
            </div>

            {/* The page's full stop. `select-none` so a drag-select of the
                legal line above does not pick up a 20vw decorative word, and
                `-mb-[0.18em]` crops the descender-free cap line flush to the
                bottom edge rather than leaving a band of empty leading. */}
            {/* <p
                aria-hidden
                className="shell -mb-[0.18em] select-none font-display text-[22vw] leading-[0.78] tracking-[-0.04em] text-white/[0.05] lg:text-[15vw]"
            >
                SkyNest
            </p> */}
        </footer>
    );
}
