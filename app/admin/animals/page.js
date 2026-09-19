import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ImageOff, Pencil, Plus, Star } from "lucide-react";

import { requireAdmin } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Animal, Category } from "@/models/index.js";
import { serializeAnimal, serializeCategory } from "@/lib/serialize";
import { buildAnimalFilter, sortFor } from "@/lib/animal-query";
import { adminAnimalQuerySchema } from "@/lib/validators";
import { formatPriceRange, formatCount, formatDateLatin } from "@/lib/utils";
import AdminShell from "../admin-shell";
import PageHeader from "@/components/admin/page-header";
import { StatusTag, DraftTag } from "@/components/admin/status-tag";
import { Button, Card, EmptyState, Pagination } from "@/components/admin/ui";
import AnimalFilters from "./animal-filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "প্রাণী" };

/**
 * Kept in one place so the pager and the toolbar cannot drift apart.
 * Not exported — a `page.js` should only export the route's own contract.
 */
function animalsHref(current, patch = {}) {
    const next = { ...current, ...patch };
    const sp = new URLSearchParams();

    for (const [key, value] of Object.entries(next)) {
        if (value === "" || value === null || value === undefined) continue;
        if (key === "limit") continue;
        if (key === "page" && Number(value) === 1) continue;
        if ((key === "status" || key === "published") && value === "all") continue;
        if (key === "sort" && value === "newest") continue;
        sp.set(key, String(value));
    }

    const qs = sp.toString();
    return qs ? `/admin/animals?${qs}` : "/admin/animals";
}

export default async function AnimalsPage({ searchParams }) {
    const admin = await requireAdmin();
    if (!admin) redirect("/admin/login");

    const raw = await searchParams;
    // Falls back to defaults rather than erroring — a hand-typed URL should
    // never 500 the listing.
    const parsed = adminAnimalQuerySchema.safeParse(raw ?? {});
    const params = parsed.success ? parsed.data : adminAnimalQuerySchema.parse({});

    await dbConnect();

    const filter = buildAnimalFilter(params);

    const [animals, total, categories] = await Promise.all([
        Animal.find(filter)
            .sort(sortFor(params.sort))
            .skip((params.page - 1) * params.limit)
            .limit(params.limit)
            .populate("category", "name nameEn slug")
            .populate("subcategory", "name nameEn slug")
            .lean(),
        Animal.countDocuments(filter),
        Category.find({}).sort({ order: 1, nameEn: 1 }).lean(),
    ]);

    const rows = animals.map(serializeAnimal);
    const pages = Math.max(1, Math.ceil(total / params.limit));
    const filtered =
        params.q !== "" ||
        params.category !== "" ||
        params.status !== "all" ||
        params.published !== "all" ||
        params.missing !== "";

    return (
        <AdminShell admin={admin}>
            <PageHeader
                title="প্রাণী"
                description="তালিকা, স্ট্যাটাস আর ছবি — সব এখান থেকে।"
                actions={
                    <Button tone="primary" href="/admin/animals/new">
                        <Plus size={15} strokeWidth={2} aria-hidden />
                        নতুন যোগ করুন
                    </Button>
                }
            />

            <AnimalFilters
                categories={categories.map(serializeCategory)}
                current={params}
            />

            <p className="mt-3 text-sm text-ink-mute">
                <span className="ad-num font-medium text-ink">{formatCount(total)}</span>টি
                পাওয়া গেছে
                {pages > 1 ? ` · পৃষ্ঠা ${params.page}/${pages}` : ""}
            </p>

            {rows.length === 0 ? (
                <EmptyState
                    className="mt-3"
                    title={filtered ? "এই ফিল্টারে কিছু পাওয়া যায়নি" : "তালিকা ফাঁকা"}
                    hint={
                        filtered
                            ? "ফিল্টার সরিয়ে আবার দেখুন, অথবা অন্য শব্দ দিয়ে খুঁজুন।"
                            : "প্রথম প্রাণীটি যোগ করে শুরু করুন।"
                    }
                    action={
                        filtered ? (
                            <Button size="sm" href="/admin/animals">
                                ফিল্টার সরান
                            </Button>
                        ) : (
                            <Button tone="primary" size="sm" href="/admin/animals/new">
                                প্রাণী যোগ করুন
                            </Button>
                        )
                    }
                />
            ) : (
                <Card className="mt-3 overflow-hidden">
                    <div className="ad-scroll">
                        <table className="ad-table min-w-[54rem]">
                            <thead>
                                <tr>
                                    <th scope="col" className="w-14">
                                        <span className="sr-only">ছবি</span>
                                    </th>
                                    <th scope="col">শিরোনাম</th>
                                    <th scope="col">ক্যাটাগরি</th>
                                    <th scope="col" className="ad-num">
                                        দাম
                                    </th>
                                    <th scope="col">স্ট্যাটাস</th>
                                    <th scope="col" className="ad-num">
                                        আপডেট
                                    </th>
                                    <th scope="col" className="w-12">
                                        <span className="sr-only">সম্পাদনা</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((animal) => (
                                    <tr key={animal.id}>
                                        <td>
                                            <span className="frame relative block aspect-4/5 w-10 overflow-hidden">
                                                {animal.cover ? (
                                                    <Image
                                                        src={animal.cover.path}
                                                        alt=""
                                                        width={80}
                                                        height={100}
                                                        sizes="40px"
                                                        placeholder={
                                                            animal.cover.blur ? "blur" : "empty"
                                                        }
                                                        blurDataURL={animal.cover.blur || undefined}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span
                                                        title="ছবি নেই"
                                                        className="flex h-full w-full items-center justify-center text-ink-mute"
                                                    >
                                                        <ImageOff
                                                            size={14}
                                                            strokeWidth={1.5}
                                                            aria-hidden
                                                        />
                                                    </span>
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            <Link
                                                href={`/admin/animals/${animal.id}`}
                                                className="flex items-center gap-1.5 font-medium text-ink transition-colors hover:text-brand"
                                            >
                                                <span className="truncate">{animal.title}</span>
                                                {animal.isFeatured ? (
                                                    <Star
                                                        size={13}
                                                        strokeWidth={2}
                                                        fill="currentColor"
                                                        aria-label="ফিচার্ড"
                                                        className="shrink-0 text-clay"
                                                    />
                                                ) : null}
                                            </Link>
                                            <span className="mt-0.5 block truncate text-xs text-ink-mute">
                                                {animal.breed}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap text-ink-mute">
                                            {animal.category?.name ?? "—"}
                                            {animal.subcategory?.name ? (
                                                <span className="block text-xs">
                                                    {animal.subcategory.name}
                                                </span>
                                            ) : null}
                                        </td>

                                        <td className="ad-num text-ink">
                                            {formatPriceRange(animal.price.min, animal.price.max)}
                                        </td>

                                        <td>
                                            {animal.isPublished ? (
                                                <StatusTag status={animal.status} />
                                            ) : (
                                                <DraftTag />
                                            )}
                                        </td>

                                        <td className="ad-num text-ink-mute">
                                            {formatDateLatin(animal.updatedAt)}
                                        </td>

                                        <td>
                                            <Link
                                                href={`/admin/animals/${animal.id}`}
                                                aria-label={`${animal.title} সম্পাদনা করুন`}
                                                className="ad-btn ad-btn-ghost ad-btn-sm h-8 w-8 px-0"
                                            >
                                                <Pencil size={14} strokeWidth={1.75} aria-hidden />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Pagination
                className="mt-4"
                page={params.page}
                pages={pages}
                hrefFor={(page) => animalsHref(params, { page })}
            />
        </AdminShell>
    );
}
