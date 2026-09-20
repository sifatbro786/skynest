import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";

import { cn, formatPriceRange, toBanglaDigits } from "@/lib/utils";
import { site, telLink } from "@/lib/site";
import { Band, Button, Frame, Measure } from "@/components/site/ui";
import { Parallax, Reveal, WordReveal } from "@/components/site/motion";

/**
 * The homepage hero.
 *
 * Phase 10 moved this onto an ink band. The header is ink too, so the two
 * merge into a single dark block running from the top of the viewport to the
 * end of the facts strip — the page opens with a statement instead of easing
 * into one. Everything below it is light, which is what makes the transition
 * read as a page turn.
 *
 * The composition is deliberately off-balance: two frames, different crops,
 * different sizes, drifting at different rates as you scroll, with the seal
 * straddling the gap between them. A symmetric pair of equal cards is the
 * arrangement the PRD rules out, and it is also what makes a showcase look
 * like a product grid rather than a spread.
 *
 * Three things to leave alone:
 *
 *  · The two `Parallax` distances have OPPOSITE signs. Same-sign values slide
 *    the frames together and the composition merely floats; opposite signs
 *    open and close the gap between them, which is what reads as depth.
 *  · `pt-*` / `pb-*` are spelled out at every breakpoint that `Band` sets a
 *    `py-*` on. twMerge resolves per variant, so a bare `pb-24` loses to
 *    `Band`'s own `lg:py-28`. Same trap documented on `Section`.
 *  · The seal is `aria-hidden` and its words are repeated in the facts strip.
 *    It is a sticker on a photograph, not content.
 *
 * @param {object} props
 * @param {Array} props.pair exactly two serialized animals, each with a cover,
 *   or an empty array. Never one: a single frame reads as a missing image.
 * @param {number} props.total published animals, for the facts strip.
 */
export default function Hero({ pair = [], total = 0 }) {
    const hasPair = pair.length === 2;

    return (
        <Band
            as="div"
            tone="ink"
            grain
            innerClassName="pt-10 pb-14 md:pt-16 md:pb-20 lg:pt-20 lg:pb-24"
        >
            <div className="grid gap-y-16 lg:grid-cols-12 lg:gap-x-10">
                {/* ---------------- words ---------------- */}
                <div className="lg:col-span-6 lg:row-start-1 lg:self-center">
                    <Reveal>
                        <span className="marker">{site.taglineEn}</span>
                    </Reveal>

                    <WordReveal
                        as="h1"
                        text="শখের সেরা কালেকশন"
                        delay={0.05}
                        className="text-display mt-6 max-w-[14ch] font-display"
                    />

                    <Reveal delay={0.24}>
                        <Measure as="p" className="text-lede mt-7 text-linen/70">
                            {site.description}
                        </Measure>
                    </Reveal>

                    <Reveal delay={0.32}>
                        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3">
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

                {/* ---------------- photographs ----------------

                    Two real animals, not stock photography and not a
                    decorative collage: each frame links to that listing and
                    carries its own price. Which two is the owner's call — see
                    the `isHero` flag on the animal form.

                    Hidden entirely when fewer than two are available. A fresh
                    install would otherwise render empty grey boxes in the most
                    prominent slot on the site, and one lone frame reads as a
                    broken image rather than as a deliberate single. */}
                {hasPair ? (
                    <div className="relative lg:col-span-5 lg:col-start-8 lg:row-start-1">
                        <div className="grid grid-cols-12 items-start gap-x-4 sm:gap-x-6">
                            <Parallax distance={72} className="col-span-7">
                                <HeroFrame
                                    animal={pair[0]}
                                    priority
                                    ratio="tall"
                                    shape="arch"
                                    sizes="(min-width:1280px) 340px, (min-width:1024px) 300px, 48vw"
                                />
                            </Parallax>

                            <Parallax distance={-44} className="col-span-5 mt-16 sm:mt-24 lg:mt-28">
                                <HeroFrame
                                    animal={pair[1]}
                                    ratio="square"
                                    sizes="(min-width:1024px) 230px, 40vw"
                                />
                            </Parallax>
                        </div>

                        {/* Straddles the gap between the two frames, which is
                            what stops the pair reading as two separate cards. */}
                        <span
                            aria-hidden
                            className="sticker float-y absolute left-[44%] top-[40%] h-24 w-24 -rotate-6 sm:h-28 sm:w-28"
                        >
                            <span className="text-[9px] tracking-[0.2em]">SKYNEST</span>
                            <span className="mt-1 font-display text-[13px] leading-tight normal-case tracking-normal">
                                ফার্ম থেকে
                                <br />
                                সরাসরি
                            </span>
                        </span>
                    </div>
                ) : null}

                {/* ---------------- facts ----------------

                    Reading across on a hairline rather than stacked in a rail.
                    The right column belongs to the animals, which is what a
                    visitor to a showcase actually came for. */}
                <div className="lg:col-span-11 lg:row-start-2">
                    <Reveal delay={0.1}>
                        <hr className="rule" />
                        <dl className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-3">
                            <Fact label="এখন কালেকশনে">
                                <span className="tnum">{toBanglaDigits(total)}টি প্রাণী</span>
                            </Fact>

                            <Fact label="সরাসরি যোগাযোগ" icon={Phone}>
                                <a
                                    href={telLink()}
                                    className="tnum transition-colors hover:text-brand-on-ink"
                                >
                                    {site.phone}
                                </a>
                            </Fact>

                            <Fact label="ঠিকানা" icon={MapPin}>
                                {site.address.line}
                            </Fact>
                        </dl>
                    </Reveal>
                </div>
            </div>
        </Band>
    );
}

/* ------------------------------------------------------------------ */

function Fact({ label, icon: Icon, className, children }) {
    return (
        <div className={className}>
            <dt className="marker">{label}</dt>
            {/* One column on a phone, three from `sm`. At two columns a
                390px viewport leaves ~136px for the phone number, which is
                narrower than the number — it shipped truncated to
                "+880 1715-339…", i.e. the site's primary contact method was
                unreadable on the device most likely to dial it. Nothing here
                truncates now; the layout gives each fact its own line
                instead. */}
            <dd className="mt-2.5 flex items-center gap-2 font-display text-lg text-linen">
                {Icon ? (
                    <Icon
                        size={15}
                        strokeWidth={1.75}
                        aria-hidden
                        className="shrink-0 text-brand-on-ink"
                    />
                ) : null}
                <span className="min-w-0 wrap-anywhere">{children}</span>
            </dd>
        </div>
    );
}

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
function HeroFrame({ animal, priority, ratio, shape, sizes, className }) {
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
                shape={shape}
                sizes={sizes}
                priority={priority}
                className="bg-white/8 transition-opacity duration-200 group-hover:opacity-90"
            />

            <p className="mt-3.5 truncate font-display text-sm text-linen transition-colors group-hover:text-brand-on-ink">
                {animal.title}
            </p>
            <p className="tnum mt-1 truncate text-xs text-linen/60">{price}</p>
        </Link>
    );
}
