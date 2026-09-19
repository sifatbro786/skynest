"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const GENDER = [
    ["all", "সব"],
    ["male", "পুরুষ"],
    ["female", "মহিলা"],
    ["pair", "জোড়া"],
];

const STATUS = [
    ["all", "সব"],
    ["available", "পাওয়া যাচ্ছে"],
    ["reserved", "বুকড"],
    ["sold", "বিক্রি হয়েছে"],
];

const SORT = [
    ["newest", "নতুন আগে"],
    ["price-asc", "দাম কম আগে"],
    ["price-desc", "দাম বেশি আগে"],
    ["age-asc", "বয়সে ছোট আগে"],
    ["age-desc", "বয়সে বড় আগে"],
];

/**
 * Filter rail for `/showcase`.
 *
 * A left rail on desktop, a collapsible panel on phones. The phone behaviour
 * is the reason this is not simply a narrow column: stacked vertically, the
 * full filter set is taller than a phone screen, so leaving it open would push
 * the first animal below the fold on the page whose entire job is showing
 * animals. Collapsed by default, and the trigger carries a count so the state
 * is visible without opening it.
 *
 * Categories and breeds stay as a vertical list rather than a `<select>`: the
 * family being browsed is the most important piece of state on the page, and a
 * collapsed control hides it.
 *
 * Everything writes to the URL, so the listing stays shareable, the back
 * button works, and the server keeps sole ownership of the query — there is no
 * second copy of the filter logic here to drift from
 * `buildPublicAnimalFilter`.
 */
export default function ShowcaseFilters({ categories, current, className }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [q, setQ] = useState(current.q ?? "");
    const [open, setOpen] = useState(false);

    const families = categories.filter((c) => !c.parent);
    const activeFamily = families.find((f) => f.slug === current.category);
    const breeds = activeFamily
        ? categories.filter((c) => c.parent === activeFamily.id)
        : [];

    function apply(patch) {
        const next = { ...current, ...patch, page: 1 };
        const sp = new URLSearchParams();

        for (const [key, value] of Object.entries(next)) {
            if (value === "" || value === null || value === undefined) continue;
            if (key === "limit") continue;
            if (key === "page" && Number(value) === 1) continue;
            if ((key === "status" || key === "gender") && value === "all") continue;
            if (key === "sort" && value === "newest") continue;
            sp.set(key, String(value));
        }

        const qs = sp.toString();
        startTransition(() => router.push(qs ? `/showcase?${qs}` : "/showcase"));
    }

    const activeCount =
        ((current.q ?? "") !== "" ? 1 : 0) +
        (current.category !== "" ? 1 : 0) +
        (current.subcategory !== "" ? 1 : 0) +
        (current.status !== "all" ? 1 : 0) +
        (current.gender !== "all" ? 1 : 0);

    const body = (
        <div className="space-y-7">
            {/* ---------- search ---------- */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    apply({ q });
                }}
            >
                <label htmlFor="sc-q" className="text-micro block uppercase text-ink-mute">
                    খুঁজুন
                </label>
                <div className="relative mt-2.5">
                    <Search
                        size={16}
                        strokeWidth={1.75}
                        aria-hidden
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute"
                    />
                    <input
                        id="sc-q"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="নাম, ব্রিড বা রং"
                        className="h-11 w-full rounded-xs border border-field bg-paper pl-9 pr-10 text-sm text-ink placeholder:text-ink-mute/70 focus:border-brand focus:outline-none"
                    />
                    {q ? (
                        <button
                            type="button"
                            onClick={() => {
                                setQ("");
                                apply({ q: "" });
                            }}
                            aria-label="খোঁজা মুছুন"
                            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xs text-ink-mute hover:bg-linen-deep hover:text-ink"
                        >
                            <X size={15} strokeWidth={2} aria-hidden />
                        </button>
                    ) : null}
                </div>
                <button type="submit" className="sr-only">
                    খুঁজুন
                </button>
            </form>

            {/* ---------- families ---------- */}
            <div>
                <p className="text-micro uppercase text-ink-mute">ক্যাটাগরি</p>
                <ul className="mt-2.5 divide-y divide-line border-y border-line">
                    <RowItem
                        active={current.category === ""}
                        onClick={() => apply({ category: "", subcategory: "" })}
                    >
                        সব ক্যাটাগরি
                    </RowItem>
                    {families.map((f) => (
                        <RowItem
                            key={f.id}
                            active={current.category === f.slug}
                            onClick={() => apply({ category: f.slug, subcategory: "" })}
                        >
                            {f.name}
                        </RowItem>
                    ))}
                </ul>
            </div>

            {/* ---------- breeds of the active family ---------- */}
            {breeds.length > 0 ? (
                <div>
                    <p className="text-micro uppercase text-ink-mute">ব্রিড</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                        <Chip
                            active={current.subcategory === ""}
                            onClick={() => apply({ subcategory: "" })}
                        >
                            সব
                        </Chip>
                        {breeds.map((b) => (
                            <Chip
                                key={b.id}
                                active={current.subcategory === b.slug}
                                onClick={() => apply({ subcategory: b.slug })}
                            >
                                {b.name}
                            </Chip>
                        ))}
                    </div>
                </div>
            ) : null}

            <Select
                id="sc-status"
                label="অবস্থা"
                value={current.status}
                onChange={(v) => apply({ status: v })}
                options={STATUS}
            />
            <Select
                id="sc-gender"
                label="লিঙ্গ"
                value={current.gender}
                onChange={(v) => apply({ gender: v })}
                options={GENDER}
            />
            <Select
                id="sc-sort"
                label="সাজান"
                value={current.sort}
                onChange={(v) => apply({ sort: v })}
                options={SORT}
            />

            {activeCount > 0 ? (
                <button
                    type="button"
                    onClick={() => {
                        setQ("");
                        startTransition(() => router.push("/showcase"));
                    }}
                    className="link-quiet text-sm"
                >
                    সব ফিল্টার সরান
                </button>
            ) : null}

            {pending ? (
                <span
                    aria-live="polite"
                    className="flex items-center gap-2 text-xs text-ink-mute"
                >
                    <LoaderCircle size={13} className="animate-spin" aria-hidden />
                    খোঁজা হচ্ছে…
                </span>
            ) : null}
        </div>
    );

    return (
        <div className={className}>
            {/* ---------- phone trigger ---------- */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="showcase-filters"
                className="btn-line w-full justify-between lg:hidden"
            >
                <span className="flex items-center gap-2">
                    <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden />
                    ফিল্টার
                </span>
                {activeCount > 0 ? (
                    <span className="tnum inline-flex h-6 min-w-6 items-center justify-center rounded-xs bg-ink px-1.5 text-xs text-linen">
                        {activeCount}
                    </span>
                ) : null}
            </button>

            <div
                id="showcase-filters"
                className={cn(
                    "mt-6 lg:mt-0 lg:block",
                    open ? "block" : "hidden",
                    // The rail tracks the page rather than the viewport: pinned
                    // to the viewport it would scroll independently of the grid
                    // and leave a tall column of filters beside empty space.
                    "lg:sticky lg:top-[calc(var(--header-h)+2rem)]"
                )}
            >
                {body}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */

/** A full-width row in the category list. 44px tall, whole row is the target. */
function RowItem({ active, onClick, children }) {
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                aria-pressed={active}
                className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm transition-colors",
                    active ? "font-medium text-brand" : "text-ink-soft hover:text-ink"
                )}
            >
                {children}
                {active ? (
                    <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                ) : null}
            </button>
        </li>
    );
}

function Chip({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "inline-flex min-h-9 items-center rounded-xs border px-3 text-xs transition-colors",
                active
                    ? "border-ink bg-ink text-linen"
                    : "border-field text-ink-soft hover:border-ink hover:text-ink"
            )}
        >
            {children}
        </button>
    );
}

function Select({ id, label, value, onChange, options }) {
    return (
        <div>
            <label htmlFor={id} className="text-micro block uppercase text-ink-mute">
                {label}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-2.5 h-11 w-full rounded-xs border border-field bg-paper px-3 text-sm text-ink focus:border-brand focus:outline-none"
            >
                {options.map(([v, text]) => (
                    <option key={v} value={v}>
                        {text}
                    </option>
                ))}
            </select>
        </div>
    );
}
