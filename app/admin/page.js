import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/guard";
import { dbConnect } from "@/lib/db";
import { Animal, Inquiry } from "@/models/index.js";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "ড্যাশবোর্ড" };

/**
 * Placeholder shell — Phase 5 replaces this with the real dashboard
 * (aggregation stats, CRUD modules, inquiry inbox). It exists now so the
 * auth round-trip is testable end to end.
 */
export default async function AdminHome() {
  // proxy.js already redirected unauthenticated requests, but proxy coverage
  // depends on a matcher that a future refactor could change. The page checks
  // for itself.
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  await dbConnect();

  const [total, available, inquiries] = await Promise.all([
    Animal.countDocuments({}),
    Animal.countDocuments({ isPublished: true, status: "available" }),
    Inquiry.countDocuments({ status: "new" }),
  ]);

  const stats = [
    { label: "মোট প্রাণী", value: total },
    { label: "এখন পাওয়া যাচ্ছে", value: available },
    { label: "নতুন ইনকোয়ারি", value: inquiries },
  ];

  return (
    <main className="shell flex-1 py-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <span className="marker">ড্যাশবোর্ড</span>
          <h1 className="mt-5 font-display text-headline text-ink">
            স্বাগতম
          </h1>
          <p className="mt-2 text-sm text-ink-mute">{admin.email}</p>
        </div>
        <LogoutButton />
      </div>

      <dl className="mt-14 grid gap-px border-t border-line sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="border-b border-line py-6 sm:pr-10">
            <dt className="text-micro uppercase text-ink-mute">{stat.label}</dt>
            <dd className="tnum mt-2 font-display text-title text-ink">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-12 max-w-prose text-sm text-ink-mute">
        প্রাণী, ক্যাটাগরি আর ইনকোয়ারি ম্যানেজমেন্ট মডিউল Phase 5-এ যুক্ত হবে।
      </p>
    </main>
  );
}
