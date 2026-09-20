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
import { Button, Section, SectionHead } from "@/components/site/ui";
import AnimalGrid from "@/components/site/animal-grid";

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
            category.blurb ||
            `${category.name} কালেকশন — ${site.name}, ${site.address.line}।`,
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
        category.parent
            ? Category.findById(category.parent).select("name slug").lean()
            : null,
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
        page > 1
            ? `/category/${category.slug}?page=${page}`
            : `/category/${category.slug}`;

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

            <Section>
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

                <SectionHead
                    as="h1"
                    className="mt-6"
                    label={category.nameEn}
                    title={category.name}
                    intro={category.blurb || undefined}
                    action={
                        <Button href="/showcase" tone="line">
                            সম্পূর্ণ কালেকশন
                        </Button>
                    }
                />

                {/* Sibling or child breeds. Links, not filter chips — each breed
                    is its own indexable page, which is the whole reason this
                    route exists alongside the /showcase filters. */}
                {children.length > 0 ? (
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
                                            ? "inline-flex min-h-9 items-center rounded-xs border border-ink bg-ink px-3 text-xs text-linen"
                                            : "inline-flex min-h-9 items-center rounded-xs border border-field px-3 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
                                    }
                                >
                                    {c.name}
                                </Link>
                            );
                        })}
                    </div>
                ) : null}

                <AnimalGrid
                    className="mt-10"
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
            </Section>
        </SiteShell>
    );
}
