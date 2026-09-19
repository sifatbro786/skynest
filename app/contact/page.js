import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";

import { site, telLink, whatsappLink } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Button, Measure, Rule, Section, SectionHead } from "@/components/site/ui";
import { Reveal } from "@/components/site/motion";
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

export default function ContactPage() {
    const wa = whatsappLink(
        `আসসালামু আলাইকুম। ${site.name}-এ যোগাযোগ করতে চাই।`
    );

    return (
        // The action bar is off here: the page already is the contact surface,
        // and a fixed WhatsApp bar sitting over a form's submit button is the
        // textbook way to hide the control someone is trying to reach.
        <SiteShell actionBar={false}>
            <Section>
                <SectionHead
                    as="h1"
                    label="যোগাযোগ"
                    title="কথা বলি"
                    intro="প্রশ্ন থাকলে জিজ্ঞেস করুন, অথবা ফার্মে আসার সময় ঠিক করে নিন। সাধারণত একই দিনে উত্তর দেওয়া হয়।"
                />

                <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
                    {/* ---------- form ---------- */}
                    <div className="lg:col-span-7">
                        <InquiryForm />
                    </div>

                    {/* ---------- details ---------- */}
                    <Reveal delay={0.08} className="lg:col-span-4 lg:col-start-9">
                        <div className="space-y-9">
                            <div>
                                <h2 className="text-micro uppercase text-ink-mute">
                                    সরাসরি যোগাযোগ
                                </h2>
                                <a
                                    href={telLink()}
                                    className="tnum mt-3 block font-display text-title text-ink transition-colors hover:text-brand"
                                >
                                    {site.phone}
                                </a>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <Button as="a" href={wa} target="_blank" rel="noreferrer">
                                        <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                                        WhatsApp
                                    </Button>
                                    <Button as="a" href={telLink()} tone="line">
                                        <Phone size={16} strokeWidth={1.75} aria-hidden />
                                        কল করুন
                                    </Button>
                                </div>
                            </div>

                            <Rule />

                            <div>
                                <h2 className="text-micro uppercase text-ink-mute">ঠিকানা</h2>
                                <p className="mt-3 flex items-start gap-3 text-ink-soft">
                                    <MapPin
                                        size={17}
                                        strokeWidth={1.6}
                                        aria-hidden
                                        className="mt-0.5 shrink-0 text-ink-mute"
                                    />
                                    <span>
                                        {site.address.line}
                                        <span className="mt-0.5 block text-sm text-ink-mute">
                                            {site.address.lineEn}
                                        </span>
                                    </span>
                                </p>
                                {site.address.mapUrl ? (
                                    <a
                                        href={site.address.mapUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="link-quiet mt-4 inline-block text-sm"
                                    >
                                        ম্যাপে দেখুন
                                    </a>
                                ) : null}
                            </div>

                            <Rule />

                            <div>
                                <h2 className="text-micro uppercase text-ink-mute">
                                    ভিজিটের সময়
                                </h2>
                                <dl className="mt-3 space-y-2.5 text-sm">
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
                                <p className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-ink-mute">
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
                        </div>
                    </Reveal>
                </div>
            </Section>

            <Section tight className="pb-24">
                <Rule className="mb-12" />
                <Measure as="p" className="text-sm leading-relaxed text-ink-mute">
                    আমরা কোনো কুরিয়ার বা অগ্রিম পেমেন্ট ছাড়া বুকিং নিই না। প্রাণী নিজে দেখে,
                    পছন্দ হলে তবেই লেনদেন — এটাই {site.name}-এর নিয়ম।
                </Measure>
            </Section>
        </SiteShell>
    );
}
