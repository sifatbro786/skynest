import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  signSession,
  verifySessionToken,
  sessionCookieOptions,
} from "./session-token.js";

export { SESSION_COOKIE, signSession, verifySessionToken, sessionCookieOptions };

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
