import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { dbConnect } from "@/lib/db";
import { Animal, Category } from "@/models/index.js";
import { serializeAnimal, serializeCategory } from "@/lib/serialize";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { listQuerySchema } from "@/lib/validators";
import { buildPublicAnimalFilter, publicSortFor } from "@/lib/animal-query";
import { site } from "@/lib/site";
import SiteShell from "@/components/site/site-shell";
import { Band, Button, Measure } from "@/components/site/ui";
import { Reveal, WordReveal } from "@/components/site/motion";
import AnimalGrid from "@/components/site/animal-grid";
import VisitCta from "@/components/site/home/visit-cta";

export const dynamic = "force-dynamic";

/**
 * One category, family or breed.
 *
 * The tree is exactly two deep (family → breed), so the filter is decided by
 * whether the matched category has a parent rather than by walking ancestors:
 * a family page matches `category`, a breed page matches `subcategory`. That
 * mirrors how `Animal` actually stores the two references, and it means a
 * breed page cannot accidentally show its whole family.
 */
async function findCategory(slug) {
    await dbConnect();
    const doc = await Category.findOne({ slug, isActive: true }).lean();
    return doc ? serializeCategory(doc) : null;
}

export async function generateMetadata({ params }) {
    const { categorySlug } = await params;
    const category = await findCategory(categorySlug);
    if (!category) return { title: "পাওয়া যায়নি" };

    return {
        title: `${category.name} — ${category.nameEn}`,
        description:
            category.blurb || `${category.name} কালেকশন — ${site.name}, ${site.address.line}।`,
        alternates: { canonical: `/category/${category.slug}` },
    };
}

export default async function CategoryPage({ params, searchParams }) {
    const { categorySlug } = await params;
    const category = await findCategory(categorySlug);
    if (!category) notFound();

    const raw = await searchParams;
    const parsed = listQuerySchema.safeParse(raw ?? {});
    const query = parsed.success ? parsed.data : listQuerySchema.parse({});

    const isFamily = !category.parent;

    const [siblings, parent] = await Promise.all([
        isFamily
            ? Category.find({ parent: category.id, isActive: true })
                  .sort({ order: 1, nameEn: 1 })
                  .lean()
            : Category.find({ parent: category.parent, isActive: true })
                  .sort({ order: 1, nameEn: 1 })
                  .lean(),
        category.parent ? Category.findById(category.parent).select("name slug").lean() : null,
    ]);

    const filter = buildPublicAnimalFilter(query, {
        categoryId: isFamily ? category.id : null,
        subcategoryId: isFamily ? null : category.id,
    });

    const [docs, total] = await Promise.all([
        Animal.find(filter)
            .sort(publicSortFor(query.sort))
            .skip((query.page - 1) * query.limit)
            .limit(query.limit)
            .populate("category", "name nameEn slug")
            .populate("subcategory", "name nameEn slug")
            .lean(),
        Animal.countDocuments(filter),
    ]);

    const animals = docs.map(serializeAnimal);
    const pages = Math.max(1, Math.ceil(total / query.limit));
    const children = siblings.map(serializeCategory);

    const hrefFor = (page) =>
        page > 1 ? `/category/${category.slug}?page=${page}` : `/category/${category.slug}`;

    // Mirrors the visible breadcrumb below, including the optional parent.
    const trail = [
        ["কালেকশন", "/showcase"],
        ...(parent ? [[parent.name, `/category/${parent.slug}`]] : []),
        [category.name, `/category/${category.slug}`],
    ];

    return (
        <SiteShell
            whatsappMessage={`আসসালামু আলাইকুম। ${category.name} কালেকশন সম্পর্কে জানতে চাই।`}
        >
            <JsonLd data={breadcrumbLd(trail)} />

            {/* ---------------- ink: breadcrumb, title, breeds ---------------- */}
            <Band
                as="div"
                tone="ink"
                grain
                innerClassName="pt-8 pb-12 md:pt-12 md:pb-14 lg:pt-16 lg:pb-16"
            >
                <nav
                    aria-label="পথ"
                    className="flex flex-wrap items-center gap-1.5 text-xs text-ink-mute"
                >
                    <Link href="/showcase" className="transition-colors hover:text-brand">
                        কালেকশন
                    </Link>
                    {parent ? (
                        <>
                            <ChevronRight size={12} strokeWidth={2} aria-hidden />
                            <Link
                                href={`/category/${parent.slug}`}
                                className="transition-colors hover:text-brand"
                            >
                                {parent.name}
                            </Link>
                        </>
                    ) : null}
                    <ChevronRight size={12} strokeWidth={2} aria-hidden />
                    <span className="text-ink-soft">{category.name}</span>
                </nav>

                <div className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
                    <div className="max-w-3xl">
                        <Reveal>
                            <span className="marker">{category.nameEn}</span>
                        </Reveal>

                        <WordReveal
                            as="h1"
                            text={category.name}
                            delay={0.05}
                            className="text-display mt-5 font-display"
                        />

                        {category.blurb ? (
                            <Reveal delay={0.2}>
                                <Measure as="p" className="text-lede mt-6 text-linen/70">
                                    {category.blurb}
                                </Measure>
                            </Reveal>
                        ) : null}
                    </div>

                    <Reveal delay={0.26} className="shrink-0">
                        <Button href="/showcase" tone="line">
                            সম্পূর্ণ কালেকশন
                        </Button>
                    </Reveal>
                </div>

                {/* Sibling or child breeds. Links, not filter chips — each breed
                    is its own indexable page, which is the whole reason this
                    route exists alongside the /showcase filters.

                    The active chip is `bg-linen text-ink-band`, NOT `bg-ink
                    text-linen`. Inside `.on-ink`, `--color-ink` is rebound to
                    linen, so the old pair would have painted linen on linen and
                    the selected breed would have been invisible.
                    `--color-ink-band` is not rebound, which is what makes it
                    safe to use as a foreground here. */}
                {children.length > 0 ? (
                    <Reveal delay={0.32}>
                        <div className="mt-10 flex flex-wrap items-center gap-2 border-y border-line py-5">
                            <span className="text-micro mr-1 uppercase text-ink-mute">
                                {isFamily ? "ব্রিড" : "একই পরিবারে"}
                            </span>
                            {children.map((c) => {
                                const active = c.slug === category.slug;
                                return (
                                    <Link
                                        key={c.id}
                                        href={`/category/${c.slug}`}
                                        aria-current={active ? "page" : undefined}
                                        className={
                                            active
                                                ? "inline-flex min-h-9 items-center rounded-xs border border-linen bg-linen px-3 text-xs text-ink-band"
                                                : "inline-flex min-h-9 items-center rounded-xs border border-field px-3 text-xs text-ink-soft transition-colors hover:border-linen hover:text-linen"
                                        }
                                    >
                                        {c.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </Reveal>
                ) : null}
            </Band>

            {/* ---------------- paper: the grid ---------------- */}
            <Band tone="paper" innerClassName="py-12 md:py-16 lg:py-20">
                <AnimalGrid
                    cardHeading="h2"
                    animals={animals}
                    total={total}
                    page={query.page}
                    pages={pages}
                    hrefFor={hrefFor}
                    filtered={false}
                    emptyAction={
                        <Button href="/showcase" tone="line">
                            অন্য ক্যাটাগরি দেখুন
                        </Button>
                    }
                />
            </Band>

            <VisitCta />
        </SiteShell>
    );
}
