import { Band, Button, SectionHead } from "@/components/site/ui";
import { Stagger } from "@/components/site/motion";
import AnimalCard from "@/components/site/animal-card";

/**
 * "এই মুহূর্তে যেগুলো আছে" — the featured grid under the hero.
 *
 * Sits on `paper`, the lightest ground in the system, directly after the ink
 * hero and the blue ticker. That fall from a 16:1 ground to nothing is doing
 * real work: it is what makes the photographs the brightest thing on the page
 * at the moment you reach them.
 *
 * The middle column still starts 64px lower (`lg:mt-16` on every third card).
 * Now that the cards lift on hover, that offset is also what keeps the grid
 * from reading as a product listing when three of them move together.
 *
 * Renders nothing when empty rather than a heading over an empty row, which
 * reads as broken instead of as "none yet".
 *
 * @param {object} props
 * @param {Array} props.animals already excludes whatever the hero took, so the
 *   same animal never appears twice on one screen.
 * @param {boolean} [props.priority=false] give the first two cards fetch
 *   priority. Normally false: the hero's first frame is the LCP element, and
 *   four competing priority images is no priority at all. Only true when the
 *   hero has no photographs to show.
 */
export default function FeaturedAnimals({ animals = [], priority = false }) {
    if (animals.length === 0) return null;

    return (
        <Band tone="paper">
            <SectionHead
                index={1}
                label="নির্বাচিত"
                title="এই মুহূর্তে যেগুলো আছে"
                intro="প্রতিটির দাম, বয়স আর ভ্যাকসিনেশনের অবস্থা পাতায় খোলা লেখা আছে।"
                action={
                    <Button href="/showcase" tone="line">
                        সব দেখুন
                    </Button>
                }
            />

            <Stagger
                as="ul"
                delayChildren={0.08}
                className="mt-14 lg:mt-20 grid grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16"
            >
                {animals.map((animal, i) => (
                    <AnimalCard
                        key={animal.id}
                        animal={animal}
                        priority={priority && i < 2}
                        sizes="(min-width:1024px) 340px, (min-width:768px) 40vw, 46vw"
                        className={i % 3 === 1 ? "lg:mt-16" : undefined}
                    />
                ))}
            </Stagger>
        </Band>
    );
}
