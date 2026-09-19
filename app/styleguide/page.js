import { notFound } from "next/navigation";
import { CalendarDays, MessageCircle, Phone } from "lucide-react";

import SiteShell from "@/components/site/site-shell";
import { Button, Frame, Measure, Rule, Section, SectionHead } from "@/components/site/ui";
import { Reveal, Stagger } from "@/components/site/motion";
import AnimalCard from "@/components/site/animal-card";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "ডিজাইন সিস্টেম",
    robots: { index: false, follow: false, nocache: true },
};

/**
 * Living reference for the public design system.
 *
 * It renders the real components rather than pictures of them, so the page
 * cannot drift from the code the way a markdown spec does. Every contrast
 * figure below is measured from the actual token values, not estimated.
 *
 * Not reachable in production unless `ENABLE_STYLEGUIDE=true` — it is a
 * developer tool, and the client's site should not carry it.
 */
function styleguideEnabled() {
    return (
        process.env.NODE_ENV !== "production" ||
        process.env.ENABLE_STYLEGUIDE === "true"
    );
}

/* ---------------- measured values ---------------- */

const SURFACES = [
    ["--color-linen", "#F4F8FA", "পেজের base"],
    ["--color-linen-deep", "#E7EEF3", "recessed / hover"],
    ["--color-paper", "#FBFDFE", "card, header, footer"],
];

const INK = [
    ["--color-ink", "#1A1D20", "15.84", "AAA"],
    ["--color-ink-soft", "#394249", "9.59", "AAA"],
    ["--color-ink-mute", "#66727B", "4.62", "AA"],
];

const ACCENT = [
    ["--color-brand", "#0B62A4", "5.96", "AA", "লিংক, focus ring, active rule"],
    ["--color-brand-deep", "#084C80", "8.34", "AAA", "hover / চাপা অবস্থা"],
    ["--color-leaf", "#2E7D32", "4.80", "AA", "পাওয়া যাচ্ছে"],
    ["--color-clay", "#8D5B3A", "5.33", "AA", "বুকড, hand-drawn accent"],
];

const STRUCTURE = [
    ["--color-line", "#D6E0E7", "1.25", "decorative", "শুধু divider"],
    ["--color-line-strong", "#B6C5CF", "1.65", "decorative", "ভারী rule"],
    ["--color-field", "#788C9D", "3.26", "3:1 ✓", "input / outline button-এর border"],
];

const TYPE_SCALE = [
    ["text-display", "clamp(2.75rem → 5.5rem)", "পেজে একবার — hero"],
    ["text-headline", "clamp(2rem → 3.5rem)", "সেকশন শিরোনাম"],
    ["text-title", "clamp(1.375rem → 2rem)", "কার্ড, সাব-সেকশন"],
    ["text-lede", "clamp(1.06rem → 1.25rem)", "intro অনুচ্ছেদ"],
    ["base", "1rem / 1.5", "বডি টেক্সট"],
    ["text-micro", "0.6875rem · 0.14em caps", "marker, label"],
];

const MOTION = [
    ["--dur-fast", "140ms", "hover, focus, press"],
    ["--dur-base", "240ms", "entrance, state change"],
    ["--dur-exit", "160ms", "সবসময় enter-এর ~৬৫%"],
    ["--stagger-step", "40ms", "গ্রিড আইটেমের মাঝে"],
];

/** Fake rows so the page works against an empty database. */
const DEMO = [
    {
        id: "d1",
        slug: "german-shepherd",
        title: "শো-লাইন জার্মান শেফার্ড পাপি",
        breed: "German Shepherd",
        price: { min: 85000, max: 120000, onRequest: false },
        status: "available",
        isFeatured: true,
        cover: null,
    },
    {
        id: "d2",
        slug: "blue-french-bulldog",
        title: "ব্লু ফ্রেঞ্চ বুলডগ",
        breed: "French Bulldog",
        price: { min: 150000, max: null, onRequest: false },
        status: "reserved",
        isFeatured: false,
        cover: null,
    },
    {
        id: "d3",
        slug: "macaw",
        title: "ব্লু অ্যান্ড গোল্ড ম্যাকাও",
        breed: "Blue & Gold Macaw",
        price: { min: null, max: null, onRequest: true },
        status: "sold",
        isFeatured: false,
        cover: null,
    },
];

export default function StyleguidePage() {
    if (!styleguideEnabled()) notFound();

    return (
        <SiteShell>
            {/* ---------------- 01 tokens ---------------- */}
            <Section>
                <span className="marker">ডিজাইন সিস্টেম</span>
                <h1 className="text-headline mt-5 font-display text-ink">
                    পাবলিক সাইটের{" "}
                    <span className="stroke-under">ভিজ্যুয়াল</span> ভাষা
                </h1>
                <Measure as="p" className="text-lede mt-6 text-ink-soft">
                    এই পেজটা আসল কম্পোনেন্ট রেন্ডার করে — কোনো স্ক্রিনশট না। তাই কোড বদলালে
                    এই রেফারেন্সও সাথে সাথে বদলায়। নিচের প্রতিটা contrast সংখ্যা আসল token
                    ভ্যালু থেকে মাপা।
                </Measure>

                <div className="mt-8 border-l-2 border-clay bg-clay-wash px-4 py-3">
                    <p className="text-sm text-ink-soft">
                        হেডার, ফুটার আর মোবাইল অ্যাকশন বার — তিনটাই এই পেজের চারপাশে live
                        চলছে। মোবাইল সাইজে দেখলে নিচের বারটা পাবেন।
                    </p>
                </div>
            </Section>

            <Rule className="shell" />

            <Section>
                <SectionHead
                    index={1}
                    label="টোকেন"
                    title="রঙ"
                    intro="লোগো থেকে নেওয়া। নীল একটা লাইনের রং — বড় ব্লকে ফিল হিসেবে না, লিংক আর রুলে। উষ্ণ clay পাল্টা ভার দেয়, যাতে পেজটা পুরো ঠান্ডা না হয়ে যায়।"
                />

                <div className="mt-12 grid gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <h3 className="text-micro uppercase text-ink-mute">সারফেস</h3>
                        <ul className="mt-4 divide-y divide-line border-y border-line">
                            {SURFACES.map(([token, hex, use]) => (
                                <li key={token} className="flex items-center gap-4 py-3">
                                    <span
                                        aria-hidden
                                        className="h-9 w-9 shrink-0 rounded-xs border border-line-strong"
                                        style={{ backgroundColor: hex }}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <code className="block text-xs text-ink">{token}</code>
                                        <span className="text-xs text-ink-mute">{use}</span>
                                    </span>
                                    <code className="tnum text-xs text-ink-mute">{hex}</code>
                                </li>
                            ))}
                        </ul>

                        <h3 className="text-micro mt-10 uppercase text-ink-mute">
                            স্ট্রাকচার — কোনটা কন্ট্রোলের বর্ডার হতে পারে
                        </h3>
                        <ul className="mt-4 divide-y divide-line border-y border-line">
                            {STRUCTURE.map(([token, hex, ratio, verdict, use]) => (
                                <li key={token} className="flex items-center gap-4 py-3">
                                    <span
                                        aria-hidden
                                        className="h-9 w-9 shrink-0 rounded-xs"
                                        style={{ backgroundColor: hex }}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <code className="block text-xs text-ink">{token}</code>
                                        <span className="text-xs text-ink-mute">{use}</span>
                                    </span>
                                    <span className="text-right">
                                        <span className="tnum block text-xs text-ink">
                                            {ratio}:1
                                        </span>
                                        <span className="text-xs text-ink-mute">{verdict}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-xs leading-relaxed text-ink-mute">
                            সাজসজ্জার divider-এর জন্য ৩:১ লাগে না (WCAG 1.4.11 ছাড় দেয়)। কিন্তু
                            যে লাইনটা একটা ইনপুটের সীমানা বোঝায়, সেটা কন্ট্রোলের অংশ — তার
                            জন্য <code>--color-field</code>।
                        </p>
                    </div>

                    <div className="lg:col-span-6 lg:col-start-7">
                        <h3 className="text-micro uppercase text-ink-mute">
                            টেক্সট — linen-এর উপর মাপা
                        </h3>
                        <ul className="mt-4 divide-y divide-line border-y border-line">
                            {INK.map(([token, hex, ratio, verdict]) => (
                                <li key={token} className="flex items-baseline gap-4 py-3.5">
                                    <span
                                        className="flex-1 text-base"
                                        style={{ color: hex }}
                                    >
                                        অ্যাবাব — Aa 123
                                    </span>
                                    <code className="text-xs text-ink-mute">{token}</code>
                                    <span className="tnum w-20 text-right text-xs text-ink">
                                        {ratio}:1 {verdict}
                                    </span>
                                </li>
                            ))}
                            {ACCENT.map(([token, hex, ratio, verdict, use]) => (
                                <li key={token} className="flex items-baseline gap-4 py-3.5">
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-base" style={{ color: hex }}>
                                            অ্যাবাব — Aa 123
                                        </span>
                                        <span className="text-xs text-ink-mute">{use}</span>
                                    </span>
                                    <code className="text-xs text-ink-mute">{token}</code>
                                    <span className="tnum w-20 text-right text-xs text-ink">
                                        {ratio}:1 {verdict}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 bg-ink p-5">
                            <p className="text-micro uppercase text-linen/70">
                                ইঙ্ক সারফেসে
                            </p>
                            <p className="mt-2 text-sm text-linen">
                                সাদা টেক্সট ১৫.৮৪:১ — নিরাপদ।
                            </p>
                            <p className="mt-1.5 text-sm" style={{ color: "#2E93D8" }}>
                                লিংকের জন্য <code>--color-brand-on-ink</code> — ৫.০৬:১।
                            </p>
                            <p className="mt-1.5 text-sm" style={{ color: "#1B81C4" }}>
                                brand-soft এখানে ৪.০২:১ — বডি টেক্সটে ব্যবহার করবেন না।
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            <Rule className="shell" />

            {/* ---------------- 02 type ---------------- */}
            <Section>
                <SectionHead
                    index={2}
                    label="টোকেন"
                    title="টাইপ স্কেল"
                    intro="শিরোনামে Fraunces, বাংলা গ্লিফ স্বয়ংক্রিয়ভাবে Noto Serif Bengali-তে পড়ে যায় — এক স্টাইল, দুই লিপি। বডিতে Hind Siliguri।"
                />
                <ul className="mt-12 divide-y divide-line border-y border-line">
                    {TYPE_SCALE.map(([name, size, use]) => (
                        <li
                            key={name}
                            className="grid gap-3 py-6 lg:grid-cols-12 lg:items-baseline"
                        >
                            <div className="lg:col-span-3">
                                <code className="text-xs text-ink">{name}</code>
                                <span className="mt-1 block text-xs text-ink-mute">{size}</span>
                                <span className="text-xs text-ink-mute">{use}</span>
                            </div>
                            <div className="lg:col-span-9">
                                <span
                                    className={
                                        name === "base"
                                            ? "text-ink"
                                            : name === "text-micro"
                                              ? "text-micro uppercase text-ink"
                                              : `${name} ${name === "text-lede" ? "text-ink-soft" : "font-display text-ink"}`
                                    }
                                >
                                    শখের সেরা কালেকশন — Aa 123
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </Section>

            <Rule className="shell" />

            {/* ---------------- 03 components ---------------- */}
            <Section>
                <SectionHead
                    index={3}
                    label="প্রিমিটিভ"
                    title="কম্পোনেন্ট"
                    intro="প্রতিটা ইন্টার‍্যাক্টিভ টার্গেট কমপক্ষে ৪৪px লম্বা। ফোকাস রিং ২px brand, ৩px অফসেট — Tab চেপে দেখুন।"
                />

                <div className="mt-12 grid gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <h3 className="text-micro uppercase text-ink-mute">বাটন</h3>
                        <div className="mt-5 flex flex-wrap items-center gap-4">
                            <Button href="/showcase">কালেকশন দেখুন</Button>
                            <Button href="/contact" tone="line">
                                ফার্ম ভিজিট
                            </Button>
                        </div>
                        <p className="mt-4 text-xs leading-relaxed text-ink-mute">
                            solid = charcoal, hover-এ brand blue। নীল ফিল হিসেবে বসে না — এটাই
                            জেনেরিক SaaS চেহারা এড়ানোর মূল নিয়ম।
                        </p>

                        <h3 className="text-micro mt-10 uppercase text-ink-mute">লিংক</h3>
                        <p className="mt-4 text-sm text-ink-soft">
                            <a href="#main" className="link-quiet">
                                হেয়ারলাইন আন্ডারলাইন
                            </a>{" "}
                            — offset ৬px, যাতে বাংলা যুক্তাক্ষরের নিচের অংশ কাটা না পড়ে।
                        </p>

                        <h3 className="text-micro mt-10 uppercase text-ink-mute">
                            সেকশন মার্কার
                        </h3>
                        <div className="mt-4">
                            <span className="marker">০৪ · ফিচার্ড</span>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-ink-mute">
                            নিষিদ্ধ কেন্দ্রীভূত pill badge-এর বদলে — একটা নম্বর, একটা লেবেল,
                            বাঁয়ে সারিবদ্ধ, সামনে হেয়ারলাইন।
                        </p>
                    </div>

                    <div className="lg:col-span-6 lg:col-start-7">
                        <h3 className="text-micro uppercase text-ink-mute">
                            ফ্রেম — ৪:৫ উল্লম্ব ক্রপ
                        </h3>
                        <div className="mt-5 grid grid-cols-2 gap-4">
                            <Frame sizes="(min-width:1024px) 240px, 45vw" />
                            <Frame ratio="square" sizes="(min-width:1024px) 240px, 45vw" />
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-ink-mute">
                            ছবি না থাকলেও বক্সটা রেন্ডার হয় — জায়গা আগে থেকে ধরে রাখলে ছবি
                            আসার সময় গ্রিড লাফায় না (CLS)।
                        </p>
                    </div>
                </div>
            </Section>

            <Rule className="shell" />

            {/* ---------------- 04 card + motion ---------------- */}
            <Section>
                <SectionHead
                    index={4}
                    label="প্রিমিটিভ"
                    title="শোকেস কার্ড ও মোশন"
                    intro="স্ক্রল করে এলে কার্ডগুলো ৪০ms ব্যবধানে একটার পর একটা আসে। reduced-motion চালু থাকলে কোনো অ্যানিমেশনই চলে না — দ্রুত অ্যানিমেশন না, একদমই না।"
                />

                <Stagger
                    as="ul"
                    className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 lg:gap-x-10"
                >
                    {DEMO.map((animal, i) => (
                        <AnimalCard
                            key={animal.id}
                            animal={animal}
                            sizes="(min-width:1024px) 320px, 45vw"
                            priority={i === 0}
                        />
                    ))}
                </Stagger>

                <Reveal className="mt-16">
                    <ul className="divide-y divide-line border-y border-line">
                        {MOTION.map(([token, value, use]) => (
                            <li
                                key={token}
                                className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-3"
                            >
                                <code className="w-40 text-xs text-ink">{token}</code>
                                <span className="tnum w-20 text-sm text-ink">{value}</span>
                                <span className="text-xs text-ink-mute">{use}</span>
                            </li>
                        ))}
                    </ul>
                </Reveal>

                <Measure as="p" className="mt-6 text-xs leading-relaxed text-ink-mute">
                    ঢোকার সময় গতি কমে আসে (<code>--ease-editorial</code>), বেরোনোর সময় বাড়ে
                    (<code>--ease-exit</code>), আর বেরোনো সবসময় ছোট। শুধু transform আর opacity
                    — width/height/top/left কখনো না, ওগুলো প্রতি ফ্রেমে layout আবার চালায়।
                </Measure>
            </Section>

            <Rule className="shell" />

            {/* ---------------- 05 a11y ---------------- */}
            <Section tight>
                <SectionHead
                    index={5}
                    label="যাচাই"
                    title="অ্যাক্সেসিবিলিটি"
                />
                <ul className="mt-10 grid gap-x-10 gap-y-6 text-sm text-ink-soft lg:grid-cols-2">
                    {[
                        ["স্কিপ লিংক", "Tab চাপলে বাঁ-উপরে আসে, হেডারের উপরে বসে — হেডার কখনো ওটাকে ঢাকে না।"],
                        ["ফোকাস কখনো ঢাকা পড়ে না", "sticky হেডার আর নিচের বার দুটোর উচ্চতাই টোকেন, আর html-এ scroll-padding দিয়ে দেওয়া (WCAG 2.2 AA)।"],
                        ["টাচ টার্গেট", "বাটন ও নেভ আইটেম ≥৪৪px, মাঝে ≥৮px ফাঁক।"],
                        ["হোভারে কিছু লুকানো নেই", "টাচ স্ক্রিনে হোভার হয় না — স্ট্যাটাস, দাম, সব বিশ্রামেই দেখা যায়।"],
                        ["রঙই একমাত্র সংকেত নয়", "স্ট্যাটাস ডটের সাথে সবসময় শব্দ থাকে।"],
                        ["reduced-motion", "CSS kill switch + Framer প্রিমিটিভে JS চেক — দুই জায়গাতেই।"],
                    ].map(([title, body]) => (
                        <li key={title} className="border-l-2 border-line pl-4">
                            <span className="block font-medium text-ink">{title}</span>
                            <span className="mt-1 block leading-relaxed">{body}</span>
                        </li>
                    ))}
                </ul>
            </Section>

            <Section tight className="pb-24">
                <SectionHead index={6} label="যাচাই" title="মোবাইল অ্যাকশন বার" />
                <Measure as="p" className="mt-6 text-sm leading-relaxed text-ink-soft">
                    ফোনে প্রতিটা পাবলিক পেজের নিচে থাকে — WhatsApp (prefilled বাংলা বার্তা সহ),
                    কল, আর ফার্ম ভিজিট। প্রাণীর পেজে WhatsApp বার্তায় সেই প্রাণীর নাম বসে যায়,
                    যাতে মালিক উত্তর দেওয়ার আগেই জানেন কোনটা নিয়ে কথা।
                </Measure>
                <div className="mt-8 flex flex-wrap gap-3">
                    <span className="btn-solid pointer-events-none px-4 text-[13px]">
                        <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                        WhatsApp
                    </span>
                    <span className="btn-line pointer-events-none px-4 text-[13px]">
                        <Phone size={16} strokeWidth={1.75} aria-hidden />
                        কল
                    </span>
                    <span className="btn-line pointer-events-none px-4 text-[13px]">
                        <CalendarDays size={16} strokeWidth={1.75} aria-hidden />
                        ভিজিট
                    </span>
                </div>
            </Section>
        </SiteShell>
    );
}
