import Link from "next/link";
import { redirect } from "next/navigation";
import {
    ChevronRight,
    ImageOff,
    Inbox,
    PawPrint,
    Plus,
    ShoppingBag,
    TriangleAlert,
} from "lucide-react";

import { requireAdmin } from "@/lib/guard";
import { getDashboardStats } from "@/lib/stats";
import { formatCount, formatDateLatin, VISIT_SLOT_LABELS } from "@/lib/utils";
import AdminShell from "./admin-shell";
import PageHeader from "@/components/admin/page-header";
import { StatusTag, DraftTag } from "@/components/admin/status-tag";
import { Button, Card, CardBody, CardHead, EmptyState } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "ড্যাশবোর্ড" };

export default async function AdminHome() {
    const admin = await requireAdmin();
    if (!admin) redirect("/admin/login");

    const stats = await getDashboardStats();

    const figures = [
        {
            label: "মোট প্রাণী",
            value: stats.animals.total,
            note: `${formatCount(stats.animals.published)} প্রকাশিত · ${formatCount(stats.animals.draft)} খসড়া`,
            icon: PawPrint,
            href: "/admin/animals",
        },
        {
            label: "পাওয়া যাচ্ছে",
            value: stats.animals.available,
            note: `${formatCount(stats.animals.reserved)} বুকড`,
            icon: PawPrint,
            href: "/admin/animals?status=available",
        },
        {
            label: "বিক্রি হয়েছে",
            value: stats.animals.sold,
            note: `${formatCount(stats.animals.featured)} ফিচার্ড`,
            icon: ShoppingBag,
            href: "/admin/animals?status=sold",
        },
        {
            label: "নতুন ইনকোয়ারি",
            value: stats.inquiries.new,
            note: `মোট ${formatCount(stats.inquiries.total)}`,
            icon: Inbox,
            href: "/admin/inquiries?status=new",
            accent: stats.inquiries.new > 0,
        },
    ];

    const alerts = [
        stats.animals.missingImages > 0 && {
            icon: ImageOff,
            text: `${formatCount(stats.animals.missingImages)}টি প্রাণীর কোনো ছবি নেই`,
            action: "ছবি যোগ করুন",
            href: "/admin/animals?missing=images",
        },
        stats.animals.missingPrice > 0 && {
            icon: TriangleAlert,
            text: `${formatCount(stats.animals.missingPrice)}টির দাম বসানো হয়নি`,
            action: "দাম বসান",
            href: "/admin/animals?missing=price",
        },
        stats.animals.draft > 0 && {
            icon: TriangleAlert,
            text: `${formatCount(stats.animals.draft)}টি খসড়া অবস্থায় আছে`,
            action: "প্রকাশ করুন",
            href: "/admin/animals?published=false",
        },
    ].filter(Boolean);

    const categoryTotal = stats.byCategory.reduce((sum, c) => sum + c.total, 0);

    return (
        <AdminShell admin={admin}>
            <PageHeader
                title="ড্যাশবোর্ড"
                description="কালেকশন, ইনকোয়ারি আর আসন্ন ফার্ম ভিজিটের সংক্ষিপ্ত চিত্র।"
                actions={
                    <Button tone="primary" href="/admin/animals/new">
                        <Plus size={15} strokeWidth={2} aria-hidden />
                        নতুন প্রাণী যোগ করুন
                    </Button>
                }
            />

            {/* ---------- figures ---------- */}
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {figures.map((figure) => (
                    <Link
                        key={figure.label}
                        href={figure.href}
                        className="pnl-card group block p-4 transition-colors hover:border-line-strong"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <dt className="text-xs font-medium text-ink-soft">
                                {figure.label}
                            </dt>
                            <figure.icon
                                size={15}
                                strokeWidth={1.75}
                                aria-hidden
                                className={figure.accent ? "text-clay" : "text-ink-mute"}
                            />
                        </div>
                        <dd className="pnl-stat mt-2.5">{formatCount(figure.value)}</dd>
                        <p className="mt-1 text-xs text-ink-mute">{figure.note}</p>
                    </Link>
                ))}
            </dl>

            {/* ---------- things that need attention ---------- */}
            {alerts.length > 0 ? (
                <Card className="mt-3 border-clay/35 bg-clay-wash">
                    <CardHead title="যেগুলো ঠিক করা দরকার" />
                    <ul className="divide-y divide-clay/20">
                        {alerts.map((alert) => (
                            <li key={alert.text}>
                                <Link
                                    href={alert.href}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-clay/10 hover:text-ink"
                                >
                                    <alert.icon
                                        size={15}
                                        strokeWidth={1.75}
                                        aria-hidden
                                        className="shrink-0 text-clay"
                                    />
                                    <span className="flex-1">{alert.text}</span>
                                    <span className="hidden shrink-0 items-center gap-1 text-xs text-clay sm:flex">
                                        {alert.action}
                                        <ChevronRight size={13} strokeWidth={2} aria-hidden />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Card>
            ) : null}

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
                {/* ---------- category distribution ---------- */}
                <Card className="lg:col-span-2">
                    <CardHead
                        title="ক্যাটাগরি অনুযায়ী"
                        actions={
                            <Button size="sm" href="/admin/categories">
                                ক্যাটাগরি সাজান
                            </Button>
                        }
                    />
                    {stats.byCategory.length === 0 ? (
                        <CardBody>
                            <EmptyState
                                title="এখনো কোনো প্রাণী যোগ করা হয়নি"
                                hint="প্রথম প্রাণীটি যোগ করলে এখানে ক্যাটাগরির হিসাব দেখা যাবে।"
                                action={
                                    <Button tone="primary" size="sm" href="/admin/animals/new">
                                        প্রাণী যোগ করুন
                                    </Button>
                                }
                            />
                        </CardBody>
                    ) : (
                        <div className="pnl-scroll">
                            <table className="pnl-table">
                                <thead>
                                    <tr>
                                        <th scope="col">ক্যাটাগরি</th>
                                        <th scope="col" className="pnl-num">
                                            মোট
                                        </th>
                                        <th scope="col" className="pnl-num">
                                            আছে
                                        </th>
                                        <th scope="col" className="pnl-num">
                                            বিক্রি
                                        </th>
                                        <th scope="col" className="pnl-num">
                                            শতাংশ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.byCategory.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <Link
                                                    href={`/admin/animals?category=${row.id}`}
                                                    className="text-ink transition-colors hover:text-brand"
                                                >
                                                    {row.name}
                                                </Link>
                                                {row.nameEn ? (
                                                    <span className="ml-2 text-xs text-ink-mute">
                                                        {row.nameEn}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="pnl-num text-ink">
                                                {formatCount(row.total)}
                                            </td>
                                            <td className="pnl-num text-leaf">
                                                {formatCount(row.available)}
                                            </td>
                                            <td className="pnl-num">{formatCount(row.sold)}</td>
                                            <td className="pnl-num">
                                                {categoryTotal > 0
                                                    ? `${Math.round((row.total / categoryTotal) * 100)}%`
                                                    : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* ---------- side rail ---------- */}
                <div className="space-y-3">
                    <Card>
                        <CardHead title="আসন্ন ভিজিট" />
                        {stats.upcomingVisits.length === 0 ? (
                            <CardBody>
                                <p className="text-sm text-ink-mute">
                                    কোনো ভিজিটের সময় নির্ধারিত নেই।
                                </p>
                            </CardBody>
                        ) : (
                            <ul className="divide-y divide-line">
                                {stats.upcomingVisits.map((visit) => (
                                    <li key={visit.id} className="px-4 py-2.5">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="truncate text-sm text-ink">
                                                {visit.name}
                                            </span>
                                            <span className="pnl-num text-xs text-ink-mute">
                                                {formatDateLatin(visit.visitDate)}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-mute">
                                            <a
                                                href={`tel:${visit.phone}`}
                                                className="pnl-num transition-colors hover:text-brand"
                                            >
                                                {visit.phone}
                                            </a>
                                            {visit.visitSlot ? (
                                                <span>· {VISIT_SLOT_LABELS[visit.visitSlot]}</span>
                                            ) : null}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <CardHead
                            title="সর্বশেষ যোগ হয়েছে"
                            actions={
                                <Button size="sm" href="/admin/animals">
                                    সব দেখুন
                                </Button>
                            }
                        />
                        {stats.recent.length === 0 ? (
                            <CardBody>
                                <p className="text-sm text-ink-mute">তালিকা ফাঁকা।</p>
                            </CardBody>
                        ) : (
                            <ul className="divide-y divide-line">
                                {stats.recent.map((animal) => (
                                    <li key={animal.id}>
                                        <Link
                                            href={`/admin/animals/${animal.id}`}
                                            className="block px-4 py-2.5 transition-colors hover:bg-linen"
                                        >
                                            <span className="block truncate text-sm text-ink">
                                                {animal.title}
                                            </span>
                                            <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="text-xs text-ink-mute">
                                                    {animal.breed}
                                                </span>
                                                {animal.isPublished ? (
                                                    <StatusTag status={animal.status} />
                                                ) : (
                                                    <DraftTag />
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </AdminShell>
    );
}
