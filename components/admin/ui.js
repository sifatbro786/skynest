import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared admin controls.
 *
 * These are thin wrappers over the `.ad-*` classes in `app/globals.css`, not a
 * component framework. The point is that one screen cannot quietly drift into
 * its own input height or its own button colour — a panel where the "save"
 * button looks different on three pages is the thing that reads amateur, far
 * more than any individual styling choice.
 *
 * Server-safe: no hooks, no "use client". Client screens import them too.
 */

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function Card({ className, children, ...rest }) {
    return (
        <section className={cn("pnl-card", className)} {...rest}>
            {children}
        </section>
    );
}

export function CardHead({ title, hint, actions, className }) {
    return (
        <header className={cn("pnl-card-head", className)}>
            <div className="min-w-0">
                <h2 className="pnl-h2">{title}</h2>
                {hint ? <p className="pnl-hint mt-0.5">{hint}</p> : null}
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
        </header>
    );
}

export function CardBody({ className, children }) {
    return <div className={cn("pnl-card-body", className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

/**
 * Label + control + one message slot.
 *
 * `error` wins over `hint` on purpose: showing both pushes the field below the
 * fold on a phone, and the hint is advice the person no longer needs once the
 * server has told them what is actually wrong.
 */
export function Field({ label, hint, error, required, htmlFor, className, children }) {
    return (
        <div className={cn("min-w-0", className)}>
            <label className="pnl-label" htmlFor={htmlFor}>
                {label}
                {required ? (
                    <span className="text-[#a4402a]" aria-hidden>
                        {" *"}
                    </span>
                ) : null}
            </label>
            <div className="mt-1.5">{children}</div>
            {error ? (
                <span className="pnl-error" role="alert">
                    {error}
                </span>
            ) : hint ? (
                <span className="pnl-hint">{hint}</span>
            ) : null}
        </div>
    );
}

export function Input({ className, invalid, ...rest }) {
    return (
        <input
            className={cn("pnl-input", className)}
            aria-invalid={invalid ? "true" : undefined}
            {...rest}
        />
    );
}

export function Textarea({ className, invalid, ...rest }) {
    return (
        <textarea
            className={cn("pnl-textarea", className)}
            aria-invalid={invalid ? "true" : undefined}
            {...rest}
        />
    );
}

/** `options` is an array of [value, label] pairs. */
export function Select({ options = [], className, children, ...rest }) {
    return (
        <select className={cn("pnl-select", className)} {...rest}>
            {children ??
                options.map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
        </select>
    );
}

export function Checkbox({ label, hint, className, ...rest }) {
    return (
        <label
            className={cn(
                "flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft",
                className
            )}
        >
            <input type="checkbox" className="pnl-check mt-0.5" {...rest} />
            <span className="min-w-0">
                {label}
                {hint ? <span className="pnl-hint">{hint}</span> : null}
            </span>
        </label>
    );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

const TONE = {
    primary: "pnl-btn-primary",
    ghost: "pnl-btn-ghost",
    danger: "pnl-btn-danger",
};

export function Button({ tone = "ghost", size, className, as, href, ...rest }) {
    const classes = cn(
        "pnl-btn",
        TONE[tone] ?? TONE.ghost,
        size === "sm" && "pnl-btn-sm",
        className
    );

    if (href) {
        const Tag = as ?? Link;
        return <Tag href={href} className={classes} {...rest} />;
    }
    return <button type="button" className={classes} {...rest} />;
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function Alert({ tone = "error", className, children }) {
    const tones = {
        error: "border-[#d9b6aa] bg-[#f7ece8] text-[#7d3220]",
        warn: "border-clay/40 bg-clay-wash text-ink-soft",
        info: "border-line-strong bg-brand-wash text-ink-soft",
    };
    return (
        <p
            role="alert"
            className={cn(
                "rounded-sm border px-3.5 py-2.5 text-sm",
                tones[tone] ?? tones.error,
                className
            )}
        >
            {children}
        </p>
    );
}

/**
 * Empty states carry the next action, not just an apology. "Nothing here" with
 * no way forward is the most common dead end in a small admin panel.
 */
export function EmptyState({ title, hint, action, className }) {
    return (
        <div
            className={cn(
                "rounded-md border border-dashed border-line-strong bg-paper px-6 py-10 text-center",
                className
            )}
        >
            <p className="text-sm font-medium text-ink">{title}</p>
            {hint ? (
                <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-mute">{hint}</p>
            ) : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

/**
 * `hrefFor(page)` keeps the URL-building where the filters live; this only
 * decides which page numbers are worth rendering.
 */
export function Pagination({ page, pages, hrefFor, className }) {
    if (pages <= 1) return null;

    const window = [];
    for (let p = 1; p <= pages; p += 1) {
        if (p === 1 || p === pages || Math.abs(p - page) <= 2) window.push(p);
    }

    return (
        <nav
            aria-label="পৃষ্ঠা"
            className={cn("flex flex-wrap items-center gap-1", className)}
        >
            {window.map((p, index) => (
                <span key={p} className="flex items-center gap-1">
                    {index > 0 && p - window[index - 1] > 1 ? (
                        <span className="px-1.5 text-ink-mute" aria-hidden>
                            …
                        </span>
                    ) : null}
                    <Link
                        href={hrefFor(p)}
                        aria-current={p === page ? "page" : undefined}
                        className={cn(
                            "pnl-btn pnl-btn-sm pnl-num min-w-8 justify-center",
                            p === page ? "pnl-btn-primary" : "pnl-btn-ghost"
                        )}
                    >
                        {p}
                    </Link>
                </span>
            ))}
        </nav>
    );
}
