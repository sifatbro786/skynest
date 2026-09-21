import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import SiteShell from "@/components/site/site-shell";
import { Measure, Rule, Section, SectionHead } from "@/components/site/ui";

export async function generateMetadata() {
    return pageMetadata("/terms", {
        title: "শর্তাবলি",
        description: `${site.name} ওয়েবসাইট ব্যবহারের শর্ত — দাম, প্রাপ্যতা, স্বাস্থ্য তথ্য ও ফার্ম ভিজিট সংক্রান্ত।`,
    });
}

const UPDATED = "১৯ সেপ্টেম্বর ২০২৬";

/**
 * NOT LEGAL ADVICE — have a lawyer read this before launch.
 *
 * Written to match how the product actually behaves, not a generic template:
 * there is no cart, no online payment and no account, so none of the usual
 * e-commerce clauses about orders, refunds or delivery apply. Claiming
 * otherwise would be worse than saying nothing.
 *
 * The health clause is the one to be careful with. The admin panel records a
 * vaccination status per animal, and a buyer could reasonably read that as a
 * guarantee. It is a record of what was done, not a veterinary certificate —
 * that distinction is stated plainly rather than buried.
 */

export default function TermsPage() {
    return (
        <SiteShell actionBar={false}>
            <Section>
                <SectionHead as="h1" label="নীতিমালা" title="শর্তাবলি" />
                <p className="mt-5 text-sm text-ink-mute">সর্বশেষ হালনাগাদ — {UPDATED}</p>

                <Measure className="mt-12 space-y-12">
                    <Block title="এই ওয়েবসাইট কী">
                        <p>
                            এটি {site.name}-এর একটি ক্যাটালগ ওয়েবসাইট। এখানে কোনো কার্ট, অনলাইন
                            পেমেন্ট বা অর্ডার ব্যবস্থা নেই। ওয়েবসাইটে কোনো প্রাণী দেখে পছন্দ হলে
                            আপনি যোগাযোগ করেন, তারপর সরাসরি কথা বলে বা ফার্মে এসে লেনদেন হয়।
                        </p>
                    </Block>

                    <Block title="দাম">
                        <p>
                            পাতায় দেখানো দাম নির্দেশক। বয়স, স্বাস্থ্য, বংশ পরিচয় ও বাজার
                            পরিস্থিতি অনুযায়ী চূড়ান্ত দাম আলোচনায় ঠিক হয়। কোনো প্রাণীর ক্ষেত্রে
                            &ldquo;দাম জানতে যোগাযোগ করুন&rdquo; লেখা থাকলে বুঝতে হবে দামটি
                            নির্দিষ্ট নয়।
                        </p>
                        <p>
                            দাম আগাম ঘোষণা ছাড়াই পরিবর্তিত হতে পারে। ওয়েবসাইটে দেখানো দাম কোনো
                            বিক্রয় প্রস্তাব বা চুক্তি নয়।
                        </p>
                    </Block>

                    <Block title="প্রাপ্যতা">
                        <p>
                            কালেকশন নিয়মিত বদলায়। &ldquo;পাওয়া যাচ্ছে&rdquo; লেখা থাকা সত্ত্বেও
                            একটি প্রাণী ইতিমধ্যে বুকড বা বিক্রি হয়ে থাকতে পারে — বিশেষ করে ফোনে কথা
                            বলার আগেই। রওনা দেওয়ার আগে একবার ফোন করে নিশ্চিত হয়ে নেওয়াই নিরাপদ।
                        </p>
                    </Block>

                    <Block title="স্বাস্থ্য ও ভ্যাকসিনেশনের তথ্য">
                        <p>
                            প্রতিটি প্রাণীর পাতায় ভ্যাকসিনেশনের যে অবস্থা লেখা থাকে, সেটি আমাদের
                            নিজস্ব রেকর্ড অনুযায়ী <strong>যা করা হয়েছে তার বিবরণ</strong>— কোনো
                            পশুচিকিৎসকের সনদ বা ভবিষ্যৎ স্বাস্থ্যের নিশ্চয়তা নয়।
                        </p>
                        <p>
                            আমরা যতটুকু জানি ততটুকুই লিখি, এবং যা জানা নেই তা &ldquo;প্রযোজ্য
                            নয়&rdquo; বা &ldquo;বাকি আছে&rdquo; হিসেবেই দেখাই। নেওয়ার আগে নিজে
                            দেখে নেওয়া এবং প্রয়োজনে নিজের পশুচিকিৎসক দিয়ে পরীক্ষা করিয়ে নেওয়ার
                            পরামর্শ দিই।
                        </p>
                    </Block>

                    <Block title="ছবি ও বিবরণ">
                        <p>
                            ছবিগুলো প্রকৃত প্রাণীর। তবু আলো, বয়স আর স্ক্রিনভেদে রঙ কিছুটা আলাদা
                            দেখাতে পারে। যেসব ছবি এখনো পরিবর্তন করা হয়নি বা প্রতীকী, সেগুলো
                            সম্পর্কে জিজ্ঞেস করলে জানিয়ে দেওয়া হবে।
                        </p>
                    </Block>

                    <Block title="ফার্ম ভিজিট">
                        <p>
                            ভিজিটের জন্য আগে থেকে সময় ঠিক করে নিতে হয়। সময় চাওয়া মানেই তা
                            নিশ্চিত হয়ে যাওয়া নয় — আমরা ফোন বা WhatsApp-এ নিশ্চিত করার পরই সময়টি
                            চূড়ান্ত।
                        </p>
                        <p>
                            ফার্মে জীবিত প্রাণী থাকে। সেখানে অবস্থানকালে নিজের ও সঙ্গে আসা শিশুদের
                            নিরাপত্তার দায়িত্ব দর্শনার্থীর। কর্মীদের নির্দেশনা মেনে চলার অনুরোধ
                            রইল।
                        </p>
                    </Block>

                    <Block title="লেনদেন">
                        <p>
                            আমরা কুরিয়ার বা অগ্রিম পেমেন্টের ভিত্তিতে বুকিং নিই না। প্রাণী নিজে
                            দেখে, পছন্দ হলে তবেই লেনদেন। এই ওয়েবসাইটের মাধ্যমে কোনো টাকা লেনদেন হয়
                            না — কেউ এই সাইটের নাম করে অগ্রিম চাইলে আগে আমাদের নম্বরে যাচাই করে নিন।
                        </p>
                    </Block>

                    <Block title="ওয়েবসাইটের কনটেন্ট">
                        <p>
                            এই সাইটের ছবি, লেখা ও লোগো {site.name}-এর সম্পত্তি। অনুমতি ছাড়া
                            বাণিজ্যিক কাজে ব্যবহার করা যাবে না।
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
                    এই শর্তাবলি সরল ভাষায় লেখা খসড়া। এটি আইনি পরামর্শ নয় — প্রকাশের আগে একজন
                    আইনজীবীকে দিয়ে দেখিয়ে নেওয়া ভালো।
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
