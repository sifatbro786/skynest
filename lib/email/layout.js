/**
 * Email chrome.
 *
 * Constraints that drive every decision here:
 *  - Table layout. Outlook uses the Word rendering engine; flex and grid
 *    simply do not exist there.
 *  - Inline styles only. Gmail strips <style> blocks in the web client.
 *  - No webfonts. Fraunces and Hind Siliguri will not load — the stacks below
 *    fall through to whatever Bengali face the device already has.
 *  - No remote images. Gmail and Outlook block them until the reader clicks
 *    "display images", so the wordmark is text and the brand shows through
 *    colour and rules instead of a logo that may never appear.
 */

export const PALETTE = {
  linen: "#f4f8fa",
  paper: "#ffffff",
  ink: "#1a1d20",
  inkSoft: "#394249",
  inkMute: "#66727b",
  brand: "#0b62a4",
  clay: "#8d5b3a",
  leaf: "#2e7d32",
  line: "#d6e0e7",
  linenDeep: "#e7eef3",
};

const SERIF =
  "Georgia,'Times New Roman','Noto Serif Bengali','Nirmala UI','Shonar Bangla',serif";
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans Bengali','Hind Siliguri','Nirmala UI',Roboto,Arial,sans-serif";

export const FONTS = { SERIF, SANS };

/** Escapes untrusted values before they go into the HTML body. */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Preserves author line breaks in a message body. */
export function escMultiline(value) {
  return esc(value).replace(/\r?\n/g, "<br />");
}

/**
 * @param {{ title: string, preheader: string, body: string, footer?: string }} parts
 */
export function shell({ title, preheader, body, footer = "" }) {
  return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PALETTE.linen};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PALETTE.linen};">
  <tr>
    <td align="center" style="padding:28px 14px 36px 14px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:${PALETTE.paper};border:1px solid ${PALETTE.line};">
        <tr>
          <td style="height:3px;line-height:3px;font-size:0;background-color:${PALETTE.brand};">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:22px 32px 18px 32px;border-bottom:1px solid ${PALETTE.line};">
            <span style="font-family:${SERIF};font-size:17px;color:${PALETTE.ink};letter-spacing:-0.01em;">SkyNest Robiul</span>
            <span style="font-family:${SANS};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${PALETTE.inkMute};padding-left:12px;">Love &middot; Care &middot; Nature</span>
          </td>
        </tr>
        <tr>
          <td style="padding:30px 32px 32px 32px;">
${body}
          </td>
        </tr>
        ${footer}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function footerBlock(inner) {
  return `<tr>
          <td style="padding:18px 32px 22px 32px;border-top:1px solid ${PALETTE.line};background-color:${PALETTE.linenDeep};font-family:${SANS};font-size:12px;line-height:1.7;color:${PALETTE.inkMute};">
${inner}
          </td>
        </tr>`;
}

export function heading(text) {
  return `<h1 style="margin:0 0 10px 0;font-family:${SERIF};font-size:23px;line-height:1.25;font-weight:500;color:${PALETTE.ink};">${esc(text)}</h1>`;
}

export function lede(text) {
  return `<p style="margin:0 0 22px 0;font-family:${SANS};font-size:15px;line-height:1.75;color:${PALETTE.inkSoft};">${escMultiline(text)}</p>`;
}

export function paragraph(text, { muted = false, size = 14 } = {}) {
  const color = muted ? PALETTE.inkMute : PALETTE.inkSoft;
  return `<p style="margin:0 0 16px 0;font-family:${SANS};font-size:${size}px;line-height:1.75;color:${color};">${escMultiline(text)}</p>`;
}

export function marker(text) {
  return `<p style="margin:0 0 14px 0;font-family:${SANS};font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${PALETTE.inkMute};line-height:1.6;">${esc(text)}</p>`;
}

export function divider() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="height:1px;line-height:1px;font-size:0;background-color:${PALETTE.line};">&nbsp;</td></tr></table>`;
}

/**
 * Label/value rows. `rows` is `[label, value, opts?][]`; falsy values are
 * dropped so an optional field never renders an empty line.
 */
export function dataTable(rows) {
  const cells = rows
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(
      ([label, value, opts = {}], index) => `
            <tr>
              <td style="padding:${index === 0 ? "0" : "11px"} 14px 11px 0;vertical-align:top;width:34%;border-top:${index === 0 ? "0" : `1px solid ${PALETTE.line}`};font-family:${SANS};font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${PALETTE.inkMute};line-height:1.7;">${esc(label)}</td>
              <td style="padding:${index === 0 ? "0" : "11px"} 0 11px 0;vertical-align:top;border-top:${index === 0 ? "0" : `1px solid ${PALETTE.line}`};font-family:${SANS};font-size:14px;line-height:1.7;color:${opts.accent ? PALETTE.brand : PALETTE.ink};">${opts.raw ? value : escMultiline(value)}</td>
            </tr>`
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px 0;">${cells}
          </table>`;
}

/** A quoted block for the visitor's own message. */
export function quote(text) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px 0;">
            <tr>
              <td style="padding:14px 18px;border-left:2px solid ${PALETTE.clay};background-color:#f6f0ea;font-family:${SANS};font-size:14px;line-height:1.75;color:${PALETTE.inkSoft};">${escMultiline(text)}</td>
            </tr>
          </table>`;
}

/** Bulletproof button — a styled <a> alone collapses in Outlook. */
export function button(href, label, { tone = "ink" } = {}) {
  const bg = tone === "brand" ? PALETTE.brand : PALETTE.ink;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
            <tr>
              <td style="background-color:${bg};border-radius:2px;">
                <a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:14px;line-height:1.5;font-weight:600;color:#ffffff;text-decoration:none;border-radius:2px;">${esc(label)}</a>
              </td>
            </tr>
          </table>`;
}

export function link(href, label) {
  return `<a href="${esc(href)}" style="color:${PALETTE.brand};text-decoration:underline;">${esc(label)}</a>`;
}

/* ---------------------------------------------------------------- */

const KIND_LABELS = {
  general: "সাধারণ জিজ্ঞাসা",
  animal: "নির্দিষ্ট প্রাণী",
  visit: "ফার্ম ভিজিট",
};

const SLOT_LABELS = {
  morning: "সকাল",
  afternoon: "দুপুর",
  evening: "বিকেল",
};

export function kindLabel(kind) {
  return KIND_LABELS[kind] ?? "জিজ্ঞাসা";
}

export function slotLabel(slot) {
  return SLOT_LABELS[slot] ?? "";
}

/** Bangla date/time pinned to Dhaka — the VPS clock is UTC. */
export function formatDhaka(value, withTime = true) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
    timeZone: "Asia/Dhaka",
  }).format(date);
}
