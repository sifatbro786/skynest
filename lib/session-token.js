import { SignJWT, jwtVerify } from "jose";
import { serverEnv } from "./env.js";

/**
 * Pure token logic — no `next/headers`, no database.
 *
 * Kept separate from `lib/auth.js` so `proxy.js` can import it without
 * pulling the cookies() API (and everything downstream of it) into the
 * proxy bundle.
 */

export const SESSION_COOKIE = "skynest_session";

const ISSUER = "skynest-robiul";
const AUDIENCE = "skynest-admin";
const ALG = "HS256";

function signingKey() {
  return new TextEncoder().encode(serverEnv.authSecret);
}

/**
 * @param {{ sub: string, email: string, role: string, tv: number }} claims
 *   `tv` is the user's tokenVersion — bumping it in the database invalidates
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
 * Pinning `algorithms` matters: without it a forged token could declare a
 * different algorithm family and sidestep verification.
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
