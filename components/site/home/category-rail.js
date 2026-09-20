import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { toBanglaDigits } from "@/lib/utils";
import { Band, Frame, SectionHead } from "@/components/site/ui";
import { Stagger, StaggerItem } from "@/components/site/motion";

/**
 * "কী খুঁজছেন?" — the top-level families, on the cool band.
 *
 * A list on hairlines, not a row of cards. Five families do not divide into a
 * tidy grid, and a list lets the Bangla name, the blurb and the count sit on
 * one scannable line — which is also what keeps this off the PRD's banned
 * symmetric-card-row pattern.
 *
 * Phase 10 kept the list and gave each row a hover that fills to `paper`,
 * slides 12px right and opens its own side padding. It is the sky band's one
 * moving part, and it is deliberately the loudest hover on the page: this
 * list is the only navigation on the homepage that is not a button.
 *
 * The arrow is `ArrowUpRight`, not `ArrowRight`. On a hover that already
 * travels right, a right-pointing arrow doubles the same gesture; up-and-right
 * says "opens a page" rather than "continues this line".
 *
 * Each row leads with the family's photograph when the owner has set one, and
 * falls back to a quiet numeral when they have not. The thumbnail is what
 * stops this band from being the one stretch of the homepage with no
 * photography in it; the fallback exists because `Category.image` is optional
 * and a row of empty grey squares would be worse than no column at all.
 *
 * Both are `aria-hidden`: the thumbnail is decorative (the family is named
 * right beside it, and `alt=""` on a decorative image is correct), and the
 * numeral is typographic rhythm rather than an ordinal — the families have no
 * rank, and announcing one before each name would imply they do.
 *
 * @param {object} props
 * @param {Array} props.families serialized top-level categories
 * @param {Record<string, number>} props.countBy published count per category id
 */
export default function CategoryRail({ families = [], countBy = {} }) {
    if (families.length === 0) return null;

    return (
        <Band tone="sky">
            <SectionHead index={3} label="ক্যাটাগরি" title="কী খুঁজছেন?" />

            <Stagger
                as="ul"
                delayChildren={0.06}
                className="mt-12 divide-y divide-line border-y border-line lg:mt-16"
            >
                {families.map((family, i) => (
                    <StaggerItem as="li" key={family.id}>
                        <Link
                            href={`/category/${family.slug}`}
                            className="group flex flex-wrap items-center gap-x-6 gap-y-2 px-1 py-5 transition-[transform,background-color,padding] duration-200 ease-[var(--ease-editorial)] hover:translate-x-3 hover:bg-paper hover:px-5"
                        >
                            {family.image ? (
                                <Frame
                                    src={family.image}
                                    alt=""
                                    ratio="square"
                                    sizes="72px"
                                    className="hidden w-14 shrink-0 sm:block lg:w-18"
                                    imgClassName="transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:scale-[1.06]"
                                />
                            ) : (
                                <span
                                    aria-hidden
                                    className="tnum hidden w-14 shrink-0 font-display text-sm text-ink-mute transition-colors group-hover:text-clay sm:block lg:w-18"
                                >
                                    {toBanglaDigits(String(i + 1).padStart(2, "0"))}
                                </span>
                            )}

                            <span className="min-w-0 flex-1">
                                <span className="block font-display text-title text-ink transition-colors group-hover:text-brand">
                                    {family.name}
                                </span>
                                {family.blurb ? (
                                    <span className="measure mt-1.5 block text-sm text-ink-mute">
                                        {family.blurb}
                                    </span>
                                ) : null}
                            </span>

                            <span className="tnum shrink-0 text-sm text-ink-mute">
                                {toBanglaDigits(countBy[family.id] ?? 0)}টি
                            </span>

                            <ArrowUpRight
                                size={20}
                                strokeWidth={1.6}
                                aria-hidden
                                className="shrink-0 text-ink-mute transition-colors group-hover:text-brand"
                            />
                        </Link>
                    </StaggerItem>
                ))}
            </Stagger>
        </Band>
    );
}
