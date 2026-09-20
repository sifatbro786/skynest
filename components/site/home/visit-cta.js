import { MessageCircle, Phone } from "lucide-react";

import { site, telLink, whatsappLink } from "@/lib/site";
import { Band, Button, Measure } from "@/components/site/ui";
import { Reveal, WordReveal } from "@/components/site/motion";

/**
 * Closing call to action: come and see them.
 *
 * Ink again, closing the bracket the hero opened — the page now begins and
 * ends dark with the colour running between, which is what gives a five
 * section scroll a shape instead of a length. The footer below is the same
 * ground, so the two read as one closing block rather than as a band sitting
 * on top of a footer.
 *
 * `pb-*` is spelled out at every breakpoint that `Band` sets a `py-*` on.
 * twMerge resolves per variant, so a bare `pb-28` would lose to `Band`'s own
 * `lg:py-28` rather than beating it. The extra bottom room is for the fixed
 * mobile action bar, which overlaps whatever ends the page.
 *
 * There is deliberately NO oversized ghost wordmark behind this band. The
 * first pass had one, and with the footer's own wordmark sitting a few hundred
 * pixels below it the page ended on the same word twice at two different
 * sizes, which reads as a mistake rather than as a motif. The footer keeps it;
 * this band is carried by the headline.
 */
export default function VisitCta() {
    return (
        <Band tone="ink" grain innerClassName="py-20 pb-28 md:py-24 md:pb-28 lg:pt-32 lg:pb-24">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
                <div className="lg:col-span-7">
                    <span className="marker">ফার্ম ভিজিট</span>

                    <WordReveal
                        text="ছবি দেখে নয় — এসে দেখে নিন"
                        delay={0.04}
                        className="text-headline mt-6 max-w-[16ch] font-display"
                    />

                    <Measure as="p" className="text-lede mt-6 text-linen/70">
                        আগে থেকে সময় ঠিক করে এলে যে প্রাণীটি দেখতে চান সেটি প্রস্তুত রাখা হবে। কোনো
                        অগ্রিম পেমেন্ট লাগে না।
                    </Measure>
                </div>

                <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
                    <div className="flex flex-wrap gap-3">
                        <Button href="/contact">ভিজিটের সময় নিন</Button>
                        <Button
                            as="a"
                            href={whatsappLink(
                                `আসসালামু আলাইকুম। ${site.name}-এর কালেকশন সম্পর্কে জানতে চাই।`,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            tone="line"
                        >
                            <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                            WhatsApp
                        </Button>
                    </div>

                    <p className="mt-7 flex items-center gap-2.5 text-sm text-linen/70">
                        <Phone
                            size={15}
                            strokeWidth={1.75}
                            aria-hidden
                            className="shrink-0 text-brand-on-ink"
                        />
                        <span>
                            সরাসরি কথা বলতে চাইলে{" "}
                            <a href={telLink()} className="tnum link-quiet">
                                {site.phone}
                            </a>
                        </span>
                    </p>
                </Reveal>
            </div>
        </Band>
    );
}
