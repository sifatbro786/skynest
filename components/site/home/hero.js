import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn, formatPriceRange, toBanglaDigits } from "@/lib/utils";
import { site, telLink } from "@/lib/site";
import { Button, Frame, Measure, Rule, Section } from "@/components/site/ui";
import { Reveal } from "@/components/site/motion";

/**
 * The homepage hero.
 *
 * Three grid children, two rows. On a phone they stack in DOM order — words,
 * then photographs, then facts — so the hook is the first thing under the
 * fold. From `lg` the photographs span both rows on the right and the facts
 * return under the text.
 *
 * `lg:pb-6` is explicit rather than inherited. `Section`'s padding is merged
 * by `twMerge`, which resolves per breakpoint, so a bottom override only
 * lands if it carries the same variant as the thing it is overriding. See the
 * warning on `Section` itself.
 *
 * @param {object} props
 * @param {Array} props.pair exactly two serialized animals, each with a cover,
 *   or an empty array. Never one: a single frame reads as a missing image.
 * @param {number} props.total published animals, for the facts strip.
 */
export default function Hero({ pair = [], total = 0 }) {
    return (
        <Section as="div" className="pt-5 pb-8 md:pt-14 md:pb-10 lg:pt-16 lg:pb-6">
            <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-10">
                <div className="lg:col-span-6 lg:row-start-1">
                    <Reveal delay={0.06}>
                        <h1 className="text-display mt-7 max-w-[15ch] font-display text-ink">
                            শখের সেরা কালেকশন
                        </h1>
                    </Reveal>

                    <Reveal delay={0.12}>
                        <Measure as="p" className="text-lede mt-7 text-ink-soft">
                            {site.description}
                        </Measure>
                    </Reveal>

                    <Reveal delay={0.18}>
                        <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4">
                            <Button href="/showcase">
                                কালেকশন দেখুন
                                <ArrowRight size={16} strokeWidth={2} aria-hidden />
                            </Button>
                            <Button href="/contact" tone="line">
                                ফার্ম ভিজিটের সময় নিন
                            </Button>
                        </div>
                    </Reveal>
                </div>

                {/* Two real animals, not a stock photo and not a decorative
                    collage: each frame links to that listing and is captioned
                    with its price. The second is pushed down so the pair reads
                    as an editorial spread rather than a symmetric pair of cards.

                    Which two is the owner's decision — see the `isHero` flag on
                    the animal form. Hidden entirely when fewer than two are
                    available, because a fresh install would otherwise render
                    empty grey boxes in the most prominent slot on the site. */}
                {pair.length === 2 ? (
                    <Reveal
                        delay={0.12}
                        className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 lg:self-start lg:pt-3"
                    >
                        <div className="grid grid-cols-12 gap-x-5 sm:gap-x-6">
                            <HeroFrame
                                animal={pair[0]}
                                priority
                                ratio="portrait"
                                sizes="(min-width:1280px) 340px, (min-width:1024px) 300px, 46vw"
                                className="col-span-7"
                            />
                            <HeroFrame
                                animal={pair[1]}
                                ratio="square"
                                sizes="(min-width:1024px) 230px, 46vw"
                                className="col-span-5 mt-12 sm:mt-16"
                            />
                        </div>
                    </Reveal>
                ) : null}

                {/* Facts on a hairline, reading across rather than stacked in a
                    rail. They used to occupy the right column; the right column
                    is now the animals, which is what a visitor to a showcase
                    actually came to see. */}
                <div className="lg:col-span-6 lg:row-start-2">
                    <Reveal delay={0.24}>
                        <Rule />
                        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
                            <div>
                                <dt className="text-micro uppercase text-ink-mute">
                                    এখন কালেকশনে
                                </dt>
                                <dd className="tnum mt-1.5 font-display text-lg text-ink">
                                    {toBanglaDigits(total)}টি প্রাণী
                                </dd>
                            </div>
                            <div>
                                <dt className="text-micro uppercase text-ink-mute">
                                    সরাসরি যোগাযোগ
                                </dt>
                                <dd className="tnum mt-1.5 font-display text-lg text-ink">
                                    <a
                                        href={telLink()}
                                        className="transition-colors hover:text-brand"
                                    >
                                        {site.phone}
                                    </a>
                                </dd>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <dt className="text-micro uppercase text-ink-mute">
                                    ঠিকানা
                                </dt>
                                <dd className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                                    {site.address.line}
                                </dd>
                            </div>
                        </dl>
                    </Reveal>
                </div>
            </div>
        </Section>
    );
}

/* ------------------------------------------------------------------ */

/**
 * One photograph in the hero pair.
 *
 * Not `AnimalCard`: that one is an `<li>` inside a `Stagger`, carries the
 * status dot and the featured star, and sets its own heading level. The hero
 * wants a picture, a name and a price, and the whole thing as one link.
 *
 * The caption sits under the frame rather than over it. An overlay would need
 * a scrim to stay readable against an unknown photograph, and every scrim dark
 * enough to guarantee 4.5:1 also hides the animal the frame exists to show.
 */
function HeroFrame({ animal, priority, ratio, sizes, className }) {
    const price = animal.price?.onRequest
        ? "দাম জানতে যোগাযোগ করুন"
        : formatPriceRange(animal.price?.min, animal.price?.max, { bangla: true });

    return (
        <Link href={`/showcase/${animal.slug}`} className={cn("group block", className)}>
            <Frame
                src={animal.cover.path}
                alt={animal.cover.alt || `${animal.breed} — ${animal.title}`}
                width={animal.cover.width}
                height={animal.cover.height}
                blur={animal.cover.blur}
                ratio={ratio}
                sizes={sizes}
                priority={priority}
                className="transition-opacity duration-200 group-hover:opacity-90"
            />

            <p className="mt-3 truncate font-display text-sm text-ink transition-colors group-hover:text-brand">
                {animal.title}
            </p>
            <p className="tnum mt-1 truncate text-xs text-ink-mute">{price}</p>
        </Link>
    );
}
