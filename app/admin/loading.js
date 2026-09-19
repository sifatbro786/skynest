/**
 * Loading fallback for the admin panel.
 *
 * It exists mainly so the *public* skeleton in `app/loading.js` never paints
 * inside the panel. Without this file the nearest boundary going up is the
 * root one, and the owner would watch a brochure grid flash before their
 * dashboard — the same "is it broken?" moment the `ad-` class bug cost an
 * afternoon on.
 *
 * Table-shaped rather than grid-shaped: every panel screen that is slow
 * enough to reach this is a list (animals, categories, inquiries).
 */
export default function AdminLoading() {
    return (
        <div className="panel-root p-5 lg:p-7">
            <div role="status" aria-live="polite" aria-busy="true">
                <span className="sr-only">লোড হচ্ছে…</span>

                <div aria-hidden>
                    {/* page head */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="skel h-6 w-44" />
                            <div className="skel mt-3 h-3 w-64 max-w-full" />
                        </div>
                        <div className="skel h-9 w-32" />
                    </div>

                    {/* toolbar */}
                    <div className="mt-6 flex flex-wrap gap-2">
                        <div className="skel h-9 w-full max-w-xs" />
                        <div className="skel h-9 w-28" />
                        <div className="skel h-9 w-28" />
                    </div>

                    {/* table */}
                    <div className="pnl-card mt-5">
                        <div className="pnl-card-head">
                            <div className="skel h-3 w-24" />
                        </div>
                        <div className="divide-y divide-line">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 px-4 py-3.5"
                                >
                                    <div className="skel h-10 w-10 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="skel h-3.5 w-1/3" />
                                        <div className="skel mt-2 h-3 w-1/5" />
                                    </div>
                                    <div className="skel hidden h-3 w-20 sm:block" />
                                    <div className="skel h-5 w-16 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
