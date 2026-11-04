import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { hackshastra } from "@/data/hackshastra";
import BrandLink from "./brand-link";

export default function HackShastraFooter() {
  return (
    <footer
      id="hs-connect"
      role="contentinfo"
      aria-labelledby="hs-connect-title"
      className="hs-footer flex min-h-svh flex-col"
    >
      <div className="hs-footer-invite flex flex-1 items-center">
        <div className="hs-shell">
          <div className="hs-mono flex flex-wrap items-center justify-between gap-4 border-b border-current/25 pb-5">
            <p className="flex items-center gap-3">
              <span>05</span>
              <span
                className="h-px w-8 bg-current opacity-40"
                aria-hidden="true"
              />
              The next chapter is yours
            </p>
            <span className="hidden sm:block">
              A little curiosity goes a long way.
            </span>
          </div>

          <div className="hs-footer-invite-grid grid items-end gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-16">
            <div className="min-w-0">
              <h2 id="hs-connect-title" className="hs-footer-title">
                <span className="block" data-hackshastra-line>
                  Find your people.
                </span>
                <span className="block" data-hackshastra-line>
                  Build what’s next.
                </span>
              </h2>
              <p className="hs-footer-lede mt-6 max-w-md text-sm leading-relaxed sm:text-base">
                Bring an idea, a question, or just your curiosity. There’s a
                place for you in the community.
              </p>
            </div>

            <div className="hs-footer-actions min-w-0">
              <a
                href={hackshastra.community}
                target="_blank"
                rel="noopener noreferrer"
                className="hs-footer-join flex min-h-28 items-center justify-between gap-6 px-6 py-6 sm:px-8"
                data-hackshastra-link
              >
                <span className="min-w-0">
                  <span className="hs-mono mb-2 block">
                    Connect on WhatsApp
                  </span>
                  <span className="block text-xl font-medium tracking-[-0.035em] sm:text-2xl">
                    Join the community
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </span>
                <ArrowUpRight
                  size={32}
                  strokeWidth={1.5}
                  className="shrink-0"
                  aria-hidden="true"
                  data-hackshastra-arrow
                />
              </a>
              <BrandLink
                href={hackshastra.chapters}
                className="hs-footer-chapter mt-3 w-full border-b border-current/35 py-3 text-sm"
              >
                Start a campus chapter
              </BrandLink>
            </div>
          </div>
        </div>
      </div>

      <div className="hs-footer-base">
        <div className="hs-shell">
          <div className="grid gap-9 sm:grid-cols-[1.4fr_1fr] lg:grid-cols-[1.1fr_1.1fr_0.65fr] lg:gap-16">
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <a
                href={hackshastra.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hs-footer-brand inline-flex min-h-12 items-center gap-3"
              >
                <Image
                  src={hackshastra.logo}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="shrink-0 object-contain"
                />
                <span className="hs-brand-name">HackShastra</span>
                <span className="sr-only">
                  {" "}
                  — official website (opens in a new tab)
                </span>
              </a>
              <p className="mt-4 max-w-64 text-sm leading-relaxed text-[var(--hs-dim)]">
                Independent minds.
                <br />
                Something bigger, together.
              </p>
            </div>

            <div className="min-w-0">
              <h3 className="hs-mono mb-3 text-[var(--hs-dim)]">
                Have something in mind?
              </h3>
              <BrandLink
                href={`mailto:${hackshastra.email}`}
                className="hs-footer-email w-full text-base"
              >
                {hackshastra.email}
              </BrandLink>
              <p className="mt-2 text-xs leading-relaxed text-[var(--hs-dim)]">
                Ideas, collaborations, and a simple hello.
              </p>
            </div>

            <nav aria-label="HackShastra social links" className="min-w-0">
              <h3 className="hs-mono mb-3 text-[var(--hs-dim)]">
                Follow along
              </h3>
              <BrandLink
                href={hackshastra.instagram}
                className="w-full text-sm"
              >
                Instagram
              </BrandLink>
              <BrandLink href={hackshastra.linkedin} className="w-full text-sm">
                LinkedIn
              </BrandLink>
            </nav>
          </div>

          <div className="hs-footer-colophon mt-10 flex flex-col justify-between gap-6 border-t border-[var(--hs-line)] pt-6 lg:flex-row lg:items-center">
            <p className="text-xs leading-relaxed text-[var(--hs-dim)]">
              From the portfolio of{" "}
              <Link
                href="/about"
                className="hs-footer-author text-[var(--hs-paper)]"
              >
                Tanmay Tiwari
              </Link>
              <span className="block sm:ml-2 sm:inline">
                Co-founder, HackShastra
              </span>
            </p>
            <nav
              aria-label="Continue exploring"
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs"
            >
              <Link
                href="/projects/hackshastra-website"
                className="inline-flex min-h-11 items-center gap-2"
                data-hackshastra-link
              >
                Website case study{" "}
                <ArrowUpRight
                  size={14}
                  aria-hidden="true"
                  data-hackshastra-arrow
                />
              </Link>
              <Link
                href="/projects"
                className="inline-flex min-h-11 items-center gap-2"
                data-hackshastra-link
              >
                Selected work{" "}
                <ArrowUpRight
                  size={14}
                  aria-hidden="true"
                  data-hackshastra-arrow
                />
              </Link>
              <a
                href="#top"
                className="hs-footer-top inline-flex min-h-11 items-center gap-2"
              >
                Back to top <ArrowUp size={14} aria-hidden="true" />
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
