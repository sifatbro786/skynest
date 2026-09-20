import { PawPrint } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The running strip of claims that sits between two bands.
 *
 * Its real job is structural rather than decorative: it is the seam between
 * the ink hero and the light page below it, and a 1px rule there would be
 * invisible against a 16:1 value change. A band of brand blue absorbs the
 * step, and it is the only place on the site where brand blue is used as a
 * large fill rather than as a line — which is why it is a 56px strip and not
 * a section.
 *
 * Mechanics, all of them in globals.css under `.ticker`:
 *
 *  · The track holds the list TWICE and travels exactly -50%, so the seam
 *    lands where the copy repeats and the loop has no visible jump. Both
 *    copies must render identically — if you make the second one shorter,
 *    -50% stops lining up and the strip stutters once per lap.
 *  · It pauses on hover and on focus-within. Moving text that runs longer
 *    than five seconds and cannot be stopped is a WCAG 2.2.2 failure, and
 *    this one runs forever.
 *  · Under `prefers-reduced-motion` the animation is removed by name, not by
 *    duration — see the note in globals.css for why the global kill switch is
 *    not enough here.
 *
 * The duplicate copy is `aria-hidden`, so a screen reader hears the claims
 * once rather than twice.
 */

const CLAIMS = [
    "দুর্লভ ও প্রিমিয়াম পাখি",
    "পেডিগ্রি বিড়াল ও কুকুর",
    "ফ্যান্সি হাঁস-মুরগি ও কবুতর",
    "সরাসরি ফার্মে এসে দেখে নিন",
    "প্রতিটির দাম খোলা লেখা",
];

export default function Ticker({ items = CLAIMS, className }) {
    return (
        <div className={cn("band bg-brand text-linen", className)}>
            <div className="ticker py-4">
                <div className="ticker-track">
                    <Run items={items} />
                    <Run items={items} aria-hidden />
                </div>
            </div>
        </div>
    );
}

function Run({ items, ...rest }) {
    return (
        <ul className="flex shrink-0 items-center" {...rest}>
            {items.map((item, i) => (
                <li
                    key={`${item}-${i}`}
                    className="flex shrink-0 items-center gap-5 pr-5 text-sm whitespace-nowrap"
                >
                    <PawPrint
                        size={14}
                        strokeWidth={1.75}
                        aria-hidden
                        className="shrink-0 text-linen/55"
                    />
                    {item}
                </li>
            ))}
        </ul>
    );
}
