import { Fraunces, Hind_Siliguri, Noto_Serif_Bengali } from "next/font/google";
import { site } from "@/lib/site";
import { siteDefaults } from "@/lib/seo";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const banglaSerif = Noto_Serif_Bengali({
  variable: "--font-bangla-serif",
  subsets: ["bengali"],
  display: "swap",
});

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/**
 * Root defaults, merged with whatever the owner has saved under the site-wide
 * SEO row.
 *
 * This is `generateMetadata` rather than a static export so the site-level
 * description, keywords and share image are editable without a deploy. The
 * cost is one database read, which `lib/seo.js` caches for 60s across requests
 * and memoises per render — and which falls back to these literals if Mongo is
 * unreachable, because metadata must never be the reason a page fails.
 *
 * `title.template` stays here in code. An override typed by an admin bypasses
 * it deliberately (see `pageMetadata`), so making the template itself editable
 * would give two ways to control the same string and no way to predict which
 * one won.
 */
export async function generateMetadata() {
  const seo = await siteDefaults();

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} — ${site.tagline}`,
      template: `%s · ${site.name}`,
    },
    description: seo.description,
    ...(seo.keywords.length ? { keywords: seo.keywords } : {}),
    applicationName: site.name,
    openGraph: {
      type: "website",
      locale: "bn_BD",
      siteName: site.name,
      title: `${site.name} — ${site.tagline}`,
      description: seo.description,
      url: site.url,
      ...(seo.ogImageUrl
        ? { images: [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: site.name }] }
        : {}),
    },
    twitter: {
      card: seo.ogImageUrl ? "summary_large_image" : "summary",
      title: `${site.name} — ${site.tagline}`,
      description: seo.description,
      ...(seo.ogImageUrl ? { images: [seo.ogImageUrl] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export const viewport = {
  // Matches --color-ink-band, which is what the sticky header now paints.
  // A linen theme colour above an ink header gives mobile Safari a light
  // strip over a dark bar, which reads as a rendering fault.
  themeColor: "#16191C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="bn"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${banglaSerif.variable} ${hind.variable} h-full`}
    >
      {/* Browser extensions (ColorZilla, Grammarly, password managers) inject
          attributes onto <body> before React hydrates, which React reports as
          a hydration mismatch. Suppressing it here covers only this element's
          own attributes — children still hydrate normally. */}
      <body
        suppressHydrationWarning
        className="grain flex min-h-full flex-col bg-linen text-ink"
      >
        {children}
      </body>
    </html>
  );
}
