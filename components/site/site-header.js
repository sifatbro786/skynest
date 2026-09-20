"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { site, telLink } from "@/lib/site";
import { Button } from "./ui";
import { motion, overlayVariants, panelVariants } from "./motion";

const NAV = [
    { href: "/showcase", label: "কালেকশন" },
    { href: "/about", label: "আমাদের সম্পর্কে" },
    { href: "/contact", label: "যোগাযোগ" },
];

/**
 * Sticky site header.
 *
 * Asymmetric rather than centred: wordmark hard left, navigation and the
 * single CTA pushed right, nothing in the middle. The PRD bans the
 * centred-logo-with-nav-either-side arrangement, and it is also the layout
 * that forces a Bangla wordmark to compete with its own nav for space.
 *
 * Phase 10 put it on ink. On the homepage that is the same ground as the
 * hero directly below, so the two merge into one dark block — the page opens
 * with a statement rather than with a chrome bar sitting on top of one. On
 * every other page it bookends with the footer, which is the same ground.
 *
 * The colour work is all in `.on-ink` (globals.css): it rebinds `--color-ink`,
 * `--color-ink-soft`, `--color-line`, `--color-field` and `--color-brand`, so
 * the utilities below are the light-ground ones and resolve to their dark
 * values automatically. Two consequences worth knowing before editing:
 *
 *  · `text-brand` here IS `--color-brand-on-ink`. Do not "fix" it — the raw
 *    brand blue is 2.6:1 on this ground.
 *  · `bg-ink` would resolve to LINEN inside this component. The overlay scrim
 *    below therefore uses `bg-black/60`, which is not a style choice.
 *
 * The mobile menu is a real overlay with Escape, a close button and a scroll
 * lock, not a disclosure that pushes the page down.
 */
export default function SiteHeader() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => setOpen(false), [pathname]);

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", onKey);

        // Stop the page behind the overlay from scrolling under the finger.
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, [open]);

    const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <header className="on-ink sticky top-0 z-40 border-b border-white/10 bg-ink-band">
            <div className="shell flex h-[var(--header-h)] items-center justify-between gap-6">
                <Link
                    href="/"
                    className="flex min-w-0 items-center gap-3"
                    aria-label={`${site.name} — হোম`}
                >
                    {/* `rounded-full` is load-bearing here. The brand mark moved
                        from a transparent PNG to logo.jpg, and a JPEG has no alpha —
                        on this ink header the file's white ground rendered as a white
                        SQUARE around a circular logo. Clipping to a circle discards
                        that ground and the mark reads as a coin. Remove this only if
                        the logo goes back to a transparent PNG. */}
                    <Image
                        src={site.logo}
                        alt=""
                        width={96}
                        height={96}
                        priority
                        className="h-9 w-9 shrink-0 rounded-full object-cover lg:h-10 lg:w-10"
                    />
                    <span className="min-w-0 leading-tight">
                        <span className="block truncate font-display text-[15px] text-linen lg:text-base">
                            {site.name}
                        </span>
                        <span className="text-micro hidden uppercase text-ink-mute sm:block">
                            {site.taglineEn}
                        </span>
                    </span>
                </Link>

                {/* ---------- desktop ---------- */}
                <nav aria-label="প্রধান মেনু" className="hidden items-center gap-8 lg:flex">
                    {NAV.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "border-b py-1 text-sm transition-colors",
                                    active
                                        ? "border-brand text-linen"
                                        : "border-transparent text-linen/70 hover:border-white/30 hover:text-linen"
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                    {/* No height override: `lg:` includes touch tablets, so this
                        stays at the primitive's 44px minimum. */}
                    <Button href="/contact" className="px-5">
                        ফার্ম ভিজিটের সময় নিন
                    </Button>
                </nav>

                {/* ---------- mobile ---------- */}
                <div className="flex items-center gap-1 lg:hidden">
                    <a
                        href={telLink()}
                        aria-label="ফোন করুন"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xs text-linen/75 transition-colors hover:bg-white/10 hover:text-linen"
                    >
                        <Phone size={18} strokeWidth={1.75} aria-hidden />
                    </a>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        aria-expanded={open}
                        aria-controls="site-menu"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xs text-linen/75 transition-colors hover:bg-white/10 hover:text-linen"
                    >
                        <Menu size={20} strokeWidth={1.75} aria-hidden />
                        <span className="sr-only">মেনু খুলুন</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {open ? (
                    <motion.div
                        key="menu"
                        className="fixed inset-0 z-50 lg:hidden"
                        initial="hidden"
                        animate="shown"
                        exit="hidden"
                        variants={overlayVariants}
                    >
                        <button
                            type="button"
                            aria-label="মেনু বন্ধ করুন"
                            onClick={() => setOpen(false)}
                            className="absolute inset-0 bg-black/60"
                        />

                        <motion.div
                            id="site-menu"
                            variants={panelVariants}
                            className="absolute inset-x-0 top-0 border-b border-white/10 bg-ink-band pb-8"
                        >
                            <div className="shell flex h-[var(--header-h)] items-center justify-between">
                                <span className="font-display text-[15px] text-linen">
                                    {site.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    autoFocus
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xs text-linen/75 transition-colors hover:bg-white/10 hover:text-linen"
                                >
                                    <X size={20} strokeWidth={1.75} aria-hidden />
                                    <span className="sr-only">মেনু বন্ধ করুন</span>
                                </button>
                            </div>

                            <nav aria-label="প্রধান মেনু" className="shell">
                                <ul className="divide-y divide-white/10 border-t border-white/10">
                                    {NAV.map((item) => {
                                        const active = isActive(item.href);
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    aria-current={active ? "page" : undefined}
                                                    className={cn(
                                                        "flex min-h-14 items-center font-display text-title transition-colors",
                                                        active ? "text-brand" : "text-linen"
                                                    )}
                                                >
                                                    {item.label}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <Button href="/contact" className="mt-7 w-full">
                                    ফার্ম ভিজিটের সময় নিন
                                </Button>
                            </nav>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </header>
    );
}
