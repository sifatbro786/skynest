import { dbConnect } from "@/lib/db";
import { Animal, Category } from "@/models/index.js";
import { serializeAnimal, serializeCategory } from "@/lib/serialize";
import { listQuerySchema } from "@/lib/validators";
import { buildPublicAnimalFilter, publicSortFor } from "@/lib/animal-query";
import { site } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Band, Button, Measure } from "@/components/site/ui";
import { Reveal, WordReveal } from "@/components/site/motion";
import AnimalGrid from "@/components/site/animal-grid";
import VisitCta from "@/components/site/home/visit-cta";
import ShowcaseFilters from "./showcase-filters";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "কালেকশন",
    description:
        "পেডিগ্রি কুকুর ও বিড়াল, এক্সোটিক পাখি ও কবুতর, ফ্যান্সি হাঁস-মুরগি — সরাসরি ফার্ম থেকে।",
    alternates: { canonical: "/showcase" },
};

/**
 * Builds a `/showcase` URL from the current filters.
 *
 * Defaults are omitted rather than written out, so the canonical listing stays
 * `/showcase` instead of `/showcase?status=all&sort=newest&page=1` — three
 * URLs for one page is a crawl problem and an ugly share link.
 */
function showcaseHref(params, patch = {}) {
    const next = { ...params, ...patch };
    const sp = new URLSearchParams();

    for (const [key, value] of Object.entries(next)) {
        if (value === "" || value === null || value === undefined) continue;
        if (key === "limit") continue;
        if (key === "page" && Number(value) === 1) continue;
        if ((key === "status" || key === "gender") && value === "all") continue;
        if (key === "sort" && value === "newest") continue;
        sp.set(key, String(value));
    }

    const qs = sp.toString();
    return qs ? `/showcase?${qs}` : "/showcase";
}

export default async function ShowcasePage({ searchParams }) {
    const raw = await searchParams;
    const parsed = listQuerySchema.safeParse(raw ?? {});
    const params = parsed.success ? parsed.data : listQuerySchema.parse({});

    await dbConnect();

    // Public URLs carry slugs; the filter needs ids.
    const [categories, catDoc, subDoc] = await Promise.all([
        Category.find({ isActive: true }).sort({ order: 1, nameEn: 1 }).lean(),
        params.category
            ? Category.findOne({ slug: params.category, isActive: true }).select("_id").lean()
            : null,
        params.subcategory
            ? Category.findOne({ slug: params.subcategory, isActive: true }).select("_id").lean()
            : null,
    ]);

    const filter = buildPublicAnimalFilter(params, {
        categoryId: catDoc?._id ? String(catDoc._id) : null,
        subcategoryId: subDoc?._id ? String(subDoc._id) : null,
    });

    const [docs, total] = await Promise.all([
        Animal.find(filter)
            .sort(publicSortFor(params.sort))
            .skip((params.page - 1) * params.limit)
            .limit(params.limit)
            .populate("category", "name nameEn slug")
            .populate("subcategory", "name nameEn slug")
            .lean(),
        Animal.countDocuments(filter),
    ]);

    const animals = docs.map(serializeAnimal);
    const pages = Math.max(1, Math.ceil(total / params.limit));

    const filtered =
        params.q !== "" ||
        params.category !== "" ||
        params.subcategory !== "" ||
        params.status !== "all" ||
        params.gender !== "all";

    return (
        <SiteShell
            whatsappMessage={`আসসালামু আলাইকুম। ${site.name}-এর কালেকশন থেকে কিছু দেখতে চাই।`}
        >
            {/* ---------------- ink: the section opener ----------------

                A head block and nothing else — no right-hand column, no
                stats. The number of animals is already printed above the
                grid by `AnimalGrid`, and it is the FILTERED count there, so
                repeating it up here would show the same figure twice and
                make it look like two different measurements. */}
            <Band
                as="div"
                tone="ink"
                grain
                innerClassName="pt-10 pb-14 md:pt-16 md:pb-16 lg:pt-20 lg:pb-20"
            >
                <div className="max-w-3xl">
                    <Reveal>
                        <span className="marker">কালেকশন</span>
                    </Reveal>

                    <WordReveal
                        as="h1"
                        text="আমাদের প্রাণীরা"
                        delay={0.05}
                        className="text-display mt-6 font-display"
                    />

                    <Reveal delay={0.2}>
                        <Measure as="p" className="text-lede mt-7 text-linen/70">
                            প্রতিটি প্রাণী ফার্মে নিজে দেখে নেওয়ার সুযোগ আছে। দাম, বয়স আর
                            ভ্যাকসিনেশনের তথ্য প্রতিটি পাতায় খোলা রাখা হয়েছে।
                        </Measure>
                    </Reveal>

                    <Reveal delay={0.28}>
                        <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-3">
                            <Button href="/contact" tone="line">
                                ফার্ম ভিজিটের সময় নিন
                            </Button>
                        </div>
                    </Reveal>
                </div>
            </Band>

            {/* ---------------- paper: filters + grid ----------------

                The rail has to sit on a light ground and that is not a
                preference: every control in `showcase-filters.js` is built
                from `bg-paper`, `border-field` and `bg-ink` — light-ground
                values, and the count badge in particular would invert to
                linen-on-linen inside `.on-ink`.

                Rail left, grid right. 3/9 rather than 4/8: the filters are a
                list of short labels and do not need a quarter of the page,
                and the grid is what the visitor came for. */}
            <Band tone="paper" innerClassName="py-12 md:py-16 lg:py-20">
                <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
                    <ShowcaseFilters
                        categories={categories.map(serializeCategory)}
                        current={params}
                        className="lg:col-span-3"
                    />

                    <AnimalGrid
                        className="lg:col-span-9"
                        layout="sidebar"
                        cardHeading="h2"
                        animals={animals}
                        total={total}
                        page={params.page}
                        pages={pages}
                        filtered={filtered}
                        hrefFor={(page) => showcaseHref(params, { page })}
                        emptyAction={
                            filtered ? (
                                <Button href="/showcase" tone="line">
                                    সব ফিল্টার সরান
                                </Button>
                            ) : (
                                <Button href="/contact" tone="line">
                                    যোগাযোগ করুন
                                </Button>
                            )
                        }
                    />
                </div>
            </Band>

            <VisitCta />
        </SiteShell>
    );
}
