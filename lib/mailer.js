import nodemailer from "nodemailer";
import { serverEnv } from "./env.js";

/**
 * The single place mail leaves this app from.
 *
 * Two rules the rest of the codebase depends on:
 *
 *  1. **Lazy init.** The transporter is built on first send, never at module
 *     load — otherwise `next build` fails on a machine without SMTP env, and
 *     importing anything that imports this file would blow up.
 *  2. **Never throws.** Every caller treats mail as best-effort. A dead SMTP
 *     server must not turn a saved inquiry into a 500 for the visitor.
 */

const globalForMail = globalThis;

function getTransporter() {
  if (globalForMail.__skynestTransporter) {
    return globalForMail.__skynestTransporter;
  }

  const { host, port, secure, user, pass } = serverEnv.smtp;

  globalForMail.__skynestTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    // One VPS, low volume — a small pool avoids a TLS handshake per message
    // when the admin and client mails go out back to back.
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return globalForMail.__skynestTransporter;
}

/**
 * @param {{ to: string, subject: string, html: string, text: string, replyTo?: string }} message
 * @returns {Promise<{ ok: boolean, skipped?: boolean, messageId?: string, error?: string }>}
 */
export async function sendMail({ to, subject, html, text, replyTo }) {
  if (!to) return { ok: false, error: "No recipient" };

  if (!serverEnv.mailEnabled) {
    // Not an error: a dev clone without SMTP env should still work.
    return { ok: false, skipped: true, error: "SMTP not configured" };
  }

  try {
    const info = await getTransporter().sendMail({
      from: serverEnv.mailFrom,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    });

    return { ok: true, messageId: info?.messageId ?? "" };
  } catch (err) {
    // Log the recipient and the failure reason only. Nodemailer errors can
    // carry the auth payload in `err.response` on some SMTP servers, so the
    // error object is never logged whole.
    console.error("[mail] send failed", {
      to,
      subject,
      error: err?.message ?? String(err),
      code: err?.code,
    });
    return { ok: false, error: err?.message ?? "send failed" };
  }
}

/**
 * Sends both messages without letting either one affect the other.
 * `allSettled`, not `all`: a bounced admin address must not stop the
 * visitor's confirmation.
 */
export async function sendBoth({ admin, client }) {
  const [adminResult, clientResult] = await Promise.allSettled([
    admin ? sendMail(admin) : Promise.resolve({ ok: false, skipped: true }),
    client ? sendMail(client) : Promise.resolve({ ok: false, skipped: true }),
  ]);

  return {
    admin: settled(adminResult),
    client: settled(clientResult),
  };
}

function settled(result) {
  if (result.status === "fulfilled") return result.value;
  return { ok: false, error: result.reason?.message ?? "send failed" };
}

/**
 * Tears the pool down. The long-lived server never calls this — but a CLI
 * script does, because `pool: true` holds the socket open and the process
 * would otherwise hang after printing its result.
 */
export function closeMail() {
  const transporter = globalForMail.__skynestTransporter;
  if (!transporter) return;
  transporter.close();
  globalForMail.__skynestTransporter = null;
}

/** Optional health check — not called on the request path. */
export async function verifyMail() {
  if (!serverEnv.mailEnabled) return { ok: false, error: "SMTP not configured" };
  try {
    await getTransporter().verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message ?? "verify failed" };
  }
}
