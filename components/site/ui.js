import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn, toBanglaDigits } from "@/lib/utils";

/**
 * Editorial primitives for the public site.
 *
 * Server-safe on purpose — no hooks, no "use client". These are the pieces
 * every public page composes from, so that "what a section heading looks like"
 * is answered once instead of per page. The panel has its own set in
 * components/admin/ui.js; the two never mix.
 */

/* ------------------------------------------------------------------ */
/* Structure                                                           */
/* ------------------------------------------------------------------ */

/**
 * A page section on the editorial gutter.
 *
 * `.shell` is asymmetric by design (see globals.css) — the content reads as a
 * column, not a centred block, which is the PRD's first layout rule.
 */
export function Section({ id, as = "section", tight, className, children }) {
    const Tag = as;
    return (
        <Tag
            id={id}
            className={cn(
                "shell clears-header",
                tight ? "py-12 md:py-16" : "py-16 md:py-24 lg:py-28",
                className
            )}
        >
            {children}
        </Tag>
    );
}

/**
 * Numbered section marker + heading, left aligned, with an optional action
 * pushed to the far edge.
 *
 * The number is what replaces the banned centred pill badge: it gives the
 * section a place in a sequence rather than a decorative label. Bangla
 * numerals, because this is the public side.
 */
export function SectionHead({
    index,
    label,
    title,
    intro,
    action,
    /**
     * The page-title instance of this component must be an `h1`, and every
     * later one on the same page an `h2`. Defaulting to `h2` was leaving
     * `/showcase`, `/about`, `/contact` and `/category/[slug]` with no `h1`
     * at all — a document that starts at level 2 reads to a screen reader as
     * a fragment, and search engines treat it the same way.
     */
    as: Heading = "h2",
    className,
}) {
    return (
        <div
            className={cn(
                "flex flex-wrap items-end justify-between gap-x-10 gap-y-6",
                className
            )}
        >
            <div className="max-w-3xl">
                {label ? (
                    <span className="marker">
                        {index !== undefined
                            ? `${toBanglaDigits(String(index).padStart(2, "0"))} · `
                            : ""}
                        {label}
                    </span>
                ) : null}

                {title ? (
                    <Heading className="text-headline mt-5 font-display text-ink">
                        {title}
                    </Heading>
                ) : null}

                {intro ? (
                    <p className="text-lede measure mt-5 text-ink-soft">{intro}</p>
                ) : null}
            </div>

            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

export function Rule({ className }) {
    return <hr className={cn("rule", className)} />;
}

/** Long-form text at a readable measure (65–75 characters). */
export function Measure({ as = "div", className, children }) {
    const Tag = as;
    return <Tag className={cn("measure", className)}>{children}</Tag>;
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/**
 * `tone="solid"` is charcoal-on-linen and turns brand blue on hover;
 * `tone="line"` is the hairline outline. Both are ≥44px tall.
 *
 * Renders a `next/link` when `href` is internal, a plain `<a>` when `as="a"`
 * (tel:, wa.me, anything external), and a `<button>` otherwise.
 */
export function Button({
    href,
    as,
    tone = "solid",
    className,
    children,
    ...rest
}) {
    const classes = cn(tone === "line" ? "btn-line" : "btn-solid", className);

    if (href) {
        const Tag = as ?? Link;
        return (
            <Tag href={href} className={classes} {...rest}>
                {children}
            </Tag>
        );
    }

    return (
        <button type="button" className={classes} {...rest}>
            {children}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

const RATIOS = {
    portrait: "aspect-4/5",
    square: "aspect-square",
    wide: "aspect-3/2",
};

/**
 * The PRD's vertical photo frame.
 *
 * Always renders the aspect box, even with no image: reserving the space is
 * what keeps a grid from reflowing as photos arrive (CLS). `sizes` is
 * required by the caller rather than guessed here — a wrong `sizes` silently
 * ships a 1600px file to a 200px slot.
 */
export function Frame({
    src,
    alt = "",
    width,
    height,
    blur,
    sizes,
    priority,
    ratio = "portrait",
    className,
    children,
}) {
    return (
        <div className={cn("frame relative", RATIOS[ratio] ?? RATIOS.portrait, className)}>
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    width={width || 800}
                    height={height || 1000}
                    sizes={sizes}
                    priority={priority}
                    placeholder={blur ? "blur" : "empty"}
                    blurDataURL={blur || undefined}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="flex h-full w-full items-center justify-center text-ink-mute">
                    <ImageOff size={22} strokeWidth={1.25} aria-hidden />
                    <span className="sr-only">ছবি নেই</span>
                </span>
            )}
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

/**
 * Public pager. Real links, not buttons — a catalogue page has to be
 * shareable, crawlable and openable in a new tab.
 *
 * `hrefFor(page)` keeps URL construction with whatever owns the filters, so
 * the pager can never drop a query param the listing was filtered by.
 */
export function Pagination({ page, pages, hrefFor, className }) {
    if (pages <= 1) return null;

    const window = [];
    for (let p = 1; p <= pages; p += 1) {
        if (p === 1 || p === pages || Math.abs(p - page) <= 1) window.push(p);
    }

    return (
        <nav
            aria-label="পৃষ্ঠা"
            className={cn("flex flex-wrap items-center gap-2", className)}
        >
            {page > 1 ? (
                <Link href={hrefFor(page - 1)} rel="prev" className="btn-line px-4">
                    আগের
                </Link>
            ) : null}

            <ul className="flex flex-wrap items-center gap-1.5">
                {window.map((p, i) => (
                    <li key={p} className="flex items-center gap-1.5">
                        {i > 0 && p - window[i - 1] > 1 ? (
                            <span className="px-1 text-ink-mute" aria-hidden>
                                …
                            </span>
                        ) : null}
                        <Link
                            href={hrefFor(p)}
                            aria-current={p === page ? "page" : undefined}
                            className={cn(
                                "tnum inline-flex h-11 min-w-11 items-center justify-center rounded-xs border px-3 text-sm transition-colors",
                                p === page
                                    ? "border-ink bg-ink text-linen"
                                    : "border-field text-ink-soft hover:border-ink hover:text-ink"
                            )}
                        >
                            {toBanglaDigits(p)}
                        </Link>
                    </li>
                ))}
            </ul>

            {page < pages ? (
                <Link href={hrefFor(page + 1)} rel="next" className="btn-line px-4">
                    পরের
                </Link>
            ) : null}
        </nav>
    );
}
