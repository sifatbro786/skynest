import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { serverEnv } from "./env.js";

export const SESSION_COOKIE = "skynest_session";

const ISSUER = "skynest-robiul";
const AUDIENCE = "skynest-admin";
const ALG = "HS256";

function signingKey() {
    return new TextEncoder().encode(serverEnv.authSecret);
}

/**
 * @param {{ sub: string, email: string, role: string, tv: number }} claims
 *   `tv` is the user's tokenVersion — bumping it in the DB invalidates
 *   every token already issued.
 */
export async function signSession(claims) {
    return new SignJWT(claims)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime(`${serverEnv.sessionMaxAge}s`)
        .sign(signingKey());
}

/**
 * Pinning `algorithms` matters: without it a token could claim `alg: "none"`
 * or a different family and bypass verification.
 */
export async function verifySessionToken(token) {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, signingKey(), {
            issuer: ISSUER,
            audience: AUDIENCE,
            algorithms: [ALG],
        });
        return payload;
    } catch {
        return null;
    }
}

export function sessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: serverEnv.isProd,
        path: "/",
        maxAge: serverEnv.sessionMaxAge,
    };
}

/** Reads and verifies the session cookie. Does NOT hit the database. */
export async function readSession() {
    const store = await cookies();
    return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(token) {
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
    const store = await cookies();
    store.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
}
