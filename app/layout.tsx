import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { SiteNav, Footer } from "@/components/shell";
import PageTransition from "@/components/animations/page-transition";
import SitePreloader from "@/components/animations/site-preloader";
import { PRELOADER_BOOTSTRAP } from "@/lib/preloader-bootstrap";
import { publicSocials, published, repos } from "@/lib/db";
import SiteAnalytics from "@/components/site-analytics";
import SeoJsonLd from "@/components/seo-json-ld";
import { globalGraph } from "@/lib/seo";
import { publicPages, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-400.woff2", weight: "400" },
    { path: "./fonts/poppins-latin-500.woff2", weight: "500" },
    { path: "./fonts/poppins-latin-600.woff2", weight: "600" },
    { path: "./fonts/poppins-latin-700.woff2", weight: "700" },
    { path: "./fonts/poppins-latin-800.woff2", weight: "800" },
    { path: "./fonts/poppins-latin-900.woff2", weight: "900" },
  ],
  variable: "--font-poppins",
  display: "swap",
  // Only the variable body font is critical on every route; avoid eagerly
  // downloading six display-font weights before the hero image.
  preload: false,
});

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "300 700",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: publicPages.home.title, template: `%s | ${SITE_NAME}` },
  description: publicPages.home.description,
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, socials] = await Promise.all([
    published(repos.profile).then(([item]) => item),
    publicSocials(),
  ]);
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body id="top" className="font-body bg-spidey-dark-900 text-spidey-paper">
        <script
          id="portfolio-preloader-boot"
          dangerouslySetInnerHTML={{ __html: PRELOADER_BOOTSTRAP }}
        />
        <SeoJsonLd data={globalGraph(profile, socials)} />
        <SitePreloader
          name={profile?.name || "Tanmay Tiwari"}
          location={profile?.location || "New Delhi, India"}
          role={profile?.role || "Creative Developer & Community Builder"}
        />
        <div data-preloader-page>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <SiteAnalytics />
          <PageTransition>
            <SiteNav socials={socials} />
            <main id="main">{children}</main>
            <Footer name={profile?.name} email={profile?.email} />
          </PageTransition>
        </div>
      </body>
    </html>
  );
}
