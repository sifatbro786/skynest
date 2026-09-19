import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import AdminUser from "@/models/AdminUser";
import { loginSchema, fieldErrors } from "@/lib/validators";
import { signSession, setSessionCookie } from "@/lib/auth";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";
import { sameOrigin, forbidden } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Per-IP brake. Stops credential stuffing before it reaches bcrypt. */
const IP_LIMIT = { limit: 12, windowMs: 15 * 60 * 1000 };

/** Per-account brake. Survives an attacker rotating IPs. */
const MAX_FAILED_ATTEMPTS = 6;
const LOCK_MINUTES = 15;

/**
 * A real bcrypt hash of a random string, compared against when the email does
 * not exist. Without it, a missing account returns in ~1ms while an existing
 * one takes ~250ms, and that gap alone enumerates valid admin emails.
 */
const DUMMY_HASH = "$2b$12$ltwC7WEw9RNaEz3R13DJLe3hPFUtXbUEMTaNoPrVFJh6I2nEOnkx6";

const NO_STORE = { "Cache-Control": "no-store" };

function json(body, status = 200, extraHeaders = {}) {
    return Response.json(body, {
        status,
        headers: { ...NO_STORE, ...extraHeaders },
    });
}

/** Deliberately identical for "no such user" and "wrong password". */
const GENERIC_ERROR = "ইমেইল বা পাসওয়ার্ড ভুল";

export async function POST(request) {
    if (!sameOrigin(request)) return forbidden();

    const ip = clientIp(request);
    const ipCheck = rateLimit(`login:ip:${ip}`, IP_LIMIT);

    if (!ipCheck.ok) {
        return json(
            {
                ok: false,
                error: `অনেকবার চেষ্টা হয়েছে। ${Math.ceil(ipCheck.retryAfter / 60)} মিনিট পর আবার চেষ্টা করুন।`,
                retryAfter: ipCheck.retryAfter,
            },
            429,
            { "Retry-After": String(ipCheck.retryAfter) },
        );
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ ok: false, error: "Invalid request body" }, 400);
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
        return json(
            { ok: false, error: "তথ্য ঠিকভাবে পূরণ করুন", fields: fieldErrors(parsed.error) },
            400,
        );
    }

    const { email, password } = parsed.data;

    await dbConnect();

    const user = await AdminUser.findOne({ email }).select(
        "+passwordHash email role isActive tokenVersion failedAttempts lockedUntil",
    );

    if (user?.isLocked()) {
        const retryAfter = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
        return json(
            {
                ok: false,
                error: `অ্যাকাউন্ট সাময়িকভাবে লক করা হয়েছে। ${Math.ceil(retryAfter / 60)} মিনিট পর চেষ্টা করুন।`,
                retryAfter,
            },
            423,
            { "Retry-After": String(retryAfter) },
        );
    }

    // Always runs, even with no matching user — see DUMMY_HASH above.
    const passwordOk = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

    if (!user || !passwordOk) {
        if (user) {
            user.failedAttempts += 1;
            if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
                user.failedAttempts = 0;
            }
            await user.save();
        }
        return json({ ok: false, error: GENERIC_ERROR }, 401);
    }

    // Deactivated accounts get the same message — no signal about why.
    if (!user.isActive) {
        return json({ ok: false, error: GENERIC_ERROR }, 401);
    }

    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    resetRateLimit(`login:ip:${ip}`);

    const token = await signSession({
        sub: String(user._id),
        email: user.email,
        role: user.role,
        tv: user.tokenVersion,
    });

    await setSessionCookie(token);

    return json({ ok: true, email: user.email });
}
