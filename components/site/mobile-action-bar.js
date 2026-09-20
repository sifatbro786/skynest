import { CalendarDays, MessageCircle, Phone } from "lucide-react";
import { site, telLink, whatsappLink } from "@/lib/site";

/**
 * The site's lead capture, pinned to the bottom on phones.
 *
 * This is the conversion path the PRD is built around: no cart, no checkout —
 * a buyer either opens WhatsApp with the message already written, calls, or
 * books a farm visit. On a phone that decision should never be more than one
 * thumb-reach away, so the bar rides every public page.
 *
 * Three things here are not cosmetic:
 *
 *  · It is a server component. Everything on it is a link, so shipping a
 *    client bundle for it would buy nothing.
 *  · `--actionbar-h` in globals.css is what the footer reserves space for and
 *    what `scroll-padding-bottom` uses, so a focused field is never left
 *    underneath it (WCAG 2.2 focus-not-obscured). Change the height there.
 *  · Each target is 44px tall with real gaps — see `.action-bar`, which also
 *    carries the iOS home-indicator inset via `env(safe-area-inset-bottom)`.
 *
 * @param {object} props
 * @param {string} [props.whatsappMessage] prefilled Bangla message; an animal
 *   page passes one naming that animal, so the owner knows what the buyer is
 *   looking at before replying.
 * @param {boolean} [props.showVisit=true]
 */
export default function MobileActionBar({ whatsappMessage, showVisit = true }) {
    const message =
        whatsappMessage || `আসসালামু আলাইকুম। ${site.name}-এর কালেকশন সম্পর্কে জানতে চাই।`;

    return (
        <div className="action-bar lg:hidden" role="group" aria-label="দ্রুত যোগাযোগ">
            <a
                href={whatsappLink(message)}
                target="_blank"
                rel="noreferrer"
                className="btn-solid px-3 text-[13px]"
            >
                <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
                WhatsApp
            </a>

            <a href={telLink()} className="btn-line px-3 text-[13px]">
                <Phone size={16} strokeWidth={1.75} aria-hidden />
                কল
            </a>

            {showVisit ? (
                <a href="/contact" className="btn-line px-3 text-[13px]">
                    <CalendarDays size={16} strokeWidth={1.75} aria-hidden />
                    ভিজিট
                </a>
            ) : null}
        </div>
    );
}
