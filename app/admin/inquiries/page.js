import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Inquiry } from "@/models/index.js";
import { serializeInquiry } from "@/lib/serialize";
import { adminInquiryQuerySchema } from "@/lib/validators";
import { formatCount } from "@/lib/utils";
import AdminShell from "../admin-shell";
import PageHeader from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/ui";
import InquiryBoard from "./inquiry-board";
import InquiryFilters from "./inquiry-filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "ইনকোয়ারি" };

function hrefFor(current, patch) {
    const next = { ...current, ...patch };
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
        if (!value || value === "all" || key === "limit") continue;
        if (key === "page" && Number(value) === 1) continue;
        sp.set(key, String(value));
    }
    const qs = sp.toString();
    return qs ? `/admin/inquiries?${qs}` : "/admin/inquiries";
}

export default async function InquiriesPage({ searchParams }) {
    const admin = await requireAdmin();
    if (!admin) redirect("/admin/login");

    const raw = await searchParams;
    const parsed = adminInquiryQuerySchema.safeParse(raw ?? {});
    const params = parsed.success ? parsed.data : adminInquiryQuerySchema.parse({});

    await dbConnect();

    const filter = {};
    if (params.kind !== "all") filter.kind = params.kind;
    if (params.status !== "all") filter.status = params.status;
    if (params.q) {
        const rx = new RegExp(params.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { animalLabel: rx }];
    }

    const [docs, total, newCount] = await Promise.all([
        Inquiry.find(filter)
            .sort({ createdAt: -1 })
            .skip((params.page - 1) * params.limit)
            .limit(params.limit)
            .lean(),
        Inquiry.countDocuments(filter),
        Inquiry.countDocuments({ status: "new" }),
    ]);

    const pages = Math.max(1, Math.ceil(total / params.limit));
    const filtered =
        params.kind !== "all" || params.status !== "all" || params.q !== "";

    return (
        <AdminShell admin={admin}>
            <PageHeader
                title="ইনকোয়ারি"
                description={
                    newCount > 0
                        ? `${formatCount(newCount)}টি এখনো দেখা হয়নি।`
                        : "সব ইনকোয়ারি দেখা হয়েছে।"
                }
            />

            <InquiryFilters current={params} />

            <p className="mt-3 text-sm text-ink-mute">
                <span className="pnl-num font-medium text-ink">{formatCount(total)}</span>টি
                পাওয়া গেছে
                {pages > 1 ? ` · পৃষ্ঠা ${params.page}/${pages}` : ""}
            </p>

            <InquiryBoard
                initialInquiries={docs.map(serializeInquiry)}
                filtered={filtered}
            />

            <Pagination
                className="mt-4"
                page={params.page}
                pages={pages}
                hrefFor={(page) => hrefFor(params, { page })}
            />
        </AdminShell>
    );
}
