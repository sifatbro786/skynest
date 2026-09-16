import Image from "next/image";
import { site } from "@/lib/site";
import { safeAdminPath } from "@/lib/utils";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "প্রবেশ",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const next = safeAdminPath(params?.next);

  return (
    <div className="grid flex-1 lg:grid-cols-12">
      {/* ---------- form ---------- */}
      <div className="flex flex-col justify-center bg-paper px-6 py-16 sm:px-10 lg:col-span-5 lg:px-14">
        <div className="mx-auto w-full max-w-sm lg:mx-0">
          <div className="flex items-center gap-4">
            <Image
              src={site.logo}
              alt={`${site.name} logo`}
              width={112}
              height={112}
              priority
              className="h-14 w-14 shrink-0 object-contain"
            />
            <div className="leading-tight">
              <p className="font-display text-lg text-ink">{site.name}</p>
              <p className="text-micro uppercase text-ink-mute">
                {site.taglineEn}
              </p>
            </div>
          </div>

          <h1 className="mt-12 font-display text-title text-ink">
            প্রশাসনিক প্রবেশ
          </h1>
          <p className="mt-2 text-sm text-ink-mute">
            শুধুমাত্র ফার্মের মালিক ও অনুমোদিত ব্যবহারকারীর জন্য।
          </p>

          <LoginForm next={next} />

          <hr className="rule mt-12" />
          <p className="mt-4 text-xs leading-relaxed text-ink-mute">
            পাসওয়ার্ড ভুলে গেলে সার্ভারে{" "}
            <code className="rounded-xs bg-linen-deep px-1.5 py-0.5 font-mono text-[0.95em] text-ink-soft">
              npm run create-admin
            </code>{" "}
            চালিয়ে রিসেট করতে হবে।
          </p>
        </div>
      </div>

      {/* ---------- brand panel ---------- */}
      <aside className="grain relative hidden bg-linen-deep lg:col-span-7 lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-16">
        <div className="flex items-baseline gap-4">
          <span className="text-micro uppercase text-ink-mute">
            {site.address.lineEn}
          </span>
          <span className="h-px flex-1 bg-line-strong" />
        </div>

        <div className="max-w-2xl">
          <p className="font-display text-headline text-ink">
            শখের পাখি, বিড়াল আর কুকুরের{" "}
            <span className="stroke-under">যত্নের</span> হিসাব — এক জায়গায়।
          </p>
          <p className="text-lede mt-8 max-w-prose text-ink-soft">
            কালেকশনে নতুন প্রাণী যোগ করা, স্ট্যাটাস বদলানো আর ভিজিটের
            রিকোয়েস্ট দেখা — সবই এখান থেকে।
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-px border-t border-line-strong pt-6 text-sm">
          <div>
            <dt className="text-micro uppercase text-ink-mute">মালিক</dt>
            <dd className="mt-1.5 text-ink">{site.owner}</dd>
          </div>
          <div>
            <dt className="text-micro uppercase text-ink-mute">যোগাযোগ</dt>
            <dd className="tnum mt-1.5 text-ink">{site.phone}</dd>
          </div>
          <div>
            <dt className="text-micro uppercase text-ink-mute">ঠিকানা</dt>
            <dd className="mt-1.5 text-ink">{site.address.line}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
