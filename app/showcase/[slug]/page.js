import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, MessageCircle, Phone } from "lucide-react";

import { dbConnect } from "@/lib/db";
import { Animal } from "@/models/index.js";
import { serializeAnimal } from "@/lib/serialize";
import { JsonLd, animalLd, breadcrumbLd } from "@/lib/jsonld";
import { formatAge, formatPriceRange, truncate } from "@/lib/utils";
import { site, telLink, whatsappLink } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import SiteShell from "@/components/site/site-shell";
import { Band, Button, Measure, Rule } from "@/components/site/ui";
import { Reveal, Stagger } from "@/components/site/motion";
import AnimalCard from "@/components/site/animal-card";
import VideoEmbed from "@/components/site/video-embed";
import Gallery from "./gallery";
import AnimalInquiryForm from "./animal-inquiry-form";

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

/**
 * Derived from the animal, then merged with the site-wide SEO defaults.
 *
 * There is no per-animal row in the SEO panel and there should not be: a title
 * and description generated from the record are always current, and an
 * override typed once for one bird would still be there after it is sold. What
 * the animal page takes from the panel is the site-level inheritance only —
 * keywords, and a share card for the few listings with no photograph.
 *
 * The animal's own cover beats the site card; see the precedence note in
 * lib/seo.js.
 */
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const animal = await findAnimal(slug);

    // A missing slug renders the 404 route with these tags. `noindex` matters:
    // without it a mistyped or deleted listing is a soft 404 that Google will
    // happily index under whatever title the not-found page carries.
    if (!animal) {
        return { title: "পাওয়া যায়নি", robots: { index: false, follow: false } };
    }

    const description = truncate(
        animal.description || `${animal.breed} — ${site.name}-এর কালেকশন থেকে।`,
        160,
    );

    return pageMetadata(`/showcase/${animal.slug}`, {
        title: animal.title,
        description,
        canonical: `/showcase/${animal.slug}`,
        ogType: "article",
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
    });
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

    // Built from the trail the page actually renders below, not from the URL.
    const trail = [
        ["কালেকশন", "/showcase"],
        ...(animal.category?.slug
            ? [[animal.category.name, `/category/${animal.category.slug}`]]
            : []),
        [animal.title, `/showcase/${animal.slug}`],
    ];

    return (
        <SiteShell whatsappMessage={waMessage}>
            <JsonLd data={animalLd(animal)} />
            <JsonLd data={breadcrumbLd(trail)} />

            {/* ================= ink: the showroom wall =================

                The gallery and the buying decision sit on the darkest ground
                on the site, and that is the one place this project can fairly
                call itself a luxury showroom: a photograph of an animal against
                charcoal reads as lit, the same photograph on linen reads as a
                catalogue entry. Everything a buyer needs to decide — status,
                name, price, specs, and the three ways to make contact — is
                inside this band.

                Every value here comes from `.on-ink`'s rebinds, so the
                utilities are the ordinary light-ground ones. Two exceptions
                are marked below; both would be invisible without the note. */}
            <Band
                as="div"
                tone="ink"
                grain
                innerClassName="pt-8 pb-14 md:pt-10 md:pb-18 lg:pt-12 lg:pb-20"
            >
                {/* ---------- breadcrumb ---------- */}
                <nav
                    aria-label="পথ"
                    className="flex flex-wrap items-center gap-1.5 text-xs text-ink-mute"
                >
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
                        Six columns with a hard 520px cap. At 1440 an
                        unconstrained seven-column 4:5 frame renders ~700x875,
                        which pushes the price and the WhatsApp button below the
                        fold on the one screen where they matter most. Capped,
                        the whole buying decision fits above it.

                        `Gallery` needs no dark variant: its active thumbnail is
                        `border-brand`, which `.on-ink` rebinds to the sky-blue
                        on-ink value, and its hover border reads `--color-field`,
                        raised to white/0.38 on the same band. */}
                    <div className="lg:col-span-6">
                        <Gallery
                            images={animal.images}
                            alt={`${animal.breed} — ${animal.title}`}
                            className="mx-auto w-full max-w-104 sm:max-w-120 lg:mx-0 lg:max-w-130"
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

                            {/* EXCEPTION 1. This was `bg-leaf-wash` with
                                `text-ink-soft`. On a light page that is a pale
                                green callout with dark text; inside `.on-ink`,
                                `--color-ink-soft` rebinds to #c3c9cd and the
                                result was near-white text on a near-white
                                block. The note now tints the BAND instead of
                                replacing it, and the rule uses `leaf-soft`
                                (4.25:1 here) because full-strength leaf is
                                2.99:1 on this ground. */}
                            {animal.vaccinationNote ? (
                                <p className="mt-5 border-l-2 border-leaf-soft bg-white/6 px-4 py-3 text-xs leading-relaxed text-ink-soft">
                                    {animal.vaccinationNote}
                                </p>
                            ) : null}

                            <Rule className="my-7" />

                            {/* On phones the sticky action bar already carries
                                these, so this block is the desktop path — but it
                                stays visible on mobile too, because a buyer who
                                has scrolled to the specs should not have to look
                                back down at the bar. */}
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
            </Band>

            {/* ================= sage: the reading =================
                Prose and the video, on the quietest coloured ground. Renders
                nothing at all when the owner filled none of these in — a
                heading over an empty column reads as broken rather than as
                "nothing written yet". */}
            {animal.description || animal.careNotes || animal.pedigree || animal.videoUrl ? (
                <Band tone="sage" grain innerClassName="py-14 md:py-18 lg:py-24">
                    <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
                        {animal.description ? (
                            <Reveal className="lg:col-span-7">
                                <h2 className="font-display text-title text-ink">বিস্তারিত</h2>
                                <Measure
                                    as="p"
                                    className="mt-5 leading-relaxed whitespace-pre-line text-ink-soft"
                                >
                                    {animal.description}
                                </Measure>
                            </Reveal>
                        ) : null}

                        {animal.pedigree || animal.careNotes ? (
                            <Reveal
                                delay={0.08}
                                className="space-y-10 lg:col-span-4 lg:col-start-9"
                            >
                                {animal.pedigree ? (
                                    <div>
                                        <h2 className="text-micro uppercase text-ink-mute">
                                            পেডিগ্রি
                                        </h2>
                                        <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-soft">
                                            {animal.pedigree}
                                        </p>
                                    </div>
                                ) : null}

                                {animal.careNotes ? (
                                    <div>
                                        <h2 className="text-micro uppercase text-ink-mute">
                                            যত্নের নির্দেশনা
                                        </h2>
                                        <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-soft">
                                            {animal.careNotes}
                                        </p>
                                    </div>
                                ) : null}
                            </Reveal>
                        ) : null}

                        {animal.videoUrl ? (
                            <Reveal delay={0.12} className="lg:col-span-8">
                                <h2 className="font-display text-title text-ink">ভিডিও</h2>
                                <div className="mt-6">
                                    <VideoEmbed url={animal.videoUrl} title={animal.title} />
                                </div>
                            </Reveal>
                        ) : null}
                    </div>
                </Band>
            ) : null}

            {/* ================= paper: the ask =================
                The form has to be on a light ground — `form-ui.js` builds every
                control from `bg-paper` / `border-field` and its alert reds are
                light-ground values.

                Only for an animal someone can still buy. On a sold listing the
                form would collect leads for something that no longer exists,
                and the honest answer — "this one is gone, here is the rest of
                the family" — is more useful to both sides. */}
            {animal.status === "sold" ? (
                <Band tone="paper" id="inquiry" innerClassName="py-14 md:py-18 lg:py-24">
                    <h2 className="text-headline font-display text-ink">এটি বিক্রি হয়ে গেছে</h2>
                    <Measure as="p" className="text-lede mt-5 leading-relaxed text-ink-soft">
                        একই ধরনের প্রাণী নিয়মিত আসে। কী খুঁজছেন জানালে নতুন কিছু এলে আপনাকে
                        জানানো যাবে।
                    </Measure>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button href="/contact">কী খুঁজছেন বলুন</Button>
                        {animal.category?.slug ? (
                            <Button href={`/category/${animal.category.slug}`} tone="line">
                                {animal.category.name} — সব দেখুন
                            </Button>
                        ) : null}
                    </div>
                </Band>
            ) : (
                <Band tone="paper" id="inquiry" innerClassName="py-14 md:py-18 lg:py-24">
                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
                        <Reveal className="lg:col-span-4">
                            <h2 className="text-headline font-display text-ink">
                                এই প্রাণীটি নিয়ে <span className="stroke-under">জানতে চান?</span>
                            </h2>
                            <Measure as="p" className="mt-5 text-sm leading-relaxed text-ink-soft">
                                নাম আর নম্বরটা রেখে যান — আমরা ফোন করে বাকিটা বলব। এখনই কথা
                                বলতে চাইলে WhatsApp বা সরাসরি কল দুটোই খোলা।
                            </Measure>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Button
                                    as="a"
                                    href={whatsappLink(waMessage)}
                                    target="_blank"
                                    rel="noreferrer"
                                    tone="line"
                                >
                                    <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                                    WhatsApp
                                </Button>
                                <Button as="a" href={telLink()} tone="line">
                                    <Phone size={16} strokeWidth={1.75} aria-hidden />
                                    <span className="tnum">{site.phone}</span>
                                </Button>
                            </div>
                        </Reveal>

                        <Reveal delay={0.08} className="lg:col-span-7 lg:col-start-6">
                            <AnimalInquiryForm animalId={animal.id} animalTitle={animal.title} />
                        </Reveal>
                    </div>
                </Band>
            )}

            {/* ================= sky: the rest of the family ================= */}
            {related.length > 0 ? (
                <Band tone="sky" innerClassName="py-14 md:py-18 lg:py-24">
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
                        delayChildren={0.08}
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
                </Band>
            ) : null}
        </SiteShell>
    );
}
