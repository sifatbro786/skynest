import Link from "next/link";
import { Star } from "lucide-react";
import { cn, formatPriceRange } from "@/lib/utils";
import { Frame } from "./ui";
import { StaggerItem } from "./motion";

const STATUS = {
    available: { label: "পাওয়া যাচ্ছে", dot: "bg-status-available" },
    reserved: { label: "বুকড", dot: "bg-status-reserved" },
    sold: { label: "বিক্রি হয়েছে", dot: "bg-status-sold" },
};

/**
 * One animal in the showcase grid.
 *
 * Takes a `serializeAnimal()` result. Three decisions worth keeping:
 *
 *  · The whole card is one link, and nothing inside it is a second link — a
 *    card with a nested "view" anchor gives screen readers two targets for one
 *    destination and breaks the tap area on a phone.
 *  · Nothing is revealed on hover. The status, the price and the featured mark
 *    are all visible at rest, because on a touch screen hover never happens.
 *  · Status is a dot *plus a word*. Colour alone is not an indicator.
 *
 * Phase 10 added two hover states and no third. The card rises 6px and the
 * photograph scales 4% inside its own clip — transform only, both of them, so
 * a nine-card grid costs no layout on mouse move. The 700ms zoom against the
 * 240ms lift is deliberate: matched durations read as one canned effect,
 * offset ones read as the picture having depth behind the card.
 *
 * Nothing was ADDED to hover. Everything the card says at rest it still says
 * at rest — see the second point above, which touch screens depend on.
 *
 * `sizes` is passed down explicitly so the grid's breakpoints and the image
 * budget stay in one place.
 */
export default function AnimalCard({
    animal,
    priority,
    sizes,
    /**
     * The card's title level depends on what sits above it. Under a section
     * `h2` (home, related) it is an `h3`; on a listing where the grid follows
     * the page `h1` directly, it has to be an `h2` or the document skips a
     * level. Left hard-coded, `/showcase` and `/category/[slug]` both went
     * H1 → H3.
     */
    as: Heading = "h3",
    className,
}) {
    if (!animal) return null;

    const status = STATUS[animal.status] ?? STATUS.available;
    const price = animal.price?.onRequest
        ? "দাম জানতে যোগাযোগ করুন"
        : formatPriceRange(animal.price?.min, animal.price?.max, { bangla: true });

    return (
        <StaggerItem as="li" lift={6} className={cn("min-w-0", className)}>
            <Link href={`/showcase/${animal.slug}`} className="group block">
                <Frame
                    src={animal.cover?.path}
                    alt={animal.cover?.alt || `${animal.breed} — ${animal.title}`}
                    width={animal.cover?.width}
                    height={animal.cover?.height}
                    blur={animal.cover?.blur}
                    sizes={sizes}
                    priority={priority}
                    imgClassName="transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
                />

                <div className="mt-4">
                    <div className="flex items-start justify-between gap-3">
                        <Heading className="font-display text-title leading-snug text-ink transition-colors group-hover:text-brand">
                            {animal.title}
                        </Heading>
                        {animal.isFeatured ? (
                            <Star
                                size={15}
                                strokeWidth={2}
                                fill="currentColor"
                                aria-label="ফিচার্ড"
                                className="mt-1 shrink-0 text-clay"
                            />
                        ) : null}
                    </div>

                    <p className="mt-1.5 text-sm text-ink-mute">{animal.breed}</p>

                    <hr className="rule my-3.5" />

                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                        <span className="tnum text-sm text-ink">{price}</span>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-ink-soft">
                            <span
                                aria-hidden
                                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.dot)}
                            />
                            {status.label}
                        </span>
                    </div>
                </div>
            </Link>
        </StaggerItem>
    );
}
