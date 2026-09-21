"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
    Check,
    ExternalLink,
    Globe,
    ImagePlus,
    LoaderCircle,
    Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardHead,
    Checkbox,
    Field,
    Input,
    Textarea,
} from "@/components/admin/ui";

/**
 * The SEO panel.
 *
 * One route is edited at a time, picked from a rail on the left. Every row is
 * held in local state from the first render — the server sends a complete row
 * for each page including ones never saved — so switching pages is instant and
 * there is no per-page fetch, no loading state, and no "create vs edit" fork.
 *
 * Unsaved edits survive switching pages, and the rail marks which rows are
 * dirty. That is deliberate: an owner writing descriptions works down the list
 * and should not lose the one they just typed by clicking the next page. Each
 * row saves on its own, so nothing is batched into one risky submit either.
 *
 * `LIMITS` are the RECOMMENDED lengths, not the schema's. The counter turns
 * amber past them and the save still goes through — Google's truncation is a
 * pixel-width heuristic on a rendered SERP, so a 63-character title is a
 * judgement call, not an error. The hard caps live in `seoMetaSchema`.
 */

const LIMITS = { title: 60, description: 160 };

function emptyErrors() {
    return {};
}

export default function SeoManager({ pages, siteKey, initialSite, initialRows, baseUrl }) {
    const [rows, setRows] = useState(() => {
        const map = { [siteKey]: initialSite };
        for (const row of initialRows) map[row.path] = row;
        return map;
    });
    const [saved, setSaved] = useState(() => {
        const map = { [siteKey]: initialSite };
        for (const row of initialRows) map[row.path] = row;
        return map;
    });

    const [active, setActive] = useState(siteKey);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState(emptyErrors);
    const [topError, setTopError] = useState("");
    const [flash, setFlash] = useState("");

    const row = rows[active];
    const isSite = active === siteKey;

    const dirty = (path) => JSON.stringify(rows[path]) !== JSON.stringify(saved[path]);

    function patch(changes) {
        setRows((prev) => ({ ...prev, [active]: { ...prev[active], ...changes } }));
        setFlash("");
    }

    async function save() {
        if (busy) return;
        setBusy(true);
        setErrors(emptyErrors());
        setTopError("");

        try {
            const res = await fetch("/api/admin/seo", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...row, path: active }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                setTopError(data.error ?? "সেভ করা যায়নি");
                setErrors(data.fields ?? emptyErrors());
                return;
            }

            // Take the SERVER's row back, not the local one. Keywords are
            // normalised server-side (trimmed, deduped, capped), so echoing
            // local state would leave the form showing input the database does
            // not actually hold.
            setRows((prev) => ({ ...prev, [active]: data.row }));
            setSaved((prev) => ({ ...prev, [active]: data.row }));
            setFlash("সেভ হয়েছে");
        } catch {
            setTopError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন");
        } finally {
            setBusy(false);
        }
    }

    const label = isSite
        ? "সব পাতার ডিফল্ট"
        : (pages.find((p) => p.path === active)?.label ?? active);

    return (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* ---------------- rail ---------------- */}
            <nav aria-label="পেজ" className="lg:col-span-3">
                <Card>
                    <CardHead title="পেজ" />
                    <ul className="p-1.5">
                        <RailItem
                            active={isSite}
                            dirty={dirty(siteKey)}
                            icon={Globe}
                            label="সব পাতার ডিফল্ট"
                            hint="খালি ঘর এখান থেকে পূরণ হয়"
                            onClick={() => setActive(siteKey)}
                        />

                        <li aria-hidden className="my-1.5 border-t border-line" />

                        {pages.map((p) => (
                            <RailItem
                                key={p.path}
                                active={active === p.path}
                                dirty={dirty(p.path)}
                                noindex={rows[p.path]?.noindex}
                                label={p.label}
                                hint={p.path}
                                onClick={() => setActive(p.path)}
                            />
                        ))}
                    </ul>
                </Card>
            </nav>

            {/* ---------------- editor ---------------- */}
            <div className="lg:col-span-9">
                <Card>
                    <CardHead
                        title={label}
                        hint={isSite ? undefined : active}
                        actions={
                            !isSite ? (
                                <Button as="a" href={active} target="_blank" rel="noreferrer" size="sm">
                                    <ExternalLink size={14} strokeWidth={1.75} aria-hidden />
                                    পাতা দেখুন
                                </Button>
                            ) : null
                        }
                    />

                    <CardBody className="space-y-5">
                        {topError ? <Alert>{topError}</Alert> : null}

                        {isSite ? (
                            <p className="text-sm leading-relaxed text-ink-mute">
                                এখানে যা লিখবেন তা সেই পাতাগুলোতে ব্যবহার হবে যেখানে নিজস্ব কিছু
                                লেখা নেই — প্রাণী ও ক্যাটাগরির পাতাগুলো সহ। কোনো পাতায় আলাদা কিছু
                                লিখলে সেটিই আগে যাবে।
                            </p>
                        ) : null}

                        {!isSite ? (
                            <Field
                                label="মেটা টাইটেল"
                                htmlFor="seo-title"
                                error={errors.title}
                                hint={
                                    <Counter
                                        value={row.title}
                                        limit={LIMITS.title}
                                        empty="খালি রাখলে পাতার নিজের টাইটেল ব্যবহার হবে"
                                    />
                                }
                            >
                                <Input
                                    id="seo-title"
                                    value={row.title}
                                    invalid={Boolean(errors.title)}
                                    onChange={(e) => patch({ title: e.target.value })}
                                    placeholder="যেমন: প্রিমিয়াম ও এক্সোটিক পাখির কালেকশন — ঢাকা"
                                />
                            </Field>
                        ) : null}

                        <Field
                            label="মেটা ডেসক্রিপশন"
                            htmlFor="seo-description"
                            error={errors.description}
                            hint={
                                <Counter
                                    value={row.description}
                                    limit={LIMITS.description}
                                    empty={
                                        isSite
                                            ? "যেসব পাতায় নিজস্ব ডেসক্রিপশন নেই, সেখানে এটি যাবে"
                                            : "খালি রাখলে পাতার নিজের লেখা ব্যবহার হবে"
                                    }
                                />
                            }
                        >
                            <Textarea
                                id="seo-description"
                                rows={3}
                                value={row.description}
                                invalid={Boolean(errors.description)}
                                onChange={(e) => patch({ description: e.target.value })}
                            />
                        </Field>

                        {!isSite ? (
                            <Field
                                label="ক্যাননিক্যাল ঠিকানা"
                                htmlFor="seo-canonical"
                                error={errors.canonical}
                                hint={`খালি রাখলে ${baseUrl}${active} ব্যবহার হবে। / দিয়ে শুরু করুন, অথবা পুরো https:// ঠিকানা দিন।`}
                            >
                                <Input
                                    id="seo-canonical"
                                    value={row.canonical}
                                    invalid={Boolean(errors.canonical)}
                                    onChange={(e) => patch({ canonical: e.target.value })}
                                    placeholder={active}
                                    dir="ltr"
                                />
                            </Field>
                        ) : null}

                        <Field
                            label="মেটা কিওয়ার্ড"
                            htmlFor="seo-keywords"
                            error={errors.keywords}
                            hint="কমা দিয়ে আলাদা করুন, সর্বোচ্চ ২০টি। মনে রাখবেন — Google ২০০৯ সাল থেকে এই ট্যাগ ব্যবহার করে না, তাই র‍্যাঙ্কিংয়ে এর প্রভাব নেই।"
                        >
                            <Input
                                id="seo-keywords"
                                value={
                                    Array.isArray(row.keywords)
                                        ? row.keywords.join(", ")
                                        : row.keywords
                                }
                                invalid={Boolean(errors.keywords)}
                                onChange={(e) => patch({ keywords: e.target.value })}
                                placeholder="ম্যাকাও, এক্সোটিক পাখি, ঢাকা"
                                dir="ltr"
                            />
                        </Field>

                        <OgImageField
                            value={row.ogImage}
                            baseUrl={baseUrl}
                            onChange={(ogImage) => patch({ ogImage })}
                        />

                        {!isSite ? (
                            <div className="space-y-3 border-t border-line pt-5">
                                <Checkbox
                                    checked={row.noindex}
                                    onChange={(e) => patch({ noindex: e.target.checked })}
                                    label="সার্চ ইঞ্জিনে দেখাবে না (noindex)"
                                    hint="Google এই পাতাটি ফলাফলে দেখাবে না। সাইটম্যাপ থেকেও বাদ পড়বে।"
                                />
                                <Checkbox
                                    checked={row.nofollow}
                                    onChange={(e) => patch({ nofollow: e.target.checked })}
                                    label="এই পাতার লিংকগুলো অনুসরণ করবে না (nofollow)"
                                    hint="সাধারণত দরকার হয় না।"
                                />
                            </div>
                        ) : null}

                        <SerpPreview
                            baseUrl={baseUrl}
                            path={active}
                            isSite={isSite}
                            row={row}
                        />
                    </CardBody>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-[1.125rem] py-3.5">
                        <span className="text-xs text-ink-mute" aria-live="polite">
                            {flash ? (
                                <span className="inline-flex items-center gap-1.5 text-leaf">
                                    <Check size={14} strokeWidth={2} aria-hidden />
                                    {flash}
                                </span>
                            ) : dirty(active) ? (
                                "সেভ করা হয়নি"
                            ) : (
                                ""
                            )}
                        </span>

                        <Button tone="primary" onClick={save} disabled={busy || !dirty(active)}>
                            {busy ? (
                                <LoaderCircle size={14} className="animate-spin" aria-hidden />
                            ) : null}
                            সেভ করুন
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */

function RailItem({ active, dirty, noindex, icon: Icon, label, hint, onClick }) {
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                aria-current={active ? "true" : undefined}
                className={cn(
                    "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors",
                    active ? "bg-brand-wash text-ink" : "text-ink-soft hover:bg-linen",
                )}
            >
                {Icon ? (
                    <Icon size={15} strokeWidth={1.75} aria-hidden className="shrink-0" />
                ) : null}
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{label}</span>
                    {hint ? (
                        <span className="block truncate text-xs text-ink-mute" dir="ltr">
                            {hint}
                        </span>
                    ) : null}
                </span>
                {noindex ? (
                    <span className="pnl-chip h-5 shrink-0 px-1.5 text-[10px]">noindex</span>
                ) : null}
                {dirty ? (
                    <span
                        aria-label="সেভ করা হয়নি"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                    />
                ) : null}
            </button>
        </li>
    );
}

/**
 * Live character count against the RECOMMENDED length.
 *
 * Amber past the limit, never blocking — see the note at the top of the file.
 */
function Counter({ value, limit, empty }) {
    const length = (value ?? "").trim().length;
    if (length === 0) return <>{empty}</>;

    return (
        <span className={cn(length > limit && "text-[#8a5a12]")}>
            {length}/{limit} অক্ষর
            {length > limit ? " — সার্চ ফলাফলে কেটে যেতে পারে" : ""}
        </span>
    );
}

/**
 * Single-image picker for og:image.
 *
 * Not `ImageUploader`: that one manages an ordered list with a cover pick and
 * alt text per image. This field holds exactly one path, so the multi-image
 * component would be a list of one with two controls that do nothing.
 *
 * It posts to the same `/api/admin/upload` endpoint with `folder: "seo"`, so
 * the file goes through the same sharp pipeline — EXIF stripped, capped at
 * 2000px, content-hashed, written to /public/uploads/seo.
 *
 * Removing only clears the field. The file stays on disk, exactly as in the
 * animal form: upload names are content-hashed, so the same image referenced
 * from another page is the same file, and unlinking it here would break that
 * page. Cleanup is `scripts/cleanup-uploads.js`.
 */
function OgImageField({ value, baseUrl, onChange }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function upload(fileList) {
        const file = Array.from(fileList ?? [])[0];
        if (!file || busy) return;

        setBusy(true);
        setError("");

        const form = new FormData();
        form.set("folder", "seo");
        form.append("files", file);

        try {
            const res = await fetch("/api/admin/upload", { method: "POST", body: form });
            const data = await res.json().catch(() => ({}));

            if (data.files?.[0]?.path) onChange(data.files[0].path);
            else setError(data.errors?.[0]?.error ?? data.error ?? "আপলোড করা যায়নি");
        } catch {
            setError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন");
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    return (
        <Field
            label="শেয়ার ছবি (og:image)"
            error={error}
            hint="WhatsApp বা Facebook-এ লিংক শেয়ার করলে এই ছবিটি দেখাবে। ১২০০×৬৩০ পিক্সেল সবচেয়ে ভালো।"
        >
            <div className="flex flex-wrap items-start gap-3">
                {value ? (
                    <div className="relative h-20 w-38 shrink-0 overflow-hidden rounded-sm border border-line bg-linen-deep">
                        <Image
                            src={value}
                            alt=""
                            fill
                            sizes="152px"
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => upload(e.target.files)}
                    />
                    <Button size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
                        {busy ? (
                            <LoaderCircle size={14} className="animate-spin" aria-hidden />
                        ) : (
                            <ImagePlus size={14} strokeWidth={1.75} aria-hidden />
                        )}
                        {value ? "বদলান" : "ছবি দিন"}
                    </Button>

                    {value ? (
                        <Button size="sm" tone="danger" onClick={() => onChange("")}>
                            <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                            সরান
                        </Button>
                    ) : null}
                </div>
            </div>

            {value ? (
                <p className="mt-2 truncate text-xs text-ink-mute" dir="ltr">
                    {baseUrl}
                    {value}
                </p>
            ) : null}
        </Field>
    );
}

/**
 * A rough search-result preview.
 *
 * Rough is the right word and it is stated in the UI: Google rewrites titles
 * and descriptions for a large share of results, and truncation is by pixel
 * width in the user's own font, not by character count. This is here so the
 * owner can see the shape of what they wrote, not to promise an outcome.
 */
function SerpPreview({ baseUrl, path, isSite, row }) {
    if (isSite) return null;

    const title = row.title?.trim() || "(পাতার নিজের টাইটেল)";
    const description = row.description?.trim() || "(পাতার নিজের ডেসক্রিপশন)";
    const url = row.canonical?.trim()
        ? row.canonical.startsWith("http")
            ? row.canonical
            : `${baseUrl}${row.canonical}`
        : `${baseUrl}${path}`;

    return (
        <div className="border-t border-line pt-5">
            <p className="pnl-label">সার্চ ফলাফলে যেমন দেখাতে পারে</p>
            <div className="mt-2.5 rounded-sm border border-line bg-linen px-4 py-3.5">
                <p className="truncate text-xs text-ink-mute" dir="ltr">
                    {url}
                </p>
                <p className="mt-1 truncate text-[17px] leading-snug text-brand-deep">{title}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {description}
                </p>
                {row.noindex ? (
                    <p className="mt-2.5 text-xs text-[#8a5a12]">
                        noindex চালু — এই পাতাটি আসলে সার্চ ফলাফলে দেখাবে না।
                    </p>
                ) : null}
            </div>
            <p className="pnl-hint">
                আনুমানিক। Google প্রায়ই নিজে থেকে টাইটেল বা ডেসক্রিপশন বদলে দেখায়।
            </p>
        </div>
    );
}
