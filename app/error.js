"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";

import { site } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Button, Measure, Rule, Section } from "@/components/site/ui";

/**
 * Error boundary for the public site.
 *
 * Distinct from `app/not-found.js`: that one means the URL is wrong, this one
 * means the site is at fault. So it never suggests the visitor mistyped
 * something, and it always ends with a phone number — a buyer who hit a
 * database timeout should not have to come back later to reach the farm.
 *
 * The digest is shown, quietly. It is the only handle on the matching server
 * log line in production, and a visitor reading it out over the phone is more
 * useful than a screenshot of a blank page.
 *
 * Note this does NOT catch a throw inside `app/layout.js` — that is what
 * `app/global-error.js` is for.
 */
export default function SiteError({ error, reset }) {
    useEffect(() => {
        console.error("[site] render failed", error);
    }, [error]);

    const isDev = process.env.NODE_ENV !== "production";

    return (
        <SiteShell actionBar={false}>
            <Section className="py-24 md:py-32">
                <span className="marker">ত্রুটি</span>

                <h1 className="text-headline mt-6 font-display text-ink">
                    কিছু একটা ঠিকমতো লোড হয়নি
                </h1>

                <Measure as="p" className="text-lede mt-6 text-ink-soft">
                    সমস্যাটি আমাদের দিকে, আপনার দিকে নয়। একবার আবার চেষ্টা করে দেখুন —
                    বেশিরভাগ সময়ই এতে কাজ হয়ে যায়।
                </Measure>

                <div className="mt-10 flex flex-wrap gap-3">
                    <Button onClick={() => reset()}>
                        <RotateCw size={16} strokeWidth={2} aria-hidden />
                        আবার চেষ্টা করুন
                    </Button>
                    <Button href="/" tone="line">
                        হোমে ফিরুন
                    </Button>
                </div>

                {isDev && error?.message ? (
                    <pre className="mt-10 max-w-full overflow-x-auto rounded-sm border border-line bg-linen-deep p-4 text-xs leading-relaxed text-ink-soft">
                        {error.message}
                        {error.stack ? `\n\n${error.stack}` : ""}
                    </pre>
                ) : null}

                <Rule className="mt-16" />

                <p className="tnum mt-8 text-sm text-ink-mute">
                    অপেক্ষা না করে সরাসরি কথা বলতে চাইলে — {site.phone}
                    {error?.digest ? (
                        <span className="mt-2 block text-xs">
                            রেফারেন্স কোড — <code className="font-mono">{error.digest}</code>
                        </span>
                    ) : null}
                </p>
            </Section>
        </SiteShell>
    );
}
