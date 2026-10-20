import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { SiteNav, Footer } from "@/components/shell";
import PageTransition from "@/components/animations/page-transition";
import Preloader from "@/components/animations/preloader";
import { repos } from "@/lib/db";
import { Analytics } from "@vercel/analytics/next";

export const dynamic = "force-dynamic";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
  const [profile] = await repos.profile.getAll();
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body id="top" className="font-body bg-spidey-dark-900 text-spidey-paper">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Analytics />
        <Preloader />
        <SiteNav />
        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer name={profile?.name} email={profile?.email} />
      </body>
    </html>
  );
}
