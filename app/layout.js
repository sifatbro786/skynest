import { Fraunces, Hind_Siliguri, Noto_Serif_Bengali } from "next/font/google";
import { site } from "@/lib/site";
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

export const metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
  },
  robots: { index: true, follow: true },
};

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
