/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    ExternalLink,
    FolderTree,
    Inbox,
    LayoutDashboard,
    Menu,
    PawPrint,
    Plus,
    X,
} from "lucide-react";
import { cn, formatCount } from "@/lib/utils";
import { site } from "@/lib/site";
import LogoutButton from "./logout-button";

const LINKS = [
    { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
    { href: "/admin/animals", label: "প্রাণী", icon: PawPrint },
    { href: "/admin/categories", label: "ক্যাটাগরি", icon: FolderTree },
    { href: "/admin/inquiries", label: "ইনকোয়ারি", icon: Inbox, badge: true },
];

/**
 * Fixed rail on lg+, off-canvas drawer below it.
 *
 * The drawer is an overlay rather than the old push-down accordion: on a phone
 * the accordion shifted the whole page down, so tapping a menu item moved the
 * content you were looking at. An overlay leaves the page where it was.
 */
export default function AdminNav({ admin, newInquiries = 0 }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // Route change closes the drawer; Escape closes it without reaching for the X.
    useEffect(() => setOpen(false), [pathname]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    const isActive = (link) =>
        link.exact ? pathname === link.href : pathname.startsWith(link.href);

    const panel = (
        <div className="flex h-full flex-col gap-6 bg-paper">
            <div className="flex items-center justify-between gap-3 px-4 pt-5">
                <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
                    <Image
                        src={site.logo}
                        alt=""
                        width={72}
                        height={72}
                        className="h-8 w-8 shrink-0 object-contain"
                    />
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold leading-tight text-ink">
                            {site.name}
                        </span>
                        <span className="block text-xs leading-tight text-ink-mute">
                            অ্যাডমিন প্যানেল
                        </span>
                    </span>
                </Link>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="pnl-btn pnl-btn-ghost pnl-btn-sm h-8 w-8 px-0 lg:hidden"
                >
                    <X size={16} strokeWidth={2} aria-hidden />
                    <span className="sr-only">মেনু বন্ধ করুন</span>
                </button>
            </div>

            <div className="px-3">
                <Link href="/admin/animals/new" className="pnl-btn pnl-btn-primary w-full">
                    <Plus size={15} strokeWidth={2} aria-hidden />
                    নতুন প্রাণী
                </Link>
            </div>

            <nav aria-label="অ্যাডমিন মেনু" className="flex-1 px-3">
                <ul className="space-y-1">
                    {LINKS.map((link) => {
                        const active = isActive(link);
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors",
                                        active
                                            ? "bg-brand-wash font-medium text-brand-deep"
                                            : "text-ink-soft hover:bg-linen-deep hover:text-ink",
                                    )}
                                >
                                    <link.icon
                                        size={16}
                                        strokeWidth={1.75}
                                        aria-hidden
                                        className={active ? "text-brand" : "text-ink-mute"}
                                    />
                                    <span className="flex-1 truncate">{link.label}</span>
                                    {link.badge && newInquiries > 0 ? (
                                        <span className="pnl-num inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-clay px-1.5 text-xs font-medium text-paper">
                                            {formatCount(newInquiries)}
                                        </span>
                                    ) : null}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="space-y-3 border-t border-line px-4 py-4">
                <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-ink-mute transition-colors hover:text-brand"
                >
                    পাবলিক সাইট দেখুন
                    <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
                </a>
                <p className="truncate text-xs text-ink-soft" title={admin.email}>
                    {admin.name || admin.email}
                </p>
                <LogoutButton />
            </div>
        </div>
    );

    return (
        <>
            {/* ---------- desktop rail ---------- */}
            <aside className="hidden w-60 shrink-0 border-r border-line lg:block">
                <div className="sticky top-0 h-dvh">{panel}</div>
            </aside>

            {/* ---------- mobile bar + drawer ---------- */}
            <div className="lg:hidden">
                <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-2.5">
                    <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
                        <Image
                            src={site.logo}
                            alt=""
                            width={72}
                            height={72}
                            className="h-7 w-7 shrink-0 object-contain"
                        />
                        <span className="truncate text-sm font-semibold text-ink">{site.name}</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        aria-expanded={open}
                        aria-controls="admin-drawer"
                        className="pnl-btn pnl-btn-ghost pnl-btn-sm relative h-9 w-9 px-0"
                    >
                        <Menu size={17} strokeWidth={1.75} aria-hidden />
                        {newInquiries > 0 ? (
                            <span
                                aria-hidden
                                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-clay"
                            />
                        ) : null}
                        <span className="sr-only">মেনু</span>
                    </button>
                </div>

                {open ? (
                    <div className="fixed inset-0 z-40">
                        <button
                            type="button"
                            aria-label="মেনু বন্ধ করুন"
                            onClick={() => setOpen(false)}
                            className="absolute inset-0 bg-ink/35"
                        />
                        <div
                            id="admin-drawer"
                            className="absolute inset-y-0 left-0 w-68 max-w-[85vw] border-r border-line shadow-lift"
                        >
                            {panel}
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}
