"use client";

import { useRef, useState } from "react";
import { Check, LoaderCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { site, whatsappLink } from "@/lib/site";
import { Button } from "@/components/site/ui";
import {
    Field,
    FormErrorSummary,
    Honeypot,
    inputCls,
} from "@/components/site/form-ui";

const SLOTS = [
    ["morning", "সকাল"],
    ["afternoon", "দুপুর"],
    ["evening", "বিকেল"],
];

/** Tomorrow, as yyyy-mm-dd in Asia/Dhaka — the earliest a visit can be booked. */
function tomorrow() {
    const d = new Date(Date.now() + 86_400_000);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(d);
}

/**
 * The public inquiry form.
 *
 * Posts to `/api/inquiries`, which is a discriminated union on `kind` — so the
 * toggle at the top is not cosmetic, it chooses which schema the server
 * validates against. `general` requires a message of at least 5 characters;
 * `visit` requires a future date and a slot and ignores the message length.
 * Sending the wrong shape gets a 400 with a field map, so the two branches
 * submit different payloads rather than one superset.
 *
 * Three things here exist because the server does them and the UI has to
 * match:
 *
 *  · `website` is the honeypot. It is hidden from sight, from assistive tech
 *    and from Tab — and it is *read from the DOM* on submit. It used to be
 *    hard-coded to `""` in the payload, which made it decorative: the body is
 *    built from React state, so a bot that filled every input still sent an
 *    empty `website` and sailed through.
 *  · A 429 is a normal outcome, not a crash — the route rate-limits by IP and
 *    by phone/email. It gets its own message and offers WhatsApp instead of
 *    telling the visitor to try again into a wall.
 *  · Field errors come back as `{ field: message }`. They render inline *and*
 *    in a focused summary, because on a phone the invalid field is often off
 *    screen after a failed submit.
 */
export default function InquiryForm({ className }) {
    const [kind, setKind] = useState("general");
    const [values, setValues] = useState({
        name: "",
        phone: "",
        email: "",
        message: "",
        visitDate: "",
        visitSlot: "morning",
    });
    const [fields, setFields] = useState({});
    const [error, setError] = useState("");
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const summaryRef = useRef(null);
    const potRef = useRef(null);

    const set = (patch) => setValues((v) => ({ ...v, ...patch }));

    async function submit(event) {
        event.preventDefault();
        if (sending) return;

        setSending(true);
        setError("");
        setFields({});

        const payload = {
            kind,
            name: values.name,
            phone: values.phone,
            email: values.email,
            message: values.message,
            website: potRef.current?.value ?? "", // honeypot — read, not assumed
            source: typeof window !== "undefined" ? window.location.pathname : "",
            ...(kind === "visit"
                ? { visitDate: values.visitDate, visitSlot: values.visitSlot }
                : {}),
        };

        try {
            const res = await fetch("/api/inquiries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));

            if (res.status === 429) {
                setError(data.error || "একটু পরে আবার চেষ্টা করুন।");
                setSending(false);
                requestAnimationFrame(() => summaryRef.current?.focus());
                return;
            }

            if (!res.ok || !data.ok) {
                setError(data.error || "পাঠানো যায়নি, আবার চেষ্টা করুন");
                setFields(data.fields || {});
                setSending(false);
                requestAnimationFrame(() => summaryRef.current?.focus());
                return;
            }

            setDone(true);
        } catch {
            setError("সার্ভারের সাথে সংযোগ করা যায়নি");
            setSending(false);
            requestAnimationFrame(() => summaryRef.current?.focus());
        }
    }

    if (done) {
        return (
            <div
                className={cn("rounded-md border border-leaf/40 bg-leaf-wash p-7", className)}
                role="status"
            >
                <Check size={22} strokeWidth={2} aria-hidden className="text-leaf" />
                <h2 className="mt-4 font-display text-title text-ink">
                    বার্তা পৌঁছে গেছে
                </h2>
                <p className="measure mt-3 text-sm leading-relaxed text-ink-soft">
                    ধন্যবাদ। সাধারণত একই দিনে উত্তর দেওয়া হয়। জরুরি হলে সরাসরি ফোন বা
                    WhatsApp করতে পারেন — {site.phone}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                        as="a"
                        href={whatsappLink(
                            `আসসালামু আলাইকুম। এইমাত্র ওয়েবসাইট থেকে বার্তা পাঠিয়েছি।`
                        )}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                        WhatsApp-এ কথা বলুন
                    </Button>
                    <Button href="/showcase" tone="line">
                        কালেকশন দেখুন
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={submit} noValidate className={className}>
            {/* ---------- kind ---------- */}
            <fieldset>
                <legend className="text-micro uppercase text-ink-mute">
                    কী নিয়ে যোগাযোগ
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                    {[
                        ["general", "সাধারণ প্রশ্ন"],
                        ["visit", "ফার্ম ভিজিট"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setKind(value)}
                            aria-pressed={kind === value}
                            className={cn(
                                "inline-flex min-h-11 items-center rounded-xs border px-4 text-sm transition-colors",
                                kind === value
                                    ? "border-ink bg-ink text-linen"
                                    : "border-field text-ink-soft hover:border-ink hover:text-ink"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </fieldset>

            <FormErrorSummary
                ref={summaryRef}
                error={error}
                fields={fields}
                prefix="iq"
                className="mt-6"
            />

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field id="iq-name" label="আপনার নাম" error={fields.name} required>
                    <input
                        id="iq-name"
                        value={values.name}
                        onChange={(e) => set({ name: e.target.value })}
                        autoComplete="name"
                        required
                        aria-invalid={fields.name ? "true" : undefined}
                        aria-describedby={fields.name ? "iq-name-err" : undefined}
                        className={inputCls(fields.name)}
                    />
                </Field>

                <Field
                    id="iq-phone"
                    label="মোবাইল নম্বর"
                    error={fields.phone}
                    hint="যেমন ০১৭XXXXXXXX"
                    required
                >
                    <input
                        id="iq-phone"
                        value={values.phone}
                        onChange={(e) => set({ phone: e.target.value })}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        aria-invalid={fields.phone ? "true" : undefined}
                        aria-describedby={fields.phone ? "iq-phone-err" : undefined}
                        className={cn(inputCls(fields.phone), "tnum")}
                    />
                </Field>

                <Field
                    id="iq-email"
                    label="ইমেইল"
                    error={fields.email}
                    hint="দিলে কনফার্মেশন মেইল পাবেন"
                    className="sm:col-span-2"
                >
                    <input
                        id="iq-email"
                        value={values.email}
                        onChange={(e) => set({ email: e.target.value })}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        aria-invalid={fields.email ? "true" : undefined}
                        aria-describedby={fields.email ? "iq-email-err" : undefined}
                        className={inputCls(fields.email)}
                    />
                </Field>

                {kind === "visit" ? (
                    <>
                        <Field
                            id="iq-visitDate"
                            label="কোন তারিখে আসতে চান"
                            error={fields.visitDate}
                            required
                        >
                            <input
                                id="iq-visitDate"
                                value={values.visitDate}
                                onChange={(e) => set({ visitDate: e.target.value })}
                                type="date"
                                min={tomorrow()}
                                required
                                aria-invalid={fields.visitDate ? "true" : undefined}
                                className={cn(inputCls(fields.visitDate), "tnum")}
                            />
                        </Field>

                        <Field id="iq-visitSlot" label="কখন" error={fields.visitSlot} required>
                            <select
                                id="iq-visitSlot"
                                value={values.visitSlot}
                                onChange={(e) => set({ visitSlot: e.target.value })}
                                className={inputCls(fields.visitSlot)}
                            >
                                {SLOTS.map(([v, label]) => (
                                    <option key={v} value={v}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </>
                ) : null}

                <Field
                    id="iq-message"
                    label={kind === "visit" ? "কিছু বলার থাকলে" : "কী জানতে চান"}
                    error={fields.message}
                    required={kind === "general"}
                    className="sm:col-span-2"
                >
                    <textarea
                        id="iq-message"
                        value={values.message}
                        onChange={(e) => set({ message: e.target.value })}
                        rows={5}
                        required={kind === "general"}
                        placeholder={
                            kind === "visit"
                                ? "কোন প্রাণী দেখতে চান, কতজন আসবেন…"
                                : "কোন ব্রিড খুঁজছেন, বাজেট কত…"
                        }
                        aria-invalid={fields.message ? "true" : undefined}
                        aria-describedby={fields.message ? "iq-message-err" : undefined}
                        className={cn(inputCls(fields.message), "min-h-32 resize-y py-3 leading-relaxed")}
                    />
                </Field>
            </div>

            <Honeypot ref={potRef} id="iq-website" />

            <div className="mt-7 flex flex-wrap items-center gap-4">
                <button type="submit" disabled={sending} className="btn-solid px-7">
                    {sending ? (
                        <>
                            <LoaderCircle size={16} className="animate-spin" aria-hidden />
                            পাঠানো হচ্ছে…
                        </>
                    ) : (
                        "বার্তা পাঠান"
                    )}
                </button>
                <p className="text-xs text-ink-mute">
                    আপনার নম্বর শুধু যোগাযোগের জন্য ব্যবহার হবে।
                </p>
            </div>
        </form>
    );
}
