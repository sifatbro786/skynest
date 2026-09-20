import { site } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Measure, Rule, Section, SectionHead } from "@/components/site/ui";

export const metadata = {
    title: "গোপনীয়তা নীতি",
    description: `${site.name} ওয়েবসাইটে কী তথ্য নেওয়া হয়, কেন নেওয়া হয় এবং কতদিন রাখা হয়।`,
    alternates: { canonical: "/privacy" },
    robots: { index: true, follow: true },
};

const UPDATED = "১৯ সেপ্টেম্বর ২০২৬";

/**
 * NOT LEGAL ADVICE — have a lawyer read this before launch.
 *
 * What makes it worth shipping anyway is that it is written from the code
 * rather than from a template. Every claim below was checked against what the
 * app actually does:
 *
 *  · `app/api/inquiries/route.js` — the only place visitor data is written.
 *  · `models/Inquiry.js` — the exact field list. Note there is NO ip field:
 *    `clientIp()` feeds the in-memory rate limiter and is never persisted, so
 *    the policy says that rather than the usual "we collect your IP".
 *  · No analytics, tag manager or ad pixel exists anywhere in the codebase,
 *    so the policy says there are none.
 *
 * If any of that changes — adding Google Analytics, a Meta pixel, a chat
 * widget — this page is now wrong and must be updated in the same commit.
 */

export default function PrivacyPage() {
    return (
        <SiteShell actionBar={false}>
            <Section>
                <SectionHead as="h1" label="নীতিমালা" title="গোপনীয়তা নীতি" />
                <p className="mt-5 text-sm text-ink-mute">সর্বশেষ হালনাগাদ — {UPDATED}</p>

                <Measure className="mt-12 space-y-12">
                    <Block title="সংক্ষেপে">
                        <p>
                            এই ওয়েবসাইটে কোনো অ্যাকাউন্ট খুলতে হয় না, কোনো পেমেন্ট নেওয়া হয় না,
                            আর কোনো বিজ্ঞাপন বা ট্র্যাকিং স্ক্রিপ্ট বসানো নেই। আপনি যোগাযোগ ফর্ম
                            পূরণ না করা পর্যন্ত আমরা আপনার কোনো তথ্য সংরক্ষণ করি না।
                        </p>
                    </Block>

                    <Block title="কী তথ্য নেওয়া হয়">
                        <p>শুধু যোগাযোগ ফর্মে আপনি নিজে যা লেখেন সেটুকুই। নির্দিষ্ট করে —</p>
                        <ul className="mt-4 space-y-2.5">
                            <Item>নাম ও মোবাইল নম্বর (আবশ্যক)</Item>
                            <Item>ইমেইল ঠিকানা (ঐচ্ছিক — দিলে কনফার্মেশন মেইল পাঠানো হয়)</Item>
                            <Item>আপনার বার্তা</Item>
                            <Item>ভিজিটের অনুরোধ হলে — তারিখ ও সময়</Item>
                            <Item>
                                কোন পাতা থেকে বার্তা পাঠিয়েছেন, আর আপনার ব্রাউজারের পরিচয় (user
                                agent) — উত্তর দেওয়ার সময় প্রসঙ্গ বোঝার জন্য
                            </Item>
                        </ul>
                        <p className="mt-5">
                            আপনার IP ঠিকানা <strong>সংরক্ষণ করা হয় না</strong>। এক ব্যক্তি যাতে
                            অল্প সময়ে অসংখ্য বার্তা পাঠাতে না পারে, শুধু সেই হিসাব রাখতে এটি
                            সাময়িকভাবে সার্ভারের মেমরিতে থাকে এবং সার্ভার রিস্টার্ট হলেই মুছে যায়।
                        </p>
                    </Block>

                    <Block title="কেন নেওয়া হয়">
                        <p>
                            একটাই কারণ — আপনার প্রশ্নের উত্তর দেওয়া বা ভিজিটের সময় ঠিক করা। আপনার
                            নম্বর বা ইমেইল বিপণন বার্তা, প্রচার বা নিউজলেটারের জন্য ব্যবহার করা হয়
                            না।
                        </p>
                    </Block>

                    <Block title="কোথায় থাকে, কে দেখতে পায়">
                        <p>
                            বার্তাগুলো আমাদের নিজস্ব সার্ভারের ডেটাবেসে জমা থাকে। শুধু ফার্মের মালিক
                            ও অনুমোদিত ব্যক্তি পাসওয়ার্ড দিয়ে সেটি দেখতে পারেন। একই সাথে বার্তাটির
                            একটি কপি ইমেইলে পাঠানো হয় যাতে দ্রুত চোখে পড়ে।
                        </p>
                    </Block>

                    <Block title="তৃতীয় পক্ষ">
                        <p>
                            আমরা কারো কাছে আপনার তথ্য বিক্রি বা হস্তান্তর করি না। তবে কয়েকটি
                            জায়গায় আপনি স্বাভাবিকভাবেই অন্য প্রতিষ্ঠানের সেবার সংস্পর্শে আসেন —
                        </p>
                        <ul className="mt-4 space-y-2.5">
                            <Item>
                                <strong>WhatsApp</strong> — বোতামে চাপলে WhatsApp-এ চলে যাবেন;
                                সেখানকার কথোপকথন তাদের নিজস্ব নীতিতে চলে।
                            </Item>
                            <Item>
                                <strong>ইমেইল সেবা</strong> — নোটিফিকেশন পাঠাতে একটি সাধারণ ইমেইল
                                সেবা ব্যবহার করা হয়।
                            </Item>
                            <Item>
                                <strong>ভিডিও</strong> — কোনো প্রাণীর পাতায় ইউটিউব বা ফেসবুক ভিডিও
                                থাকলে সেটি ওই প্ল্যাটফর্ম থেকে লোড হয়। ইউটিউবের ক্ষেত্রে আমরা
                                privacy-enhanced (<code>youtube-nocookie</code>) ঠিকানা ব্যবহার করি,
                                যাতে আপনি ভিডিও না চালানো পর্যন্ত ট্র্যাকিং কুকি না বসে।
                            </Item>
                        </ul>
                    </Block>

                    <Block title="কুকি">
                        <p>
                            সাধারণ দর্শকের ব্রাউজারে আমরা কোনো কুকি বসাই না। শুধু ফার্মের মালিক যখন
                            অ্যাডমিন প্যানেলে লগইন করেন, তখন একটি নিরাপত্তা কুকি তৈরি হয় — সেটি
                            লগইন ধরে রাখা ছাড়া অন্য কিছুতে ব্যবহার হয় না।
                        </p>
                    </Block>

                    <Block title="কতদিন রাখা হয়">
                        <p>
                            যোগাযোগের কাজ শেষ হলেও পুরনো বার্তা কিছুকাল রাখা হয়, কারণ অনেকে মাস পরে
                            আবার যোগাযোগ করেন। আপনি চাইলে আপনার বার্তা মুছে ফেলতে বলতে পারেন —
                            অনুরোধ পেলে মুছে দেওয়া হবে।
                        </p>
                    </Block>

                    <Block title="আপনার অধিকার">
                        <p>
                            আপনার সম্পর্কে কী তথ্য আছে তা জানতে চাইতে পারেন, ভুল থাকলে ঠিক করতে বলতে
                            পারেন, অথবা মুছে ফেলতে বলতে পারেন। নিচের নম্বরে যোগাযোগ করলেই হবে।
                        </p>
                    </Block>

                    <Block title="যোগাযোগ">
                        <p className="tnum">
                            {site.owner} — {site.phone}
                            <span className="mt-1 block text-ink-mute">{site.address.line}</span>
                        </p>
                    </Block>
                </Measure>

                <Rule className="mt-14" />
                <Measure as="p" className="mt-6 text-xs leading-relaxed text-ink-mute">
                    এই নীতিমালা সরল ভাষায় লেখা এবং ওয়েবসাইটটি বাস্তবে যা করে তার ভিত্তিতে তৈরি।
                    এটি আইনি পরামর্শ নয় — প্রকাশের আগে একজন আইনজীবীকে দিয়ে দেখিয়ে নেওয়া ভালো।
                </Measure>
            </Section>
        </SiteShell>
    );
}

/* ------------------------------------------------------------------ */

function Block({ title, children }) {
    return (
        <section>
            <h2 className="font-display text-title text-ink">{title}</h2>
            <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">{children}</div>
        </section>
    );
}

function Item({ children }) {
    return (
        <li className="flex gap-3 leading-relaxed">
            <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-line-strong" />
            <span className="min-w-0">{children}</span>
        </li>
    );
}
