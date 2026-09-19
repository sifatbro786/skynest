import {
  shell,
  footerBlock,
  heading,
  marker,
  paragraph,
  dataTable,
  quote,
  button,
  link,
  esc,
  kindLabel,
  slotLabel,
  formatDhaka,
  PALETTE,
  FONTS,
} from "../layout.js";

/**
 * Notification sent to the owner when a visitor submits an inquiry.
 *
 * @param {object} args
 * @param {object} args.inquiry  serialized inquiry
 * @param {string} args.siteUrl  absolute base URL, for admin deep links
 * @param {{id?: string, title?: string}} [args.animal]
 */
export function adminInquiryEmail({ inquiry, siteUrl, animal }) {
  const label = inquiry.animalLabel || animal?.title || "";
  const subject = `নতুন Inquiry: ${kindLabel(inquiry.kind)}${label ? ` — ${label}` : ""}`;

  const inboxUrl = `${siteUrl}/admin/inquiries`;
  // A visit request about a specific animal deserves the same deep link as
  // an "animal" inquiry — the owner wants the record either way.
  const animalId = inquiry.animal || animal?.id || "";
  const animalUrl = animalId ? `${siteUrl}/admin/animals/${animalId}` : "";

  const rows = [
    ["নাম", inquiry.name],
    [
      "ফোন",
      `<a href="tel:${esc(inquiry.phone)}" style="color:${PALETTE.brand};text-decoration:none;">${esc(inquiry.phone)}</a>`,
      { raw: true },
    ],
    [
      "ইমেইল",
      inquiry.email
        ? `<a href="mailto:${esc(inquiry.email)}" style="color:${PALETTE.brand};text-decoration:none;">${esc(inquiry.email)}</a>`
        : "",
      { raw: true },
    ],
    ["ধরন", kindLabel(inquiry.kind)],
    label ? ["প্রাণী", label] : null,
    inquiry.kind === "visit" && inquiry.visitDate
      ? ["ভিজিটের তারিখ", formatDhaka(inquiry.visitDate, false)]
      : null,
    inquiry.kind === "visit" && inquiry.visitSlot
      ? ["সময়", slotLabel(inquiry.visitSlot)]
      : null,
    ["জমা পড়েছে", formatDhaka(inquiry.createdAt ?? new Date())],
    inquiry.source ? ["যে পেজ থেকে", inquiry.source] : null,
  ].filter(Boolean);

  const body = [
    marker("নতুন ইনকোয়ারি"),
    heading(`${inquiry.name} যোগাযোগ করেছেন`),
    paragraph(
      inquiry.email
        ? "সরাসরি Reply চাপলেই উত্তর তাঁর ইমেইলে চলে যাবে।"
        : "ইমেইল দেননি — ফোন বা WhatsApp-এ যোগাযোগ করতে হবে।",
      { muted: true }
    ),
    dataTable(rows),
    inquiry.message ? quote(inquiry.message) : "",
    animalUrl ? button(animalUrl, "প্রাণীটি দেখুন", { tone: "brand" }) : "",
    button(inboxUrl, "ইনকোয়ারি ইনবক্স"),
  ]
    .filter(Boolean)
    .join("\n");

  const footer = footerBlock(
    `এই বার্তাটি ${esc(siteUrl)} থেকে স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।`
  );

  const html = shell({
    title: subject,
    preheader: `${inquiry.name} · ${inquiry.phone}${label ? ` · ${label}` : ""}`,
    body,
    footer,
  });

  const text = [
    `নতুন ইনকোয়ারি — ${kindLabel(inquiry.kind)}`,
    "",
    `নাম: ${inquiry.name}`,
    `ফোন: ${inquiry.phone}`,
    inquiry.email ? `ইমেইল: ${inquiry.email}` : null,
    label ? `প্রাণী: ${label}` : null,
    inquiry.kind === "visit" && inquiry.visitDate
      ? `ভিজিটের তারিখ: ${formatDhaka(inquiry.visitDate, false)}${
          inquiry.visitSlot ? ` (${slotLabel(inquiry.visitSlot)})` : ""
        }`
      : null,
    `জমা পড়েছে: ${formatDhaka(inquiry.createdAt ?? new Date())}`,
    inquiry.source ? `পেজ: ${inquiry.source}` : null,
    "",
    inquiry.message ? `বার্তা:\n${inquiry.message}` : null,
    "",
    animalUrl ? `প্রাণী: ${animalUrl}` : null,
    `ইনবক্স: ${inboxUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    subject,
    html,
    text,
    replyTo: inquiry.email || undefined,
  };
}

export { FONTS };
