"use client";

import { useRef } from "react";
import {
    motion,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
} from "framer-motion";

/**
 * The public site's motion vocabulary.
 *
 * Three rules this file exists to enforce, because each one is the kind of
 * thing that drifts the moment animation is written per-page:
 *
 *  1. **One rhythm.** Every entrance shares a duration and an easing. Mixed
 *     timings are the single loudest tell of a page assembled in pieces.
 *  2. **Enter decelerates, exit accelerates, and exit is shorter.** Arriving
 *     should settle; leaving should get out of the way. `DUR.exit` is ~65% of
 *     `DUR.base` on purpose.
 *  3. **Transform and opacity only.** Never width, height, top or left — those
 *     re-run layout every frame and show up as jank and CLS.
 *
 * Reduced motion is handled here rather than left to the CSS kill switch in
 * globals.css: Framer drives transforms from JavaScript, so a
 * `transition-duration: 0` override would not touch it. When the preference is
 * set these primitives render their children in the final state with no
 * animation at all — not a faster animation.
 *
 * The numbers mirror the `--dur-*` tokens in globals.css. They are duplicated
 * because Framer needs seconds as numbers; if you change one, change both.
 */

export const DUR = {
    fast: 0.14,
    base: 0.24,
    exit: 0.16,
    slow: 0.42,
};

/** Decelerating — for things arriving. Matches `--ease-editorial`. */
export const EASE_ENTER = [0.22, 1, 0.36, 1];
/** Accelerating — for things leaving. Matches `--ease-exit`. */
export const EASE_EXIT = [0.4, 0, 1, 1];

export const STAGGER_STEP = 0.04;

/**
 * Scroll-triggered entrance for a single block.
 *
 * `once: true` is deliberate: content that re-animates every time it scrolls
 * back into view turns reading into a slideshow. `amount: 0.25` fires when a
 * quarter of the element is visible, so a tall section does not wait until its
 * bottom edge arrives.
 *
 * @param {object} props
 * @param {string} [props.as="div"] intrinsic tag to render
 * @param {number} [props.y=14] px it rises from
 * @param {number} [props.delay=0] seconds
 */
export function Reveal({
    as = "div",
    y = 14,
    delay = 0,
    className,
    children,
    ...rest
}) {
    const still = useReducedMotion();
    const Tag = motion[as] ?? motion.div;

    if (still) {
        const Plain = as;
        return (
            <Plain className={className} {...rest}>
                {children}
            </Plain>
        );
    }

    return (
        <Tag
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: DUR.base, ease: EASE_ENTER, delay }}
            {...rest}
        >
            {children}
        </Tag>
    );
}

/**
 * Entrance container for a list or grid.
 *
 * 40ms between children: fast enough that a twelve-card grid finishes in half
 * a second, slow enough that the eye reads it as a sequence rather than a
 * flash. `delayChildren` lets a section heading land first.
 */
export function Stagger({
    as = "div",
    step = STAGGER_STEP,
    delayChildren = 0,
    className,
    children,
    ...rest
}) {
    const still = useReducedMotion();
    const Tag = motion[as] ?? motion.div;

    if (still) {
        const Plain = as;
        return (
            <Plain className={className} {...rest}>
                {children}
            </Plain>
        );
    }

    return (
        <Tag
            className={className}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.15 }}
            variants={{
                hidden: {},
                shown: {
                    transition: { staggerChildren: step, delayChildren },
                },
            }}
            {...rest}
        >
            {children}
        </Tag>
    );
}

/**
 * A direct child of `Stagger`. Inherits the parent's orchestration.
 *
 * `lift` raises the item by that many pixels on hover. It is a prop rather
 * than a `whileHover` the caller spreads through `...rest`, because under
 * reduced motion this component renders a plain `<li>` and React would then
 * forward `whileHover={{...}}` to the DOM as an unknown attribute — a console
 * warning, and an object stringified into markup. Taking it as a named prop
 * keeps the reduced-motion branch clean.
 *
 * @param {number} [props.lift=0] px of hover rise. 0 disables it.
 */
export function StaggerItem({
    as = "div",
    y = 16,
    lift = 0,
    className,
    children,
    ...rest
}) {
    const still = useReducedMotion();
    const Tag = motion[as] ?? motion.div;

    if (still) {
        const Plain = as;
        return (
            <Plain className={className} {...rest}>
                {children}
            </Plain>
        );
    }

    return (
        <Tag
            className={className}
            variants={{
                hidden: { opacity: 0, y },
                shown: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: DUR.base, ease: EASE_ENTER },
                },
            }}
            whileHover={lift ? { y: -lift } : undefined}
            {...rest}
        >
            {children}
        </Tag>
    );
}

/**
 * Press feedback for tappable cards.
 *
 * Spread onto a `motion` element. Kept tiny (0.985) — a card that visibly
 * shrinks reads as a toy. Returns nothing under reduced motion so the caller
 * does not have to branch.
 */
export function usePressProps() {
    const still = useReducedMotion();
    if (still) return {};
    return {
        whileTap: { scale: 0.985 },
        transition: { duration: DUR.fast, ease: EASE_EXIT },
    };
}

/**
 * Overlay pair for the mobile menu. Enter and exit are asymmetric by design;
 * see rule 2 at the top of this file.
 */
export const overlayVariants = {
    hidden: { opacity: 0, transition: { duration: DUR.exit, ease: EASE_EXIT } },
    shown: { opacity: 1, transition: { duration: DUR.base, ease: EASE_ENTER } },
};

export const panelVariants = {
    hidden: {
        opacity: 0,
        y: -8,
        transition: { duration: DUR.exit, ease: EASE_EXIT },
    },
    shown: {
        opacity: 1,
        y: 0,
        transition: { duration: DUR.base, ease: EASE_ENTER },
    },
};

/* ------------------------------------------------------------------ */
/* Parallax (phase 10)                                                 */
/* ------------------------------------------------------------------ */

/**
 * Scroll-linked vertical drift.
 *
 * Two elements, not one, and that split is the whole trick. `useScroll`
 * measures its target with `getBoundingClientRect`, which already includes
 * any transform on that element — so putting the ref and the `y` on the same
 * node feeds the transform back into the measurement and the element drifts
 * away under its own motion. The outer div is what gets measured and never
 * moves; the inner one is what moves and is never measured.
 *
 * `offset: ["start end", "end start"]` maps progress across the element's
 * whole pass through the viewport: 0 as its top touches the bottom edge, 1 as
 * its bottom leaves the top. So `distance` is the *total* travel, split
 * either side of centre — the element sits at its laid-out position when it
 * is centred, which is what keeps captions aligned with their frames.
 *
 * The spring is intentionally stiff and heavily damped. A loose spring on a
 * scroll-linked value keeps integrating after the finger lifts and reads as
 * the page being slow rather than the image being deep.
 *
 * Everything the browser needs to promote the layer is on the inner element,
 * and it only ever writes `transform` — no top, no margin, so no layout pass
 * per frame and no CLS.
 *
 * @param {number} [props.distance=56] total px of travel, top of pass to
 *   bottom. Negative inverts it, which is how two frames in one composition
 *   are made to separate instead of sliding together.
 * @param {string} [props.className] on the measured wrapper.
 * @param {string} [props.innerClassName] on the moving element.
 */
export function Parallax({
    distance = 56,
    className,
    innerClassName,
    children,
    ...rest
}) {
    const still = useReducedMotion();
    const ref = useRef(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const raw = useTransform(
        scrollYProgress,
        [0, 1],
        [distance / 2, -distance / 2]
    );
    const y = useSpring(raw, { stiffness: 140, damping: 30, mass: 0.3 });

    if (still) {
        return (
            <div ref={ref} className={className} {...rest}>
                <div className={innerClassName}>{children}</div>
            </div>
        );
    }

    return (
        <div ref={ref} className={className} {...rest}>
            <motion.div style={{ y, willChange: "transform" }} className={innerClassName}>
                {children}
            </motion.div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Headline entrance                                                   */
/* ------------------------------------------------------------------ */

/**
 * A display heading that arrives a word at a time.
 *
 * Split on SPACES ONLY. Splitting a Bangla string per character breaks
 * conjuncts (ক্ষ, ন্ত) and orphans matras from the consonant they attach to,
 * and the result renders as visible garbage rather than as a nice effect.
 * Word boundaries are safe in both scripts.
 *
 * There is also no `overflow: hidden` mask here, which is the usual way this
 * effect is built. A mask clips the line box, and Bangla puts its ikars and
 * matras *above* the line and several marks below it — a clip tight enough to
 * look crisp in Latin decapitates বৈ and চূ. Opacity and translate only.
 *
 * `aria-label` carries the whole string and the fragments are hidden, so a
 * screen reader reads one heading rather than five loose words.
 *
 * @param {string} props.text
 * @param {string} [props.as="h2"]
 * @param {number} [props.step=0.055] seconds between words
 */
export function WordReveal({
    as: Tag = "h2",
    text = "",
    step = 0.055,
    delay = 0,
    y = 24,
    className,
}) {
    const still = useReducedMotion();
    const words = String(text).split(/\s+/).filter(Boolean);

    if (still) {
        return <Tag className={className}>{text}</Tag>;
    }

    const MotionTag = motion[Tag] ?? motion.h2;

    return (
        <MotionTag
            className={className}
            aria-label={text}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.4 }}
            variants={{
                hidden: {},
                shown: { transition: { staggerChildren: step, delayChildren: delay } },
            }}
        >
            {words.map((word, i) => (
                <motion.span
                    key={`${word}-${i}`}
                    aria-hidden
                    className="inline-block will-change-transform"
                    variants={{
                        hidden: { opacity: 0, y },
                        shown: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: DUR.slow, ease: EASE_ENTER },
                        },
                    }}
                >
                    {word}
                    {i < words.length - 1 ? "\u00A0" : null}
                </motion.span>
            ))}
        </MotionTag>
    );
}

export { motion };
