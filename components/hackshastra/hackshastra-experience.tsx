import HackShastraHero from "./hackshastra-hero";
import { Asterisk } from "lucide-react";
import { hackshastra } from "@/data/hackshastra";
import HackShastraMotion from "./hackshastra-motion";
import BrandImage from "./brand-image";
import BrandLink from "./brand-link";
import EventArchive, { type HackShastraEvent } from "./event-archive";
import FoundersLineup from "./founders-lineup";
import HackShastraFooter from "./hackshastra-footer";
import PracticeExplorer from "./practice-explorer";

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
      <HackShastraHero />

      <section
        id="hs-story"
        className="hs-story hs-section"
        aria-labelledby="hs-story-title"
      >
        <div className="hs-shell">
          <div className="hs-story-header">
            <SectionLabel number="01">
              An idea worth gathering around
            </SectionLabel>
            <p className="hs-mono hs-story-edition">
              Field notes / Our beginning
            </p>
          </div>
          <div className="hs-story-grid">
            <div className="hs-story-copy">
              <h2 id="hs-story-title" className="hs-statement">
                <span className="block" data-hackshastra-line>
                  What if learning{" "}
                </span>
                <span className="block" data-hackshastra-line>
                  didn’t stop at{" "}
                </span>
                <span className="hs-story-question" data-hackshastra-line>
                  <span className="hs-outline">knowing?</span>
                  <svg
                    className="hs-story-underline"
                    viewBox="0 0 390 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M5 15C97 2 245 2 382 10M55 22C146 10 265 10 337 15" />
                  </svg>
                </span>
              </h2>
              <p className="hs-story-lede">
                HackShastra exists in the space between what you learn and what
                you make.
              </p>
              <p className="hs-story-origin">
                One question in November 2024 became a student collective. A
                place to find your people, get your hands dirty, and turn what
                you know into something real.
              </p>
              <BrandLink
                href={hackshastra.about}
                className="hs-story-link w-fit border-b border-current text-sm"
              >
                Read the origin story
              </BrandLink>
            </div>

            <div className="hs-story-board">
              <div className="hs-story-board-grid" aria-hidden="true" />
              <p className="hs-story-handnote">
                Good things start with people.
              </p>
              <svg
                className="hs-story-sketch"
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden="true"
              >
                <path d="M76 8C24 0 7 41 30 59C52 76 88 48 68 34C49 22 26 51 34 87M21 77L34 89L43 73" />
              </svg>
              <figure className="hs-story-photo hs-story-photo-main">
                <div className="hs-story-photo-image" data-hackshastra-image>
                  <BrandImage
                    src={hackshastra.moments[0].src}
                    alt={hackshastra.moments[0].alt}
                    sizes="(max-width: 767px) 70vw, (min-width: 1600px) 460px, 32vw"
                  />
                </div>
              </figure>
              <figure className="hs-story-photo hs-story-photo-small">
                <div className="hs-story-photo-image" data-hackshastra-image>
                  <BrandImage
                    src={hackshastra.moments[1].src}
                    alt={hackshastra.moments[1].alt}
                    sizes="(max-width: 767px) 36vw, (min-width: 1600px) 240px, 17vw"
                  />
                </div>
                <figcaption className="hs-mono">Better, together.</figcaption>
              </figure>
              <div className="hs-story-note">
                <div className="hs-story-note-top">
                  <span className="hs-mono">The question / Nov ’24</span>
                  <Asterisk size={25} strokeWidth={1.4} aria-hidden="true" />
                </div>
                <p>
                  Why aren’t we
                  <br />
                  building more?
                </p>
                <span className="hs-story-note-bottom hs-mono">
                  And so, we started.
                </span>
              </div>
              <p className="hs-story-board-caption hs-mono">
                Small beginnings. Shared ambition.
              </p>
            </div>
          </div>

          <div className="hs-story-bottom">
            <div className="hs-story-timeline-heading">
              <p className="hs-mono">How a question became a community</p>
              <p>Curiosity starts it. Community carries it.</p>
            </div>
            <ol
              className="hs-story-timeline"
              aria-label="HackShastra beginnings"
            >
              {[
                [
                  "2024-11",
                  "Nov 2024",
                  "The first question",
                  "An idea worth building on.",
                ],
                [
                  "2025-07",
                  "Jul 2025",
                  "A room of possibilities",
                  "The first community meetup.",
                ],
                [
                  "2025-09",
                  "Sep 2025",
                  "The first big build",
                  "Our first national hackathon.",
                ],
                [
                  "2025-10",
                  "Oct 2025",
                  "Beyond one campus",
                  "The start of student chapters.",
                ],
              ].map(([dateTime, date, title, description], index) => (
                <li key={dateTime}>
                  <div className="hs-story-milestone-marker" aria-hidden="true">
                    {index === 0 ? (
                      <Asterisk size={20} strokeWidth={1.5} />
                    ) : (
                      <span />
                    )}
                  </div>
                  <time className="hs-mono" dateTime={dateTime}>
                    {date}
                  </time>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ol>
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
              Less someday.{" "}
            </span>
            <span className="block text-[var(--hs-red)]" data-hackshastra-line>
              More let’s build.
            </span>
          </h2>
          <p className="max-w-xs text-sm leading-[1.85] text-[var(--hs-dim)]">
            Join a build. Find a fresh perspective. Bring your campus together.
            There’s more than one way to make a start.
          </p>
        </div>
        <PracticeExplorer />
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
                It starts with{" "}
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
              Come for the build.{" "}
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
