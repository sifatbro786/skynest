import { notFound, redirect } from "next/navigation";

import { requireAdmin } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Animal, Category, Inquiry } from "@/models/index.js";
import { serializeAnimal, serializeCategory } from "@/lib/serialize";
import { objectId } from "@/lib/validators";
import { formatCount, formatDateLatin } from "@/lib/utils";
import { Button } from "@/components/admin/ui";
import AdminShell from "../../admin-shell";
import PageHeader from "@/components/admin/page-header";
import AnimalForm from "../animal-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (!objectId.safeParse(id).success) return { title: "প্রাণী" };

  await dbConnect();
  const doc = await Animal.findById(id).select("title").lean();
  return { title: doc?.title ?? "প্রাণী" };
}

export default async function EditAnimalPage({ params }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  if (!objectId.safeParse(id).success) notFound();

  await dbConnect();

  const [doc, categories, inquiryCount] = await Promise.all([
    Animal.findById(id)
      .populate("category", "name nameEn slug")
      .populate("subcategory", "name nameEn slug")
      .lean(),
    Category.find({ isActive: true }).sort({ order: 1, nameEn: 1 }).lean(),
    Inquiry.countDocuments({ animal: id }),
  ]);

  if (!doc) notFound();

  const animal = serializeAnimal(doc);

  return (
    <AdminShell admin={admin}>
      <PageHeader
        eyebrow="প্রাণী"
        eyebrowHref="/admin/animals"
        title={animal.title}
        description={`${animal.breed} · যোগ হয়েছে ${formatDateLatin(animal.createdAt)}`}
        actions={
          // The public detail page lands in phase 7; until then the only
          // useful cross-link from here is the inquiries this animal drew.
          inquiryCount > 0 ? (
            <Button href={`/admin/inquiries?q=${encodeURIComponent(animal.title)}`}>
              {formatCount(inquiryCount)}টি ইনকোয়ারি
            </Button>
          ) : null
        }
      />
      <AnimalForm
        categories={categories.map(serializeCategory)}
        animal={animal}
      />
    </AdminShell>
  );
}
