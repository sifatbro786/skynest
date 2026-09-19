/**
 * Mongo documents → plain JSON for API responses and Client Components.
 *
 * Server Components cannot pass ObjectId or Date across the boundary, and
 * `.lean()` results still carry both. Everything the client sees goes through
 * here so ids are strings and dates are ISO.
 */

export function serializeCategory(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id ?? doc.id),
    name: doc.name,
    nameEn: doc.nameEn,
    slug: doc.slug,
    parent: doc.parent ? String(doc.parent) : null,
    icon: doc.icon ?? "",
    image: doc.image ?? "",
    blurb: doc.blurb ?? "",
    order: doc.order ?? 0,
    isActive: doc.isActive !== false,
  };
}

export function serializeImage(img) {
  return {
    path: img.path,
    alt: img.alt ?? "",
    width: img.width ?? 0,
    height: img.height ?? 0,
    blur: img.blur ?? "",
  };
}

export function serializeAnimal(doc) {
  if (!doc) return null;
  const images = (doc.images ?? []).map(serializeImage);
  const coverIndex = Math.min(doc.coverIndex ?? 0, Math.max(images.length - 1, 0));

  return {
    id: String(doc._id ?? doc.id),
    title: doc.title,
    breed: doc.breed,
    slug: doc.slug,
    category: doc.category?._id ? serializeCategory(doc.category) : doc.category ? String(doc.category) : null,
    subcategory: doc.subcategory?._id
      ? serializeCategory(doc.subcategory)
      : doc.subcategory
        ? String(doc.subcategory)
        : null,
    price: {
      min: doc.price?.min ?? null,
      max: doc.price?.max ?? null,
      onRequest: Boolean(doc.price?.onRequest),
    },
    status: doc.status,
    gender: doc.gender,
    ageMonths: doc.ageMonths ?? null,
    color: doc.color ?? "",
    vaccination: doc.vaccination ?? "na",
    vaccinationNote: doc.vaccinationNote ?? "",
    pedigree: doc.pedigree ?? "",
    images,
    coverIndex,
    cover: images[coverIndex] ?? null,
    videoUrl: doc.videoUrl ?? "",
    description: doc.description ?? "",
    careNotes: doc.careNotes ?? "",
    isFeatured: Boolean(doc.isFeatured),
    isPublished: doc.isPublished !== false,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeInquiry(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id ?? doc.id),
    kind: doc.kind,
    name: doc.name,
    phone: doc.phone,
    email: doc.email ?? "",
    message: doc.message ?? "",
    animal: doc.animal ? String(doc.animal?._id ?? doc.animal) : null,
    animalLabel: doc.animalLabel ?? "",
    visitDate: toIso(doc.visitDate),
    visitSlot: doc.visitSlot ?? null,
    status: doc.status,
    adminNote: doc.adminNote ?? "",
    source: doc.source ?? "",
    mail: {
      admin: mailStatus(doc.mail?.admin),
      client: mailStatus(doc.mail?.client),
    },
    createdAt: toIso(doc.createdAt),
  };
}

function mailStatus(entry) {
  return {
    status: entry?.status ?? "pending",
    at: toIso(entry?.at),
    error: entry?.error ?? "",
  };
}

function toIso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
