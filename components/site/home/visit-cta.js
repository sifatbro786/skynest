import { MessageCircle } from "lucide-react";

import { site, whatsappLink } from "@/lib/site";
import { Button, Measure, Rule, Section } from "@/components/site/ui";
import { Reveal } from "@/components/site/motion";

/**
 * Closing call to action: come and see them.
 *
 * `pb-24` at every breakpoint, not just the base one — this is the last thing
 * above the footer, and on a phone the fixed action bar overlaps whatever ends
 * the page. `twMerge` resolves per variant, so a bare `pb-24` would be
 * overridden by `Section`'s own `md:`/`lg:` padding rather than winning.
 */
export default function VisitCta() {
    return (
        <Section className="pb-24 md:pb-24 lg:pb-24">
            <Rule className="mb-10" />
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
                <Reveal className="lg:col-span-7">
                    <h2 className="text-headline font-display text-ink">
                        ছবি দেখে নয় — <span className="stroke-under">এসে</span> দেখে নিন
                    </h2>
                    <Measure as="p" className="text-lede mt-6 text-ink-soft">
                        আগে থেকে সময় ঠিক করে এলে যে প্রাণীটি দেখতে চান সেটি প্রস্তুত রাখা
                        হবে। কোনো অগ্রিম পেমেন্ট লাগে না।
                    </Measure>
                </Reveal>

                <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
                    <div className="flex flex-wrap gap-3">
                        <Button href="/contact">ভিজিটের সময় নিন</Button>
                        <Button
                            as="a"
                            href={whatsappLink(
                                `আসসালামু আলাইকুম। ${site.name}-এর কালেকশন সম্পর্কে জানতে চাই।`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            tone="line"
                        >
                            <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                            WhatsApp
                        </Button>
                    </div>
                </Reveal>
            </div>
        </Section>
    );
}
