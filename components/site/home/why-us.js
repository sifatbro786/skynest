import { ShieldCheck, Sprout, Tag } from "lucide-react";

import { cn, toBanglaDigits } from "@/lib/utils";
import { Band, SectionHead } from "@/components/site/ui";
import { Parallax, Stagger, StaggerItem } from "@/components/site/motion";

/**
 * "কেন এখান থেকে" — the three promises, on the warm band.
 *
 * This is the one block on the homepage with no photograph in it, and it is
 * the block most at risk of turning into the three identical icon cards every
 * template ships. Four things keep it off that pattern:
 *
 *  · The ratios start at `sm:`. At one column a fixed 5:4 arch is 280px tall
 *    holding an icon and two lines, and the dome goes hollow again — the same
 *    failure the tall portraits had. Below `sm` the tile is sized by its
 *    content, which on a phone is a compact arch that still domes correctly.
 *  · The arch tiles are DIFFERENT SHAPES. Two are 5:4, the middle one is 4:3,
 *    and the middle column starts lower. Three equal cards in a row is the
 *    arrangement the PRD rules out, and offsets alone do not fix it — the eye
 *    still reads a repeated unit unless the units differ.
 *  · The tiles are WIDE, not tall, and the title lives inside them. The first
 *    pass used 3:4 and 4:5 portraits with only a 40px icon in the middle, and
 *    the review verdict was accurate: three tall empty rectangles read as
 *    unloaded images, not as a designed block. An arch needs its dome filled
 *    or it is just a gap with a curved top.
 *  · Each tile has its own ground, drawn from a different family (paper,
 *    leaf, sky). One repeated tint would read as a colour-coded legend.
 *  · The number is set in the display face at the size of a heading. It is
 *    the composition's rhythm, not a list bullet.
 *  · Each column drifts at its own rate on scroll, so the staircase opens as
 *    you pass it instead of arriving pre-arranged.
 *
 * `aria-hidden` on the numerals: they are typographic, and a screen reader
 * announcing "০১" before each heading is noise in a three-item list.
 */

const PROMISES = [
    {
        icon: Sprout,
        title: "সরাসরি নিজের ফার্ম থেকে",
        body: "কোনো মাঝের হাত নেই। যে প্রাণীটি ছবিতে দেখছেন, সেটিই ফার্মে আছে — এসে দেখে নিতে পারেন।",
        ground: "bg-paper",
        ink: "text-clay",
        ratio: "sm:aspect-5/4",
        offset: "",
    },
    {
        icon: ShieldCheck,
        title: "স্বাস্থ্য ও ভ্যাকসিনেশন লেখা",
        body: "বয়স, ভ্যাকসিনের অবস্থা আর প্রয়োজনীয় যত্নের কথা প্রতিটি প্রাণীর পাতায় খোলাখুলি লেখা থাকে।",
        ground: "bg-leaf-wash",
        ink: "text-leaf",
        ratio: "sm:aspect-4/3",
        offset: "lg:mt-16",
    },
    {
        icon: Tag,
        title: "দাম আগেই জানা",
        body: "দরদামের ঝামেলা নেই। যেখানে দাম আলোচনাসাপেক্ষ, সেখানেও সেটি স্পষ্ট করে বলা থাকে।",
        ground: "bg-brand-wash",
        ink: "text-brand",
        ratio: "sm:aspect-5/4",
        offset: "lg:mt-7",
    },
];

export default function WhyUs() {
    return (
        <Band tone="sand" grain>
            <SectionHead
                index={2}
                label="কেন এখান থেকে"
                title="ছবি সুন্দর হলেই হয় না"
                intro="একটি প্রাণী ঘরে তোলার আগে যে তিনটি প্রশ্ন সবাই করেন, সেগুলোর উত্তর আমরা আগেই দিয়ে রাখি।"
            />

            <Stagger
                as="ul"
                delayChildren={0.08}
                className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-x-10"
            >
                {PROMISES.map((item, i) => (
                    <StaggerItem as="li" key={item.title} className={cn("min-w-0", item.offset)}>
                        <Parallax distance={i === 1 ? -36 : 28}>
                            <div
                                className={cn(
                                    "arch relative flex flex-col justify-between border border-line px-6 pt-10 pb-6",
                                    item.ratio,
                                    item.ground,
                                )}
                            >
                                {/* The ring is not decoration for its own
                                    sake: a bare 44px stroke icon floating in
                                    a 400px dome reads as a placeholder for a
                                    picture that failed to load. The circle
                                    gives it enough mass to look placed. */}
                                <span
                                    className={cn(
                                        "mx-auto grid size-20 place-items-center rounded-pill border border-line",
                                        item.ink,
                                    )}
                                >
                                    <item.icon size={30} strokeWidth={1.25} aria-hidden />
                                </span>

                                <div>
                                    <span
                                        aria-hidden
                                        className="tnum block font-display text-3xl leading-none text-ink/15"
                                    >
                                        {toBanglaDigits(String(i + 1).padStart(2, "0"))}
                                    </span>
                                    <h3 className="text-title mt-2 font-display text-ink">
                                        {item.title}
                                    </h3>
                                </div>
                            </div>

                            <p className="measure mt-5 text-sm leading-relaxed text-ink-soft">
                                {item.body}
                            </p>
                        </Parallax>
                    </StaggerItem>
                ))}
            </Stagger>
        </Band>
    );
}
