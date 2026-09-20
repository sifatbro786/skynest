"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";
import { Card, Field, Select } from "@/components/admin/ui";

const KIND = [
    ["all", "সব ধরন"],
    ["general", "সাধারণ প্রশ্ন"],
    ["animal", "প্রাণী সম্পর্কে"],
    ["visit", "ফার্ম ভিজিট"],
];

const STATUS = [
    ["all", "সব স্ট্যাটাস"],
    ["new", "নতুন"],
    ["contacted", "যোগাযোগ হয়েছে"],
    ["scheduled", "সময় ঠিক"],
    ["closed", "সম্পন্ন"],
];

/**
 * Filter bar for the inquiry inbox.
 *
 * Replaces two rows of chip tabs. Nine chips wrapping across two labelled rows
 * cost more vertical space than the first inquiry row underneath them, and on
 * a narrow panel they wrapped into a ragged block that read as a tag cloud
 * rather than as controls.
 *
 * Deliberately the same shape as `animal-filters.js` — labelled selects, a
 * search box, one "clear" affordance and a pending indicator — because the
 * panel is a tool and two screens that do the same job should not need to be
 * learned twice.
 *
 * It also exposes the search that `adminInquiryQuerySchema` has always
 * accepted (`q`, matched against name, phone, email and animal label). The
 * page filtered on it; nothing ever rendered an input for it, so it was
 * reachable only by typing a query string by hand.
 */
export default function InquiryFilters({ current }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [q, setQ] = useState(current.q ?? "");

    /** Any change resets to page 1 — staying on page 5 of a narrower result
     *  set shows an empty list and reads as a bug. */
    function apply(patch) {
        const next = { ...current, ...patch, page: 1 };
        const sp = new URLSearchParams();

        for (const [key, value] of Object.entries(next)) {
            if (value === "" || value === null || value === undefined) continue;
            if (key === "page" && Number(value) === 1) continue;
            if (key === "limit") continue;
            if ((key === "kind" || key === "status") && value === "all") continue;
            sp.set(key, String(value));
        }

        const qs = sp.toString();
        startTransition(() => router.push(qs ? `/admin/inquiries?${qs}` : "/admin/inquiries"));
    }

    const dirty = (current.q ?? "") !== "" || current.kind !== "all" || current.status !== "all";

    return (
        <Card className="mt-4 p-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        apply({ q });
                    }}
                    className="xl:col-span-2"
                >
                    <Field label="খুঁজুন" htmlFor="iq-q">
                        <div className="relative">
                            <Search
                                size={15}
                                strokeWidth={1.75}
                                aria-hidden
                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-mute"
                            />
                            <input
                                id="iq-q"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="নাম, নম্বর, ইমেইল বা প্রাণীর নাম"
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

                <Field label="ধরন" htmlFor="iq-kind">
                    <Select
                        id="iq-kind"
                        value={current.kind}
                        onChange={(e) => apply({ kind: e.target.value })}
                        options={KIND}
                    />
                </Field>

                <Field label="স্ট্যাটাস" htmlFor="iq-status">
                    <Select
                        id="iq-status"
                        value={current.status}
                        onChange={(e) => apply({ status: e.target.value })}
                        options={STATUS}
                    />
                </Field>
            </div>

            {dirty || pending ? (
                <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
                    {dirty ? (
                        <button
                            type="button"
                            onClick={() => {
                                setQ("");
                                startTransition(() => router.push("/admin/inquiries"));
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
