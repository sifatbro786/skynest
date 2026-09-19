"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";
import { Card, Field, Select } from "@/components/admin/ui";

const STATUS = [
    ["all", "সব স্ট্যাটাস"],
    ["available", "পাওয়া যাচ্ছে"],
    ["reserved", "বুকড"],
    ["sold", "বিক্রি হয়েছে"],
];

const PUBLISHED = [
    ["all", "প্রকাশিত + খসড়া"],
    ["true", "শুধু প্রকাশিত"],
    ["false", "শুধু খসড়া"],
];

const MISSING = [
    ["", "সব"],
    ["images", "ছবি নেই"],
    ["price", "দাম নেই"],
];

const SORT = [
    ["newest", "নতুন আগে"],
    ["oldest", "পুরনো আগে"],
    ["price-desc", "দাম বেশি আগে"],
    ["price-asc", "দাম কম আগে"],
    ["title", "নাম অনুসারে"],
];

export default function AnimalFilters({ categories, current }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [q, setQ] = useState(current.q ?? "");

    const families = categories.filter((c) => !c.parent);

    /** Any filter change resets to page 1 — staying on page 7 of a narrower
     *  result set shows an empty list and reads as a bug. */
    function apply(patch) {
        const next = { ...current, ...patch, page: 1 };
        const sp = new URLSearchParams();

        for (const [key, value] of Object.entries(next)) {
            if (value === "" || value === null || value === undefined) continue;
            if (key === "page" && value === 1) continue;
            if (key === "limit") continue;
            if ((key === "status" || key === "published") && value === "all") continue;
            if (key === "sort" && value === "newest") continue;
            sp.set(key, String(value));
        }

        const qs = sp.toString();
        startTransition(() =>
            router.push(qs ? `/admin/animals?${qs}` : "/admin/animals")
        );
    }

    const dirty =
        (current.q ?? "") !== "" ||
        current.category !== "" ||
        current.status !== "all" ||
        current.published !== "all" ||
        current.missing !== "";

    return (
        <Card className="mt-4 p-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        apply({ q });
                    }}
                    className="xl:col-span-2"
                >
                    <Field label="খুঁজুন" htmlFor="animal-q">
                        <div className="relative">
                            <Search
                                size={15}
                                strokeWidth={1.75}
                                aria-hidden
                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-mute"
                            />
                            <input
                                id="animal-q"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="নাম, ব্রিড বা রং"
                                className="pnl-input pl-8 pr-9"
                            />
                            {q ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQ("");
                                        apply({ q: "" });
                                    }}
                                    aria-label="খোঁজা মুছুন"
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-ink-mute transition-colors hover:bg-linen-deep hover:text-ink"
                                >
                                    <X size={14} strokeWidth={2} aria-hidden />
                                </button>
                            ) : null}
                        </div>
                    </Field>
                    <button type="submit" className="sr-only">
                        খুঁজুন
                    </button>
                </form>

                <Field label="ক্যাটাগরি" htmlFor="f-category">
                    <Select
                        id="f-category"
                        value={current.category}
                        onChange={(e) => apply({ category: e.target.value })}
                        options={[
                            ["", "সব ক্যাটাগরি"],
                            ...families.map((f) => [f.id, f.name]),
                        ]}
                    />
                </Field>

                <Field label="স্ট্যাটাস" htmlFor="f-status">
                    <Select
                        id="f-status"
                        value={current.status}
                        onChange={(e) => apply({ status: e.target.value })}
                        options={STATUS}
                    />
                </Field>

                <Field label="প্রকাশ" htmlFor="f-published">
                    <Select
                        id="f-published"
                        value={current.published}
                        onChange={(e) => apply({ published: e.target.value })}
                        options={PUBLISHED}
                    />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="অসম্পূর্ণ" htmlFor="f-missing">
                        <Select
                            id="f-missing"
                            value={current.missing}
                            onChange={(e) => apply({ missing: e.target.value })}
                            options={MISSING}
                        />
                    </Field>
                    <Field label="সাজান" htmlFor="f-sort">
                        <Select
                            id="f-sort"
                            value={current.sort}
                            onChange={(e) => apply({ sort: e.target.value })}
                            options={SORT}
                        />
                    </Field>
                </div>
            </div>

            {dirty || pending ? (
                <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
                    {dirty ? (
                        <button
                            type="button"
                            onClick={() => {
                                setQ("");
                                startTransition(() => router.push("/admin/animals"));
                            }}
                            className="pnl-btn pnl-btn-ghost pnl-btn-sm"
                        >
                            <X size={13} strokeWidth={2} aria-hidden />
                            ফিল্টার সরান
                        </button>
                    ) : null}
                    {pending ? (
                        <span className="flex items-center gap-1.5 text-xs text-ink-mute">
                            <LoaderCircle size={13} className="animate-spin" aria-hidden />
                            লোড হচ্ছে…
                        </span>
                    ) : null}
                </div>
            ) : null}
        </Card>
    );
}
