import {
    shell,
    footerBlock,
    heading,
    marker,
    paragraph,
    dataTable,
    quote,
    button,
    esc,
    kindLabel,
    slotLabel,
    formatDhaka,
    PALETTE,
    FONTS,
} from "../layout.js";

/**
 * Confirmation to the person who submitted the inquiry.
 *
 * Restates exactly what they asked about so the mail is a useful record, then
 * gives them the two ways to reach the farm. No marketing copy — the tone
 * matches the rest of the site: direct, and written like a person sent it.
 */
export function clientConfirmationEmail({ inquiry, site, whatsappUrl }) {
    const subject = "আমরা আপনার বার্তা পেয়েছি — SkyNest Robiul";
    const label = inquiry.animalLabel || "";

    const rows = [
        ["আপনার নাম", inquiry.name],
        ["ফোন", inquiry.phone],
        ["ধরন", kindLabel(inquiry.kind)],
        label ? ["যে প্রাণী নিয়ে", label] : null,
        inquiry.kind === "visit" && inquiry.visitDate
            ? [
                  "যে দিন আসতে চেয়েছেন",
                  `${formatDhaka(inquiry.visitDate, false)}${
                      inquiry.visitSlot ? ` · ${slotLabel(inquiry.visitSlot)}` : ""
                  }`,
              ]
            : null,
    ].filter(Boolean);

    const intro =
        inquiry.kind === "visit"
            ? "আপনার ফার্ম ভিজিটের অনুরোধ আমাদের কাছে পৌঁছেছে। সময়টা মিলিয়ে দেখে আমরা ফোনে জানিয়ে দেব।"
            : inquiry.kind === "animal"
              ? "আপনি যে প্রাণীটি নিয়ে জানতে চেয়েছেন, তার খোঁজ নিয়ে আমরা শিগগিরই আপনাকে জানাচ্ছি।"
              : "আপনার বার্তা আমাদের কাছে পৌঁছেছে। শিগগিরই উত্তর দিচ্ছি।";

    const body = [
        marker("প্রাপ্তি নিশ্চিতকরণ"),
        heading(`ধন্যবাদ, ${inquiry.name}`),
        paragraph(intro),
        dataTable(rows),
        inquiry.message
            ? `${paragraph("আপনি লিখেছেন —", { muted: true })}${quote(inquiry.message)}`
            : "",
        paragraph("তাড়া থাকলে সরাসরি ফোন বা WhatsApp-এ কথা বলে নিতে পারেন — সেটাই দ্রুততম।"),
        whatsappUrl ? button(whatsappUrl, "WhatsApp-এ কথা বলুন", { tone: "brand" }) : "",
        marker("যোগাযোগ"),
        dataTable([
            [
                "ফোন",
                `<a href="tel:${esc(site.phone)}" style="color:${PALETTE.brand};text-decoration:none;">${esc(site.phone)}</a>`,
                { raw: true },
            ],
            ["ঠিকানা", site.address?.line ?? ""],
        ]),
    ]
        .filter(Boolean)
        .join("\n");

    const footer = footerBlock(
        `SkyNest Robiul · ${esc(site.address?.lineEn ?? "")}<br />
This is a confirmation that we received your message. We will get back to you shortly.`,
    );

    const html = shell({
        title: subject,
        preheader: `${inquiry.name}, আপনার বার্তা পৌঁছেছে। শিগগিরই যোগাযোগ করছি।`,
        body,
        footer,
    });

    const text = [
        `ধন্যবাদ, ${inquiry.name}`,
        "",
        intro,
        "",
        `ফোন: ${inquiry.phone}`,
        `ধরন: ${kindLabel(inquiry.kind)}`,
        label ? `প্রাণী: ${label}` : null,
        inquiry.kind === "visit" && inquiry.visitDate
            ? `ভিজিটের দিন: ${formatDhaka(inquiry.visitDate, false)}${
                  inquiry.visitSlot ? ` (${slotLabel(inquiry.visitSlot)})` : ""
              }`
            : null,
        inquiry.message ? `\nআপনার বার্তা:\n${inquiry.message}` : null,
        "",
        "তাড়া থাকলে সরাসরি কথা বলুন —",
        `ফোন: ${site.phone}`,
        whatsappUrl ? `WhatsApp: ${whatsappUrl}` : null,
        site.address?.line ? `ঠিকানা: ${site.address.line}` : null,
        "",
        "SkyNest Robiul",
    ]
        .filter((line) => line !== null)
        .join("\n");

    return { subject, html, text };
}

export { FONTS };
