import Image from "next/image";
import { ArrowDown, ArrowUpRight, Asterisk, MoveUpRight } from "lucide-react";
import { hackshastra } from "@/data/hackshastra";
import HackShastraMotion from "./hackshastra-motion";
import BrandImage from "./brand-image";
import BrandLink from "./brand-link";
import EventArchive, { type HackShastraEvent } from "./event-archive";
import FoundersLineup from "./founders-lineup";
import HackShastraFooter from "./hackshastra-footer";

function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <p className="hs-section-label hs-mono flex items-center gap-4">
      <span className="text-[var(--hs-red)]">{number}</span>
      <span className="h-px w-8 bg-current opacity-35" aria-hidden="true" />
      {children}
    </p>
  );
}

export default function HackShastraExperience({
  events,
}: {
  events: HackShastraEvent[];
}) {
  return (
    <HackShastraMotion className="hs-page relative isolate min-w-0 bg-[var(--hs-ink)] text-[var(--hs-paper)]">
      <section className="hs-hero hs-shell relative" aria-labelledby="hs-title">
        <div
          className="hs-hero-kicker flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hs-line)]"
          data-hackshastra-intro
        >
          <p className="hs-mono flex items-center gap-3">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--hs-red)]"
              aria-hidden="true"
            />{" "}
            Independent minds. Collective energy.
          </p>
          <span className="hs-mono text-[var(--hs-dim)]">
            India / Since 2024
          </span>
        </div>

        <div className="hs-hero-grid grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="hs-hero-copy relative z-10 min-w-0">
            <div
              className="hs-hero-brand flex items-center gap-4"
              data-hackshastra-intro
            >
              <Image
                src={hackshastra.logo}
                alt="HackShastra official symbol"
                width={78}
                height={78}
                unoptimized
                className="hs-brand-symbol h-16 w-16 shrink-0 object-contain sm:h-[78px] sm:w-[78px]"
              />
              <div>
                <p className="hs-brand-name">HackShastra</p>
                <p className="hs-mono mt-1 text-[var(--hs-dim)]">
                  A creator-led tech community
                </p>
              </div>
            </div>
            <h1 id="hs-title" className="hs-hero-title" data-hackshastra-intro>
              <span className="block">Big ideas.</span>
              <span className="block">Built</span>
              <span className="block text-[var(--hs-red)]">together.</span>
            </h1>
            <p
              className="hs-hero-lede text-[var(--hs-dim)]"
              data-hackshastra-intro
            >
              A student community turning curiosity into things that work.
              Through hackathons, campus chapters and the people you meet along
              the way.
            </p>
            <div
              className="hs-hero-actions flex flex-wrap items-center gap-x-7 gap-y-3"
              data-hackshastra-intro
            >
              <BrandLink
                href={hackshastra.website}
                className="hs-primary px-6 py-3 text-sm font-medium"
              >
                Enter HackShastra
              </BrandLink>
              <a
                href="#hs-story"
                className="hs-text-link inline-flex min-h-12 items-center gap-3 text-sm"
                data-hackshastra-link
              >
                Discover the story{" "}
                <ArrowDown
                  size={17}
                  aria-hidden="true"
                  data-hackshastra-arrow
                />
              </a>
            </div>
          </div>

          <div
            className="hs-hero-visual relative min-w-0"
            data-hackshastra-intro
          >
            <div className="hs-photo-coordinate hs-mono absolute -top-7 left-0 text-[var(--hs-dim)]">
              Field notes / The builder collective
            </div>
            <figure
              className="hs-hero-photo relative overflow-hidden"
              data-hackshastra-parallax
            >
              <div
                className="absolute -inset-y-[8%] inset-x-0"
                data-hackshastra-parallax-inner
              >
                <BrandImage
                  src={hackshastra.arena}
                  alt="HackShastra builders gathered for a community event"
                  sizes="(max-width: 767px) 92vw, (min-width: 1600px) 650px, 44vw"
                  priority
                />
              </div>
              <figcaption className="hs-photo-caption absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 sm:p-8">
                <span className="hs-mono relative z-10 max-w-40 leading-relaxed">
                  Made of people.
                  <br />
                  Powered by possibility.
                </span>
                <MoveUpRight
                  size={38}
                  strokeWidth={1}
                  aria-hidden="true"
                  className="relative z-10"
                />
              </figcaption>
            </figure>
            <div className="hs-photo-note absolute -right-3 bottom-[-20px] max-w-44 bg-[var(--hs-red)] px-5 py-4 sm:-right-5 sm:bottom-[-24px] sm:max-w-48">
              <p className="hs-mono text-[var(--hs-ink)]">The best part?</p>
              <p className="mt-1 text-xl leading-tight font-semibold tracking-[-0.05em] text-[var(--hs-ink)]">
                You don’t have to
                <br />
                build alone.
              </p>
            </div>
          </div>
        </div>
        <nav
          aria-label="HackShastra page sections"
          className="hs-index hs-mono flex flex-wrap justify-between gap-x-5 gap-y-1 border-t border-[var(--hs-line)] py-3"
        >
          <a
            href="#hs-story"
            className="inline-flex min-h-11 items-center gap-3"
          >
            <span>01</span> The idea
          </a>
          <a
            href="#hs-practice"
            className="inline-flex min-h-11 items-center gap-3"
          >
            <span>02</span> In practice
          </a>
          <a
            href="#hs-events"
            className="inline-flex min-h-11 items-center gap-3"
          >
            <span>03</span> The gatherings
          </a>
          <a
            href="#hs-people"
            className="inline-flex min-h-11 items-center gap-3"
          >
            <span>04</span> Our people
          </a>
          <a
            href="#hs-connect"
            className="inline-flex min-h-11 items-center gap-3"
          >
            <span>05</span> Your next step{" "}
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </section>

      <section
        id="hs-story"
        className="hs-story hs-section"
        aria-labelledby="hs-story-title"
      >
        <div className="hs-shell">
          <SectionLabel number="01">
            An idea worth gathering around
          </SectionLabel>
          <div className="hs-story-grid grid gap-8 lg:grid-cols-[1.65fr_0.8fr] lg:gap-16">
            <h2 id="hs-story-title" className="hs-statement">
              <span className="block" data-hackshastra-line>
                What if learning
              </span>
              <span className="block" data-hackshastra-line>
                didn’t stop at
              </span>
              <span className="block hs-outline" data-hackshastra-line>
                knowing?
              </span>
            </h2>
            <div className="flex flex-col justify-end">
              <Asterisk
                size={54}
                strokeWidth={1.25}
                aria-hidden="true"
                className="hs-story-asterisk text-[var(--hs-red)]"
              />
              <p className="text-lg leading-[1.7] font-medium">
                HackShastra exists in the space between what you learn and what
                you make.
              </p>
              <p className="mt-5 text-sm leading-[1.85] text-[var(--hs-dim)]">
                It began in November 2024 with a question: why aren’t we
                building more? That question grew into a student collective
                connecting academic learning with hands-on engineering.
              </p>
              <BrandLink
                href={hackshastra.about}
                className="mt-6 w-fit border-b border-current text-sm"
              >
                Read the origin story
              </BrandLink>
            </div>
          </div>
          <div className="hs-story-bottom mt-14 grid gap-7 border-t border-current/20 pt-7 md:mt-20 md:grid-cols-3 md:gap-12">
            <p className="hs-mono">
              A question in a college dorm.
              <br />A community across campuses.
            </p>
            <p className="text-sm leading-[1.8] text-[var(--hs-dim)]">
              A first meetup in July 2025. A national hackathon that September.
              College chapters from October. The idea kept finding new people.
            </p>
            <p className="text-xl leading-snug font-semibold tracking-[-0.045em]">
              Curiosity starts it.
              <br />
              Community carries it.
            </p>
          </div>
        </div>
      </section>

      <section
        id="hs-practice"
        className="hs-practice hs-section hs-shell"
        aria-labelledby="hs-practice-title"
      >
        <SectionLabel number="02">The idea, in practice</SectionLabel>
        <div className="hs-section-heading flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 id="hs-practice-title" className="hs-heading">
            <span className="block" data-hackshastra-line>
              Less someday.
            </span>
            <span className="block text-[var(--hs-red)]" data-hackshastra-line>
              More let’s build.
            </span>
          </h2>
          <p className="max-w-xs text-sm leading-[1.85] text-[var(--hs-dim)]">
            Different ways in. The same hands-on spirit. Spaces where students
            can put their ideas to work.
          </p>
        </div>
        {[
          [
            "01",
            "Gather. Make. Repeat.",
            "Hackathons & technical events",
            "From a first meetup to national hackathons and a technology expo, the community creates occasions to turn ideas into working projects.",
          ],
          [
            "02",
            "A little guidance. A big leap.",
            "Mentorship & evaluation",
            "Grand Hack IPEC paired an online mentorship phase with an in-person hackathon, bringing guidance and expert feedback into the building process.",
          ],
          [
            "03",
            "Bring it to your campus.",
            "Student chapters",
            "Campus chapters carry the community locally. IPEC and SRM–AP chapters have hosted their own gatherings, giving students a place to start.",
          ],
        ].map(([number, title, label, copy]) => (
          <article
            className="hs-practice-row relative grid gap-4 py-8 sm:py-10 md:grid-cols-[0.12fr_1fr_0.75fr] md:gap-10"
            key={number}
          >
            <span
              className="hs-rule absolute inset-x-0 top-0 h-px bg-[var(--hs-line)]"
              data-hackshastra-rule
              aria-hidden="true"
            />
            <span className="hs-mono text-[var(--hs-red)]">{number}</span>
            <div>
              <p className="hs-mono mb-3 text-[var(--hs-dim)]">{label}</p>
              <h3 className="text-[clamp(1.65rem,3vw,2.6rem)] leading-[1.18] font-medium tracking-[-0.05em]">
                {title}
              </h3>
            </div>
            <p className="max-w-lg text-sm leading-[1.85] text-[var(--hs-dim)] md:pt-7">
              {copy}
            </p>
          </article>
        ))}
      </section>

      <section
        id="hs-events"
        className="hs-events hs-section"
        aria-labelledby="hs-events-title"
      >
        <div className="hs-shell">
          <SectionLabel number="03">Real rooms. Real builds.</SectionLabel>
          <div className="hs-section-heading flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 id="hs-events-title" className="hs-heading">
              <span className="block" data-hackshastra-line>
                It starts with
              </span>
              <span
                className="block text-[var(--hs-red)]"
                data-hackshastra-line
              >
                showing up.
              </span>
            </h2>
            <p className="hs-mono max-w-52 leading-loose text-[var(--hs-dim)]">
              Community gatherings
              <br />
              From the event archive
              <br />
              Meetups / Hackathons / Campus events
            </p>
          </div>
          <EventArchive events={events} />
        </div>
      </section>

      <section
        id="hs-people"
        className="hs-people hs-section hs-shell"
        aria-labelledby="hs-people-title"
      >
        <SectionLabel number="04">The people are the point</SectionLabel>
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.75fr] lg:items-end lg:gap-20">
          <h2 id="hs-people-title" className="hs-heading">
            <span className="block" data-hackshastra-line>
              Come for the build.
            </span>
            <span className="block" data-hackshastra-line>
              Stay for <span className="text-[var(--hs-red)]">the people.</span>
            </span>
          </h2>
          <p className="text-sm leading-[1.85] text-[var(--hs-dim)]">
            For students, developers and curious first-timers. A community
            becomes something bigger when people share the work, the questions
            and the small breakthroughs.
          </p>
        </div>
        <div className="hs-gallery grid grid-cols-12 gap-4 sm:gap-5">
          <figure className="hs-gallery-main col-span-12 sm:col-span-8">
            <div
              className="hs-gallery-primary relative overflow-hidden"
              data-hackshastra-image
            >
              <BrandImage
                src={hackshastra.celebration}
                alt="HackShastra community members celebrating together on stage"
                sizes="(max-width: 639px) 92vw, (min-width: 1600px) 960px, 62vw"
              />
            </div>
            <figcaption className="hs-mono mt-4 flex justify-between gap-4 text-[var(--hs-dim)]">
              <span>A shared moment.</span>
              <span>HackShastra / Community</span>
            </figcaption>
          </figure>
          <div className="hs-gallery-side col-span-12 grid grid-cols-2 gap-4 sm:col-span-4 sm:grid-cols-1">
            {hackshastra.moments.map((moment, index) => (
              <figure key={moment.src}>
                <div
                  className="hs-gallery-secondary relative overflow-hidden"
                  data-hackshastra-image
                >
                  <BrandImage
                    src={moment.src}
                    alt={moment.alt}
                    sizes="(max-width: 639px) 44vw, (min-width: 1600px) 460px, 30vw"
                  />
                </div>
                <figcaption className="hs-mono mt-3 text-[var(--hs-dim)]">
                  Field note / 0{index + 1}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section
        id="hs-founders"
        className="hs-founders hs-section border-t border-[var(--hs-line)]"
        aria-labelledby="hs-founders-title"
      >
        <div className="hs-shell">
          <FoundersLineup />
        </div>
      </section>

      <HackShastraFooter />
    </HackShastraMotion>
  );
}
