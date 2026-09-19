import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";

import { dbConnect } from "@/lib/db";
import { Animal, Category } from "@/models/index.js";
import { serializeAnimal, serializeCategory } from "@/lib/serialize";
import { toBanglaDigits } from "@/lib/utils";
import { site, whatsappLink } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Button, Measure, Rule, Section, SectionHead } from "@/components/site/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/site/motion";
import AnimalCard from "@/components/site/animal-card";

export const dynamic = "force-dynamic";

export const metadata = {
    alternates: { canonical: "/" },
};

/**
 * One trip to the database for everything the page shows.
 *
 * The featured list falls back to newest when nothing is flagged: a brand new
 * install would otherwise render a heading over an empty row, which reads as
 * broken rather than as "no featured animals yet".
 */
async function getHomeData() {
    await dbConnect();

    const [featuredDocs, families, counts, total] = await Promise.all([
        Animal.find({ isPublished: true, isFeatured: true })
            .sort({ createdAt: -1 })
            .limit(6)
            .lean(),
        Category.find({ parent: null, isActive: true })
            .sort({ order: 1, nameEn: 1 })
            .lean(),
        Animal.aggregate([
            { $match: { isPublished: true } },
            { $group: { _id: "$category", n: { $sum: 1 } } },
        ]),
        Animal.countDocuments({ isPublished: true }),
    ]);

    let featured = featuredDocs;
    if (featured.length === 0) {
        featured = await Animal.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();
    }

    const countBy = {};
    for (const row of counts) {
        if (row?._id) countBy[String(row._id)] = row.n;
    }

    return {
        featured: featured.map(serializeAnimal),
        families: families.map(serializeCategory),
        countBy,
        total,
    };
}

export default async function Home() {
    const { featured, families, countBy, total } = await getHomeData();

    return (
        <SiteShell>
            {/* ================= hero ================= */}
            <Section as="div" className="pt-14 md:pt-20 lg:pt-24">
                <div className="grid gap-14 lg:grid-cols-12 lg:items-end lg:gap-10">
                    <div className="lg:col-span-7">
                        <Reveal>
                            <div className="flex items-center gap-5">
                                <Image
                                    src={site.logo}
                                    alt=""
                                    width={144}
                                    height={144}
                                    priority
                                    className="h-16 w-16 shrink-0 object-contain md:h-20 md:w-20"
                                />
                                <span className="marker">{site.tagline}</span>
                            </div>
                        </Reveal>

                        <Reveal delay={0.06}>
                            <h1 className="text-display mt-7 max-w-[15ch] font-display text-ink">
                                শখের সেরা <span className="stroke-under">কালেকশন</span>
                            </h1>
                        </Reveal>

                        <Reveal delay={0.12}>
                            <Measure as="p" className="text-lede mt-7 text-ink-soft">
                                {site.description}
                            </Measure>
                        </Reveal>

                        <Reveal delay={0.18}>
                            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                                <Button href="/showcase">
                                    কালেকশন দেখুন
                                    <ArrowRight size={16} strokeWidth={2} aria-hidden />
                                </Button>
                                <Button href="/contact" tone="line">
                                    ফার্ম ভিজিটের সময় নিন
                                </Button>
                            </div>
                        </Reveal>
                    </div>

                    <Reveal as="aside" delay={0.24} className="lg:col-span-4 lg:col-start-9">
                        <Rule />
                        <dl className="mt-6 space-y-5">
                            <div>
                                <dt className="text-micro uppercase text-ink-mute">
                                    এখন কালেকশনে
                                </dt>
                                <dd className="tnum mt-1 font-display text-title text-ink">
                                    {toBanglaDigits(total)}টি প্রাণী
                                </dd>
                            </div>
                            <div>
                                <dt className="text-micro uppercase text-ink-mute">
                                    সরাসরি যোগাযোগ
                                </dt>
                                <dd className="tnum mt-1 font-display text-title text-ink">
                                    {site.phone}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-micro uppercase text-ink-mute">ঠিকানা</dt>
                                <dd className="mt-1 text-ink-soft">{site.address.line}</dd>
                            </div>
                        </dl>
                    </Reveal>
                </div>
            </Section>

            {/* ================= featured ================= */}
            {featured.length > 0 ? (
                <Section>
                    <Rule className="mb-14" />
                    <SectionHead
                        index={1}
                        label="নির্বাচিত"
                        title="এই মুহূর্তে যেগুলো আছে"
                        intro="প্রতিটির দাম, বয়স আর ভ্যাকসিনেশনের অবস্থা পাতায় খোলা লেখা আছে।"
                        action={
                            <Button href="/showcase" tone="line">
                                সব দেখুন
                            </Button>
                        }
                    />

                    <Stagger
                        as="ul"
                        className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16"
                    >
                        {featured.map((animal, i) => (
                            <AnimalCard
                                key={animal.id}
                                animal={animal}
                                priority={i < 2}
                                sizes="(min-width:1024px) 340px, (min-width:768px) 40vw, 46vw"
                                className={i % 3 === 1 ? "lg:mt-16" : undefined}
                            />
                        ))}
                    </Stagger>
                </Section>
            ) : null}

            {/* ================= categories ================= */}
            {families.length > 0 ? (
                <Section>
                    <Rule className="mb-14" />
                    <SectionHead
                        index={2}
                        label="ক্যাটাগরি"
                        title="কী খুঁজছেন?"
                    />

                    {/* A list on hairlines, not a row of cards: five families do not
                        divide into a tidy grid, and a list lets the name, the
                        English label and the count sit on one scannable line. */}
                    <Stagger
                        as="ul"
                        className="mt-12 divide-y divide-line border-y border-line"
                    >
                        {families.map((family) => (
                            <StaggerItem as="li" key={family.id}>
                                <Link
                                    href={`/category/${family.slug}`}
                                    className="group flex flex-wrap items-center gap-x-6 gap-y-2 py-7 transition-colors"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-display text-title text-ink transition-colors group-hover:text-brand">
                                            {family.name}
                                        </span>
                                        {family.blurb ? (
                                            <span className="measure mt-1.5 block text-sm text-ink-mute">
                                                {family.blurb}
                                            </span>
                                        ) : null}
                                    </span>

                                    <span className="tnum shrink-0 text-sm text-ink-mute">
                                        {toBanglaDigits(countBy[family.id] ?? 0)}টি
                                    </span>
                                    <ArrowRight
                                        size={18}
                                        strokeWidth={1.75}
                                        aria-hidden
                                        className="shrink-0 text-ink-mute transition-colors group-hover:text-brand"
                                    />
                                </Link>
                            </StaggerItem>
                        ))}
                    </Stagger>
                </Section>
            ) : null}

            {/* ================= visit CTA ================= */}
            <Section className="pb-24">
                <Rule className="mb-14" />
                <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
                    <Reveal className="lg:col-span-7">
                        <h2 className="text-headline font-display text-ink">
                            ছবি দেখে নয় — <span className="stroke-under">এসে</span> দেখে
                            নিন
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
        </SiteShell>
    );
}
