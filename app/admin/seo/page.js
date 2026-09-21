import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { SeoMeta } from "@/models/index.js";
import { serializeSeoMeta } from "@/lib/serialize";
import { SEO_PAGES, SEO_PATHS, SEO_SITE_KEY } from "@/lib/seo";
import { site } from "@/lib/site";
import AdminShell from "../admin-shell";
import PageHeader from "@/components/admin/page-header";
import SeoManager from "./seo-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO ও মেটা" };

export default async function SeoPage() {
    const admin = await requireAdmin();
    if (!admin) redirect("/admin/login");

    await dbConnect();

    // One query for every row. Pages with nothing saved come back as empty
    // rows rather than being absent, so the client never branches on
    // "created yet?" — see the note on GET /api/admin/seo.
    const docs = await SeoMeta.find({ path: { $in: SEO_PATHS } }).lean();
    const byPath = new Map(docs.map((d) => [d.path, d]));

    return (
        <AdminShell admin={admin}>
            <PageHeader
                title="SEO ও মেটা"
                description="প্রতিটি পাতার টাইটেল, ডেসক্রিপশন, ক্যাননিক্যাল ঠিকানা ও শেয়ার ছবি। খালি রাখলে সাইটের নিজের লেখা ব্যবহার হবে।"
            />

            <SeoManager
                pages={SEO_PAGES}
                siteKey={SEO_SITE_KEY}
                initialSite={serializeSeoMeta(byPath.get(SEO_SITE_KEY), SEO_SITE_KEY)}
                initialRows={SEO_PAGES.map((p) => serializeSeoMeta(byPath.get(p.path), p.path))}
                baseUrl={site.url.replace(/\/$/, "")}
            />
        </AdminShell>
    );
}
