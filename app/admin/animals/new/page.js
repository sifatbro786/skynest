import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Category } from "@/models/index.js";
import { serializeCategory } from "@/lib/serialize";
import AdminShell from "../../admin-shell";
import PageHeader from "@/components/admin/page-header";
import AnimalForm from "../animal-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "নতুন প্রাণী" };

export default async function NewAnimalPage() {
    const admin = await requireAdmin();
    if (!admin) redirect("/admin/login");

    await dbConnect();
    const categories = await Category.find({ isActive: true }).sort({ order: 1, nameEn: 1 }).lean();

    return (
        <AdminShell admin={admin}>
            <PageHeader
                eyebrow="প্রাণী"
                eyebrowHref="/admin/animals"
                title="নতুন প্রাণী"
                description="ছবি আর দাম না দিলেও খসড়া হিসেবে সংরক্ষণ করা যাবে।"
            />
            <AnimalForm categories={categories.map(serializeCategory)} />
        </AdminShell>
    );
}
