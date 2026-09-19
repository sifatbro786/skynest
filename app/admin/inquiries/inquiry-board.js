"use client";

import { useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    LoaderCircle,
    MailCheck,
    MailX,
    MessageSquare,
    MinusCircle,
    Phone,
    Trash2,
} from "lucide-react";
import { StatusTag, InquiryKind } from "@/components/admin/status-tag";
import { cn, formatDateLatin, VISIT_SLOT_LABELS } from "@/lib/utils";
import {
    Alert,
    Button,
    Card,
    EmptyState,
    Textarea,
} from "@/components/admin/ui";

const STATUSES = [
    ["new", "নতুন"],
    ["contacted", "যোগাযোগ হয়েছে"],
    ["scheduled", "সময় ঠিক হয়েছে"],
    ["closed", "সম্পন্ন"],
];

const MAIL_LOOK = {
    sent: { icon: MailCheck, tone: "text-leaf", label: "পাঠানো হয়েছে" },
    failed: { icon: MailX, tone: "text-[#a4402a]", label: "ব্যর্থ" },
    skipped: { icon: MinusCircle, tone: "text-ink-mute", label: "পাঠানো হয়নি" },
    pending: { icon: LoaderCircle, tone: "text-ink-mute", label: "অপেক্ষমাণ" },
};

export default function InquiryBoard({ initialInquiries, filtered = false }) {
    const [items, setItems] = useState(initialInquiries);
    const [openId, setOpenId] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState("");

    async function patch(id, body) {
        setBusyId(id);
        setError("");
        try {
            const res = await fetch(`/api/admin/inquiries/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                setError(data.error || "সংরক্ষণ করা যায়নি");
                return;
            }
            setItems((prev) =>
                prev.map((item) => (item.id === id ? data.inquiry : item))
            );
        } catch {
            setError("সার্ভারের সাথে সংযোগ করা যায়নি");
        } finally {
            setBusyId(null);
        }
    }

    async function remove(id) {
        setBusyId(id);
        setError("");
        try {
            const res = await fetch(`/api/admin/inquiries/${id}`, {
                method: "DELETE",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                setError(data.error || "মুছে ফেলা যায়নি");
                return;
            }
            setItems((prev) => prev.filter((item) => item.id !== id));
            setOpenId(null);
        } catch {
            setError("সার্ভারের সাথে সংযোগ করা যায়নি");
        } finally {
            setBusyId(null);
        }
    }

    if (items.length === 0) {
        return (
            <EmptyState
                className="mt-3"
                title={filtered ? "এই ফিল্টারে কোনো ইনকোয়ারি নেই" : "এখনো কোনো ইনকোয়ারি আসেনি"}
                hint={
                    filtered
                        ? "অন্য ধরন বা স্ট্যাটাস বেছে দেখুন।"
                        : "পাবলিক সাইট থেকে কেউ যোগাযোগ করলে এখানে দেখা যাবে।"
                }
                action={
                    filtered ? (
                        <Button size="sm" href="/admin/inquiries">
                            ফিল্টার সরান
                        </Button>
                    ) : null
                }
            />
        );
    }

    return (
        <div className="mt-3 space-y-3">
            {error ? <Alert>{error}</Alert> : null}

            <Card className="overflow-hidden">
                <ul className="divide-y divide-line">
                    {items.map((inquiry) => {
                        const open = openId === inquiry.id;
                        const busy = busyId === inquiry.id;
                        const unread = inquiry.status === "new";

                        return (
                            <li key={inquiry.id}>
                                <button
                                    type="button"
                                    onClick={() => setOpenId(open ? null : inquiry.id)}
                                    aria-expanded={open}
                                    className={cn(
                                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-linen",
                                        unread && "bg-brand-wash/45"
                                    )}
                                >
                                    {/* Unread marker: a 2px rule, not a coloured row — the
                                        inbox stays scannable when half of it is new. */}
                                    <span
                                        aria-hidden
                                        className={cn(
                                            "h-8 w-0.5 shrink-0 rounded-full",
                                            unread ? "bg-brand" : "bg-transparent"
                                        )}
                                    />

                                    <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                            <span
                                                className={cn(
                                                    "truncate text-sm text-ink",
                                                    unread && "font-semibold"
                                                )}
                                            >
                                                {inquiry.name}
                                            </span>
                                            <InquiryKind kind={inquiry.kind} />
                                            {inquiry.animalLabel ? (
                                                <span className="truncate text-xs text-ink-mute">
                                                    {inquiry.animalLabel}
                                                </span>
                                            ) : null}
                                            {inquiry.message ? (
                                                <MessageSquare
                                                    size={12}
                                                    strokeWidth={1.75}
                                                    aria-label="বার্তা আছে"
                                                    className="shrink-0 text-ink-mute"
                                                />
                                            ) : null}
                                        </span>
                                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-mute">
                                            <span className="pnl-num">{inquiry.phone}</span>
                                            {inquiry.email ? (
                                                <span className="truncate">{inquiry.email}</span>
                                            ) : null}
                                            <span className="pnl-num">
                                                {formatDateLatin(inquiry.createdAt)}
                                            </span>
                                        </span>
                                    </span>

                                    <span className="flex shrink-0 items-center gap-3">
                                        <span className="hidden items-center gap-1.5 sm:flex">
                                            <MailDot label="অ্যাডমিন" state={inquiry.mail?.admin} />
                                            <MailDot
                                                label="ক্লায়েন্ট"
                                                state={inquiry.mail?.client}
                                            />
                                        </span>
                                        <StatusTag status={inquiry.status} kind="inquiry" />
                                        <ChevronDown
                                            size={15}
                                            strokeWidth={1.75}
                                            aria-hidden
                                            className={cn(
                                                "text-ink-mute transition-transform",
                                                open && "rotate-180"
                                            )}
                                        />
                                    </span>
                                </button>

                                {open ? (
                                    <div className="grid gap-5 border-t border-line bg-linen px-4 py-4 lg:grid-cols-3">
                                        <div className="space-y-4 lg:col-span-2">
                                            {inquiry.kind === "visit" && inquiry.visitDate ? (
                                                <Detail label="ভিজিটের সময়">
                                                    {formatDateLatin(inquiry.visitDate)}
                                                    {inquiry.visitSlot
                                                        ? ` · ${VISIT_SLOT_LABELS[inquiry.visitSlot]}`
                                                        : ""}
                                                </Detail>
                                            ) : null}

                                            {inquiry.message ? (
                                                <div>
                                                    <p className="pnl-label">বার্তা</p>
                                                    <p className="mt-1.5 whitespace-pre-line rounded-sm border border-line bg-paper px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
                                                        {inquiry.message}
                                                    </p>
                                                </div>
                                            ) : null}

                                            {inquiry.source ? (
                                                <Detail label="যে পেজ থেকে">{inquiry.source}</Detail>
                                            ) : null}

                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    as="a"
                                                    href={`tel:${inquiry.phone}`}
                                                >
                                                    <Phone size={14} strokeWidth={1.75} aria-hidden />
                                                    কল করুন
                                                </Button>
                                                {inquiry.animal ? (
                                                    <Button
                                                        size="sm"
                                                        href={`/admin/animals/${inquiry.animal}`}
                                                    >
                                                        প্রাণীটি দেখুন
                                                    </Button>
                                                ) : null}
                                            </div>

                                            <MailReport mail={inquiry.mail} />
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="pnl-label">স্ট্যাটাস</p>
                                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                    {STATUSES.map(([value, label]) => (
                                                        <Button
                                                            key={value}
                                                            size="sm"
                                                            tone={
                                                                inquiry.status === value
                                                                    ? "primary"
                                                                    : "ghost"
                                                            }
                                                            aria-pressed={inquiry.status === value}
                                                            disabled={busy || inquiry.status === value}
                                                            onClick={() =>
                                                                patch(inquiry.id, { status: value })
                                                            }
                                                        >
                                                            {label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <NoteField
                                                key={`${inquiry.id}-${inquiry.adminNote}`}
                                                initial={inquiry.adminNote}
                                                busy={busy}
                                                onSave={(adminNote) =>
                                                    patch(inquiry.id, { adminNote })
                                                }
                                            />

                                            <DeleteRow
                                                busy={busy}
                                                onDelete={() => remove(inquiry.id)}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            </Card>
        </div>
    );
}

/* ---------------------------------------------------------------- */

function MailDot({ label, state }) {
    const look = MAIL_LOOK[state?.status ?? "pending"] ?? MAIL_LOOK.pending;
    const Icon = look.icon;
    return (
        <span
            title={`${label} মেইল: ${look.label}${state?.error ? ` — ${state.error}` : ""}`}
            className={look.tone}
        >
            <Icon size={14} strokeWidth={1.75} aria-hidden />
            <span className="sr-only">{`${label} মেইল ${look.label}`}</span>
        </span>
    );
}

/**
 * Explicit, not just an icon: "the buyer never got a confirmation" and "the
 * buyer is ignoring us" look identical from the inbox otherwise.
 */
function MailReport({ mail }) {
    const rows = [
        ["অ্যাডমিন নোটিফিকেশন", mail?.admin],
        ["ক্লায়েন্ট কনফার্মেশন", mail?.client],
    ];

    return (
        <div>
            <p className="pnl-label">ইমেইল</p>
            <ul className="mt-1.5 divide-y divide-line rounded-sm border border-line bg-paper">
                {rows.map(([label, state]) => {
                    const look = MAIL_LOOK[state?.status ?? "pending"] ?? MAIL_LOOK.pending;
                    const Icon = look.icon;
                    return (
                        <li
                            key={label}
                            className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs"
                        >
                            <Icon
                                size={13}
                                strokeWidth={1.75}
                                aria-hidden
                                className={look.tone}
                            />
                            <span className="text-ink-soft">{label}</span>
                            <span className={look.tone}>· {look.label}</span>
                            {state?.at ? (
                                <span className="pnl-num text-ink-mute">
                                    {formatDateLatin(state.at)}
                                </span>
                            ) : null}
                            {state?.error && state.status === "failed" ? (
                                <span className="flex items-center gap-1 text-[#a4402a]">
                                    <AlertTriangle size={12} strokeWidth={1.75} aria-hidden />
                                    {state.error}
                                </span>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function NoteField({ initial, busy, onSave }) {
    const [value, setValue] = useState(initial ?? "");
    const dirty = value !== (initial ?? "");

    return (
        <div>
            <label className="pnl-label" htmlFor="inq-note">
                অভ্যন্তরীণ নোট
            </label>
            <Textarea
                id="inq-note"
                className="mt-1.5 min-h-20"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="কী কথা হলো, কী বাকি…"
            />
            {dirty ? (
                <Button
                    tone="primary"
                    size="sm"
                    className="mt-2"
                    onClick={() => onSave(value)}
                    disabled={busy}
                >
                    {busy ? (
                        <LoaderCircle size={13} className="animate-spin" aria-hidden />
                    ) : (
                        <Check size={13} strokeWidth={2} aria-hidden />
                    )}
                    নোট সংরক্ষণ
                </Button>
            ) : null}
        </div>
    );
}

function DeleteRow({ busy, onDelete }) {
    const [confirm, setConfirm] = useState(false);

    if (!confirm) {
        return (
            <Button tone="danger" size="sm" onClick={() => setConfirm(true)}>
                <Trash2 size={13} strokeWidth={1.75} aria-hidden />
                ইনকোয়ারি মুছুন
            </Button>
        );
    }

    return (
        <div className="space-y-2 rounded-sm border border-[#d9b6aa] bg-[#f7ece8] px-3 py-2.5">
            <p className="text-xs text-[#7d3220]">
                মুছে ফেললে আর ফিরিয়ে আনা যাবে না।
            </p>
            <div className="flex flex-wrap gap-2">
                <Button tone="danger" size="sm" onClick={onDelete} disabled={busy}>
                    হ্যাঁ, মুছুন
                </Button>
                <Button size="sm" onClick={() => setConfirm(false)}>
                    বাতিল
                </Button>
            </div>
        </div>
    );
}

function Detail({ label, children }) {
    return (
        <div>
            <p className="pnl-label">{label}</p>
            <p className="pnl-num mt-0.5 text-sm text-ink">{children}</p>
        </div>
    );
}
