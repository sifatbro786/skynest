import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import MobileActionBar from "./mobile-action-bar";

/**
 * Chrome for every public page: skip link, header, main, footer, action bar.
 *
 * A component rather than an `app/(site)/layout.js` route group, for the same
 * reason the admin chrome is one — see the Phase 9 note in CLAUDE.md. Moving
 * `app/page.js` into a route group means deleting the old file, and file
 * deletion is not available on this machine yet. Phase 9 converts both.
 *
 * The practical cost is that the header remounts on navigation instead of
 * persisting. For a five-page brochure that is not worth blocking on; the
 * pieces are already split so the swap is mechanical when it happens.
 *
 * `<main>` is focusable (`tabIndex={-1}`) so the skip link has somewhere to
 * land, and so a route change can move screen-reader focus into the content
 * rather than leaving it stranded on the previous page's last element.
 *
 * @param {object} props
 * @param {string} [props.whatsappMessage] overrides the action bar's prefilled
 *   text — an animal page should name the animal.
 * @param {boolean} [props.showVisit=true]
 * @param {boolean} [props.actionBar=true] off for pages that carry their own
 *   primary action, such as the contact form.
 */
export default function SiteShell({
    children,
    whatsappMessage,
    showVisit = true,
    actionBar = true,
}) {
    return (
        <>
            <a href="#main" className="skip-link">
                মূল কনটেন্টে যান
            </a>

            <SiteHeader />

            <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
                {children}
            </main>

            <SiteFooter reserveActionBar={actionBar} />

            {actionBar ? (
                <MobileActionBar
                    whatsappMessage={whatsappMessage}
                    showVisit={showVisit}
                />
            ) : null}
        </>
    );
}
