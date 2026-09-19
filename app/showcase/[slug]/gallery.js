"use client";

import { useState } from "react";
import { Frame } from "@/components/site/ui";
import { cn } from "@/lib/utils";

/**
 * Photo gallery for one animal.
 *
 * A main 4:5 frame plus a thumbnail strip. Deliberately not a carousel: a
 * carousel hides most of the photos behind a gesture, auto-advances past the
 * one the buyer wanted, and needs pause controls to be accessible. A visible
 * strip of thumbnails shows how many photos exist at a glance and never moves
 * on its own.
 *
 * The thumbnails are real buttons in a tablist, so arrow keys and a screen
 * reader both work, and the selected one announces itself rather than only
 * looking different.
 */
export default function Gallery({ images, alt, className }) {
    const [index, setIndex] = useState(0);

    if (!images?.length) {
        return <Frame className={className} sizes="(min-width:1024px) 620px, 100vw" />;
    }

    const active = images[Math.min(index, images.length - 1)];

    return (
        <div className={className}>
            <Frame
                src={active.path}
                alt={active.alt || alt}
                width={active.width}
                height={active.height}
                blur={active.blur}
                priority
                sizes="(min-width:1024px) 620px, 100vw"
            />

            {images.length > 1 ? (
                <div
                    role="tablist"
                    aria-label="ছবি বেছে নিন"
                    className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6"
                >
                    {images.map((img, i) => (
                        <button
                            key={img.path}
                            type="button"
                            role="tab"
                            aria-selected={i === index}
                            aria-label={`ছবি ${i + 1}`}
                            onClick={() => setIndex(i)}
                            onKeyDown={(e) => {
                                if (e.key === "ArrowRight")
                                    setIndex((v) => (v + 1) % images.length);
                                if (e.key === "ArrowLeft")
                                    setIndex((v) => (v - 1 + images.length) % images.length);
                            }}
                            className={cn(
                                "frame relative aspect-square overflow-hidden border-2 transition-colors",
                                i === index
                                    ? "border-brand"
                                    : "border-transparent hover:border-field"
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.path}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
