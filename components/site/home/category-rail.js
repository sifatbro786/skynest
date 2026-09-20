import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { toBanglaDigits } from "@/lib/utils";
import { Rule, Section, SectionHead } from "@/components/site/ui";
import { Stagger, StaggerItem } from "@/components/site/motion";

/**
 * "কী খুঁজছেন?" — the top-level families.
 *
 * A list on hairlines, not a row of cards. Five families do not divide into a
 * tidy grid, and a list lets the Bangla name, the blurb and the count sit on
 * one scannable line — which is also what keeps this off the PRD's banned
 * symmetric-card-row pattern.
 *
 * @param {object} props
 * @param {Array} props.families serialized top-level categories
 * @param {Record<string, number>} props.countBy published count per category id
 */
export default function CategoryRail({ families = [], countBy = {} }) {
    if (families.length === 0) return null;

    return (
        <Section>
            <Rule className="mb-10" />
            <SectionHead index={2} label="ক্যাটাগরি" title="কী খুঁজছেন?" />

            <Stagger as="ul" className="mt-12 divide-y divide-line border-y border-line">
                {families.map((family) => (
                    <StaggerItem as="li" key={family.id}>
                        <Link
                            href={`/category/${family.slug}`}
                            className="group flex flex-wrap items-center gap-x-6 gap-y-2 py-7 transition-colors"
                        >
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
                            <ArrowRight
                                size={18}
                                strokeWidth={1.75}
                                aria-hidden
                                className="shrink-0 text-ink-mute transition-colors group-hover:text-brand"
                            />
                        </Link>
                    </StaggerItem>
                ))}
            </Stagger>
        </Section>
    );
}
