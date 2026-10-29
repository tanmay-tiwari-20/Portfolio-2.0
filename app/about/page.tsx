import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Compass,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { published, repos } from "@/lib/db";
import { resolveAboutPopOut } from "@/lib/about-gallery";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { hackathonMoments } from "@/data/hackathon-moments";
import RadialPopOut from "@/components/about/radial-pop-out";
import SkiperTextReveal from "@/components/about/skiper-text-reveal";
import AboutMotion from "@/components/about/about-motion";
import { MotionLayer } from "@/components/shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Tanmay Tiwari, a software developer from New Delhi, India. Explore his work, hackathon journey, and experience.",
};

const wrap =
  "mx-auto w-[calc(100%_-_64px)] max-w-[1360px] max-[760px]:w-[calc(100%_-_40px)] max-[760px]:max-w-[620px] max-[420px]:w-[calc(100%_-_36px)] max-[420px]:max-w-[360px]";
const sectionLabel =
  "mb-[26px] mt-1 flex items-center gap-[11px] text-[10px] font-bold uppercase leading-[1.4] tracking-[0.2em] text-[#ef463e] before:h-px before:w-[22px] before:bg-current before:content-[''] max-[420px]:text-[8px] max-[420px]:tracking-[0.16em]";
const signalCard =
  "relative flex min-h-[138px] flex-col items-start overflow-hidden border border-white/10 bg-[linear-gradient(145deg,rgba(255,250,247,0.055),rgba(255,250,247,0.012))] p-[14px_13px_12px] shadow-[inset_0_1px_0_rgba(255,250,247,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#ff6558]/50 hover:bg-[#ef463e]/5 max-[760px]:min-h-[128px] max-[760px]:p-3 max-[420px]:min-h-[124px] max-[420px]:p-[11px_8px] motion-reduce:transition-none motion-reduce:hover:transform-none";

export default async function AboutPage() {
  const [profiles, settingsRows, experiences, hackathons] = await Promise.all([
    repos.profile.getAll(),
    repos.settings.getAll(),
    published(repos.experiences),
    published(repos.hackathons),
  ]);
  const profile = profiles[0];
  const settings = settingsRows[0];
  const name = profile?.name || "Tanmay Tiwari";
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts.shift() || "Tanmay";
  const familyName = nameParts.join(" ") || "Tiwari";
  const location = profile?.location || "New Delhi, India";
  const role = profile?.role || "Creative Developer & Community Builder";
  const biography =
    profile?.bio ||
    "I’m a software developer from New Delhi, India. I enjoy building useful digital experiences, exploring new technologies, and turning ideas into working software.";
  const gallery = resolveAboutPopOut(settings?.aboutPopOut, profile?.avatar);
  const highlights = profile?.stats?.slice(0, 3) ?? [];
  const moments = hackathonMoments.slice(0, 3);
  const featuredHackathons = hackathons.slice(0, 3);

  const coreInterests = [
    {
      icon: Sparkles,
      label: "Creative Dev & Motion",
      tagline: "Physics, GSAP, WebGL & tactile micro-interactions",
      badge: "Craft",
    },
    {
      icon: UsersRound,
      label: "Community & Hackathons",
      tagline: "Co-founded HackShastra · 3,000+ builders",
      badge: "Culture",
    },
    {
      icon: Code2,
      label: "Full-Stack Architecture",
      tagline: "Next.js, TypeScript, resilient data pipelines",
      badge: "Systems",
    },
    {
      icon: Compass,
      label: "Editorial Design",
      tagline: "Cinematic dark UI, bold typography, craft",
      badge: "Aesthetics",
    },
  ];

  return (
    <div className="relative isolate overflow-clip bg-[#090708] bg-[linear-gradient(rgba(255,250,247,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,250,247,0.012)_1px,transparent_1px),radial-gradient(ellipse_at_80%_3%,rgba(239,70,62,0.12),transparent_42rem)] bg-size-[72px_72px,72px_72px,auto] text-[#fffaf7]">
      {/* ── HERO ── Strict single screen height (100svh), perfectly balanced layout ── */}
      <section
        className={
          "relative isolate mx-auto grid min-h-[100svh] lg:h-[100svh] lg:max-h-[100svh] grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] items-center gap-[clamp(24px,3.5vw,56px)] px-0 pt-[clamp(80px,10vh,115px)] pb-[clamp(24px,3vh,44px)] overflow-clip max-[1060px]:h-auto max-[1060px]:min-h-0 max-[1060px]:max-h-none max-[1060px]:grid-cols-1 max-[1060px]:gap-12 max-[1060px]:py-24 max-[760px]:pb-12 max-[760px]:pt-28 " +
          wrap
        }
        aria-labelledby="about-title"
      >
        {/* Ambient atmospheric red lighting behind visual */}
        <div
          className="pointer-events-none absolute -right-[10%] -z-10 top-[4%] aspect-square w-[min(62vw,800px)] rounded-full border border-white/[0.025] bg-[radial-gradient(circle,rgba(239,70,62,0.1),transparent_68%)]"
          aria-hidden="true"
        />

        {/* ─── Left Column: Rich, Balanced Editorial Story Content ─── */}
        <div className="relative z-2 flex flex-col justify-center">
          {/* Top Kicker — Clean static editorial text (no live pulse badge) */}
          <div
            className="mb-[clamp(10px,1.8vh,18px)] flex flex-wrap items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#938783]"
            data-about-kicker
          >
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[9px] font-bold text-[#ffd2c4]">
              {role}
            </span>
            <span className="text-white/20">/</span>
            <span className="text-[rgba(255,250,247,0.65)]">{location}</span>
          </div>

          {/* Giant Display Name */}
          <h1
            id="about-title"
            className="m-0 ml-[-0.06em] font-[var(--font-display)] text-[clamp(3.8rem,7.4vw,6.8rem)] font-black uppercase leading-[0.84] tracking-[-0.085em] max-[760px]:text-[clamp(3.2rem,13vw,5.2rem)] max-[420px]:text-[clamp(2.6rem,15vw,3.8rem)]"
            aria-label={name}
          >
            <span
              className="block w-fit max-w-full overflow-hidden text-[#fffaf7]"
              data-about-hero-line
            >
              {firstName}
            </span>
            <span
              className="block w-fit max-w-full overflow-hidden text-[#ffd2c4]"
              data-about-hero-line
            >
              {familyName}
              <span className="text-[#fffaf7]">.</span>
            </span>
          </h1>

          {/* Manifesto / Subtitle */}
          <p
            className="mt-[clamp(10px,1.5vh,16px)] max-w-[560px] font-[var(--font-display)] text-[clamp(16px,1.5vw,22px)] font-bold leading-[1.2] tracking-[-0.035em] text-[rgba(255,250,247,0.9)] max-[760px]:text-[clamp(15px,4vw,20px)]"
            data-about-intro
          >
            Curiosity in code. Obsession with craft.
          </p>

          {/* Exact Skiper70 Text Animation with Specially Highlighted HackShastra Link */}
          <div className="mt-[clamp(10px,1.5vh,16px)] max-w-[560px]" data-about-intro>
            <SkiperTextReveal
              highlight="HackShastra"
              highlightLink="https://hackshastra.in"
              highlightTextClass="!text-[#ff8c7e] font-extrabold hover:!text-white"
              highlightBgClass="!bg-[#ef463e]/20 border border-[#ef463e]/60 shadow-[0_0_20px_rgba(239,70,62,0.35)]"
              className="text-[clamp(13px,1.08vw,15.5px)] leading-[1.72]"
            >
              {`I'm Tanmay Tiwari, an independent creative developer and community architect based in New Delhi.
I build at the intersection of sturdy full-stack engineering and fluid digital experiences. Co-founder of HackShastra, empowering 3,000+ builders across India to ship real software.`}
            </SkiperTextReveal>
          </div>

          {/* Core Craft Badges Bar — Fills middle space so it never looks empty */}
          <div
            className="mt-[clamp(12px,1.8vh,18px)] flex flex-wrap items-center gap-1.5"
            data-about-intro
          >
            {[
              "Creative Dev & Motion",
              "Founder @ HackShastra",
              "Full-Stack Systems",
            ].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[linear-gradient(145deg,rgba(255,250,247,0.04),rgba(255,250,247,0.01))] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#d0c7c2] shadow-xs"
              >
                <span className="h-1 w-1 rounded-full bg-[#ff6558]/80" />
                {tag}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div
            className="mt-[clamp(12px,2vh,22px)] flex flex-wrap items-center gap-2.5 max-[420px]:gap-2"
            data-about-intro
          >
            <Link
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/20 bg-[#ef463e] px-5 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-[#fffaf7] no-underline shadow-[0_6px_22px_rgba(239,70,62,0.28)] transition duration-300 hover:-translate-y-[2px] hover:bg-[#ff6558]"
              href="#the-person"
            >
              Explore the journey <ArrowRight size={13} aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#ffd2c4] no-underline transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              href="/hackshastra"
            >
              HackShastra Story <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>

          {/* Key Milestones & Metrics */}
          {highlights.length > 0 && (
            <div
              className="mt-[clamp(12px,2vh,22px)] grid max-w-[460px] grid-cols-3 gap-3 border-t border-white/10 pt-[clamp(10px,1.5vh,15px)] max-[420px]:gap-2"
              role="group"
              aria-label="Portfolio highlights"
            >
              {highlights.map((highlight, index) => (
                <div
                  className="relative grid min-w-0 gap-0.5"
                  data-about-stat
                  key={highlight.label}
                >
                  <strong className="font-[var(--font-display)] text-[clamp(20px,2.2vw,28px)] font-extrabold leading-none tracking-[-0.06em] text-[#fffaf7]">
                    {highlight.value}
                    <sup className="ml-0.5 text-[0.52em] text-[#ff6558]">+</sup>
                  </strong>
                  <span className="text-[8px] font-bold uppercase leading-tight tracking-[0.1em] text-[#938783] max-[420px]:text-[7px]">
                    {highlight.label}
                  </span>
                  {index < highlights.length - 1 && (
                    <i
                      className="absolute right-0 top-1 h-5 w-px bg-white/10"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Right Column: Enlarged Radial Pop-Out Component ─── */}
        <div
          className="relative flex h-full w-full items-center justify-center max-[1060px]:min-h-[380px]"
          data-about-visual
        >
          {/* Background Rotating Orbit Guide */}
          <div
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="aspect-square w-[min(92%,540px)] rounded-full border border-dashed border-white/[0.04] animate-[spin_90s_linear_infinite] motion-reduce:animate-none" />
          </div>

          {/* Inner concentric circle guide */}
          <div
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="aspect-square w-[min(60%,340px)] rounded-full border border-white/[0.025]" />
          </div>

          <RadialPopOut
            gallery={gallery}
            cardSize={245}
            heroSize={310}
            radius={290}
          />
        </div>
      </section>

      <a
        className={
          wrap +
          " mx-auto -mt-8 flex items-center gap-[13px] pb-[38px] text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 no-underline before:h-px before:w-9 before:bg-[#ef463e] before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ef463e] max-[760px]:mt-0"
        }
        href="#the-person"
      >
        Scroll to explore
      </a>

      <div
        className="overflow-hidden border-y border-[#ef463e]/20 bg-[linear-gradient(90deg,rgba(239,70,62,0.11),rgba(255,250,247,0.025)_48%,rgba(239,70,62,0.08))] py-4"
        role="group"
        aria-label="Software, community, hackathons, New Delhi"
      >
        <div className="flex w-max" data-about-marquee-track aria-hidden="true">
          {[0, 1].map((copy) => (
            <span
              className="flex shrink-0 items-center gap-[clamp(24px,4vw,58px)] px-[clamp(24px,4vw,58px)]"
              key={copy}
            >
              {["Software", "Community", "Hackathons", "New Delhi"].map(
                (word) => (
                  <span
                    className="inline-flex items-center gap-[clamp(24px,4vw,58px)] whitespace-nowrap font-[var(--font-display)] text-[clamp(12px,1.4vw,17px)] font-bold uppercase tracking-[0.12em] text-white/80"
                    key={word}
                  >
                    {word}
                    <i className="h-[7px] w-[7px] rounded-full border border-[#ff6558] bg-[#ef463e] shadow-[0_0_14px_rgba(239,70,62,0.28)]" />
                  </span>
                ),
              )}
            </span>
          ))}
        </div>
      </div>

      <section
        id="the-person"
        className="border-t border-white/10 py-[clamp(72px,8vw,116px)]"
        aria-labelledby="bio-title"
      >
        <div
          className={
            "grid grid-cols-[minmax(200px,0.75fr)_minmax(0,1.25fr)] items-start gap-[clamp(40px,10vw,150px)] " +
            wrap
          }
        >
          <div>
            <p className={sectionLabel}>01 / The person</p>
            <h2
              id="bio-title"
              className="max-w-[820px] font-[var(--font-display)] text-[clamp(2.7rem,5.1vw,5.4rem)] font-bold leading-[0.99] tracking-[-0.075em]"
              data-about-heading
            >
              More than the screen. It’s the thinking behind it.
            </h2>
          </div>
          <div className="max-w-[660px] pt-[5px] text-[clamp(17px,1.7vw,23px)] leading-[1.72] text-[#d0c7c2] max-[760px]:text-[17px]">
            <p className="m-0">{biography}</p>
            <div className="mt-[34px] flex items-center gap-3 border-t border-white/10 pt-[18px] text-[10px] font-bold uppercase tracking-[0.13em] text-[#938783] max-[420px]:flex-wrap">
              <span>Interested in</span>
              <strong className="font-semibold text-[#fffaf7]">
                software · people · the details
              </strong>
            </div>
            <div className="mt-[34px] grid grid-cols-3 gap-[10px] max-[760px]:gap-[7px] max-[420px]:gap-[6px]">
              <article className={signalCard} data-about-anime-item>
                <Code2
                  size={16}
                  className="text-[#ff6558]"
                  aria-hidden="true"
                />
                <span className="absolute right-[13px] top-[14px] text-[8px] font-bold tracking-[0.1em] text-white/40">
                  01
                </span>
                <strong className="mt-auto text-[clamp(10px,1vw,12px)] font-bold leading-[1.3] text-[#fffaf7]">
                  Build with care
                </strong>
                <small className="mt-1 text-[8px] leading-[1.35] text-[#938783]">
                  Thoughtful engineering
                </small>
              </article>
              <article className={signalCard} data-about-anime-item>
                <UsersRound
                  size={16}
                  className="text-[#ff6558]"
                  aria-hidden="true"
                />
                <span className="absolute right-[13px] top-[14px] text-[8px] font-bold tracking-[0.1em] text-white/40">
                  02
                </span>
                <strong className="mt-auto text-[clamp(10px,1vw,12px)] font-bold leading-[1.3] text-[#fffaf7]">
                  Make it together
                </strong>
                <small className="mt-1 text-[8px] leading-[1.35] text-[#938783]">
                  People make the work
                </small>
              </article>
              <article className={signalCard} data-about-anime-item>
                <Sparkles
                  size={16}
                  className="text-[#ff6558]"
                  aria-hidden="true"
                />
                <span className="absolute right-[13px] top-[14px] text-[8px] font-bold tracking-[0.1em] text-white/40">
                  03
                </span>
                <strong className="mt-auto text-[clamp(10px,1vw,12px)] font-bold leading-[1.3] text-[#fffaf7]">
                  Keep exploring
                </strong>
                <small className="mt-1 text-[8px] leading-[1.35] text-[#938783]">
                  Curiosity in motion
                </small>
              </article>
            </div>

            <div className="mt-9 border-t border-white/10 pt-7">
              <div className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#938783]">
                <span className="flex items-center gap-2">
                  <span className="h-px w-3 bg-[#ef463e]" aria-hidden="true" />
                  Core Passions & Focus Areas
                </span>
                <span className="text-[#ef463e]">04 Disciplines</span>
              </div>
              <div className="grid grid-cols-2 gap-3 max-[540px]:grid-cols-1">
                {coreInterests.map((interest) => (
                  <div
                    key={interest.label}
                    data-about-anime-item
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,250,247,0.035),rgba(255,250,247,0.01))] p-4 shadow-[inset_0_1px_0_rgba(255,250,247,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#ff6558]/50 hover:bg-[#ef463e]/10"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#171011] text-[#ff6558] transition-colors group-hover:border-[#ff6558]/60 group-hover:bg-[#ef463e]/20">
                        <interest.icon size={15} aria-hidden="true" />
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#ff8c7e]">
                        {interest.badge}
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <strong className="block text-[12px] font-bold leading-tight text-[#fffaf7] transition-colors group-hover:text-[#ffd2c4]">
                        {interest.label}
                      </strong>
                      <small className="mt-1 block text-[10px] leading-relaxed text-[#938783] group-hover:text-[#d0c7c2]">
                        {interest.tagline}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="isolate relative overflow-hidden border-y border-white/10 bg-[#151011] py-[clamp(70px,8vw,112px)] before:absolute before:-right-[9vw] before:-z-10 before:bottom-[-28vw] before:aspect-square before:w-[min(60vw,780px)] before:rounded-full before:border before:border-white/[0.055] before:shadow-[0_0_0_70px_rgba(255,250,247,0.014)] before:content-['']"
        aria-labelledby="hackathons-title"
      >
        <div
          className={
            "grid grid-cols-[minmax(0,0.92fr)_minmax(320px,1.08fr)] items-start gap-[clamp(38px,8vw,120px)] max-[1000px]:grid-cols-2 max-[1000px]:gap-[42px] max-[760px]:grid-cols-1 max-[760px]:gap-11 " +
            wrap
          }
        >
          <div>
            <p className={sectionLabel}>02 / Learning by building</p>
            <h2
              id="hackathons-title"
              className="max-w-[620px] font-[var(--font-display)] text-[clamp(3.4rem,6.6vw,7rem)] font-extrabold leading-[0.87] tracking-[-0.09em] max-[760px]:text-[clamp(3.6rem,15vw,6rem)]"
              data-about-heading
            >
              Good ideas grow{" "}
              <em className="font-[Georgia,serif] font-normal italic text-[#ff8c7e]">
                together.
              </em>
            </h2>
            <p className="mt-[26px] max-w-[510px] text-[clamp(15px,1.3vw,18px)] leading-[1.8] text-[#d0c7c2]">
              Hackathons bring the parts of software I enjoy into one room: an
              open-ended problem, new perspectives, and the chance to make an
              idea tangible. My experience includes mentoring, judging, and
              organizing; the shared process is what keeps me coming back.
            </p>

            {moments.length > 0 && (
              <div
                className="mt-10 grid grid-cols-[1.16fr_0.84fr] grid-rows-[205px_205px] gap-[10px] max-[1000px]:grid-rows-[175px_175px] max-[760px]:mt-7 max-[760px]:grid-rows-[minmax(135px,36vw)_minmax(135px,36vw)] max-[420px]:grid-rows-[128px_128px]"
                aria-label="Moments from hackathons"
              >
                {moments.map((moment, index) => (
                  <div
                    className={
                      "relative overflow-hidden border border-white/15 bg-[#251c1d] shadow-[0_18px_48px_rgba(0,0,0,0.2)] " +
                      (index === 0
                        ? "row-span-2 translate-y-3 -rotate-[1.2deg]"
                        : index === 2
                          ? "-translate-y-[5px] rotate-[1.1deg]"
                          : "")
                    }
                    key={moment.src}
                  >
                    <Image
                      src={getOptimizedUrl(
                        moment.src,
                        index === 0 ? 900 : 620,
                        index === 0 ? 1200 : 620,
                      )}
                      alt={moment.alt}
                      width={moment.width}
                      height={moment.height}
                      sizes={
                        index === 0
                          ? "(max-width: 760px) 52vw, 360px"
                          : "(max-width: 760px) 42vw, 260px"
                      }
                      unoptimized
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.75,0.25,1)] hover:scale-[1.045] motion-reduce:transition-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className={sectionLabel}>A few places along the way</p>
            {featuredHackathons.length > 0 ? (
              <div className="border-t border-white/20">
                {featuredHackathons.map((event) => (
                  <article
                    className="grid grid-cols-[75px_minmax(0,1fr)_auto] items-center gap-[15px] border-b border-white/15 py-[17px] transition duration-300 hover:translate-x-1 hover:border-[#ff6558]/50 max-[420px]:grid-cols-[58px_minmax(0,1fr)] max-[420px]:gap-x-3 max-[420px]:gap-y-2 motion-reduce:transition-none"
                    data-about-anime-item
                    key={event.id}
                  >
                    <span className="text-[9px] font-bold uppercase leading-[1.5] tracking-[0.12em] text-[#938783]">
                      {event.date}
                    </span>
                    <div>
                      <h3 className="m-0 font-[var(--font-display)] text-[clamp(15px,1.45vw,20px)] leading-[1.2] tracking-[-0.035em] text-[#fffaf7]">
                        {event.name}
                      </h3>
                      <span className="mt-[5px] block text-[11px] leading-[1.5] text-[#d0c7c2]">
                        {event.organizer}
                      </span>
                    </div>
                    <span className="whitespace-nowrap rounded-full border border-[#ff6558]/40 px-[9px] py-[5px] text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#ff8c7e] max-[420px]:col-start-2 max-[420px]:justify-self-start">
                      {event.role}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="border-t border-white/10 py-6 text-[14px] text-[#938783]">
                Hackathon details will appear here when they are published.
              </p>
            )}
            <Link
              className="group mt-6 inline-flex items-center gap-[9px] text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#ff8c7e] no-underline hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ef463e]"
              href="/hackathons"
            >
              Explore hackathons{" "}
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="experience"
        className="py-[clamp(72px,8vw,116px)] pb-[clamp(108px,15vw,200px)]"
        aria-labelledby="experience-title"
      >
        <div className={wrap}>
          <div className="mb-[72px] grid grid-cols-[minmax(0,0.8fr)_minmax(300px,1.2fr)] items-end gap-12 max-[760px]:mb-[45px] max-[760px]:grid-cols-1 max-[760px]:gap-[18px]">
            <div>
              <p className={sectionLabel}>03 / Experience</p>
              <h2
                id="experience-title"
                className="max-w-[820px] font-[var(--font-display)] text-[clamp(2.7rem,5.1vw,5.4rem)] font-bold leading-[0.99] tracking-[-0.075em]"
                data-about-heading
              >
                Work shaped by people and practice.
              </h2>
            </div>
            <p className="mb-[6px] ml-auto max-w-[470px] text-[14px] leading-[1.75] text-[#938783] max-[760px]:m-0">
              A record of roles and contributions, drawn from the experience
              shared across my portfolio.
            </p>
          </div>

          {experiences.length > 0 ? (
            <div className="relative grid gap-0 pl-[35px] [counter-reset:about-experience]">
              <span
                className="absolute bottom-[18px] left-2 top-[10px] w-px origin-top bg-[linear-gradient(to_bottom,#ef463e,rgba(239,70,62,0.08))]"
                data-about-thread
                aria-hidden="true"
              />
              {experiences.map((experience, index) => (
                <article
                  className="relative grid grid-cols-[minmax(160px,0.72fr)_minmax(0,1.28fr)] gap-[clamp(24px,6vw,82px)] pb-[54px] last:pb-0 max-[760px]:grid-cols-1 max-[760px]:gap-[15px] max-[760px]:pb-[42px]"
                  data-about-experience
                  key={experience.id}
                >
                  <span
                    className="pointer-events-none absolute right-0 top-[-19px] font-[var(--font-display)] text-[clamp(74px,10vw,132px)] font-black leading-[0.8] tracking-[-0.1em] text-[#ef463e]/[0.075]"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="absolute -left-8 top-[10px] h-[9px] w-[9px] rounded-full border-2 border-[#0d0a0b] bg-[#ef463e] shadow-[0_0_0_1px_#ef463e]"
                    aria-hidden="true"
                  />
                  <div className="relative z-[1] pt-[3px] max-[760px]:flex max-[760px]:flex-wrap max-[760px]:gap-x-3 max-[760px]:gap-y-[6px]">
                    <span className="block text-[10px] font-extrabold uppercase leading-[1.5] tracking-[0.12em] text-[#ef463e]">
                      {experience.period}
                    </span>
                    <span className="mt-[9px] block text-[11px] text-[#938783] max-[760px]:mt-0">
                      {experience.location}
                    </span>
                  </div>
                  <div className="relative z-[1]">
                    <h3 className="m-0 font-[var(--font-display)] text-[clamp(22px,3vw,37px)] font-bold leading-[1.12] tracking-[-0.06em]">
                      {experience.role}
                    </h3>
                    <span className="mt-[5px] block text-[14px] font-bold text-[#ef463e]">
                      {experience.company}
                    </span>
                    <p className="mt-[17px] max-w-[680px] whitespace-pre-line text-[14px] leading-[1.75] text-[#d0c7c2]">
                      {experience.description}
                    </p>
                    {experience.achievements.length > 0 && (
                      <ul className="mt-[19px] grid list-none gap-[9px] p-0">
                        {experience.achievements.map(
                          (achievement, achievementIndex) => (
                            <li
                              className="relative pl-[18px] text-[12px] leading-[1.65] text-[#d0c7c2] before:absolute before:left-0 before:top-[0.68em] before:h-px before:w-[6px] before:bg-[#ef463e] before:content-['']"
                              key={
                                experience.id +
                                "-achievement-" +
                                achievementIndex
                              }
                            >
                              {achievement}
                            </li>
                          ),
                        )}
                      </ul>
                    )}
                    {experience.tech.length > 0 && (
                      <div
                        className="mt-[17px] flex flex-wrap gap-[7px]"
                        aria-label="Technologies"
                      >
                        {experience.tech.map((technology) => (
                          <span
                            className="rounded-full border border-white/10 px-[9px] py-[5px] text-[9px] font-semibold text-[#938783]"
                            key={technology}
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="border-y border-white/10 py-6 text-[14px] text-[#938783]">
              No experience entries have been published yet.
            </p>
          )}
        </div>
      </section>

      <section
        className={
          "relative mx-auto flex min-h-[245px] items-center justify-between gap-[30px] border-t border-white/10 py-12 max-[760px]:min-h-[250px] max-[760px]:items-start max-[760px]:flex-col max-[760px]:justify-center " +
          wrap
        }
        aria-label="Contact Tanmay"
      >
        <span
          className="absolute left-0 top-[-1px] h-px w-[min(16vw,180px)] bg-[#ef463e] shadow-[0_0_18px_rgba(239,70,62,0.28)]"
          aria-hidden="true"
        />
        <h2 className="m-0 max-w-[680px] font-[var(--font-display)] text-[clamp(2.3rem,5vw,5rem)] font-bold leading-[0.98] tracking-[-0.075em]">
          Good work starts with a conversation.
        </h2>
        <Link
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2.5 rounded-full border border-white/30 bg-[#ef463e] px-[19px] text-[11px] font-extrabold text-[#fffaf7] no-underline shadow-[0_8px_24px_rgba(239,70,62,0.28)] transition-transform duration-200 hover:-translate-y-[3px] hover:bg-[#ff6558] motion-reduce:transition-none motion-reduce:hover:transform-none"
          href="/contact"
        >
          Let’s talk <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <AboutMotion />
      <MotionLayer />
    </div>
  );
}
