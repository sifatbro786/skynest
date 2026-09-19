"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Trash2 } from "lucide-react";
import ImageUploader from "@/components/admin/image-uploader";
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardHead,
    Checkbox,
    Field,
    Input,
    Select,
    Textarea,
} from "@/components/admin/ui";

const STATUS = [
    ["available", "পাওয়া যাচ্ছে"],
    ["reserved", "বুকড"],
    ["sold", "বিক্রি হয়েছে"],
];
const GENDER = [
    ["unknown", "জানা নেই"],
    ["male", "পুরুষ"],
    ["female", "মহিলা"],
    ["pair", "জোড়া"],
];
const VACCINATION = [
    ["na", "প্রযোজ্য নয়"],
    ["done", "সম্পন্ন"],
    ["partial", "আংশিক"],
    ["pending", "বাকি আছে"],
];

function emptyDraft() {
    return {
        title: "",
        breed: "",
        slug: "",
        category: "",
        subcategory: "",
        priceMin: "",
        priceMax: "",
        priceOnRequest: false,
        status: "available",
        gender: "unknown",
        ageMonths: "",
        color: "",
        vaccination: "na",
        vaccinationNote: "",
        pedigree: "",
        videoUrl: "",
        description: "",
        careNotes: "",
        isFeatured: false,
        isPublished: true,
    };
}

function fromAnimal(animal) {
    return {
        title: animal.title ?? "",
        breed: animal.breed ?? "",
        slug: animal.slug ?? "",
        category: animal.category?.id ?? animal.category ?? "",
        subcategory: animal.subcategory?.id ?? animal.subcategory ?? "",
        priceMin: animal.price?.min ?? "",
        priceMax: animal.price?.max ?? "",
        priceOnRequest: Boolean(animal.price?.onRequest),
        status: animal.status ?? "available",
        gender: animal.gender ?? "unknown",
        ageMonths: animal.ageMonths ?? "",
        color: animal.color ?? "",
        vaccination: animal.vaccination ?? "na",
        vaccinationNote: animal.vaccinationNote ?? "",
        pedigree: animal.pedigree ?? "",
        videoUrl: animal.videoUrl ?? "",
        description: animal.description ?? "",
        careNotes: animal.careNotes ?? "",
        isFeatured: Boolean(animal.isFeatured),
        isPublished: animal.isPublished !== false,
    };
}

export default function AnimalForm({ categories, animal = null }) {
    const router = useRouter();
    const isEdit = Boolean(animal);

    const [draft, setDraft] = useState(() =>
        animal ? fromAnimal(animal) : emptyDraft()
    );
    const [images, setImages] = useState(animal?.images ?? []);
    const [coverIndex, setCoverIndex] = useState(animal?.coverIndex ?? 0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [fields, setFields] = useState({});
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [dirty, setDirty] = useState(false);

    const families = useMemo(
        () => categories.filter((c) => !c.parent),
        [categories]
    );
    const breeds = useMemo(
        () => categories.filter((c) => c.parent === draft.category),
        [categories, draft.category]
    );

    /**
     * Twenty fields and no autosave: closing the tab halfway through should
     * cost a confirm dialog, not the whole entry. Cleared before we navigate
     * away ourselves on a successful save.
     */
    useEffect(() => {
        if (!dirty) return undefined;
        const onLeave = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", onLeave);
        return () => window.removeEventListener("beforeunload", onLeave);
    }, [dirty]);

    const set = (patch) => {
        setDirty(true);
        setDraft((d) => ({ ...d, ...patch }));
    };

    const setImagesDirty = (next) => {
        setDirty(true);
        setImages(next);
    };

    /** The first error the server sent, so the alert says what to fix. */
    const firstFieldError = Object.values(fields)[0];

    async function submit(event) {
        event.preventDefault();
        if (busy) return;

        setBusy(true);
        setError("");
        setFields({});

        const payload = {
            ...draft,
            subcategory: draft.subcategory || null,
            images,
            coverIndex,
            // Blank means "generate on create" / "leave alone on edit" — sending ""
            // would fail the slug pattern.
            slug: draft.slug?.trim() ? draft.slug.trim() : undefined,
        };

        try {
            const res = await fetch(
                isEdit ? `/api/admin/animals/${animal.id}` : "/api/admin/animals",
                {
                    method: isEdit ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                setError(data.error || "সংরক্ষণ করা যায়নি");
                setFields(data.fields || {});
                setBusy(false);
                // A server-side field error is usually above the fold on desktop
                // and well below it on a phone. Put the summary in view.
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }

            setDirty(false);
            router.push("/admin/animals");
            router.refresh();
        } catch {
            setError("সার্ভারের সাথে সংযোগ করা যায়নি");
            setBusy(false);
        }
    }

    async function remove() {
        setBusy(true);
        setError("");
        try {
            const res = await fetch(`/api/admin/animals/${animal.id}`, {
                method: "DELETE",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                setError(data.error || "মুছে ফেলা যায়নি");
                setBusy(false);
                return;
            }
            setDirty(false);
            router.push("/admin/animals");
            router.refresh();
        } catch {
            setError("সার্ভারের সাথে সংযোগ করা যায়নি");
            setBusy(false);
        }
    }

    const saveButton = (extra) => (
        <Button
            tone="primary"
            type="submit"
            disabled={busy}
            as="button"
            className={extra}
        >
            {busy ? (
                <LoaderCircle size={15} className="animate-spin" aria-hidden />
            ) : (
                <Check size={15} strokeWidth={2} aria-hidden />
            )}
            {isEdit ? "পরিবর্তন সংরক্ষণ" : "যোগ করুন"}
        </Button>
    );

    return (
        <form onSubmit={submit} className="pb-20 lg:pb-0">
            {error || firstFieldError ? (
                <Alert className="mt-4">
                    {error || "কিছু তথ্য ঠিক করতে হবে"}
                    {firstFieldError ? ` — ${firstFieldError}` : ""}
                </Alert>
            ) : null}

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {/* ================= main column ================= */}
                <div className="space-y-3 lg:col-span-2">
                    <Card>
                        <CardHead title="পরিচয়" />
                        <CardBody className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="শিরোনাম (বাংলা)"
                                error={fields.title}
                                required
                                htmlFor="af-title"
                                className="sm:col-span-2"
                            >
                                <Input
                                    id="af-title"
                                    value={draft.title}
                                    onChange={(e) => set({ title: e.target.value })}
                                    placeholder="শো-লাইন জার্মান শেফার্ড পাপি"
                                    invalid={Boolean(fields.title)}
                                    required
                                />
                            </Field>

                            <Field
                                label="Breed (English)"
                                error={fields.breed}
                                required
                                htmlFor="af-breed"
                            >
                                <Input
                                    id="af-breed"
                                    value={draft.breed}
                                    onChange={(e) => set({ breed: e.target.value })}
                                    placeholder="German Shepherd"
                                    invalid={Boolean(fields.breed)}
                                    required
                                />
                            </Field>

                            <Field
                                label="Slug"
                                error={fields.slug}
                                htmlFor="af-slug"
                                hint={
                                    isEdit
                                        ? "বদলালে পুরনো পাবলিক লিংক ভেঙে যাবে"
                                        : "খালি রাখলে Breed থেকে তৈরি হবে"
                                }
                            >
                                <Input
                                    id="af-slug"
                                    value={draft.slug}
                                    onChange={(e) => set({ slug: e.target.value })}
                                    placeholder="german-shepherd"
                                    invalid={Boolean(fields.slug)}
                                />
                            </Field>

                            <Field
                                label="ক্যাটাগরি"
                                error={fields.category}
                                required
                                htmlFor="af-category"
                            >
                                <Select
                                    id="af-category"
                                    value={draft.category}
                                    onChange={(e) =>
                                        set({ category: e.target.value, subcategory: "" })
                                    }
                                    required
                                >
                                    <option value="">বেছে নিন</option>
                                    {families.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} · {f.nameEn}
                                        </option>
                                    ))}
                                </Select>
                            </Field>

                            <Field
                                label="ব্রিড ক্যাটাগরি"
                                error={fields.subcategory}
                                htmlFor="af-subcategory"
                                hint={draft.category ? undefined : "আগে ক্যাটাগরি বেছে নিন"}
                            >
                                <Select
                                    id="af-subcategory"
                                    value={draft.subcategory}
                                    onChange={(e) => set({ subcategory: e.target.value })}
                                    disabled={!draft.category || breeds.length === 0}
                                >
                                    <option value="">নেই</option>
                                    {breeds.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} · {b.nameEn}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHead
                            title="ছবি"
                            hint="তারকা চিহ্ন দিয়ে কভার ছবি বেছে নিন।"
                        />
                        <CardBody>
                            <ImageUploader
                                value={images}
                                onChange={setImagesDirty}
                                coverIndex={coverIndex}
                                onCoverChange={(i) => {
                                    setDirty(true);
                                    setCoverIndex(i);
                                }}
                            />
                            {fields.images || fields.coverIndex ? (
                                <p className="pnl-error">
                                    {fields.images || fields.coverIndex}
                                </p>
                            ) : null}
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHead title="বৈশিষ্ট্য" />
                        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Field label="লিঙ্গ" error={fields.gender} htmlFor="af-gender">
                                <Select
                                    id="af-gender"
                                    value={draft.gender}
                                    onChange={(e) => set({ gender: e.target.value })}
                                    options={GENDER}
                                />
                            </Field>

                            <Field
                                label="বয়স (মাসে)"
                                error={fields.ageMonths}
                                htmlFor="af-age"
                            >
                                <Input
                                    id="af-age"
                                    type="number"
                                    min="0"
                                    max="600"
                                    inputMode="numeric"
                                    value={draft.ageMonths}
                                    onChange={(e) => set({ ageMonths: e.target.value })}
                                    placeholder="4"
                                    invalid={Boolean(fields.ageMonths)}
                                />
                            </Field>

                            <Field
                                label="রং / মিউটেশন"
                                error={fields.color}
                                htmlFor="af-color"
                            >
                                <Input
                                    id="af-color"
                                    value={draft.color}
                                    onChange={(e) => set({ color: e.target.value })}
                                    placeholder="Black & Tan"
                                />
                            </Field>

                            <Field
                                label="ভ্যাকসিনেশন"
                                error={fields.vaccination}
                                htmlFor="af-vax"
                            >
                                <Select
                                    id="af-vax"
                                    value={draft.vaccination}
                                    onChange={(e) => set({ vaccination: e.target.value })}
                                    options={VACCINATION}
                                />
                            </Field>

                            <Field
                                label="ভ্যাকসিনেশন নোট"
                                error={fields.vaccinationNote}
                                htmlFor="af-vaxnote"
                            >
                                <Input
                                    id="af-vaxnote"
                                    value={draft.vaccinationNote}
                                    onChange={(e) => set({ vaccinationNote: e.target.value })}
                                    placeholder="DHPPi + Rabies সম্পন্ন"
                                />
                            </Field>

                            <Field
                                label="ভিডিও লিংক"
                                error={fields.videoUrl}
                                htmlFor="af-video"
                                hint="YouTube বা Facebook লিংক"
                            >
                                <Input
                                    id="af-video"
                                    type="url"
                                    value={draft.videoUrl}
                                    onChange={(e) => set({ videoUrl: e.target.value })}
                                    placeholder="https://youtu.be/…"
                                    invalid={Boolean(fields.videoUrl)}
                                />
                            </Field>

                            <Field
                                label="পেডিগ্রি / বংশ পরিচয়"
                                error={fields.pedigree}
                                htmlFor="af-pedigree"
                                className="sm:col-span-2 lg:col-span-3"
                            >
                                <Textarea
                                    id="af-pedigree"
                                    className="min-h-20"
                                    value={draft.pedigree}
                                    onChange={(e) => set({ pedigree: e.target.value })}
                                    placeholder="Import sire (Czech working line), 3 generation pedigree paper সহ"
                                />
                            </Field>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHead title="বিবরণ" />
                        <CardBody className="space-y-4">
                            <Field
                                label="বিস্তারিত"
                                error={fields.description}
                                htmlFor="af-description"
                            >
                                <Textarea
                                    id="af-description"
                                    value={draft.description}
                                    onChange={(e) => set({ description: e.target.value })}
                                    placeholder="শক্ত হাড়ের গঠন, গাঢ় পিগমেন্টেশন আর ঠান্ডা মেজাজ…"
                                />
                            </Field>
                            <Field
                                label="যত্নের নির্দেশনা"
                                error={fields.careNotes}
                                htmlFor="af-care"
                            >
                                <Textarea
                                    id="af-care"
                                    className="min-h-20"
                                    value={draft.careNotes}
                                    onChange={(e) => set({ careNotes: e.target.value })}
                                    placeholder="দিনে দুইবার খাবার, সপ্তাহে দুইবার ব্রাশিং।"
                                />
                            </Field>
                        </CardBody>
                    </Card>
                </div>

                {/* ================= side column ================= */}
                <div className="space-y-3">
                    <div className="space-y-3 lg:sticky lg:top-4">
                        <Card>
                            <CardHead title="প্রকাশ" />
                            <CardBody className="space-y-3">
                                <Checkbox
                                    checked={draft.isPublished}
                                    onChange={(e) => set({ isPublished: e.target.checked })}
                                    label="পাবলিক সাইটে দেখাও"
                                />
                                <Checkbox
                                    checked={draft.isFeatured}
                                    onChange={(e) => set({ isFeatured: e.target.checked })}
                                    label="হোম পেজে ফিচার করুন"
                                />

                                <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                                    {saveButton()}
                                    <Button href="/admin/animals">বাতিল</Button>
                                </div>

                                {dirty ? (
                                    <p className="text-xs text-clay">
                                        সংরক্ষণ করা হয়নি এমন পরিবর্তন আছে।
                                    </p>
                                ) : null}
                            </CardBody>
                        </Card>

                        <Card>
                            <CardHead title="দাম ও অবস্থা" />
                            <CardBody className="space-y-4">
                                <Field
                                    label="স্ট্যাটাস"
                                    error={fields.status}
                                    htmlFor="af-status"
                                >
                                    <Select
                                        id="af-status"
                                        value={draft.status}
                                        onChange={(e) => set({ status: e.target.value })}
                                        options={STATUS}
                                    />
                                </Field>

                                <div className="grid grid-cols-2 gap-3">
                                    <Field
                                        label="দাম (সর্বনিম্ন)"
                                        error={fields.priceMin}
                                        htmlFor="af-pricemin"
                                    >
                                        <Input
                                            id="af-pricemin"
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            className="pnl-num"
                                            value={draft.priceMin}
                                            onChange={(e) => set({ priceMin: e.target.value })}
                                            placeholder="85000"
                                            disabled={draft.priceOnRequest}
                                            invalid={Boolean(fields.priceMin)}
                                        />
                                    </Field>
                                    <Field
                                        label="দাম (সর্বোচ্চ)"
                                        error={fields.priceMax}
                                        htmlFor="af-pricemax"
                                        hint="রেঞ্জ না হলে খালি"
                                    >
                                        <Input
                                            id="af-pricemax"
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            className="pnl-num"
                                            value={draft.priceMax}
                                            onChange={(e) => set({ priceMax: e.target.value })}
                                            placeholder="120000"
                                            disabled={draft.priceOnRequest}
                                        />
                                    </Field>
                                </div>

                                <Checkbox
                                    checked={draft.priceOnRequest}
                                    onChange={(e) => set({ priceOnRequest: e.target.checked })}
                                    label="দাম জানতে যোগাযোগ করতে বলুন"
                                    hint="সাইটে দাম দেখাবে না।"
                                />
                            </CardBody>
                        </Card>

                        {isEdit ? (
                            <Card>
                                <CardBody>
                                    {confirmDelete ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-ink-soft">
                                                “{animal.title}” স্থায়ীভাবে মুছে যাবে। ফিরিয়ে আনা
                                                যাবে না।
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    tone="danger"
                                                    size="sm"
                                                    onClick={remove}
                                                    disabled={busy}
                                                >
                                                    হ্যাঁ, মুছে ফেলুন
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => setConfirmDelete(false)}
                                                >
                                                    বাতিল
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            tone="danger"
                                            size="sm"
                                            onClick={() => setConfirmDelete(true)}
                                        >
                                            <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                                            মুছে ফেলুন
                                        </Button>
                                    )}
                                </CardBody>
                            </Card>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Mobile save bar — the sidebar's save button is a full scroll away
                on a phone, and this form is long. */}
            <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-line bg-paper px-4 py-2.5 shadow-lift lg:hidden">
                {saveButton("flex-1")}
                <Button href="/admin/animals">বাতিল</Button>
            </div>
        </form>
    );
}
