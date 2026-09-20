/**
 * SMTP health check.
 *
 *   npm run verify-mail                     # config summary + handshake only
 *   npm run verify-mail -- --send           # also send to ADMIN_EMAIL
 *   npm run verify-mail -- --send you@x.com # ...or to a specific address
 *
 * Exists because `sendMail()` is best-effort by design: a wrong password or a
 * blocked port 465 shows up as a quiet `mail.admin.status = "failed"` on an
 * inquiry nobody has opened yet, hours after the lead came in. This turns that
 * into an answer you get in two seconds, before the first real buyer writes.
 *
 * The password is never printed — only its length, which is enough to catch
 * the two mistakes that actually happen: an empty value, and a Gmail app
 * password pasted with its spaces still in (16 vs 19 characters).
 */
import { serverEnv } from "../lib/env.js";
import { closeMail, sendMail, verifyMail } from "../lib/mailer.js";
import { adminInquiryEmail } from "../lib/email/templates/admin-inquiry.js";

const args = process.argv.slice(2);
const SEND = args.includes("--send");
const explicitTo = args.find((a) => a.includes("@"));

function line(label, value, note = "") {
    console.log(`  ${label.padEnd(14)} ${value}${note ? `  ${note}` : ""}`);
}

async function main() {
    console.log("\nSMTP configuration");
    console.log("------------------");

    if (!serverEnv.mailEnabled) {
        console.error(
            "\n✗ SMTP is NOT configured — SMTP_HOST, SMTP_USER and SMTP_PASS must all\n" +
                "  be set. Until then inquiries are still saved, but every notification\n" +
                "  is recorded as `skipped` and nothing leaves the server.\n",
        );
        process.exit(1);
    }

    const { host, port, secure, user, pass } = serverEnv.smtp;

    line("host", host);
    line("port", String(port), secure ? "(TLS on)" : "(STARTTLS / plaintext)");
    line("user", user);
    line(
        "pass",
        `${pass.length} characters`,
        /\s/.test(pass)
            ? "⚠ contains a space — Gmail app passwords must be pasted without them"
            : "",
    );
    line("from", serverEnv.mailFrom);
    line("admin inbox", serverEnv.adminEmail || "(not set)");

    if (port === 465 && !secure) {
        console.log("\n⚠ Port 465 with SMTP_SECURE=false will hang: 465 is implicit TLS.");
    }
    if (port === 587 && secure) {
        console.log(
            "\n⚠ Port 587 with SMTP_SECURE=true will hang: 587 expects STARTTLS," +
                " so set SMTP_SECURE=false.",
        );
    }

    console.log("\nHandshake");
    console.log("---------");
    const verified = await verifyMail();

    if (!verified.ok) {
        console.error(`  ✗ ${verified.error}`);
        console.error(
            "\n  Common causes:\n" +
                "    · Gmail without an App Password (a normal password is rejected)\n" +
                "    · 2-Step Verification off, so App Passwords are unavailable\n" +
                "    · the VPS firewall blocking outbound 465/587\n",
        );
        process.exit(1);
    }
    console.log("  ✓ server accepted the credentials");

    if (!SEND) {
        console.log("\nHandshake only. Re-run with --send to put a real message through.\n");
        return;
    }

    const to = explicitTo || serverEnv.adminEmail;
    if (!to) {
        console.error("\n✗ No recipient. Set ADMIN_EMAIL or pass an address.\n");
        process.exit(1);
    }

    console.log("\nTest send");
    console.log("---------");

    // Uses the real template, so a broken layout import fails here rather than
    // on the first live inquiry.
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
        /\/$/,
        "",
    );

    const sample = {
        id: "000000000000000000000000",
        kind: "general",
        name: "টেস্ট বার্তা",
        phone: "01700000000",
        email: to,
        message: "This is a delivery test from scripts/verify-mail.js. No action needed.",
        animalLabel: "",
        visitDate: null,
        visitSlot: null,
        source: "verify-mail",
        createdAt: new Date().toISOString(),
    };

    const result = await sendMail({
        to,
        ...adminInquiryEmail({ inquiry: sample, siteUrl }),
    });

    if (result.ok) {
        console.log(`  ✓ delivered to ${to}`);
        console.log(`    messageId ${result.messageId}`);
        console.log(
            "\n  Not in the inbox? Check spam — a brand-new Gmail sender without" +
                "\n  SPF/DKIM on the site domain often lands there the first few times.\n",
        );
    } else {
        console.error(`  ✗ ${result.error}`);
        process.exit(1);
    }
}

main()
    .then(closeMail)
    .catch((err) => {
        closeMail();
        console.error(err);
        process.exit(1);
    });
