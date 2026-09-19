"use client";

import { useMemo, useState } from "react";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatCount } from "@/lib/utils";
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardHead,
    Checkbox,
    EmptyState,
    Field,
    Input,
} from "@/components/admin/ui";

const emptyDraft = (parent = null) => ({
    name: "",
    nameEn: "",
    slug: "",
    blurb: "",
    icon: "",
    order: 0,
    isActive: true,
    parent,
});

export default function CategoryManager({ initialCategories, usage }) {
    const [categories, setCategories] = useState(initialCategories);
    /** null | { mode: "create" | "edit", parent?: string, id?: string } */
    const [form, setForm] = useState(null);
    const [draft, setDraft] = useState(emptyDraft());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [fields, setFields] = useState({});
    const [confirmId, setConfirmId] = useState(null);

    const { families, childrenOf } = useMemo(() => {
        const fams = categories
            .filter((c) => !c.parent)
            .sort((a, b) => a.order - b.order || a.nameEn.localeCompare(b.nameEn));

        const map = {};
        for (const cat of categories) {
            if (!cat.parent) continue;
            (map[cat.parent] ??= []).push(cat);
        }
        for (const list of Object.values(map)) {
            list.sort((a, b) => a.order - b.order || a.nameEn.localeCompare(b.nameEn));
        }
        return { families: fams, childrenOf: map };
    }, [categories]);

    function resetForm() {
        setForm(null);
        setDraft(emptyDraft());
        setError("");
        setFields({});
    }

    function startCreate(parent = null) {
        const siblings = parent ? (childrenOf[parent] ?? []) : families;
        setForm({ mode: "create", parent });
        setDraft({ ...emptyDraft(parent), order: siblings.length + 1 });
        setError("");
        setFields({});
        setConfirmId(null);
    }

    function startEdit(category) {
        setForm({ mode: "edit", id: category.id, parent: category.parent });
        setDraft({
            name: category.name,
            nameEn: category.nameEn,
            slug: category.slug,
            blurb: category.blurb,
            icon: category.icon,
            order: category.order,
            isActive: category.isActive,
            parent: category.parent,
        });
        setError("");
        setFields({});
        setConfirmId(null);
    }

    async function submit(event) {
        event.preventDefault();
        if (busy) return;

        setBusy(true);
        setError("");
        setFields({});

        const isEdit = form.mode === "edit";
        const url = isEdit
            ? `/api/admin/categories/${form.id}`
            : "/api/admin/categories";

        try {
            const res = await fetch(url, {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...draft,
                    order: Number(draft.order) || 0,
                    // An empty slug means "leave it alone" on edit and "generate one"
                    // on create — sending "" would fail the pattern check.
                    slug: draft.slug?.trim() ? draft.slug.trim() : undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                setError(data.error || "সংরক্ষণ করা যায়নি");
                setFields(data.fields || {});
                return;
            }

            setCategories((prev) =>
                isEdit
                    ? prev.map((c) => (c.id === data.category.id ? data.category : c))
                    : [...prev, data.category]
            );
            resetForm();
        } catch {
            setError("সার্ভারের সাথে সংযোগ করা যায়নি");
        } finally {
            setBusy(false);
        }
    }

    async function remove(id) {
        setBusy(true);
        setError("");
        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: "DELETE",
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                setError(data.error || "মুছে ফেলা যায়নি");
                return;
            }

            setCategories((prev) => prev.filter((c) => c.id !== id));
            setConfirmId(null);
        } catch {
            setError("সার্ভারের সাথে সংযোগ করা যায়নি");
        } finally {
            setBusy(false);
        }
    }

    const formIsFamily = form ? !form.parent : true;
    const familyName = form?.parent
        ? (families.find((f) => f.id === form.parent)?.name ?? "")
        : "";

    return (
        <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-mute">
                    <span className="ad-num font-medium text-ink">
                        {formatCount(families.length)}
                    </span>
                    টি পরিবার ·{" "}
                    <span className="ad-num font-medium text-ink">
                        {formatCount(categories.length - families.length)}
                    </span>
                    টি ব্রিড
                </p>
                <Button tone="primary" size="sm" onClick={() => startCreate(null)}>
                    <Plus size={15} strokeWidth={2} aria-hidden />
                    নতুন পরিবার
                </Button>
            </div>

            {error && !form ? <Alert>{error}</Alert> : null}

            {/* ---------------- editor ---------------- */}
            {form ? (
                <Card>
                    <CardHead
                        title={
                            form.mode === "edit"
                                ? "সম্পাদনা"
                                : formIsFamily
                                  ? "নতুন পরিবার"
                                  : `${familyName}-এ নতুন ব্রিড`
                        }
                        actions={
                            <Button size="sm" onClick={resetForm}>
                                <X size={14} strokeWidth={2} aria-hidden />
                                বন্ধ করুন
                            </Button>
                        }
                    />
                    <form onSubmit={submit}>
                        <CardBody className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="বাংলা নাম"
                                    error={fields.name}
                                    required
                                    htmlFor="cat-name"
                                >
                                    <Input
                                        id="cat-name"
                                        value={draft.name}
                                        onChange={(e) =>
                                            setDraft({ ...draft, name: e.target.value })
                                        }
                                        placeholder="কুকুর"
                                        invalid={Boolean(fields.name)}
                                        required
                                        autoFocus
                                    />
                                </Field>

                                <Field
                                    label="English name"
                                    error={fields.nameEn}
                                    required
                                    htmlFor="cat-nameen"
                                >
                                    <Input
                                        id="cat-nameen"
                                        value={draft.nameEn}
                                        onChange={(e) =>
                                            setDraft({ ...draft, nameEn: e.target.value })
                                        }
                                        placeholder="Dogs"
                                        invalid={Boolean(fields.nameEn)}
                                        required
                                    />
                                </Field>

                                {formIsFamily ? (
                                    <>
                                        <Field
                                            label="Lucide আইকন"
                                            hint="যেমন Dog, Cat, Bird, Feather, Rabbit"
                                            error={fields.icon}
                                            htmlFor="cat-icon"
                                        >
                                            <Input
                                                id="cat-icon"
                                                value={draft.icon}
                                                onChange={(e) =>
                                                    setDraft({ ...draft, icon: e.target.value })
                                                }
                                                placeholder="Dog"
                                            />
                                        </Field>
                                        <Field
                                            label="সংক্ষিপ্ত বর্ণনা"
                                            error={fields.blurb}
                                            htmlFor="cat-blurb"
                                        >
                                            <Input
                                                id="cat-blurb"
                                                value={draft.blurb}
                                                onChange={(e) =>
                                                    setDraft({ ...draft, blurb: e.target.value })
                                                }
                                                placeholder="পেডিগ্রি লাইনের গার্ড ও কম্প্যানিয়ন ব্রিড।"
                                            />
                                        </Field>
                                    </>
                                ) : null}

                                <Field label="ক্রম" error={fields.order} htmlFor="cat-order">
                                    <Input
                                        id="cat-order"
                                        type="number"
                                        min="0"
                                        inputMode="numeric"
                                        className="ad-num"
                                        value={draft.order}
                                        onChange={(e) =>
                                            setDraft({ ...draft, order: e.target.value })
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Slug"
                                    hint={
                                        form.mode === "edit"
                                            ? "বদলালে পুরনো পাবলিক লিংক ভেঙে যাবে"
                                            : "খালি রাখলে English name থেকে তৈরি হবে"
                                    }
                                    error={fields.slug}
                                    htmlFor="cat-slug"
                                >
                                    <Input
                                        id="cat-slug"
                                        value={draft.slug}
                                        onChange={(e) =>
                                            setDraft({ ...draft, slug: e.target.value })
                                        }
                                        placeholder="dogs"
                                        invalid={Boolean(fields.slug)}
                                    />
                                </Field>
                            </div>

                            <Checkbox
                                checked={draft.isActive}
                                onChange={(e) =>
                                    setDraft({ ...draft, isActive: e.target.checked })
                                }
                                label="পাবলিক সাইটে দেখাও"
                            />

                            {error ? <Alert>{error}</Alert> : null}

                            <div className="flex items-center gap-2 border-t border-line pt-3">
                                <Button tone="primary" as="button" type="submit" disabled={busy}>
                                    {busy ? (
                                        <LoaderCircle
                                            size={15}
                                            className="animate-spin"
                                            aria-hidden
                                        />
                                    ) : (
                                        <Check size={15} strokeWidth={2} aria-hidden />
                                    )}
                                    সংরক্ষণ
                                </Button>
                                <Button onClick={resetForm}>বাতিল</Button>
                            </div>
                        </CardBody>
                    </form>
                </Card>
            ) : null}

            {/* ---------------- tree ---------------- */}
            {families.length === 0 ? (
                <EmptyState
                    title="কোনো ক্যাটাগরি নেই"
                    hint="শুরু করতে একটি পরিবার যোগ করুন, অথবা টার্মিনালে npm run seed -- --fresh চালান।"
                    action={
                        <Button tone="primary" size="sm" onClick={() => startCreate(null)}>
                            পরিবার যোগ করুন
                        </Button>
                    }
                />
            ) : (
                families.map((family) => (
                    <Card key={family.id}>
                        <CardHead
                            title={
                                <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                                    <span>{family.name}</span>
                                    <span className="text-xs font-normal text-ink-mute">
                                        {family.nameEn}
                                    </span>
                                    <code className="text-xs font-normal text-ink-mute">
                                        /{family.slug}
                                    </code>
                                    {!family.isActive ? (
                                        <span className="ad-chip h-5 text-clay">লুকানো</span>
                                    ) : null}
                                </span>
                            }
                            actions={
                                <RowActions
                                    onEdit={() => startEdit(family)}
                                    onDelete={() => setConfirmId(family.id)}
                                    count={usage[family.id] ?? 0}
                                />
                            }
                        />

                        {confirmId === family.id ? (
                            <Confirm
                                busy={busy}
                                label={family.name}
                                onCancel={() => setConfirmId(null)}
                                onConfirm={() => remove(family.id)}
                            />
                        ) : null}

                        {(childrenOf[family.id] ?? []).length > 0 ? (
                            <ul className="divide-y divide-line">
                                {(childrenOf[family.id] ?? []).map((breed) => (
                                    <li key={breed.id}>
                                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                                            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
                                                <span className="text-sm text-ink">
                                                    {breed.name}
                                                </span>
                                                <span className="text-xs text-ink-mute">
                                                    {breed.nameEn}
                                                </span>
                                                <code className="text-xs text-ink-mute">
                                                    /{breed.slug}
                                                </code>
                                                {!breed.isActive ? (
                                                    <span className="ad-chip h-5 text-clay">
                                                        লুকানো
                                                    </span>
                                                ) : null}
                                            </div>
                                            <RowActions
                                                onEdit={() => startEdit(breed)}
                                                onDelete={() => setConfirmId(breed.id)}
                                                count={usage[breed.id] ?? 0}
                                            />
                                        </div>
                                        {confirmId === breed.id ? (
                                            <Confirm
                                                busy={busy}
                                                label={breed.name}
                                                onCancel={() => setConfirmId(null)}
                                                onConfirm={() => remove(breed.id)}
                                            />
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-4 py-3 text-sm text-ink-mute">
                                এই পরিবারে কোনো ব্রিড নেই।
                            </p>
                        )}

                        <div className="border-t border-line px-4 py-2.5">
                            <Button size="sm" onClick={() => startCreate(family.id)}>
                                <Plus size={14} strokeWidth={2} aria-hidden />
                                ব্রিড যোগ করুন
                            </Button>
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
}

/* ---------------------------------------------------------------- */

function RowActions({ onEdit, onDelete, count }) {
    return (
        <div className="flex shrink-0 items-center gap-2">
            {count > 0 ? (
                <span className="ad-chip ad-num">{formatCount(count)}টি প্রাণী</span>
            ) : null}
            <Button size="sm" onClick={onEdit} className="h-8 w-8 px-0" aria-label="সম্পাদনা">
                <Pencil size={14} strokeWidth={1.75} aria-hidden />
            </Button>
            <Button
                tone="danger"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 px-0"
                aria-label="মুছুন"
            >
                <Trash2 size={14} strokeWidth={1.75} aria-hidden />
            </Button>
        </div>
    );
}

function Confirm({ label, busy, onCancel, onConfirm }) {
    return (
        <div className="flex flex-wrap items-center gap-3 border-y border-[#d9b6aa] bg-[#f7ece8] px-4 py-3 text-sm text-[#7d3220]">
            <span className="flex-1">“{label}” মুছে ফেলবেন? ফিরিয়ে আনা যাবে না।</span>
            <Button tone="danger" size="sm" onClick={onConfirm} disabled={busy}>
                {busy ? (
                    <LoaderCircle size={13} className="animate-spin" aria-hidden />
                ) : null}
                হ্যাঁ, মুছুন
            </Button>
            <Button size="sm" onClick={onCancel}>
                বাতিল
            </Button>
        </div>
    );
}
