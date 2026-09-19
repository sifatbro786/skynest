import { Handshake, HeartPulse, ScrollText, Store } from "lucide-react";

import { site } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Button, Frame, Measure, Rule, Section, SectionHead } from "@/components/site/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/site/motion";

export const metadata = {
    title: "আমাদের সম্পর্কে",
    description: `${site.name} — ${site.address.lineEn}. প্রিমিয়াম ও এক্সোটিক পেট ব্রিডিং, সরাসরি ফার্ম থেকে।`,
    alternates: { canonical: "/about" },
};

/**
 * NOTE FOR HANDOVER — the prose on this page is a working draft.
 *
 * Everything here is deliberately non-specific: no founding year, no animal
 * counts, no award or certification claims. Those are the client's facts to
 * state, not ours to invent, and a wrong number on an "about" page is the kind
 * of thing a buyer quotes back at you. Replace the copy with Robiul's own
 * words before launch; the layout holds either length.
 */

const PRINCIPLES = [
    {
        icon: Store,
        title: "আগে দেখুন, তারপর সিদ্ধান্ত",
        body: "ছবি দেখে নয় — ফার্মে এসে প্রাণীটি নিজের চোখে দেখে, হাতে নিয়ে তবেই সিদ্ধান্ত নেবেন। অগ্রিম পেমেন্ট ছাড়াই সময় নেওয়া যায়।",
    },
    {
        icon: HeartPulse,
        title: "স্বাস্থ্য গোপন করা হয় না",
        body: "ভ্যাকসিনেশনের অবস্থা প্রতিটি প্রাণীর পাতায় খোলা লেখা থাকে — সম্পন্ন, আংশিক নাকি বাকি। যেটুকু হয়েছে ঠিক সেটুকুই লেখা।",
    },
    {
        icon: ScrollText,
        title: "বংশ পরিচয় যাচাইযোগ্য",
        body: "যেসব প্রাণীর পেডিগ্রি পেপার আছে, সেটি বিবরণে উল্লেখ করা থাকে। কাগজ না থাকলে সেটাও লুকানো হয় না।",
    },
    {
        icon: Handshake,
        title: "কেনার পরেও যোগাযোগ",
        body: "খাবার, যত্ন বা হঠাৎ কোনো সমস্যা — নেওয়ার পরেও ফোন করতে পারবেন। শখের প্রাণী একবার বিক্রি করে ভুলে যাওয়ার জিনিস না।",
    },
];

export default function AboutPage() {
    return (
        <SiteShell
            whatsappMessage={`আসসালামু আলাইকুম। ${site.name} সম্পর্কে জানতে চাই।`}
        >
            <Section>
                <SectionHead
                    as="h1"
                    label="আমাদের সম্পর্কে"
                    title="শেওড়াপাড়ার ছোট্ট একটা ফার্ম"
                />

                <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
                    <Reveal className="lg:col-span-7">
                        <Measure className="space-y-6 text-ink-soft">
                            <p className="text-lede">
                                {site.name} শুরু হয়েছিল শখ থেকে — কয়েকটা কবুতর আর একজোড়া
                                দেশি হাঁস দিয়ে। এখন কুকুর, বিড়াল, এক্সোটিক পাখি, ফ্যান্সি
                                হাঁস-মুরগি আর খরগোশ — সবই আছে, কিন্তু কাজের ধরনটা বদলায়নি।
                            </p>
                            <p className="leading-relaxed">
                                আমরা পাইকারি বিক্রেতা নই। যে প্রাণীগুলো এখানে আছে, সেগুলো
                                ফার্মেই বড় হয়েছে বা সরাসরি নির্ভরযোগ্য ব্রিডারের কাছ থেকে আনা।
                                প্রতিটির বয়স, রং, স্বভাব আর স্বাস্থ্যের অবস্থা আমরা নিজেরা
                                জানি — তাই প্রশ্ন করলে সত্যি উত্তরটাই পাবেন।
                            </p>
                            <p className="leading-relaxed">
                                ওয়েবসাইটে কোনো কার্ট বা অনলাইন পেমেন্ট নেই, ইচ্ছে করেই।
                                শখের প্রাণী কেনা মানে একটা প্রাণীর দায়িত্ব নেওয়া — সেটা
                                একটা &ldquo;অর্ডার&rdquo; বোতাম চেপে হওয়ার জিনিস না। কথা বলুন,
                                এসে দেখুন, তারপর ঠিক করুন।
                            </p>
                        </Measure>

                        <div className="mt-10 flex flex-wrap gap-3">
                            <Button href="/showcase">কালেকশন দেখুন</Button>
                            <Button href="/contact" tone="line">
                                ফার্ম ভিজিটের সময় নিন
                            </Button>
                        </div>
                    </Reveal>

                    <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
                        <Frame
                            src={site.logo}
                            alt=""
                            ratio="square"
                            sizes="(min-width:1024px) 340px, 100vw"
                            className="bg-linen-deep p-12"
                        />
                        <dl className="mt-7 space-y-5">
                            <div>
                                <dt className="text-micro uppercase text-ink-mute">
                                    স্বত্বাধিকারী
                                </dt>
                                <dd className="mt-1.5 font-display text-title text-ink">
                                    {site.owner}
                                </dd>
                                <dd className="text-sm text-ink-mute">{site.ownerEn}</dd>
                            </div>
                            <div>
                                <dt className="text-micro uppercase text-ink-mute">ঠিকানা</dt>
                                <dd className="mt-1.5 text-ink-soft">{site.address.line}</dd>
                                <dd className="text-sm text-ink-mute">
                                    {site.address.lineEn}
                                </dd>
                            </div>
                        </dl>
                    </Reveal>
                </div>
            </Section>

            <Section>
                <Rule className="mb-14" />
                <SectionHead
                    index={1}
                    label="আমাদের নিয়ম"
                    title="যেভাবে কাজ করি"
                    intro="চারটা কথা, যেগুলো আমরা প্রতিটা লেনদেনে মেনে চলি।"
                />

                {/* Four, in a 2x2 — not three across. The PRD rules out the
                    symmetric three-card row, and these are prose blocks on
                    hairlines rather than cards with shadows. */}
                <Stagger
                    as="ul"
                    className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2"
                >
                    {PRINCIPLES.map((item) => (
                        <StaggerItem as="li" key={item.title}>
                            <item.icon
                                size={22}
                                strokeWidth={1.5}
                                aria-hidden
                                className="text-clay"
                            />
                            <h3 className="mt-4 font-display text-title text-ink">
                                {item.title}
                            </h3>
                            <p className="measure mt-3 text-sm leading-relaxed text-ink-soft">
                                {item.body}
                            </p>
                        </StaggerItem>
                    ))}
                </Stagger>
            </Section>
        </SiteShell>
    );
}
