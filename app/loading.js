import SiteShell from "@/components/site/site-shell";
import { Section } from "@/components/site/ui";

/**
 * Route-level loading fallback for the whole public site.
 *
 * Shape, not spinner. The header and footer are rendered for real so the
 * page does not jump when the content arrives — only the middle is a
 * placeholder, and it is sized from the actual showcase grid (2 columns on
 * phones, 3 from `lg`, 4:5 frames) so nothing reflows on swap.
 *
 * A grid rather than something neutral because the pages that can actually
 * hang are the database-backed ones — `/`, `/showcase`, `/category/*` are all
 * `force-dynamic`. `/about`, `/contact`, `/terms` and `/privacy` are static
 * and will essentially never reach this file.
 *
 * Six cards, not twelve: enough to fill the first screen, and a skeleton that
 * runs past the fold is promising a page length it cannot guarantee.
 */
export default function Loading() {
    return (
        <SiteShell actionBar={false}>
            <Section>
                <div role="status" aria-live="polite" aria-busy="true">
                    <span className="sr-only">লোড হচ্ছে…</span>

                    <div aria-hidden>
                        {/* section head */}
                        <div className="skel h-3 w-16" />
                        <div className="skel mt-5 h-9 w-64 max-w-full md:h-11 md:w-80" />
                        <div className="skel mt-6 h-4 w-full max-w-[34rem]" />
                        <div className="skel mt-2.5 h-4 w-full max-w-[26rem]" />

                        {/* grid */}
                        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className={i % 3 === 1 ? "lg:mt-16" : undefined}>
                                    <div className="skel aspect-4/5 w-full" />
                                    <div className="skel mt-4 h-4 w-3/4" />
                                    <div className="skel mt-2.5 h-3 w-1/2" />
                                    <div className="skel mt-4 h-3 w-2/5" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>
        </SiteShell>
    );
}
