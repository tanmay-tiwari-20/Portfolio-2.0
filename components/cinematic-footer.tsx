import Link from "next/link";
import { ArrowUpRight, Share2 } from "lucide-react";
import {
  FaGithub,
  FaInstagram,
  FaLink,
  FaLinkedinIn,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { SocialLink } from "@/lib/validators/schemas";

const footerLinks = [
  { label: "Projects", href: "/projects" },
  { label: "Experience", href: "/experience" },
  { label: "HackShastra", href: "/hackshastra" },
  { label: "Hackathons", href: "/hackathons" },
];

function SocialIcon({ social }: { social: SocialLink }) {
  const key = `${social.id} ${social.label} ${social.href}`.toLowerCase();
  const Icon = key.includes("instagram")
    ? FaInstagram
    : key.includes("linkedin")
      ? FaLinkedinIn
      : key.includes("github")
        ? FaGithub
        : key.includes("twitter") || key.includes("x.com")
          ? FaXTwitter
          : key.includes("youtube")
            ? FaYoutube
            : key.includes("share")
              ? Share2
              : FaLink;

  return <Icon aria-hidden="true" className="h-full w-full" />;
}

export default function CinematicFooter({
  socials,
}: {
  socials: SocialLink[];
}) {
  return (
    <footer
      aria-label="Site links and next step"
      data-cinematic-footer
      className="relative z-20 isolate mt-[-25svh] flex min-h-svh w-full items-stretch overflow-visible bg-transparent p-0 text-[#fffaf7] perspective-[1400px]"
    >
      <div
        data-footer-plane
        className="relative isolate flex min-h-svh w-full max-w-none flex-col justify-between gap-10 overflow-hidden rounded-t-4xl rounded-b-none border-t border-white/20 bg-[#090708] shadow-[0_-24px_90px_rgba(43,8,8,0.3)] transform-3d sm:rounded-t-[2.75rem] lg:rounded-t-[3.5rem]"
      >
        <div
          data-footer-background
          aria-hidden="true"
          className="absolute inset-0 bg-[#090708]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
          >
            <div
              data-footer-color-reveal
              className="aspect-square w-[min(100vw,100svh)] rounded-full bg-[#b82f2b]"
              style={{ transform: "scale(4)" }}
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_6%,rgba(255,204,181,0.22),transparent_42%),linear-gradient(135deg,rgba(72,10,16,0.04),transparent_48%,rgba(54,7,13,0.18))]" />
        </div>
        <div
          data-footer-light
          aria-hidden="true"
          className="pointer-events-none absolute right-[-17vw] top-[-30vh] aspect-square w-[min(82vw,100vh)] rounded-full bg-[radial-gradient(circle,rgba(255,226,207,0.4),rgba(255,180,151,0.1)_40%,transparent_71%)] blur-2xl"
        />
        <div
          data-footer-grid
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-100 bg-[linear-gradient(rgba(255,250,247,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,250,247,0.08)_1px,transparent_1px)] bg-size-[76px_76px] mask-[linear-gradient(90deg,rgba(0,0,0,0.45),black_12%,black_88%,rgba(0,0,0,0.45))]"
        />
        <div
          data-footer-orbit
          aria-hidden="true"
          className="pointer-events-none absolute right-[max(3%,calc((100vw-1380px)/2))] top-[12%] aspect-square w-[min(49vw,700px)] rounded-full border border-white/17"
        >
          <div className="absolute inset-[12%] rounded-full border border-white/10" />
          <div className="absolute inset-[25%] rounded-full border border-white/8" />
          <span className="absolute left-[18%] top-[24%] h-2 w-2 rounded-full bg-white/75 shadow-[0_0_18px_rgba(255,255,255,0.75)]" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-[1660px] flex-1 flex-col justify-between gap-10 px-5 py-6 sm:px-9 sm:py-8 lg:px-16 lg:py-11 2xl:px-20 2xl:py-12">
          <div
            data-footer-reveal
            className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-white/25 pb-4 sm:pb-5"
          >
            <Link
              href="#top"
              aria-label="Back to the beginning"
              className="group inline-flex items-center gap-3 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-[11px]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/45 font-display text-sm transition-[background-color,color,transform] duration-300 group-hover:rotate-12 group-hover:bg-white group-hover:text-[#b92c2b] motion-reduce:transition-none">
                ↗
              </span>
              The next chapter
            </Link>
            <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/75 sm:text-[10px] sm:tracking-[0.22em]">
             ◍ Open to interesting collaborations
            </span>
          </div>

          <div className="grid items-end gap-8 py-2 sm:gap-10 md:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)] md:gap-8 lg:gap-14 lg:py-4">
            <div className="min-w-0">
              <p
                data-footer-reveal
                className="mb-5 text-[9px] font-bold uppercase tracking-[0.22em] text-white/75 sm:mb-7 sm:text-[10px] sm:tracking-[0.25em]"
              >
                A good place to begin
              </p>
              <h2
                data-footer-title
                className="max-w-[12ch] text-[clamp(2.55rem,9.2vw,9rem)] font-black uppercase leading-[0.82] tracking-[-0.085em] text-balance"
              >
                <span className="block">Bring the</span>
                <span className="block">unfinished</span>
                <span className="block text-[#ffd9cf]">idea.</span>
              </h2>
            </div>

            <div className="flex max-w-md flex-col items-start gap-5 lg:pb-2">
              <p
                data-footer-reveal
                className="max-w-[38ch] text-sm leading-6 text-white/85 sm:text-base sm:leading-7"
              >
                A half-written brief. A strange interaction you can’t quite
                explain. A product with one stubbornly hard problem. That’s
                enough to start.
              </p>
              <Link
                href="/contact"
                data-cinematic-footer-link
                className="group inline-flex min-h-12 items-center justify-center gap-4 rounded-full border border-white/20 bg-[#fffaf7] px-6 py-3 text-sm font-bold text-[#211011] shadow-[0_12px_35px_rgba(61,9,12,0.2)] transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_42px_rgba(61,9,12,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:min-h-14 sm:px-7 sm:text-base"
                style={{ color: "#211011" }}
              >
                Start with the rough draft
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
              </Link>
            </div>
          </div>

          <div className="grid gap-5 border-t border-white/25 pt-5 text-[11px] sm:text-xs md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end md:gap-8">
            <nav
              aria-label="Footer navigation"
              data-footer-reveal
              className="flex flex-wrap items-center gap-x-5 gap-y-3 text-white/80 sm:gap-x-6"
            >
              {footerLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group relative py-1 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {item.label}
                  <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none" />
                </Link>
              ))}
            </nav>

            <nav
              aria-label="Social links"
              data-footer-reveal
              className="flex items-center gap-2"
            >
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="group grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white/85 transition-[transform,background-color,border-color,color] duration-300 hover:-translate-y-1 hover:scale-105 hover:border-white/75 hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
                >
                  <span className="h-4.5 w-4.5">
                    <SocialIcon social={social} />
                  </span>
                </a>
              ))}
            </nav>

            <div
              data-footer-reveal
              className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-white/65 md:flex-col md:items-end md:gap-1 md:text-right"
            >
              <span>© {new Date().getFullYear()} · End frame</span>
              <a
                href="#top"
                className="transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Back to top <span aria-hidden="true">↑</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
