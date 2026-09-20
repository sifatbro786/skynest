import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Compact page header for the panel.
 *
 * `eyebrow` used to be the editorial `.marker` rule-and-caps treatment. In a
 * tool it has a job: say where you are and, when there is a parent screen,
 * give you the way back. So it renders as a breadcrumb instead — a link when
 * `eyebrowHref` is set, plain text when it is not.
 */
export default function PageHeader({ eyebrow, eyebrowHref, title, description, actions }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-line pb-5">
            <div className="min-w-0 max-w-2xl">
                {eyebrow ? (
                    <nav aria-label="পথ" className="flex items-center gap-1 text-xs text-ink-mute">
                        {eyebrowHref ? (
                            <Link href={eyebrowHref} className="transition-colors hover:text-brand">
                                {eyebrow}
                            </Link>
                        ) : (
                            <span>{eyebrow}</span>
                        )}
                        <ChevronRight size={12} strokeWidth={2} aria-hidden />
                        <span className="truncate text-ink-soft">{title}</span>
                    </nav>
                ) : null}

                <h1 className="pnl-title mt-1.5 truncate">{title}</h1>

                {description ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-mute">{description}</p>
                ) : null}
            </div>

            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
    );
}
