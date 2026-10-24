import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { published, repos } from "@/lib/db";
import { resolveAboutPopOut } from "@/lib/about-gallery";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { hackathonMoments } from "@/data/hackathon-moments";
import RadialPopOut from "@/components/about/radial-pop-out";
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

  return (
    <div className="relative isolate overflow-clip bg-[#090708] bg-[linear-gradient(rgba(255,250,247,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,250,247,0.012)_1px,transparent_1px),radial-gradient(ellipse_at_80%_3%,rgba(239,70,62,0.1),transparent_38rem)] bg-size-[72px_72px,72px_72px,auto] text-[#fffaf7]">
      <section
        className={
          "relative isolate mx-auto grid min-h-[min(860px,100svh)] grid-cols-[minmax(0,1.02fr)_minmax(400px,0.98fr)] items-center gap-[clamp(12px,2vw,36px)] px-0 pb-[clamp(64px,10vh,120px)] pt-[clamp(132px,16vh,190px)] before:absolute before:right-[-6%] before:-z-10 before:top-[10%] before:aspect-square before:w-[min(55vw,720px)] before:rounded-full before:border before:border-white/[0.035] before:bg-[radial-gradient(circle,rgba(239,70,62,0.08),transparent_68%)] before:content-[''] max-[1000px]:min-h-0 max-[1000px]:grid-cols-[minmax(0,0.95fr)_minmax(330px,1.05fr)] max-[760px]:grid-cols-1 max-[760px]:gap-5.5 max-[760px]:pb-9 max-[760px]:pt-33 " +
          wrap
        }
        aria-labelledby="about-title"
      >
        <div className="relative z-2">
          <p className="mb-6.75 flex items-center gap-2.75 text-[10px] font-bold uppercase leading-[1.4] tracking-[0.2em] text-[#938783] max-[420px]:text-[8px] max-[420px]:tracking-[0.16em]">
            <span
              className="h-1.75 w-1.75 shrink-0 rounded-full bg-[#ef463e] shadow-[0_0_18px_rgba(239,70,62,0.28)]"
              aria-hidden="true"
            />
            {role}
            <span
              className="mx-0.75 h-3.75 w-px bg-[#ef463e]/55"
              aria-hidden="true"
            />
            {location}
          </p>

          <h1
            id="about-title"
            className="mb-0 ml-[-0.07em] font-[var(--font-display)] text-[clamp(4.6rem,9.2vw,8.7rem)] font-black uppercase leading-[0.79] tracking-[-0.095em] text-nowrap max-[760px]:text-[clamp(3.4rem,13vw,6.3rem)] max-[420px]:text-[clamp(3.15rem,14.4vw,3.75rem)]"
          >
            <span
              className="block w-fit max-w-full overflow-hidden px-[0.12em] pb-[0.12em] pl-[0.07em]"
              data-about-hero-line
            >
              {firstName}
            </span>
            <span
              className="block w-fit max-w-full overflow-hidden px-[0.12em] pb-[0.12em] pl-[0.07em] text-[#ffd2c4] [text-shadow:0_0_44px_rgba(239,70,62,0.13)]"
              data-about-hero-line
            >
              {familyName}.
            </span>
          </h1>

          <p
            className="mt-[29px] max-w-[520px] text-[clamp(15px,1.25vw,18px)] leading-[1.72] text-white/80 max-[760px]:mt-[22px] max-[760px]:text-[15px]"
            data-about-intro
          >
            I care about the whole product experience: sturdy engineering,
            thoughtful interfaces, and the details that make software feel
            right.
          </p>
          <p
            className="mt-[26px] flex max-w-[480px] items-center gap-3 text-[11px] font-semibold uppercase leading-[1.6] tracking-[0.08em] text-[#ffd2c4] max-[760px]:mt-[18px] max-[760px]:text-[9px] max-[420px]:items-start"
            data-about-intro
          >
            <span
              className="h-px w-[34px] shrink-0 bg-[#ef463e]"
              aria-hidden="true"
            />
            {location}
            <span aria-hidden="true">·</span>
            <Link
              className="inline-flex items-center gap-1 underline decoration-[#ffd2c4]/40 underline-offset-4 transition-colors hover:text-white hover:decoration-current"
              href="/hackshastra"
            >
              Co-founder, HackShastra{" "}
              <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </p>

          <div
            className="mt-[26px] flex items-center gap-[17px] max-[420px]:gap-[11px]"
            data-about-intro
          >
            <Link
              className="inline-flex min-h-11 items-center gap-[13px] rounded-full border border-white/20 bg-[#ef463e] px-[17px] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#fffaf7] no-underline shadow-[0_8px_26px_rgba(239,70,62,0.2)] transition duration-300 hover:-translate-y-[3px] hover:bg-[#ff6558] hover:shadow-[0_12px_32px_rgba(239,70,62,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:transform-none"
              href="#experience"
            >
              The journey <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#938783] max-[420px]:text-[8px]">
              <i
                className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#ff6558] shadow-[0_0_14px_rgba(239,70,62,0.28)] motion-reduce:animate-none"
                aria-hidden="true"
              />
              Scroll-led story
            </span>
          </div>

          {highlights.length > 0 && (
            <div
              className="mt-[clamp(27px,3vw,42px)] grid max-w-[540px] grid-cols-3 gap-4 border-t border-white/15 pt-[15px]"
              role="group"
              aria-label="Portfolio highlights"
            >
              {highlights.map((highlight, index) => (
                <div
                  className="relative grid min-w-0 gap-[5px]"
                  data-about-stat
                  key={highlight.label}
                >
                  <strong className="font-[var(--font-display)] text-[clamp(25px,3vw,37px)] font-extrabold leading-[0.95] tracking-[-0.08em] text-[#fffaf7]">
                    {highlight.value}
                    <sup className="ml-0.5 align-top text-[0.52em] text-[#ff6558]">
                      +
                    </sup>
                  </strong>
                  <span className="text-[8px] font-bold uppercase leading-[1.4] tracking-[0.12em] text-[#938783] max-[420px]:text-[7px] max-[420px]:tracking-[0.08em]">
                    {highlight.label}
                  </span>
                  {index < highlights.length - 1 && (
                    <i
                      className="absolute right-0 top-[3px] h-[35px] w-px bg-white/10"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="relative grid min-h-[clamp(560px,48vw,690px)] min-w-0 -translate-y-[clamp(14px,3.5vw,42px)] place-items-center max-[1000px]:min-h-[470px] max-[760px]:mx-auto max-[760px]:min-h-[clamp(390px,105vw,490px)] max-[760px]:w-full max-[760px]:max-w-[440px] max-[760px]:-translate-y-[clamp(10px,3vw,18px)] before:absolute before:left-[4%] before:top-[4%] before:z-0 before:aspect-square before:w-[92%] before:animate-spin before:rounded-full before:border before:border-white/[0.055] before:border-t-[#ff6558]/40 before:shadow-[0_0_0_22px_rgba(255,250,247,0.012)] before:content-[''] motion-reduce:before:animate-none"
          data-about-visual
        >
          <p
            className="absolute right-0 top-[4%] z-[3] text-right text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 max-[760px]:right-[2%] max-[760px]:top-[7%]"
            aria-hidden="true"
          >
            <span className="mb-2 mt-0 block font-[var(--font-display)] text-[15px] tracking-[0.06em] text-[#fffaf7]">
              01 / {String(gallery.images.length).padStart(2, "0")}
            </span>
            A life in motion
            <span className="mt-[5px] block text-[#ef463e]">
              People · Projects · Possibility
            </span>
          </p>
          <RadialPopOut gallery={gallery} />
          <span
            className="absolute bottom-[4%] left-[1%] text-[8px] font-bold uppercase tracking-[0.16em] text-white/50"
            aria-hidden="true"
          >
            New Delhi / India
          </span>
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
