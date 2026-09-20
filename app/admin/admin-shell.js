import { site } from "@/lib/site";
import { dbConnect } from "@/lib/db";
import { Inquiry } from "@/models/index.js";
import AdminNav from "./admin-nav";

/**
 * Admin chrome: a persistent left rail with the page content beside it.
 *
 * Deliberately a component rather than a layout — `/admin/login` sits under
 * the same segment and must render without chrome, and every panel page has
 * to call `requireAdmin()` for itself regardless (proxy coverage is not a
 * substitute; see CLAUDE.md).
 *
 * `.panel-root` is what switches on the `.pnl-*` layer in globals.css, so the
 * panel's type and surface rules never leak into the public site.
 *
 * The content column is capped at 80rem, not 64rem: the listing and the
 * animal form are the two screens in the product that genuinely want the
 * width, and a 5xl column left a third of a laptop screen empty beside a
 * table that then had to scroll.
 */
export default async function AdminShell({ admin, children }) {
    await dbConnect();
    const newInquiries = await Inquiry.countDocuments({ status: "new" });

    return (
        <div
            // `translate="no"` + the `notranslate` class are what actually stop
            // Chrome; the meta tag in layout.js only suppresses the offer. Both
            // are needed — see the note there.
            translate="no"
            className="notranslate panel-root flex flex-1 flex-col lg:flex-row"
        >
            <AdminNav admin={admin} newInquiries={newInquiries} />

            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <div className="mx-auto w-full max-w-7xl">{children}</div>
                </main>

                <footer className="border-t border-line px-4 py-4 sm:px-6 lg:px-8">
                    <p className="mx-auto w-full max-w-7xl text-xs text-ink-mute">
                        {site.name} · {site.taglineEn}
                    </p>
                </footer>
            </div>
        </div>
    );
}
