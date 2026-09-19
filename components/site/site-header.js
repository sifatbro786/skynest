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
        <header className="sticky top-0 z-40 border-b border-line bg-paper">
            <div className="shell flex h-[var(--header-h)] items-center justify-between gap-6">
                <Link
                    href="/"
                    className="flex min-w-0 items-center gap-3"
                    aria-label={`${site.name} — হোম`}
                >
                    <Image
                        src={site.logo}
                        alt=""
                        width={96}
                        height={96}
                        priority
                        className="h-9 w-9 shrink-0 object-contain lg:h-10 lg:w-10"
                    />
                    <span className="min-w-0 leading-tight">
                        <span className="block truncate font-display text-[15px] text-ink lg:text-base">
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
                                        ? "border-brand text-ink"
                                        : "border-transparent text-ink-soft hover:border-line-strong hover:text-ink"
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
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:bg-linen-deep hover:text-ink"
                    >
                        <Phone size={18} strokeWidth={1.75} aria-hidden />
                    </a>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        aria-expanded={open}
                        aria-controls="site-menu"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:bg-linen-deep hover:text-ink"
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
                            className="absolute inset-0 bg-ink/40"
                        />

                        <motion.div
                            id="site-menu"
                            variants={panelVariants}
                            className="absolute inset-x-0 top-0 border-b border-line bg-paper pb-8"
                        >
                            <div className="shell flex h-[var(--header-h)] items-center justify-between">
                                <span className="font-display text-[15px] text-ink">
                                    {site.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    autoFocus
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:bg-linen-deep hover:text-ink"
                                >
                                    <X size={20} strokeWidth={1.75} aria-hidden />
                                    <span className="sr-only">মেনু বন্ধ করুন</span>
                                </button>
                            </div>

                            <nav aria-label="প্রধান মেনু" className="shell">
                                <ul className="divide-y divide-line border-t border-line">
                                    {NAV.map((item) => {
                                        const active = isActive(item.href);
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    aria-current={active ? "page" : undefined}
                                                    className={cn(
                                                        "flex min-h-14 items-center font-display text-title transition-colors",
                                                        active ? "text-brand" : "text-ink"
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
