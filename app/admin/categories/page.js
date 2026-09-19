import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Category, Animal } from "@/models/index.js";
import { serializeCategory } from "@/lib/serialize";
import AdminShell from "../admin-shell";
import PageHeader from "@/components/admin/page-header";
import CategoryManager from "./category-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "ক্যাটাগরি" };

export default async function CategoriesPage() {
    const admin = await requireAdmin();
    if (!admin) redirect("/admin/login");

    await dbConnect();

    const [categories, usage] = await Promise.all([
        Category.find({}).sort({ order: 1, nameEn: 1 }).lean(),
        // One pass for both reference columns — the manager needs these to explain
        // why a delete is blocked before the admin clicks it.
        Animal.aggregate([
            {
                $facet: {
                    byCategory: [{ $group: { _id: "$category", n: { $sum: 1 } } }],
                    bySubcategory: [
                        { $match: { subcategory: { $ne: null } } },
                        { $group: { _id: "$subcategory", n: { $sum: 1 } } },
                    ],
                },
            },
        ]),
    ]);

    const counts = {};
    for (const row of [...(usage?.[0]?.byCategory ?? []), ...(usage?.[0]?.bySubcategory ?? [])]) {
        if (!row?._id) continue;
        const key = String(row._id);
        counts[key] = (counts[key] ?? 0) + row.n;
    }

    return (
        <AdminShell admin={admin}>
            <PageHeader
                title="ক্যাটাগরি ও ব্রিড"
                description="দুই স্তর: পরিবার (কুকুর, বিড়াল, পাখি) আর তার নিচে ব্রিড। ব্রিডের নিচে আর কোনো স্তর রাখা যাবে না।"
            />

            <CategoryManager initialCategories={categories.map(serializeCategory)} usage={counts} />
        </AdminShell>
    );
}
