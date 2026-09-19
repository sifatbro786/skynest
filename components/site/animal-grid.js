import { cn, formatCount } from "@/lib/utils";
import AnimalCard from "./animal-card";
import { Button, Pagination } from "./ui";
import { Stagger } from "./motion";

/**
 * The showcase grid, shared by `/showcase` and `/category/[categorySlug]`.
 *
 * Two layouts, because the available width differs:
 *
 *   `full`     — the page owns the whole shell. 3 columns from `lg`.
 *   `sidebar`  — a filter rail takes 3 of 12 columns, so the grid only gets
 *                9. Holding 3 columns at `lg` there would squeeze each card
 *                to ~210px; it waits for `xl` instead.
 *
 * The PRD asks for a staggered grid rather than a flat one, so every second
 * card of a row of three drops by 4rem. The offset is applied by index rather
 * than by an `nth-child` variant, and it is tied to the same breakpoint the
 * third column appears at — a stagger that fires while the grid is still two
 * columns wide just makes one column look broken.
 *
 * Two columns on phones, not one: these are 4:5 portraits, and a
 * single-column feed of tall photos makes a twelve-item catalogue feel like
 * eighty.
 */
const LAYOUTS = {
    full: {
        grid: "grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16",
        stagger: "lg:mt-16",
    },
    sidebar: {
        grid: "grid-cols-2 gap-x-5 gap-y-12 md:gap-x-7 xl:grid-cols-3 xl:gap-x-8 xl:gap-y-14",
        stagger: "xl:mt-14",
    },
};

export default function AnimalGrid({
    animals,
    total,
    page,
    pages,
    hrefFor,
    filtered,
    emptyAction,
    layout = "full",
    /** `h2` when the grid follows the page title directly — see AnimalCard. */
    cardHeading = "h3",
    className,
}) {
    const { grid, stagger } = LAYOUTS[layout] ?? LAYOUTS.full;
    if (!animals?.length) {
        return (
            <div
                className={cn(
                    "rounded-md border border-dashed border-line-strong bg-paper px-6 py-16 text-center",
                    className
                )}
            >
                <p className="font-display text-title text-ink">
                    {filtered ? "এই ফিল্টারে কিছু পাওয়া যায়নি" : "এখনো কিছু যোগ করা হয়নি"}
                </p>
                <p className="measure mx-auto mt-3 text-sm leading-relaxed text-ink-mute">
                    {filtered
                        ? "ফিল্টার কমিয়ে দেখুন, অথবা সরাসরি WhatsApp-এ জানান কী খুঁজছেন — ফার্মে থাকলে ছবি পাঠিয়ে দেওয়া হবে।"
                        : "খুব শিগগিরই নতুন কালেকশন যোগ হবে। যোগাযোগ করলে আগেভাগে জানিয়ে দেওয়া হবে।"}
                </p>
                {emptyAction ? (
                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                        {emptyAction}
                    </div>
                ) : null}
            </div>
        );
    }

    return (
        <div className={className}>
            <p className="text-sm text-ink-mute">
                <span className="tnum text-ink">{formatCount(total)}</span>টি প্রাণী
                {pages > 1 ? ` · পৃষ্ঠা ${page}/${pages}` : ""}
            </p>

            <Stagger as="ul" className={cn("mt-8 grid", grid)}>
                {animals.map((animal, i) => (
                    <AnimalCard
                        key={animal.id}
                        animal={animal}
                        priority={i < 2}
                        sizes={
                            layout === "sidebar"
                                ? "(min-width:1280px) 300px, (min-width:768px) 38vw, 46vw"
                                : "(min-width:1024px) 340px, (min-width:768px) 40vw, 46vw"
                        }
                        as={cardHeading}
                        className={i % 3 === 1 ? stagger : undefined}
                    />
                ))}
            </Stagger>

            {hrefFor ? (
                <Pagination
                    className="mt-16 justify-center"
                    page={page}
                    pages={pages}
                    hrefFor={hrefFor}
                />
            ) : null}
        </div>
    );
}

/** Convenience default for the empty state's escape hatch. */
export function ClearFiltersAction({ href = "/showcase" }) {
    return (
        <Button href={href} tone="line">
            সব দেখুন
        </Button>
    );
}
