import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { site } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Button, Measure, Rule, Section } from "@/components/site/ui";

export const metadata = {
    title: "পাতাটি পাওয়া যায়নি",
    robots: { index: false, follow: false },
};

/**
 * 404 for the whole app.
 *
 * Catches both an unmatched URL and an explicit `notFound()` — which on this
 * site most often means a sold animal whose listing was deleted, or a
 * category that was renamed. So the page does not stop at "not found": the
 * most likely reason is stated, and every route out is a real link.
 *
 * Deliberately not a dead end with a single "go home" button. Someone who
 * landed on a removed animal wants a similar animal, not the front page.
 */
export default function NotFound() {
    return (
        <SiteShell>
            <Section className="py-24 md:py-32">
                <span className="marker">৪০৪</span>

                <h1 className="text-headline mt-6 font-display text-ink">এই পাতাটি আর নেই</h1>

                <Measure as="p" className="text-lede mt-6 text-ink-soft">
                    লিংকটা পুরনো হয়ে যেতে পারে — কোনো প্রাণী বিক্রি হয়ে গেলে বা ক্যাটাগরির নাম
                    বদলালে তার পুরনো ঠিকানা আর কাজ করে না।
                </Measure>

                <div className="mt-10 flex flex-wrap gap-3">
                    <Button href="/showcase">
                        কালেকশন দেখুন
                        <ArrowRight size={16} strokeWidth={2} aria-hidden />
                    </Button>
                    <Button href="/contact" tone="line">
                        কী খুঁজছেন বলুন
                    </Button>
                </div>

                <Rule className="mt-16" />

                <nav aria-label="অন্যান্য পাতা" className="mt-8">
                    <p className="text-micro uppercase text-ink-mute">অথবা এখানে যান</p>
                    <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                        {[
                            ["/", "হোম"],
                            ["/showcase", "সম্পূর্ণ কালেকশন"],
                            ["/about", "আমাদের সম্পর্কে"],
                            ["/contact", "যোগাযোগ"],
                        ].map(([href, label]) => (
                            <li key={href}>
                                <Link href={href} className="link-quiet text-sm">
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <p className="tnum mt-10 text-sm text-ink-mute">
                    জরুরি হলে সরাসরি ফোন করুন — {site.phone}
                </p>
            </Section>
        </SiteShell>
    );
}
