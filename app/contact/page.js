import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";

import { site, telLink, whatsappLink } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Band, Button, Measure, Rule, SectionHead } from "@/components/site/ui";
import { Reveal, Stagger, StaggerItem, WordReveal } from "@/components/site/motion";
import InquiryForm from "./inquiry-form";

export const metadata = {
    title: "যোগাযোগ ও ফার্ম ভিজিট",
    description:
        "সরাসরি ফোন, WhatsApp বা ফর্মে বার্তা পাঠান। আগে থেকে সময় ঠিক করে ফার্মে এসে প্রাণী দেখে নিতে পারবেন।",
    alternates: { canonical: "/contact" },
};

const HOURS = [
    ["শনি – বৃহস্পতি", "সকাল ৯টা – সন্ধ্যা ৭টা"],
    ["শুক্রবার", "বিকেল ৩টা – সন্ধ্যা ৭টা"],
];

/**
 * `/contact`, on the phase 10 bands.
 *
 *     ink (the three direct channels) → paper (the form) → leaf (the rule)
 *
 * The band order here is an information-architecture decision, not a colour
 * one. The three channels come FIRST, in the loudest band on the page, and
 * the form comes second — because on a Dhaka pet showcase most people tap
 * WhatsApp or the phone number and never touch a form. Putting the form at
 * the top, as this page did, makes the fast path scroll past the slow one.
 *
 * The form stays on `paper` and that is load-bearing: `form-ui.js` builds
 * every control from `bg-paper`, `border-field` and the alert reds
 * (#d9b6aa / #f7ece8 / #a4402a), all of which are light-ground values. A form
 * on a dark band would need a second set of all of them, and the error state
 * is exactly the wrong place to be maintaining two of anything.
 *
 * Closing on the leaf band rather than on `VisitCta`: every other page ends with "come
 * and see them", and this page IS that. Repeating the CTA here would be
 * asking someone to click through to the page they are already reading. The
 * closing band carries the no-advance-payment rule instead, which was
 * previously a 12px footnote under a hairline — it is the single most
 * reassuring sentence on the site and it was set like a disclaimer.
 */
export default function ContactPage() {
    const wa = whatsappLink(`আসসালামু আলাইকুম। ${site.name}-এ যোগাযোগ করতে চাই।`);

    return (
        // The action bar is off here: the page already is the contact surface,
        // and a fixed WhatsApp bar sitting over a form's submit button is the
        // textbook way to hide the control someone is trying to reach.
        <SiteShell actionBar={false}>
            {/* ---------------- ink: the fast paths ---------------- */}
            <Band
                as="div"
                tone="ink"
                grain
                innerClassName="pt-10 pb-14 md:pt-16 md:pb-18 lg:pt-20 lg:pb-20"
            >
                <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-10">
                    <div className="lg:col-span-6 lg:self-center">
                        <Reveal>
                            <span className="marker">যোগাযোগ</span>
                        </Reveal>

                        <WordReveal
                            as="h1"
                            text="কথা বলি"
                            delay={0.05}
                            className="text-display mt-6 font-display"
                        />

                        <Reveal delay={0.2}>
                            <Measure as="p" className="text-lede mt-7 text-linen/70">
                                প্রশ্ন থাকলে জিজ্ঞেস করুন, অথবা ফার্মে আসার সময় ঠিক করে নিন।
                                সাধারণত একই দিনে উত্তর দেওয়া হয়।
                            </Measure>
                        </Reveal>
                    </div>

                    {/* Three channels as full-width rows on hairlines rather
                        than a row of three equal cards. A list keeps the phone
                        number at heading size — it is the thing most people
                        came for — and it survives the single-column reflow
                        without the cards turning into a stack of boxes. */}
                    <Stagger
                        as="ul"
                        delayChildren={0.12}
                        className="divide-y divide-line border-y border-line lg:col-span-5 lg:col-start-8 lg:self-center"
                    >
                        <StaggerItem as="li">
                            <a
                                href={telLink()}
                                className="group flex items-center gap-4 py-5 transition-colors"
                            >
                                <Phone
                                    size={18}
                                    strokeWidth={1.6}
                                    aria-hidden
                                    className="shrink-0 text-brand"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="text-micro block uppercase text-ink-mute">
                                        ফোন
                                    </span>
                                    <span className="tnum mt-1 block font-display text-title text-linen transition-colors group-hover:text-brand">
                                        {site.phone}
                                    </span>
                                </span>
                            </a>
                        </StaggerItem>

                        <StaggerItem as="li">
                            <a
                                href={wa}
                                target="_blank"
                                rel="noreferrer"
                                className="group flex items-center gap-4 py-5 transition-colors"
                            >
                                <MessageCircle
                                    size={18}
                                    strokeWidth={1.6}
                                    aria-hidden
                                    className="shrink-0 text-brand"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="text-micro block uppercase text-ink-mute">
                                        WhatsApp
                                    </span>
                                    <span className="mt-1 block font-display text-title text-linen transition-colors group-hover:text-brand">
                                        বার্তা পাঠান
                                    </span>
                                </span>
                            </a>
                        </StaggerItem>

                        <StaggerItem as="li">
                            <div className="flex items-start gap-4 py-5">
                                <MapPin
                                    size={18}
                                    strokeWidth={1.6}
                                    aria-hidden
                                    className="mt-0.5 shrink-0 text-brand"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="text-micro block uppercase text-ink-mute">
                                        ঠিকানা
                                    </span>
                                    <span className="mt-1 block text-ink-soft">
                                        {site.address.line}
                                        <span className="mt-0.5 block text-sm text-ink-mute">
                                            {site.address.lineEn}
                                        </span>
                                    </span>
                                    {site.address.mapUrl ? (
                                        <a
                                            href={site.address.mapUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="link-quiet mt-2.5 inline-block text-sm"
                                        >
                                            ম্যাপে দেখুন
                                        </a>
                                    ) : null}
                                </span>
                            </div>
                        </StaggerItem>
                    </Stagger>
                </div>
            </Band>

            {/* ---------------- paper: the form ---------------- */}
            <Band tone="paper">
                <SectionHead
                    index={1}
                    label="বার্তা পাঠান"
                    title="লিখে জানান, আমরা ফিরে আসছি"
                    intro="ফোনে ধরতে না পারলে এখানে লিখে রাখুন — নাম আর নম্বরটুকু হলেই চলবে।"
                />

                <div className="mt-12 grid gap-x-10 gap-y-14 lg:mt-16 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <InquiryForm />
                    </div>

                    <Reveal delay={0.08} className="lg:col-span-4 lg:col-start-9">
                        <div className="border-t border-line pt-7">
                            <h2 className="text-micro uppercase text-ink-mute">
                                ভিজিটের সময়
                            </h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                {HOURS.map(([days, hours]) => (
                                    <div
                                        key={days}
                                        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1"
                                    >
                                        <dt className="text-ink-soft">{days}</dt>
                                        <dd className="tnum text-ink">{hours}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-ink-mute">
                                <Clock
                                    size={14}
                                    strokeWidth={1.6}
                                    aria-hidden
                                    className="mt-0.5 shrink-0"
                                />
                                আগে থেকে সময় ঠিক করে এলে যে প্রাণীটি দেখতে চান সেটি প্রস্তুত
                                রাখা হবে।
                            </p>
                        </div>

                        <Rule className="my-9" />

                        <div>
                            <h2 className="text-micro uppercase text-ink-mute">
                                তাড়া থাকলে
                            </h2>
                            <p className="measure mt-4 text-sm leading-relaxed text-ink-soft">
                                ফর্ম না ভরে সরাসরি কল বা WhatsApp করুন — কোন প্রাণীটি নিয়ে
                                জানতে চান সেটুকু বললেই হবে।
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Button as="a" href={wa} target="_blank" rel="noreferrer">
                                    <MessageCircle
                                        size={16}
                                        strokeWidth={1.75}
                                        aria-hidden
                                    />
                                    WhatsApp
                                </Button>
                                <Button as="a" href={telLink()} tone="line">
                                    <Phone size={16} strokeWidth={1.75} aria-hidden />
                                    কল করুন
                                </Button>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </Band>

            {/* ---------------- leaf: the rule ---------------- */}
            {/* Left aligned, single column. The first pass split this into a
                far-left marker and a col-start-5 text block, and with a short
                marker and a wide gap the statement read as CENTRED — which is
                the layout the PRD rules out, arrived at by accident rather
                than by choice. An offset column is not automatically an
                asymmetric layout; it is only asymmetric if something occupies
                the other side. */}
            <Band tone="leaf" grain innerClassName="py-16 md:py-20 lg:py-24">
                <Reveal className="max-w-4xl">
                    <span className="marker">আমাদের নিয়ম</span>
                    <p className="text-headline mt-6 font-display text-linen">
                        অগ্রিম পেমেন্ট ছাড়া বুকিং নিই না।
                    </p>
                    <Measure as="p" className="text-lede mt-5 text-ink-soft">
                        কোনো কুরিয়ার নেই, অগ্রিম নেই। প্রাণী নিজে দেখে, পছন্দ হলে তবেই
                        লেনদেন — এটাই {site.name}-এর নিয়ম।
                    </Measure>
                </Reveal>
            </Band>
        </SiteShell>
    );
}
