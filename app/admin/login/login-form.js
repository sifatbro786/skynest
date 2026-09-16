"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

/**
 * Underlined inputs rather than boxed-and-rounded ones: the whole design
 * system keeps radii at 2–8px and leans on hairlines, so a stack of
 * rounded-lg boxes would be the one generic-looking screen in the product.
 */
const FIELD =
  "w-full border-0 border-b border-line bg-transparent px-0 py-2.5 text-ink " +
  "placeholder:text-ink-mute/70 focus:border-brand focus:outline-none " +
  "focus:ring-0 transition-colors";

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
    <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-7">
      <div>
        <label
          htmlFor="email"
          className="text-micro block uppercase text-ink-mute"
        >
          ইমেইল
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(fields.email)}
          className={`${FIELD} mt-1`}
          placeholder="owner@example.com"
        />
        {fields.email ? (
          <p className="mt-1.5 text-xs text-clay">{fields.email}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-micro block uppercase text-ink-mute"
        >
          পাসওয়ার্ড
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={reveal ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fields.password)}
            className={`${FIELD} mt-1 pr-10`}
            placeholder="••••••"
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-ink-mute transition-colors hover:text-ink"
          >
            {reveal ? (
              <EyeOff size={17} strokeWidth={1.75} aria-hidden />
            ) : (
              <Eye size={17} strokeWidth={1.75} aria-hidden />
            )}
          </button>
        </div>
        {fields.password ? (
          <p className="mt-1.5 text-xs text-clay">{fields.password}</p>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          aria-live="polite"
          className="border-l-2 border-clay bg-clay-wash px-3.5 py-2.5 text-sm text-ink-soft"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xs bg-ink px-6 text-sm font-medium text-linen transition-colors duration-200 hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <LoaderCircle size={16} className="animate-spin" aria-hidden />
            যাচাই করা হচ্ছে…
          </>
        ) : (
          "প্রবেশ করুন"
        )}
      </button>
    </form>
  );
}
