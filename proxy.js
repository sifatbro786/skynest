import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Next 16 renamed `middleware` → `proxy` (Node runtime, not configurable).
 *
 * This is the cheap gate: it verifies the JWT signature only, so an expired or
 * forged cookie never reaches a page render. It deliberately does NOT check
 * the database — `requireAdmin()` in lib/guard.js does that, and every admin
 * route handler and Server Component calls it. Per the Next docs, proxy
 * coverage can silently disappear when a matcher or route path changes, so it
 * is never the only authorization check.
 */

const LOGIN_PATH = "/admin/login";

export async function proxy(request) {
    const { pathname, search } = request.nextUrl;

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);

    // Already signed in and hitting the login page → send to the dashboard.
    if (pathname === LOGIN_PATH) {
        if (session) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.next();
    }

    // Auth endpoints must stay reachable while signed out.
    if (pathname.startsWith("/api/admin/auth/")) {
        return NextResponse.next();
    }

    if (session) return NextResponse.next();

    // API calls get a status code, not an HTML redirect — otherwise a fetch()
    // from the admin UI silently receives the login page as its JSON body.
    if (pathname.startsWith("/api/")) {
        return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401, headers: { "Cache-Control": "no-store" } },
        );
    }

    const loginUrl = new URL(LOGIN_PATH, request.url);
    if (pathname !== "/admin") {
        loginUrl.searchParams.set("next", `${pathname}${search || ""}`);
    }
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
