"use client";

import { site } from "@/lib/site";
import Link from "next/link";

/**
 * Last line of defence: a throw inside `app/layout.js` itself.
 *
 * `app/error.js` cannot catch that one, because the boundary lives *inside*
 * the layout it would have to replace. When the root layout dies, React
 * unmounts everything and the visitor gets a white page — which is exactly
 * the failure mode that was so expensive to diagnose in the panel.
 *
 * This file replaces `<html>` and `<body>` wholesale, which means the app's
 * own `globals.css` is not in the tree. So the styling here is inline and
 * literal on purpose: the palette hex values are duplicated rather than
 * referenced, because a stylesheet that failed to load is one of the reasons
 * this screen might be showing in the first place. It is the one file in the
 * project allowed to hard-code colours.
 *
 * Keep it near dependency-free. No `next/link`, no `lucide-react`, no design
 * primitives — anything imported here is another thing that can throw at the
 * exact moment nothing else is left to catch it. `lib/site` is the one
 * exception: a frozen object literal with no side effects, and printing a
 * wrong phone number on the one screen whose job is "call us instead" would
 * defeat the file.
 */
export default function GlobalError({ error, reset }) {
    return (
        <html lang="bn">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem 1.5rem",
                    backgroundColor: "#f4f8fa",
                    color: "#1a1d20",
                    fontFamily:
                        "system-ui, -apple-system, 'Segoe UI', 'Noto Sans Bengali', sans-serif",
                }}
            >
                <main style={{ maxWidth: "34rem", width: "100%" }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "0.75rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "#5b666e",
                        }}
                    >
                        {site.name}
                    </p>

                    <h1
                        style={{
                            margin: "1rem 0 0",
                            fontSize: "1.75rem",
                            lineHeight: 1.3,
                            fontWeight: 600,
                        }}
                    >
                        সাইটটি এই মুহূর্তে লোড করা যাচ্ছে না
                    </h1>

                    <p
                        style={{
                            margin: "1rem 0 0",
                            lineHeight: 1.7,
                            color: "#3f4a52",
                        }}
                    >
                        সাময়িক একটি সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন, অথবা সরাসরি ফোন করুন
                        —{" "}
                        <a
                            href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}
                            style={{ color: "#1a1d20", fontWeight: 600 }}
                        >
                            {site.phone}
                        </a>
                    </p>

                    <div
                        style={{
                            marginTop: "2rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.75rem",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => reset()}
                            style={{
                                minHeight: "2.75rem",
                                padding: "0 1.5rem",
                                border: "1px solid #1a1d20",
                                borderRadius: "2px",
                                backgroundColor: "#1a1d20",
                                color: "#f4f8fa",
                                fontSize: "0.875rem",
                                fontFamily: "inherit",
                                cursor: "pointer",
                            }}
                        >
                            আবার চেষ্টা করুন
                        </button>
                        <Link
                            href="/"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                minHeight: "2.75rem",
                                padding: "0 1.5rem",
                                border: "1px solid #788c9d",
                                borderRadius: "2px",
                                color: "#1a1d20",
                                fontSize: "0.875rem",
                                textDecoration: "none",
                            }}
                        >
                            হোমে ফিরুন
                        </Link>
                    </div>

                    {error?.digest ? (
                        <p
                            style={{
                                marginTop: "2.5rem",
                                paddingTop: "1.25rem",
                                borderTop: "1px solid #d6e0e7",
                                fontSize: "0.75rem",
                                color: "#5b666e",
                            }}
                        >
                            রেফারেন্স কোড — <code>{error.digest}</code>
                        </p>
                    ) : null}
                </main>
            </body>
        </html>
    );
}
