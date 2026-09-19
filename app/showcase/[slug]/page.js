import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, MessageCircle, Phone } from "lucide-react";

import { dbConnect } from "@/lib/db";
import { Animal } from "@/models/index.js";
import { serializeAnimal } from "@/lib/serialize";
import { formatAge, formatPriceRange, truncate } from "@/lib/utils";
import { site, telLink, whatsappLink } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Button, Measure, Rule, Section } from "@/components/site/ui";
import { Reveal, Stagger } from "@/components/site/motion";
import AnimalCard from "@/components/site/animal-card";
import VideoEmbed from "@/components/site/video-embed";
import Gallery from "./gallery";

export const dynamic = "force-dynamic";

const GENDER = {
    unknown: "জানা নেই",
    male: "পুরুষ",
    female: "মহিলা",
    pair: "জোড়া",
};

const VACCINATION = {
    na: "প্রযোজ্য নয়",
    done: "সম্পন্ন",
    partial: "আংশিক",
    pending: "বাকি আছে",
};

const STATUS = {
    available: { label: "পাওয়া যাচ্ছে", dot: "bg-status-available" },
    reserved: { label: "বুকড", dot: "bg-status-reserved" },
    sold: { label: "বিক্রি হয়েছে", dot: "bg-status-sold" },
};

/** Published only — an unpublished slug must 404, not render a draft. */
async function findAnimal(slug) {
    await dbConnect();
    const doc = await Animal.findOne({ slug, isPublished: true })
        .populate("category", "name nameEn slug")
        .populate("subcategory", "name nameEn slug")
        .lean();
    return doc ? serializeAnimal(doc) : null;
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const animal = await findAnimal(slug);
    if (!animal) return { title: "পাওয়া যায়নি" };

    const description = truncate(
        animal.description || `${animal.breed} — ${site.name}-এর কালেকশন থেকে।`,
        160
    );

    return {
        title: animal.title,
        description,
        alternates: { canonical: `/showcase/${animal.slug}` },
        openGraph: {
            type: "article",
            title: animal.title,
            description,
            url: `/showcase/${animal.slug}`,
            images: animal.cover?.path
                ? [
                      {
                          url: animal.cover.path,
                          width: animal.cover.width || 1200,
                          height: animal.cover.height || 1500,
                          alt: animal.cover.alt || animal.title,
                      },
                  ]
                : undefined,
        },
    };
}

export default async function AnimalPage({ params }) {
    const { slug } = await params;
    const animal = await findAnimal(slug);
    if (!animal) notFound();

    // Same family, still published, not this one. Four so the row fills on
    // desktop and does not leave one orphan card.
    const relatedDocs = animal.category?.id
        ? await Animal.find({
              isPublished: true,
              category: animal.category.id,
              _id: { $ne: animal.id },
          })
              .sort({ isFeatured: -1, createdAt: -1 })
              .limit(3)
              .lean()
        : [];
    const related = relatedDocs.map(serializeAnimal);

    const status = STATUS[animal.status] ?? STATUS.available;
    const price = animal.price?.onRequest
        ? "দাম জানতে যোগাযোগ করুন"
        : formatPriceRange(animal.price?.min, animal.price?.max, { bangla: true });

    const specs = [
        ["ব্রিড", animal.breed],
        ["লিঙ্গ", GENDER[animal.gender] ?? GENDER.unknown],
        ["বয়স", animal.ageMonths != null ? formatAge(animal.ageMonths) : "—"],
        ["রং / মিউটেশন", animal.color || "—"],
        ["ভ্যাকসিনেশন", VACCINATION[animal.vaccination] ?? VACCINATION.na],
    ];

    const waMessage = `আসসালামু আলাইকুম। "${animal.title}" (${animal.breed}) নিয়ে জানতে চাই।`;

    return (
        <SiteShell whatsappMessage={waMessage}>
            <Section>
                {/* ---------- breadcrumb ---------- */}
                <nav aria-label="পথ" className="flex flex-wrap items-center gap-1.5 text-xs text-ink-mute">
                    <Link href="/showcase" className="transition-colors hover:text-brand">
                        কালেকশন
                    </Link>
                    {animal.category?.slug ? (
                        <>
                            <ChevronRight size={12} strokeWidth={2} aria-hidden />
                            <Link
                                href={`/category/${animal.category.slug}`}
                                className="transition-colors hover:text-brand"
                            >
                                {animal.category.name}
                            </Link>
                        </>
                    ) : null}
                    <ChevronRight size={12} strokeWidth={2} aria-hidden />
                    <span className="truncate text-ink-soft">{animal.title}</span>
                </nav>

                <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
                    {/* ---------- gallery ----------
                        Six columns with a hard 520px cap. At 1440 an unconstrained
                        seven-column 4:5 frame renders ~700x875, which pushes the
                        price and the WhatsApp button below the fold on the one
                        screen where they matter most. Capped, the whole buying
                        decision fits above it. */}
                    <div className="lg:col-span-6">
                        <Gallery
                            images={animal.images}
                            alt={`${animal.breed} — ${animal.title}`}
                            className="mx-auto w-full max-w-[26rem] sm:max-w-[30rem] lg:mx-0 lg:max-w-[32.5rem]"
                        />
                    </div>

                    {/* ---------- info rail ---------- */}
                    <div className="lg:col-span-5 lg:col-start-8">
                        <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
                            <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                                <span
                                    aria-hidden
                                    className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`}
                                />
                                {status.label}
                            </span>

                            <h1 className="text-headline mt-3 font-display text-ink">
                                {animal.title}
                            </h1>
                            <p className="mt-2 text-ink-mute">{animal.breed}</p>

                            <p className="tnum mt-6 font-display text-title text-ink">{price}</p>

                            <Rule className="my-7" />

                            <dl className="space-y-3.5 text-sm">
                                {specs.map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1"
                                    >
                                        <dt className="text-ink-mute">{label}</dt>
                                        <dd className="tnum text-right text-ink">{value}</dd>
                                    </div>
                                ))}
                            </dl>

                            {animal.vaccinationNote ? (
                                <p className="mt-4 border-l-2 border-leaf bg-leaf-wash px-4 py-2.5 text-xs leading-relaxed text-ink-soft">
                                    {animal.vaccinationNote}
                                </p>
                            ) : null}

                            <Rule className="my-7" />

                            {/* On phones the sticky action bar already carries these, so
                                this block is the desktop path — but it stays visible on
                                mobile too, because a buyer who has scrolled to the specs
                                should not have to look back down at the bar. */}
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    as="a"
                                    href={whatsappLink(waMessage)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                                    WhatsApp-এ জিজ্ঞেস করুন
                                </Button>
                                <Button as="a" href={telLink()} tone="line">
                                    <Phone size={16} strokeWidth={1.75} aria-hidden />
                                    কল করুন
                                </Button>
                                <Button href="/contact" tone="line">
                                    <CalendarDays size={16} strokeWidth={1.75} aria-hidden />
                                    ফার্মে দেখতে আসুন
                                </Button>
                            </div>

                            <p className="mt-4 text-xs leading-relaxed text-ink-mute">
                                {site.address.line} — আগে থেকে সময় ঠিক করে এলে প্রাণীটি প্রস্তুত
                                রাখা হবে।
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ---------- long form ---------- */}
            {animal.description || animal.careNotes || animal.pedigree ? (
                <Section tight>
                    <Rule className="mb-14" />
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
                        {animal.description ? (
                            <Reveal className="lg:col-span-7">
                                <h2 className="font-display text-title text-ink">বিস্তারিত</h2>
                                <Measure
                                    as="p"
                                    className="mt-5 whitespace-pre-line leading-relaxed text-ink-soft"
                                >
                                    {animal.description}
                                </Measure>
                            </Reveal>
                        ) : null}

                        <Reveal delay={0.08} className="space-y-10 lg:col-span-4 lg:col-start-9">
                            {animal.pedigree ? (
                                <div>
                                    <h2 className="text-micro uppercase text-ink-mute">
                                        পেডিগ্রি
                                    </h2>
                                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                                        {animal.pedigree}
                                    </p>
                                </div>
                            ) : null}

                            {animal.careNotes ? (
                                <div>
                                    <h2 className="text-micro uppercase text-ink-mute">
                                        যত্নের নির্দেশনা
                                    </h2>
                                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                                        {animal.careNotes}
                                    </p>
                                </div>
                            ) : null}
                        </Reveal>
                    </div>
                </Section>
            ) : null}

            {/* ---------- video ---------- */}
            {animal.videoUrl ? (
                <Section tight>
                    <h2 className="font-display text-title text-ink">ভিডিও</h2>
                    <Reveal className="mt-6 max-w-4xl">
                        <VideoEmbed url={animal.videoUrl} title={animal.title} />
                    </Reveal>
                </Section>
            ) : null}

            {/* ---------- related ---------- */}
            {related.length > 0 ? (
                <Section>
                    <Rule className="mb-14" />
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <h2 className="text-headline font-display text-ink">
                            একই ক্যাটাগরির আরও
                        </h2>
                        {animal.category?.slug ? (
                            <Button href={`/category/${animal.category.slug}`} tone="line">
                                {animal.category.name} — সব দেখুন
                            </Button>
                        ) : null}
                    </div>

                    <Stagger
                        as="ul"
                        className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-3 lg:gap-x-10"
                    >
                        {related.map((item) => (
                            <AnimalCard
                                key={item.id}
                                animal={item}
                                sizes="(min-width:1024px) 340px, 46vw"
                            />
                        ))}
                    </Stagger>
                </Section>
            ) : null}
        </SiteShell>
    );
}
