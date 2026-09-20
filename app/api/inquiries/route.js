import { after } from "next/server";

import { dbConnect } from "@/lib/db";
import { Animal, Inquiry } from "@/models/index.js";
import { inquirySchema, fieldErrors } from "@/lib/validators";
import { json, badRequest, readJson } from "@/lib/api";
import { serializeInquiry } from "@/lib/serialize";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sameOrigin, forbidden } from "@/lib/guard";
import { sendBoth } from "@/lib/mailer";
import { serverEnv } from "@/lib/env";
import { site, whatsappLink } from "@/lib/site";
import { adminInquiryEmail } from "@/lib/email/templates/admin-inquiry";
import { clientConfirmationEmail } from "@/lib/email/templates/client-confirmation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Broad brake against a script hammering the form from one address. */
const IP_LIMIT = { limit: 8, windowMs: 60 * 60 * 1000 };
/** Narrow brake so one person cannot flood the inbox from many IPs. */
const IDENTITY_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

const HOUR_MSG =
    "আপনি অল্প সময়ে কয়েকবার বার্তা পাঠিয়েছেন। এক ঘণ্টা পর আবার চেষ্টা করুন, অথবা সরাসরি ফোন করুন।";

/**
 * POST /api/inquiries — public.
 *
 * The inquiry is saved synchronously; both emails go out in `after()`, once
 * the response has already been sent. Gmail's SMTP handshake costs a second
 * or two, and a visitor on a phone should not stare at a spinner for it — nor
 * should a dead mail server ever turn a captured lead into an error page.
 */
export async function POST(request) {
    if (!sameOrigin(request)) return forbidden();

    const ip = clientIp(request);
    const ipCheck = rateLimit(`inquiry:ip:${ip}`, IP_LIMIT);
    if (!ipCheck.ok) {
        return json({ ok: false, error: HOUR_MSG, retryAfter: ipCheck.retryAfter }, 429, {
            "Retry-After": String(ipCheck.retryAfter),
        });
    }

    const { ok: parsedBody, body } = await readJson(request);
    if (!parsedBody) return badRequest("Invalid request body");

    // Honeypot. Answering 201 keeps the bot from learning which field gave it
    // away; nothing is written.
    if (typeof body?.website === "string" && body.website.trim() !== "") {
        return json({ ok: true, id: null }, 201);
    }

    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
        return badRequest("তথ্য ঠিকভাবে পূরণ করুন", fieldErrors(parsed.error));
    }

    const data = parsed.data;
    const identity = (data.email || data.phone || "").toLowerCase();
    const identityCheck = rateLimit(`inquiry:id:${identity}`, IDENTITY_LIMIT);
    if (!identityCheck.ok) {
        return json({ ok: false, error: HOUR_MSG, retryAfter: identityCheck.retryAfter }, 429, {
            "Retry-After": String(identityCheck.retryAfter),
        });
    }

    try {
        await dbConnect();

        // Snapshot the animal's title so the inbox stays readable even if the
        // listing is deleted later.
        let animalLabel = "";
        if (data.animal) {
            const animal = await Animal.findById(data.animal).select("title breed").lean();
            if (!animal) return badRequest("প্রাণীটি পাওয়া যায়নি");
            animalLabel = animal.title || animal.breed || "";
        }

        const doc = await Inquiry.create({
            kind: data.kind,
            name: data.name,
            phone: data.phone,
            email: data.email ?? "",
            message: data.message ?? "",
            animal: data.animal ?? null,
            animalLabel,
            visitDate: data.visitDate ?? null,
            visitSlot: data.visitSlot ?? null,
            source: data.source ?? "",
            userAgent: (request.headers.get("user-agent") ?? "").slice(0, 200),
        });

        const inquiry = serializeInquiry(doc.toObject());

        after(async () => {
            await deliverNotifications(inquiry);
        });

        return json({ ok: true, id: inquiry.id }, 201);
    } catch (err) {
        console.error("[inquiries] create failed", err?.message);
        return json({ ok: false, error: "বার্তা পাঠানো যায়নি, আবার চেষ্টা করুন" }, 500);
    }
}

/**
 * Runs after the response. Records the outcome on the inquiry so the admin
 * inbox can show whether the buyer actually received a confirmation.
 */
async function deliverNotifications(inquiry) {
    const siteUrl = site.url.replace(/\/$/, "");

    const adminMessage = serverEnv.adminEmail
        ? { to: serverEnv.adminEmail, ...adminInquiryEmail({ inquiry, siteUrl }) }
        : null;

    const clientMessage = inquiry.email
        ? {
              to: inquiry.email,
              ...clientConfirmationEmail({
                  inquiry,
                  site,
                  whatsappUrl: whatsappLink(
                      `আসসালামু আলাইকুম, আমি ${inquiry.name}। ${
                          inquiry.animalLabel
                              ? `${inquiry.animalLabel} নিয়ে জানতে চাই।`
                              : "SkyNest Robiul সম্পর্কে জানতে চাই।"
                      }`,
                  ),
              }),
          }
        : null;

    const result = await sendBoth({ admin: adminMessage, client: clientMessage });

    try {
        await dbConnect();
        await Inquiry.updateOne(
            { _id: inquiry.id },
            {
                $set: {
                    "mail.admin": toMailStatus(result.admin, Boolean(adminMessage)),
                    "mail.client": toMailStatus(result.client, Boolean(clientMessage)),
                },
            },
        );
    } catch (err) {
        // The mail already went out (or didn't); losing the bookkeeping is not
        // worth surfacing anywhere.
        console.error("[inquiries] mail status write failed", err?.message);
    }
}

function toMailStatus(result, attempted) {
    if (!attempted) {
        return { status: "skipped", at: new Date(), error: "No recipient", messageId: "" };
    }
    if (result?.ok) {
        return {
            status: "sent",
            at: new Date(),
            messageId: result.messageId ?? "",
            error: "",
        };
    }
    return {
        status: result?.skipped ? "skipped" : "failed",
        at: new Date(),
        messageId: "",
        error: (result?.error ?? "send failed").slice(0, 300),
    };
}
