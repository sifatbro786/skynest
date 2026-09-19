import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { site } from "@/lib/site";
import { safeAdminPath } from "@/lib/utils";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "প্রবেশ",
    robots: { index: false, follow: false },
};

/**
 * Login is the panel's front door, so it wears the panel's clothes, not the
 * public site's: `.panel-root` is what switches on the `.pnl-*` layer, and the
 * right-hand panel is a plain brand block rather than the editorial hero it
 * used to be — a 3.5rem display headline over a six-character password field
 * was all costume and no help.
 */
export default async function LoginPage({ searchParams }) {
    const params = await searchParams;
    const next = safeAdminPath(params?.next);

    return (
        <div
            translate="no"
            className="notranslate panel-root grid flex-1 lg:grid-cols-12"
        >
            {/* ---------- form ---------- */}
            <div className="flex flex-col justify-center bg-paper px-6 py-14 sm:px-10 lg:col-span-5 lg:px-12">
                <div className="mx-auto w-full max-w-sm lg:mx-0">
                    <div className="flex items-center gap-3">
                        <Image
                            src={site.logo}
                            alt={`${site.name} logo`}
                            width={112}
                            height={112}
                            priority
                            className="h-11 w-11 shrink-0 object-contain"
                        />
                        <div className="leading-tight">
                            <p className="text-base font-semibold text-ink">{site.name}</p>
                            <p className="text-xs text-ink-mute">অ্যাডমিন প্যানেল</p>
                        </div>
                    </div>

                    <h1 className="pnl-title mt-9">প্রবেশ করুন</h1>
                    <p className="mt-1 text-sm text-ink-mute">
                        শুধুমাত্র ফার্মের মালিক ও অনুমোদিত ব্যবহারকারীর জন্য।
                    </p>

                    <LoginForm next={next} />

                    <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-ink-mute">
                        পাসওয়ার্ড ভুলে গেলে সার্ভারে{" "}
                        <code className="rounded-sm bg-linen-deep px-1.5 py-0.5 font-mono text-[0.95em] text-ink-soft">
                            npm run create-admin -- &lt;email&gt; &apos;&lt;password&gt;&apos; --reset
                        </code>{" "}
                        চালিয়ে রিসেট করতে হবে।
                    </p>
                </div>
            </div>

            {/* ---------- brand panel ---------- */}
            <aside className="hidden bg-linen-deep lg:col-span-7 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">
                <div className="flex items-center gap-2 text-sm text-ink-soft">
                    <ShieldCheck size={16} strokeWidth={1.75} aria-hidden className="text-brand" />
                    সুরক্ষিত এলাকা
                </div>

                <div className="max-w-xl">
                    <p className="text-2xl font-semibold leading-snug text-ink">
                        কালেকশন, ইনকোয়ারি আর ফার্ম ভিজিট — সবকিছু এক জায়গা থেকে।
                    </p>
                    <p className="mt-4 max-w-prose text-ink-soft">
                        নতুন প্রাণী যোগ করা, স্ট্যাটাস বদলানো, ছবি আপলোড আর ভিজিটের রিকোয়েস্ট
                        দেখা — সবই এই প্যানেল থেকে।
                    </p>
                </div>

                <dl className="grid grid-cols-3 gap-6 border-t border-line-strong pt-5 text-sm">
                    <div>
                        <dt className="text-xs text-ink-mute">মালিক</dt>
                        <dd className="mt-1 text-ink">{site.owner}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-ink-mute">যোগাযোগ</dt>
                        <dd className="pnl-num mt-1 text-ink">{site.phone}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-ink-mute">ঠিকানা</dt>
                        <dd className="mt-1 text-ink">{site.address.line}</dd>
                    </div>
                </dl>
            </aside>
        </div>
    );
}
