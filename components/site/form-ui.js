import { cn } from "@/lib/utils";

/**
 * Shared field chrome for the public forms.
 *
 * Extracted because there are now two of them — `/contact` and the inline
 * form on an animal page — and they post to the same endpoint, which returns
 * the same `{ field: message }` map. Two private copies of the error styling
 * would drift the moment one of them gets a fix.
 *
 * No hooks and no `"use client"`: these are plain markup, and the client
 * components that import them pull them into their own bundle.
 */

/** Alert red is used in three places; it is defined once here. */
export const ALERT = {
    border: "#d9b6aa",
    wash: "#f7ece8",
    text: "#7d3220",
    strong: "#a4402a",
    field: "#b4573f",
};

export function inputCls(hasError) {
    return cn(
        "h-11 w-full rounded-xs border bg-paper px-3 text-sm text-ink placeholder:text-ink-mute/70 focus:outline-none",
        hasError ? "border-[#b4573f] focus:border-[#a4402a]" : "border-field focus:border-brand",
    );
}

/**
 * Label above, control, then either the error or the hint below.
 *
 * Error replaces hint rather than stacking under it: two lines of small text
 * under a 44px input is where a phone form starts to feel like paperwork, and
 * the hint has already done its job by the time the field is wrong.
 */
export function Field({ id, label, hint, error, required, className, children }) {
    return (
        <div className={cn("min-w-0", className)}>
            <label htmlFor={id} className="text-micro block uppercase text-ink-mute">
                {label}
                {required ? <span className="text-clay"> *</span> : null}
            </label>
            <div className="mt-2">{children}</div>
            {error ? (
                <p id={`${id}-err`} className="mt-1.5 text-xs text-[#a4402a]">
                    {error}
                </p>
            ) : hint ? (
                <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>
            ) : null}
        </div>
    );
}

/**
 * The focusable summary shown after a failed submit.
 *
 * WCAG 3.3.1 is satisfied by the inline errors alone, but on a phone the
 * invalid field is usually off screen once the page scrolls back to the top,
 * so the summary is what the visitor actually reads. Each entry links to its
 * field; `tabIndex={-1}` makes the block itself focusable so the caller can
 * move focus here without adding it to the tab order.
 *
 * @param {object} props
 * @param {string} [props.error] the top-level message (rate limit, network…)
 * @param {Record<string,string>} [props.fields] the server's field map
 * @param {string} props.prefix the caller's field id prefix, e.g. "aq"
 */
export function FormErrorSummary({ ref, error, fields = {}, prefix, className }) {
    const list = Object.entries(fields);
    if (!error && list.length === 0) return null;

    return (
        <div
            ref={ref}
            tabIndex={-1}
            role="alert"
            className={cn(
                "rounded-sm border border-[#d9b6aa] bg-[#f7ece8] px-4 py-3 focus:outline-2 focus:outline-offset-2 focus:outline-[#a4402a]",
                className,
            )}
        >
            <p className="text-sm font-medium text-[#7d3220]">
                {error || "কিছু তথ্য ঠিক করতে হবে"}
            </p>
            {list.length > 0 ? (
                <ul className="mt-2 space-y-1">
                    {list.map(([field, message]) => (
                        <li key={field} className="text-xs text-[#7d3220]">
                            <a
                                href={`#${prefix}-${field}`}
                                className="underline underline-offset-2"
                            >
                                {message}
                            </a>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

/**
 * The honeypot.
 *
 * Takes a ref and is read on submit — it is NOT decorative. A field that is
 * rendered but never read cannot catch anything, because the payload is built
 * from component state rather than from the DOM, so a bot that fills every
 * input still submits an empty `website`.
 *
 * Hidden from sight, from assistive tech, and from Tab.
 */
export function Honeypot({ ref, id }) {
    return (
        <div aria-hidden className="hidden">
            <label htmlFor={id}>Website</label>
            <input ref={ref} id={id} name="website" tabIndex={-1} autoComplete="off" />
        </div>
    );
}
