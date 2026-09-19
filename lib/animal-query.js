/**
 * Shared between the admin route handler and the admin list page, so the
 * filter the API applies and the filter the page renders can never drift.
 */

export const ANIMAL_SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "price-asc": { "price.min": 1, createdAt: -1 },
  "price-desc": { "price.min": -1, createdAt: -1 },
  title: { title: 1 },
};

/** Admin search is substring matching, not relevance — escape before regex. */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildAnimalFilter(params) {
  const filter = {};

  if (params.q) {
    const rx = new RegExp(escapeRegex(params.q), "i");
    filter.$or = [{ title: rx }, { breed: rx }, { color: rx }, { slug: rx }];
  }

  if (params.category) filter.category = params.category;
  if (params.subcategory) filter.subcategory = params.subcategory;
  if (params.status && params.status !== "all") filter.status = params.status;

  if (params.published && params.published !== "all") {
    filter.isPublished = params.published === "true";
  }

  if (params.missing === "images") filter.images = { $size: 0 };
  if (params.missing === "price") {
    filter["price.min"] = null;
    filter["price.onRequest"] = { $ne: true };
  }

  return filter;
}

export function sortFor(key) {
  return ANIMAL_SORT_MAP[key] ?? ANIMAL_SORT_MAP.newest;
}
