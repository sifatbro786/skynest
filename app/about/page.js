import { Handshake, HeartPulse, MapPin, ScrollText, Store } from "lucide-react";

import { site } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Band, Button, Frame, Measure, SectionHead } from "@/components/site/ui";
import {
    Parallax,
    Reveal,
    Stagger,
    StaggerItem,
    WordReveal,
} from "@/components/site/motion";
import VisitCta from "@/components/site/home/visit-cta";

export const metadata = {
    title: "আমাদের সম্পর্কে",
    description: `${site.name} — ${site.address.lineEn}. প্রিমিয়াম ও এক্সোটিক পেট ব্রিডিং, সরাসরি ফার্ম থেকে।`,
    alternates: { canonical: "/about" },
};

/**
 * NOTE FOR HANDOVER — the prose on this page is still a working draft.
 *
 * Everything here is deliberately non-specific: no founding year, no animal
 * counts, no award or certification claims. Those are the client's facts to
 * state, not ours to invent, and a wrong number on an "about" page is the
 * kind of thing a buyer quotes back at you. Replace the copy with Robiul's
 * own words before launch; the layout holds either length.
 *
 * ---
 *
 * Phase 10 rebuilt this page on the homepage's band rhythm:
 *
 *     ink (portrait) → sand (the story) → paper (how we work) → ink (CTA)
 *
 * Dark, warm, light, dark — the same shape as the homepage without being the
 * same page. The closing band is the homepage's own `VisitCta`, reused rather
 * than reworded: two "come and see them" blocks with different copy is how a
 * five-page site starts sounding like two different businesses.
 *
 * It still lives under `components/site/home/` because it was written there
 * and this machine cannot delete files to move it. It is a shared component
 * now; move it up to `components/site/` when a delete is possible.
 *
 * The portrait is `owner.jpeg` — a real photograph of Robiul, replacing the
 * logo-in-a-box that used to sit in that slot. A logo is not a face, and on
 * a page whose entire job is "who are you and why should I trust you", the
 * difference is the page's whole argument.
 */

const PRINCIPLES = [
    {
        icon: Store,
        title: "আগে দেখুন, তারপর সিদ্ধান্ত",
        body: "ছবি দেখে নয় — ফার্মে এসে প্রাণীটি নিজের চোখে দেখে, হাতে নিয়ে তবেই সিদ্ধান্ত নেবেন। অগ্রিম পেমেন্ট ছাড়াই সময় নেওয়া যায়।",
        ink: "text-clay",
    },
    {
        icon: HeartPulse,
        title: "স্বাস্থ্য গোপন করা হয় না",
        body: "ভ্যাকসিনেশনের অবস্থা প্রতিটি প্রাণীর পাতায় খোলা লেখা থাকে — সম্পন্ন, আংশিক নাকি বাকি। যেটুকু হয়েছে ঠিক সেটুকুই লেখা।",
        ink: "text-leaf",
    },
    {
        icon: ScrollText,
        title: "বংশ পরিচয় যাচাইযোগ্য",
        body: "যেসব প্রাণীর পেডিগ্রি পেপার আছে, সেটি বিবরণে উল্লেখ করা থাকে। কাগজ না থাকলে সেটাও লুকানো হয় না।",
        ink: "text-brand",
    },
    {
        icon: Handshake,
        title: "কেনার পরেও যোগাযোগ",
        body: "খাবার, যত্ন বা হঠাৎ কোনো সমস্যা — নেওয়ার পরেও ফোন করতে পারবেন। শখের প্রাণী একবার বিক্রি করে ভুলে যাওয়ার জিনিস না।",
        ink: "text-clay",
    },
];

export default function AboutPage() {
    return (
        <SiteShell whatsappMessage={`আসসালামু আলাইকুম। ${site.name} সম্পর্কে জানতে চাই।`}>
            {/* ---------------- ink: who ---------------- */}
            <Band
                as="div"
                tone="ink"
                grain
                innerClassName="pt-10 pb-16 md:pt-16 md:pb-20 lg:pt-20 lg:pb-24"
            >
                <div className="grid gap-y-14 lg:grid-cols-12 lg:gap-x-10">
                    <div className="lg:col-span-6 lg:row-start-1 lg:self-center">
                        <Reveal>
                            <span className="marker">আমাদের সম্পর্কে</span>
                        </Reveal>

                        <WordReveal
                            as="h1"
                            text="শেওড়াপাড়ার ছোট্ট একটা ফার্ম"
                            delay={0.05}
                            className="text-display mt-6 max-w-[13ch] font-display"
                        />

                        <Reveal delay={0.24}>
                            <Measure as="p" className="text-lede mt-7 text-linen/70">
                                শখ থেকে শুরু, আর শখের মানুষদের জন্যই। এখানে যা দেখছেন তার
                                পেছনে একজন মানুষ আছেন — নাম, মুখ আর ফোন নম্বর সহ।
                            </Measure>
                        </Reveal>

                        <Reveal delay={0.32}>
                            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3">
                                <Button href="/showcase">কালেকশন দেখুন</Button>
                                <Button href="/contact" tone="line">
                                    ফার্ম ভিজিটের সময় নিন
                                </Button>
                            </div>
                        </Reveal>
                    </div>

                    {/* The portrait, arched and drifting, in the slot the
                        homepage gives to an animal. `object-[center_15%]` is
                        not a nudge for taste: the source is 900×1600 and an
                        object-cover centre crop into a 3:4 box takes y 200–1400,
                        which cuts the top of his head off. Pulling the crop
                        window up keeps the face whole. Re-check this if the
                        photograph is ever replaced. */}
                    <div className="relative lg:col-span-4 lg:col-start-9 lg:row-start-1">
                        <Parallax distance={64}>
                            <Frame
                                src="/owner.jpeg"
                                alt={`${site.ownerEn} — ${site.name}`}
                                width={900}
                                height={1600}
                                ratio="tall"
                                shape="arch"
                                priority
                                sizes="(min-width:1024px) 360px, 80vw"
                                className="bg-white/8"
                                imgClassName="object-[center_15%]"
                            />

                            <div className="mt-5">
                                <p className="text-micro uppercase text-ink-mute">
                                    স্বত্বাধিকারী
                                </p>
                                <p className="mt-1.5 font-display text-title text-linen">
                                    {site.owner}
                                </p>
                                <p className="mt-0.5 text-sm text-ink-mute">
                                    {site.ownerEn}
                                </p>
                                <p className="mt-4 flex items-start gap-2.5 text-sm text-ink-soft">
                                    <MapPin
                                        size={15}
                                        strokeWidth={1.75}
                                        aria-hidden
                                        className="mt-0.5 shrink-0 text-brand-on-ink"
                                    />
                                    <span>
                                        {site.address.line}
                                        <span className="mt-0.5 block text-xs text-ink-mute">
                                            {site.address.lineEn}
                                        </span>
                                    </span>
                                </p>
                            </div>
                        </Parallax>
                    </div>
                </div>
            </Band>

            {/* ---------------- sand: the story ---------------- */}
            <Band tone="sand" grain>
                <SectionHead
                    index={1}
                    label="শুরুর কথা"
                    title="কয়েকটা কবুতর দিয়ে শুরু"
                />

                {/* 7/4, not 6/6. An even split reads as a layout; an uneven one
                    reads as a column of prose with something beside it. */}
                <div className="mt-12 grid gap-x-10 gap-y-12 lg:mt-16 lg:grid-cols-12">
                    <Reveal className="lg:col-span-7">
                        <Measure className="space-y-6 text-ink-soft">
                            <p className="text-lede">
                                {site.name} শুরু হয়েছিল শখ থেকে — কয়েকটা কবুতর আর একজোড়া
                                দেশি হাঁস দিয়ে। এখন কুকুর, বিড়াল, এক্সোটিক পাখি, ফ্যান্সি
                                হাঁস-মুরগি আর খরগোশ — সবই আছে, কিন্তু কাজের ধরনটা বদলায়নি।
                            </p>
                            <p className="leading-relaxed">
                                আমরা পাইকারি বিক্রেতা নই। যে প্রাণীগুলো এখানে আছে, সেগুলো
                                ফার্মেই বড় হয়েছে বা সরাসরি নির্ভরযোগ্য ব্রিডারের কাছ থেকে
                                আনা। প্রতিটির বয়স, রং, স্বভাব আর স্বাস্থ্যের অবস্থা আমরা
                                নিজেরা জানি — তাই প্রশ্ন করলে সত্যি উত্তরটাই পাবেন।
                            </p>
                            <p className="leading-relaxed">
                                ওয়েবসাইটে কোনো কার্ট বা অনলাইন পেমেন্ট নেই, ইচ্ছে করেই। শখের
                                প্রাণী কেনা মানে একটা প্রাণীর দায়িত্ব নেওয়া — সেটা একটা
                                &ldquo;অর্ডার&rdquo; বোতাম চেপে হওয়ার জিনিস না। কথা বলুন,
                                এসে দেখুন, তারপর ঠিক করুন।
                            </p>
                        </Measure>
                    </Reveal>

                    {/* A pull quote, not a stat block. This page has no numbers
                        it is allowed to claim (see the handover note above), and
                        an invented "১০+ বছর" is exactly the sort of thing that
                        gets quoted back at you.

                        It is also DELIBERATELY UNATTRIBUTED. The obvious move
                        is to sign it "— খন্দকার রবিউল", and that would be
                        putting a sentence we wrote into a real, named person's
                        mouth on his own about page — a worse version of the
                        invented-number problem, not a softer one. It reads as
                        the same first-person draft voice as the prose beside
                        it. Attribute it only once Robiul has actually said it. */}
                    <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
                        <p className="border-l-2 border-clay pl-6 font-display text-title text-ink">
                            যে প্রাণীটা নিজের ঘরে রাখতে চাই না, সেটা কারও হাতে তুলে দিই না।
                        </p>
                    </Reveal>
                </div>
            </Band>

            {/* ---------------- paper: how we work ---------------- */}
            <Band tone="paper">
                <SectionHead
                    index={2}
                    label="আমাদের নিয়ম"
                    title="যেভাবে কাজ করি"
                    intro="চারটা কথা, যেগুলো আমরা প্রতিটা লেনদেনে মেনে চলি।"
                />

                {/* Four in a 2×2, not three across — the PRD rules out the
                    symmetric three-card row, and four prose blocks on hairlines
                    are not cards in the first place. The hairline is on the
                    TOP of each block rather than between them: a top rule
                    survives the single-column reflow on a phone, where a
                    divider between columns has nothing left to divide. */}
                <Stagger
                    as="ul"
                    delayChildren={0.08}
                    className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:mt-20"
                >
                    {PRINCIPLES.map((item, i) => (
                        <StaggerItem
                            as="li"
                            key={item.title}
                            className={i % 2 === 1 ? "sm:mt-12" : undefined}
                        >
                            <div className="flex items-center gap-4 border-t border-line pt-6">
                                <span
                                    className={`grid size-12 shrink-0 place-items-center rounded-pill border border-line ${item.ink}`}
                                >
                                    <item.icon size={20} strokeWidth={1.4} aria-hidden />
                                </span>
                                <h3 className="font-display text-title text-ink">
                                    {item.title}
                                </h3>
                            </div>
                            <p className="measure mt-4 text-sm leading-relaxed text-ink-soft">
                                {item.body}
                            </p>
                        </StaggerItem>
                    ))}
                </Stagger>
            </Band>

            {/* ---------------- ink: come and see ---------------- */}
            <VisitCta />
        </SiteShell>
    );
}
