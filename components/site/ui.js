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
 *
 * ⚠ Keep the vertical padding SYMMETRIC (`py-*` only, never a lone `lg:pb-*`).
 * `cn` is `twMerge`, which resolves conflicts per breakpoint: a base
 * `lg:pb-24` here is not overridden by a caller's `pb-10` or `md:pb-0`,
 * because those are different variants. That is how the homepage ended up
 * with 96px of unkillable padding under the hero — the caller had set
 * `md:pb-0` and reasonably assumed it had won. A caller that wants a
 * different bottom on desktop must now pass `lg:pb-*`, and it will work.
 */
export function Section({ id, as = "section", tight, className, children }) {
    const Tag = as;
    return (
        <Tag
            id={id}
            className={cn(
                "shell clears-header",
                tight ? "py-5 md:py-10" : "py-5 md:py-10 lg:py-14",
                className,
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
        <div className={cn("flex flex-wrap items-end justify-between gap-x-10 gap-y-6", className)}>
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
                    <Heading className="text-headline mt-5 font-display text-ink">{title}</Heading>
                ) : null}

                {intro ? <p className="text-lede measure mt-5 text-ink-soft">{intro}</p> : null}
            </div>

            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

/**
 * A full-bleed colour band with the editorial gutter inside it.
 *
 * Phase 6 made every section a `Section` on one continuous linen sheet.
 * That is correct for a single page of long-form text and wrong for a
 * homepage: nothing marks the move from "what we have" to "why us" except a
 * 1px rule, so the page reads as one undifferentiated scroll. A band gives
 * each movement its own ground.
 *
 * Structurally this is a block-level child of `<main>`, so it is already the
 * viewport's width. No negative-margin `w-screen` trick — that one is off by
 * the scrollbar width and produces a horizontal scrollbar on Windows the
 * moment the page is tall enough to need one.
 *
 * `tone="ink"` also carries `.on-ink`, which is what reroutes buttons, rules
 * and muted text to their dark-ground values. See the contrast note in
 * globals.css: `--color-brand` is 2.6:1 on ink and must never be reached for
 * by hand here.
 *
 * ⚠ Vertical padding follows the same twMerge rule as `Section`: a caller
 * overriding the bottom on desktop must pass `lg:pb-*`, because a bare
 * `pb-10` does not beat this component's `lg:py-28`.
 *
 * @param {"linen"|"paper"|"sand"|"sky"|"ink"} [props.tone="linen"]
 * @param {boolean} [props.grain=false] fine noise behind the content. Worth
 *   it on a large flat field, pointless on a short one. It was a diagonal
 *   hatch until a review called it an eye-ache; see the note in globals.css
 *   before putting lines back.
 * @param {boolean} [props.flush=false] drop the inner vertical padding —
 *   for a band that manages its own, such as the ticker.
 */
export function Band({
    id,
    as = "section",
    tone = "linen",
    grain = false,
    flush = false,
    className,
    innerClassName,
    children,
}) {
    const Tag = as;

    return (
        <Tag
            id={id}
            className={cn(
                "band",
                BAND_TONES[tone] ?? BAND_TONES.linen,
                grain && "band-grain",
                className,
            )}
        >
            <div
                className={cn(
                    "shell clears-header",
                    !flush && "py-14 md:py-20 lg:py-28",
                    innerClassName,
                )}
            >
                {children}
            </div>
        </Tag>
    );
}

const BAND_TONES = {
    linen: "band-linen",
    paper: "band-paper",
    sand: "band-sand",
    sky: "band-sky",
    ink: "band-ink on-ink",
};

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
export function Button({ href, as, tone = "solid", className, children, ...rest }) {
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
    tall: "aspect-3/4",
};

const SHAPES = {
    arch: "arch",
    "arch-soft": "arch-soft",
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
    /**
     * `shape="arch"` domes the top of the frame and keeps 4px at the foot.
     * The system's one concession to a large radius, and it is confined to
     * feature frames — a hero photograph, a promise block. Cards, buttons,
     * chips and inputs all stay at 2–8px, which is what keeps the arch
     * reading as a deliberate accent rather than as a rounded theme.
     * `"arch-soft"` is the shallower dome for wide crops, where a 34% rise
     * eats the subject.
     */
    shape,
    className,
    /**
     * Classes for the `<img>` itself rather than the frame around it. The
     * frame already clips (`overflow: hidden`), so this is where a hover
     * zoom belongs — scaling the wrapper would scale its border radius and
     * any caption inside it too.
     */
    imgClassName,
    children,
}) {
    return (
        <div
            className={cn(
                "frame relative",
                RATIOS[ratio] ?? RATIOS.portrait,
                SHAPES[shape],
                className,
            )}
        >
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
                    className={cn("h-full w-full object-cover", imgClassName)}
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
        <nav aria-label="পৃষ্ঠা" className={cn("flex flex-wrap items-center gap-2", className)}>
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
                                    : "border-field text-ink-soft hover:border-ink hover:text-ink",
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
