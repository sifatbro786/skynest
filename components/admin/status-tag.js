import { cn } from "@/lib/utils";

/**
 * A dot plus a label — not a filled pill. The PRD bans decorative pill tags,
 * and a coloured dot carries the same information with less furniture.
 */

const ANIMAL = {
    available: { label: "পাওয়া যাচ্ছে", dot: "bg-leaf" },
    reserved: { label: "বুকড", dot: "bg-clay" },
    sold: { label: "বিক্রি হয়েছে", dot: "bg-ink-mute" },
};

const INQUIRY = {
    new: { label: "নতুন", dot: "bg-brand" },
    contacted: { label: "যোগাযোগ হয়েছে", dot: "bg-clay" },
    scheduled: { label: "সময় ঠিক হয়েছে", dot: "bg-leaf" },
    closed: { label: "সম্পন্ন", dot: "bg-ink-mute" },
};

const KIND = {
    general: "সাধারণ",
    animal: "প্রাণী সম্পর্কে",
    visit: "ফার্ম ভিজিট",
};

export function StatusTag({ status, kind = "animal", className }) {
    const map = kind === "inquiry" ? INQUIRY : ANIMAL;
    const entry = map[status];
    if (!entry) return null;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 text-xs whitespace-nowrap text-ink-soft",
                className,
            )}
        >
            <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", entry.dot)} />
            {entry.label}
        </span>
    );
}

export function InquiryKind({ kind }) {
    if (!KIND[kind]) return null;
    // A chip, not 11px caps at 0.14em tracking — this sits inline with a
    // person's name in a list the owner scans, so it has to read at a glance.
    return <span className="ad-chip h-5 text-xs">{KIND[kind]}</span>;
}

export function DraftTag({ className }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 text-xs whitespace-nowrap text-ink-mute",
                className,
            )}
        >
            <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full border border-line-strong"
            />
            খসড়া
        </span>
    );
}
