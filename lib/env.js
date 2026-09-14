/**
 * Server-only environment access.
 *
 * Deliberately dependency-free and lazy: reading at module scope would break
 * `next build`, which imports modules without a runtime env in place.
 */

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optional(name, fallback) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

export const serverEnv = {
  get mongoUri() {
    return required("MONGODB_URI");
  },

  /** Min 32 chars — signing key for the admin session JWT. */
  get authSecret() {
    const secret = required("AUTH_SECRET");
    if (secret.length < 32) {
      throw new Error("AUTH_SECRET must be at least 32 characters long.");
    }
    return secret;
  },

  /** Session lifetime in seconds. Default 8 hours. */
  get sessionMaxAge() {
    return Number(optional("AUTH_SESSION_MAX_AGE", "28800"));
  },

  /** Absolute or project-relative directory that receives uploaded media. */
  get uploadDir() {
    return optional("UPLOAD_DIR", "public/uploads");
  },

  /** Public URL prefix that maps to uploadDir. */
  get uploadUrlPrefix() {
    return optional("UPLOAD_URL_PREFIX", "/uploads");
  },

  get maxUploadBytes() {
    return Number(optional("MAX_UPLOAD_MB", "12")) * 1024 * 1024;
  },

  get isProd() {
    return process.env.NODE_ENV === "production";
  },
};

export { required, optional };
