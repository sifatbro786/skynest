"use client";

import { motion, useReducedMotion } from "framer-motion";

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

/** A direct child of `Stagger`. Inherits the parent's orchestration. */
export function StaggerItem({ as = "div", y = 16, className, children, ...rest }) {
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

export { motion };
