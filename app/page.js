import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Placeholder shell — replaced by the real editorial home page in Phase 7.
 * Kept here so `npm run dev` renders something on-brand instead of the
 * create-next-app boilerplate.
 */
export default function Home() {
  return (
    <main className="shell flex flex-1 flex-col justify-center py-24 md:py-32">
      <div className="grid gap-14 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="lg:col-span-7">
          <span className="marker">Skynest Robiul</span>

          <h1 className="text-display mt-6 max-w-[15ch] font-display text-ink">
            শখের সেরা <span className="stroke-under">কালেকশন</span>
          </h1>

          <p className="text-lede mt-7 max-w-prose text-ink-soft">
            {site.description}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/showcase"
              className="inline-flex h-12 items-center rounded-xs bg-ink px-7 text-sm font-medium text-linen transition-colors duration-200 hover:bg-olive"
            >
              কালেকশন দেখুন
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-ink underline decoration-line-strong decoration-1 underline-offset-[6px] transition-colors hover:decoration-gold"
            >
              ফার্ম ভিজিটের সময় নিন
            </Link>
          </div>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <hr className="rule" />
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-micro uppercase text-ink-mute">
                সরাসরি যোগাযোগ
              </dt>
              <dd className="tnum mt-1 font-display text-title">
                {site.phone}
              </dd>
            </div>
            <div>
              <dt className="text-micro uppercase text-ink-mute">ঠিকানা</dt>
              <dd className="mt-1 text-ink-soft">{site.address.line}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
