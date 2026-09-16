/**
 * Bootstrap (or reset) the admin account.
 *
 *   npm run create-admin -- owner@skynestrobiul.com 'StrongPassphrase123'
 *   npm run create-admin -- owner@skynestrobiul.com 'NewPass123' --reset
 *
 * Falls back to ADMIN_EMAIL / ADMIN_PASSWORD env vars, then to an interactive
 * prompt. Passwords are never stored or logged — only the bcrypt hash.
 */
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import AdminUser from "../models/AdminUser.js";

const BCRYPT_COST = 12;
/** Matches loginSchema — the login route's rate limit and account lockout
 *  carry the brute-force load, not password length. */
const MIN_PASSWORD = 6;

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const RESET = process.argv.includes("--reset");

async function prompt(question) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Run via `npm run create-admin`.");
    process.exit(1);
  }

  const email = (
    args[0] ||
    process.env.ADMIN_EMAIL ||
    (await prompt("Admin email: "))
  )
    .trim()
    .toLowerCase();

  const password =
    args[1] || process.env.ADMIN_PASSWORD || (await prompt("Password: "));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Invalid email address.");
    process.exit(1);
  }
  if (!password || password.length < MIN_PASSWORD) {
    console.error(`Password must be at least ${MIN_PASSWORD} characters.`);
    process.exit(1);
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || undefined,
    bufferCommands: false,
  });

  const existing = await AdminUser.findOne({ email }).select("+passwordHash");

  if (existing && !RESET) {
    console.error(
      `An admin with ${email} already exists. Re-run with --reset to set a new password.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  if (existing) {
    existing.passwordHash = passwordHash;
    // Invalidate every session issued against the old password.
    existing.tokenVersion += 1;
    existing.failedAttempts = 0;
    existing.lockedUntil = null;
    existing.isActive = true;
    await existing.save();
    console.log(`✓ password reset for ${email} (all sessions invalidated)`);
  } else {
    await AdminUser.create({
      email,
      passwordHash,
      name: process.env.ADMIN_NAME || "",
      role: "owner",
    });
    console.log(`✓ admin created: ${email}`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
