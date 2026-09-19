/**
 * Shared helpers for admin route handlers.
 */

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body, status = 200, extraHeaders = {}) {
    return Response.json(body, {
        status,
        headers: { ...NO_STORE, ...extraHeaders },
    });
}

export function ok(data = {}) {
    return json({ ok: true, ...data });
}

export function badRequest(error, fields) {
    return json({ ok: false, error, ...(fields ? { fields } : {}) }, 400);
}

export function notFound(error = "পাওয়া যায়নি") {
    return json({ ok: false, error }, 404);
}

export function conflict(error, extra = {}) {
    return json({ ok: false, error, ...extra }, 409);
}

/**
 * Turns a Mongo/Mongoose failure into a useful response instead of a 500.
 *
 * E11000 is the common one here: an admin typing a slug that already exists
 * should see "this slug is taken", not "Server error".
 */
export function fromDbError(err, { label = "রেকর্ড" } = {}) {
    if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern ?? {})[0] ?? "মান";
        return conflict(`এই ${field === "slug" ? "slug" : field} আগে থেকেই ব্যবহৃত হচ্ছে।`);
    }

    if (err?.name === "ValidationError") {
        const fields = {};
        for (const [key, detail] of Object.entries(err.errors ?? {})) {
            fields[key] = detail.message;
        }
        return badRequest("তথ্য ঠিকভাবে পূরণ করুন", fields);
    }

    // Thrown by the Category depth/parent guards in pre-validate.
    if (err?.message && /two levels|does not exist|own parent/.test(err.message)) {
        return badRequest(err.message);
    }

    console.error(`[api] ${label} failed`, err);
    return json({ ok: false, error: "সার্ভারে সমস্যা হয়েছে" }, 500);
}

/** `params` is a promise in Next 16. */
export async function readParams(context) {
    return (await context?.params) ?? {};
}

export async function readJson(request) {
    try {
        return { ok: true, body: await request.json() };
    } catch {
        return { ok: false, body: null };
    }
}
