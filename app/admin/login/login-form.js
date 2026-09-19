"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { Alert, Field, Input } from "@/components/admin/ui";

export default function LoginForm({ next }) {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [reveal, setReveal] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const [fields, setFields] = useState({});

    async function handleSubmit(event) {
        event.preventDefault();
        if (pending) return;

        setPending(true);
        setError("");
        setFields({});

        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.ok) {
                setError(data.error || "লগইন ব্যর্থ হয়েছে");
                setFields(data.fields || {});
                setPassword("");
                setPending(false);
                return;
            }

            // Keep the spinner up through navigation — the session cookie is set,
            // so clearing `pending` here would just flash an idle form.
            router.replace(next || "/admin");
            router.refresh();
        } catch {
            setError("সার্ভারের সাথে সংযোগ করা যায়নি");
            setPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Field label="ইমেইল" error={fields.email} htmlFor="email">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    invalid={Boolean(fields.email)}
                    placeholder="owner@example.com"
                />
            </Field>

            <Field label="পাসওয়ার্ড" error={fields.password} htmlFor="password">
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={reveal ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        invalid={Boolean(fields.password)}
                        className="pr-10"
                        placeholder="••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setReveal((v) => !v)}
                        aria-label={reveal ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-ink-mute transition-colors hover:bg-linen-deep hover:text-ink"
                    >
                        {reveal ? (
                            <EyeOff size={16} strokeWidth={1.75} aria-hidden />
                        ) : (
                            <Eye size={16} strokeWidth={1.75} aria-hidden />
                        )}
                    </button>
                </div>
            </Field>

            {error ? <Alert>{error}</Alert> : null}

            <button
                type="submit"
                disabled={pending}
                className="pnl-btn pnl-btn-primary h-11 w-full"
            >
                {pending ? (
                    <>
                        <LoaderCircle size={16} className="animate-spin" aria-hidden />
                        যাচাই করা হচ্ছে…
                    </>
                ) : (
                    <>
                        <LogIn size={16} strokeWidth={2} aria-hidden />
                        প্রবেশ করুন
                    </>
                )}
            </button>
        </form>
    );
}
