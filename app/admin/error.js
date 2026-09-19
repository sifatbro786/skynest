"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

/**
 * Segment error boundary for the whole admin panel.
 *
 * Without this file, anything that throws while rendering a panel screen
 * unmounts the React tree and leaves a white page — the SSR HTML paints, then
 * hydration fails and the DOM is emptied. From the owner's chair that is
 * indistinguishable from "the site is broken", and from the developer's chair
 * it is indistinguishable from a CSS bug.
 *
 * So: show what happened. In dev, the message and stack; in production, the
 * digest, which is the key to the matching server log line.
 */
export default function AdminError({ error, reset }) {
    useEffect(() => {
        // Survives the page being closed before anyone reads the screen.
        console.error("[admin] render failed", error);
    }, [error]);

    const isDev = process.env.NODE_ENV !== "production";

    return (
        <div className="admin-root flex min-h-dvh items-center justify-center p-6">
            <div className="ad-card w-full max-w-2xl">
                <div className="ad-card-head">
                    <div className="flex items-center gap-2">
                        <AlertTriangle
                            size={16}
                            strokeWidth={1.75}
                            aria-hidden
                            className="text-[#a4402a]"
                        />
                        <h1 className="ad-h2">পেজটি লোড করা যায়নি</h1>
                    </div>
                </div>

                <div className="ad-card-body space-y-4">
                    <p className="text-sm text-ink-soft">
                        অ্যাডমিন প্যানেলের এই অংশে একটি সমস্যা হয়েছে। আবার চেষ্টা করুন — না
                        হলে নিচের বার্তাটি ডেভেলপারকে পাঠান।
                    </p>

                    {isDev && error?.message ? (
                        <pre className="ad-scroll max-h-72 whitespace-pre-wrap rounded-sm border border-[#d9b6aa] bg-[#f7ece8] p-3 text-xs leading-relaxed text-[#7d3220]">
                            {error.message}
                            {error.stack ? `\n\n${error.stack}` : ""}
                        </pre>
                    ) : null}

                    {error?.digest ? (
                        <p className="text-xs text-ink-mute">
                            Error digest:{" "}
                            <code className="ad-num rounded-sm bg-linen-deep px-1.5 py-0.5 font-mono">
                                {error.digest}
                            </code>
                        </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                        <button
                            type="button"
                            onClick={() => reset()}
                            className="ad-btn ad-btn-primary"
                        >
                            <RotateCw size={15} strokeWidth={2} aria-hidden />
                            আবার চেষ্টা করুন
                        </button>
                        <a href="/admin" className="ad-btn ad-btn-ghost">
                            ড্যাশবোর্ডে ফিরুন
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
