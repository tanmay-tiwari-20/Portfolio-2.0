import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { SiteNav, Footer } from "@/components/shell";
import PageTransition from "@/components/animations/page-transition";
import Preloader from "@/components/animations/preloader";
import { published, repos } from "@/lib/db";
import { Analytics } from "@vercel/analytics/next";

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
});

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "300 700",
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings] = await repos.settings.getAll();
  const title =
    settings?.title || "Tanmay Tiwari — Creative Developer & Architect";
  const description =
    settings?.description ||
    "Creative developer and technical architect building high-performance web applications.";
  const image = settings?.ogImage?.url || "/og.svg";
  return {
    title: { default: title, template: "%s — Tanmay Tiwari" },
    description,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ),
    icons: {
      icon: "/icon.svg",
      shortcut: "/icon.svg",
      apple: "/icon.svg",
    },
    openGraph: { title, description, type: "website", images: [image] },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, socials] = await Promise.all([
    repos.profile.getAll().then(([item]) => item),
    published(repos.socials),
  ]);
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body id="top" className="font-body bg-spidey-dark-900 text-spidey-paper">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Analytics />
        <Preloader />
        <SiteNav socials={socials} />
        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer name={profile?.name} email={profile?.email} />
      </body>
    </html>
  );
}
