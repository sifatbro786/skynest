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

/**
 * "Ask about this animal" — the inline form on an animal page.
 *
 * This is the only place in the app that can create an inquiry with
 * `kind: "animal"`. The schema branch (`animalInquirySchema`) and the admin
 * inbox's "প্রাণী সম্পর্কে" tab both already existed; without this component
 * that tab is permanently empty.
 *
 * Deliberately shorter than the `/contact` form. `animalInquirySchema`
 * requires only `animal`, `name` and `phone` — the message is optional,
 * because the animal id already says what the inquiry is about. Asking a
 * buyer to write a paragraph explaining that they want the animal whose page
 * they are standing on is friction for no information.
 *
 * `animalId` is sent, `animalLabel` is not: the route snapshots the title
 * server-side from the id, so a forged label cannot reach the inbox, and a
 * bad id comes back as a 400 rather than a saved lead pointing nowhere.
 */
export default function AnimalInquiryForm({ animalId, animalTitle, className }) {
    const [values, setValues] = useState({
        name: "",
        phone: "",
        email: "",
        message: "",
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
            kind: "animal",
            animal: animalId,
            name: values.name,
            phone: values.phone,
            email: values.email,
            message: values.message,
            // Read from the DOM, not hard-coded — see Honeypot's note.
            website: potRef.current?.value ?? "",
            source: typeof window !== "undefined" ? window.location.pathname : "",
        };

        try {
            const res = await fetch("/api/inquiries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));

            // 429 is a normal outcome here, not a crash: the route limits by IP
            // and by phone/email. It gets the server's own message and an
            // alternative route out rather than "try again" into a wall.
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
                className={cn(
                    "rounded-md border border-leaf/40 bg-leaf-wash p-6 sm:p-7",
                    className
                )}
                role="status"
            >
                <Check size={22} strokeWidth={2} aria-hidden className="text-leaf" />
                <p className="mt-4 font-display text-title text-ink">বার্তা পৌঁছে গেছে</p>
                <p className="measure mt-3 text-sm leading-relaxed text-ink-soft">
                    ধন্যবাদ। &ldquo;{animalTitle}&rdquo; নিয়ে আপনার আগ্রহের কথা জানানো হয়েছে —
                    সাধারণত একই দিনে উত্তর দেওয়া হয়। জরুরি হলে সরাসরি ফোন করুন,{" "}
                    <span className="tnum">{site.phone}</span>।
                </p>
                <div className="mt-6">
                    <Button
                        as="a"
                        href={whatsappLink(
                            `আসসালামু আলাইকুম। এইমাত্র "${animalTitle}" নিয়ে ওয়েবসাইট থেকে বার্তা পাঠিয়েছি।`
                        )}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                        WhatsApp-এ কথা বলুন
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={submit} noValidate className={className}>
            <FormErrorSummary
                ref={summaryRef}
                error={error}
                fields={fields}
                prefix="aq"
                className="mb-6"
            />

            <div className="grid gap-5 sm:grid-cols-2">
                <Field id="aq-name" label="আপনার নাম" error={fields.name} required>
                    <input
                        id="aq-name"
                        value={values.name}
                        onChange={(e) => set({ name: e.target.value })}
                        autoComplete="name"
                        required
                        aria-invalid={fields.name ? "true" : undefined}
                        aria-describedby={fields.name ? "aq-name-err" : undefined}
                        className={inputCls(fields.name)}
                    />
                </Field>

                <Field
                    id="aq-phone"
                    label="মোবাইল নম্বর"
                    error={fields.phone}
                    hint="যেমন ০১৭XXXXXXXX"
                    required
                >
                    <input
                        id="aq-phone"
                        value={values.phone}
                        onChange={(e) => set({ phone: e.target.value })}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        aria-invalid={fields.phone ? "true" : undefined}
                        aria-describedby={fields.phone ? "aq-phone-err" : undefined}
                        className={cn(inputCls(fields.phone), "tnum")}
                    />
                </Field>

                <Field
                    id="aq-email"
                    label="ইমেইল"
                    error={fields.email}
                    hint="ঐচ্ছিক — দিলে কনফার্মেশন মেইল পাবেন"
                    className="sm:col-span-2"
                >
                    <input
                        id="aq-email"
                        value={values.email}
                        onChange={(e) => set({ email: e.target.value })}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        aria-invalid={fields.email ? "true" : undefined}
                        aria-describedby={fields.email ? "aq-email-err" : undefined}
                        className={inputCls(fields.email)}
                    />
                </Field>

                <Field
                    id="aq-message"
                    label="কিছু জিজ্ঞেস করার থাকলে"
                    error={fields.message}
                    className="sm:col-span-2"
                >
                    <textarea
                        id="aq-message"
                        value={values.message}
                        onChange={(e) => set({ message: e.target.value })}
                        rows={3}
                        placeholder="দাম নিয়ে আলোচনা, কবে দেখতে আসতে পারি…"
                        aria-invalid={fields.message ? "true" : undefined}
                        aria-describedby={fields.message ? "aq-message-err" : undefined}
                        className={cn(
                            inputCls(fields.message),
                            "min-h-24 resize-y py-3 leading-relaxed"
                        )}
                    />
                </Field>
            </div>

            <Honeypot ref={potRef} id="aq-website" />

            <div className="mt-6 flex flex-wrap items-center gap-4">
                <button type="submit" disabled={sending} className="btn-solid px-7">
                    {sending ? (
                        <>
                            <LoaderCircle size={16} className="animate-spin" aria-hidden />
                            পাঠানো হচ্ছে…
                        </>
                    ) : (
                        "আগ্রহ জানান"
                    )}
                </button>
                <p className="text-xs text-ink-mute">
                    কোনো অগ্রিম পেমেন্ট লাগে না। নম্বরটি শুধু যোগাযোগের জন্য।
                </p>
            </div>
        </form>
    );
}
