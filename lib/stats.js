import { dbConnect } from "./db.js";
import { Animal, Inquiry } from "../models/index.js";

/**
 * Dashboard numbers in two aggregation round-trips instead of a dozen
 * countDocuments() calls.
 *
 * `$facet` runs every sub-pipeline over the same scanned set, so the status
 * split, the per-category breakdown and the recent list all come from one
 * pass. It always returns exactly one document, even on an empty collection —
 * the sub-arrays are just empty, which is why every read below is defensive.
 */
export async function getDashboardStats() {
    await dbConnect();

    const [animalFacet, inquiryFacet] = await Promise.all([
        Animal.aggregate([
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                published: { $sum: { $cond: ["$isPublished", 1, 0] } },
                                featured: { $sum: { $cond: ["$isFeatured", 1, 0] } },
                                missingImages: {
                                    $sum: {
                                        $cond: [
                                            { $eq: [{ $size: { $ifNull: ["$images", []] } }, 0] },
                                            1,
                                            0,
                                        ],
                                    },
                                },
                                missingPrice: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    {
                                                        $eq: [
                                                            { $ifNull: ["$price.min", null] },
                                                            null,
                                                        ],
                                                    },
                                                    { $ne: ["$price.onRequest", true] },
                                                ],
                                            },
                                            1,
                                            0,
                                        ],
                                    },
                                },
                            },
                        },
                    ],

                    byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],

                    byCategory: [
                        {
                            $group: {
                                _id: "$category",
                                total: { $sum: 1 },
                                available: {
                                    $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
                                },
                                sold: { $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] } },
                            },
                        },
                        { $sort: { total: -1 } },
                        { $limit: 10 },
                        {
                            $lookup: {
                                from: "categories",
                                localField: "_id",
                                foreignField: "_id",
                                as: "category",
                            },
                        },
                        // preserveNull keeps rows whose category was deleted out-of-band,
                        // so the count still shows up instead of vanishing.
                        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                _id: 0,
                                id: { $toString: "$_id" },
                                total: 1,
                                available: 1,
                                sold: 1,
                                name: { $ifNull: ["$category.name", "(অজানা ক্যাটাগরি)"] },
                                nameEn: { $ifNull: ["$category.nameEn", ""] },
                                slug: { $ifNull: ["$category.slug", ""] },
                            },
                        },
                    ],

                    recent: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 6 },
                        {
                            $project: {
                                _id: 0,
                                id: { $toString: "$_id" },
                                title: 1,
                                breed: 1,
                                slug: 1,
                                status: 1,
                                isPublished: 1,
                                createdAt: 1,
                            },
                        },
                    ],
                },
            },
        ]),

        Inquiry.aggregate([
            {
                $facet: {
                    byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
                    byKind: [{ $group: { _id: "$kind", count: { $sum: 1 } } }],
                    upcomingVisits: [
                        {
                            $match: {
                                kind: "visit",
                                visitDate: { $gte: new Date() },
                                status: { $in: ["new", "contacted", "scheduled"] },
                            },
                        },
                        { $sort: { visitDate: 1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                _id: 0,
                                id: { $toString: "$_id" },
                                name: 1,
                                phone: 1,
                                visitDate: 1,
                                visitSlot: 1,
                                status: 1,
                            },
                        },
                    ],
                },
            },
        ]),
    ]);

    const animals = animalFacet?.[0] ?? {};
    const inquiries = inquiryFacet?.[0] ?? {};

    const totals = animals.totals?.[0] ?? {
        total: 0,
        published: 0,
        featured: 0,
        missingImages: 0,
        missingPrice: 0,
    };

    const status = countMap(animals.byStatus);
    const inquiryStatus = countMap(inquiries.byStatus);
    const inquiryKind = countMap(inquiries.byKind);

    return {
        animals: {
            total: totals.total ?? 0,
            published: totals.published ?? 0,
            draft: (totals.total ?? 0) - (totals.published ?? 0),
            featured: totals.featured ?? 0,
            missingImages: totals.missingImages ?? 0,
            missingPrice: totals.missingPrice ?? 0,
            available: status.available ?? 0,
            reserved: status.reserved ?? 0,
            sold: status.sold ?? 0,
        },
        byCategory: animals.byCategory ?? [],
        recent: (animals.recent ?? []).map((a) => ({
            ...a,
            createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : null,
        })),
        inquiries: {
            total: Object.values(inquiryStatus).reduce((a, b) => a + b, 0),
            new: inquiryStatus.new ?? 0,
            contacted: inquiryStatus.contacted ?? 0,
            scheduled: inquiryStatus.scheduled ?? 0,
            closed: inquiryStatus.closed ?? 0,
            visits: inquiryKind.visit ?? 0,
            general: inquiryKind.general ?? 0,
            animal: inquiryKind.animal ?? 0,
        },
        upcomingVisits: (inquiries.upcomingVisits ?? []).map((v) => ({
            ...v,
            visitDate: v.visitDate ? new Date(v.visitDate).toISOString() : null,
        })),
    };
}

function countMap(rows) {
    const out = {};
    for (const row of rows ?? []) {
        if (row?._id) out[row._id] = row.count;
    }
    return out;
}
