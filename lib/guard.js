import { dbConnect } from "./db.js";
import { readSession } from "./auth.js";
import { AdminUser } from "../models/index.js";

/**
 * Full admin check for Server Components and Route Handlers.
 *
 * Separate from `readSession()` because this one hits the database: a valid
 * signature is not enough if the account was deactivated or the password was
 * changed since the token was issued. `proxy.js` does the cheap signature-only
 * check to redirect; this is the authoritative gate.
 *
 * @returns {Promise<{ id: string, email: string, name: string, role: string } | null>}
 */
export async function requireAdmin() {
    const session = await readSession();
    if (!session?.sub) return null;

    await dbConnect();

    const user = await AdminUser.findById(session.sub)
        .select("email name role isActive tokenVersion")
        .lean();

    if (!user) return null;
    if (!user.isActive) return null;
    if (Number(user.tokenVersion) !== Number(session.tv)) return null;

    return {
        id: String(user._id),
        email: user.email,
        name: user.name ?? "",
        role: user.role,
    };
}

/** Standard 401 body for admin API routes. */
export function unauthorized() {
    return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
    );
}

/**
 * Defence-in-depth CSRF check for state-changing admin routes.
 *
 * The session cookie is SameSite=Lax, which already stops a cross-site form
 * POST from carrying it — this is the second lock, not the first. Only a
 * *mismatched* Origin is rejected; a missing one is allowed so curl and
 * server-to-server calls still work.
 */
export function sameOrigin(request) {
    const origin = request.headers.get("origin");
    if (!origin) return true;

    const host = request.headers.get("host");
    try {
        return new URL(origin).host === host;
    } catch {
        return false;
    }
}

export function forbidden(message = "Forbidden") {
    return Response.json(
        { ok: false, error: message },
        { status: 403, headers: { "Cache-Control": "no-store" } },
    );
}
