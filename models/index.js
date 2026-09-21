/**
 * Barrel import.
 *
 * Mongoose resolves `ref` strings lazily, so a route that only imports
 * `Animal` and then calls `.populate("category")` throws MissingSchemaError.
 * Importing from here guarantees every schema is registered first.
 */
export { default as Category } from "./Category.js";
export { default as Animal } from "./Animal.js";
export { default as Inquiry } from "./Inquiry.js";
export { default as AdminUser } from "./AdminUser.js";
export { default as SeoMeta } from "./SeoMeta.js";

export { ANIMAL_STATUS, ANIMAL_GENDER, VACCINATION_STATUS } from "./Animal.js";
export { INQUIRY_KINDS, INQUIRY_STATUS, VISIT_SLOTS } from "./Inquiry.js";
export { ADMIN_ROLES } from "./AdminUser.js";
