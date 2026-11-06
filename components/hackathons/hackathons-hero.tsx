import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
import { hackathonMoments } from "@/data/hackathon-moments";
import HackathonsImage from "./hackathons-image";

function Spark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M50 3v94M3 50h94M17 17l66 66M17 83l66-66"
        stroke="currentColor"
        strokeWidth="10"
      />
    </svg>
  );
}

export default function HackathonsHero({
  name,
  location,
  hasMentors,
  hasJudges,
}: {
  name: string;
  location?: string;
  hasMentors: boolean;
  hasJudges: boolean;
}) {
  const journeyHref = hasMentors ? "#hk-journey" : "#hk-archive";

  return (
    <section
      id="hk-top"
      className="hk-hero hk-screen hh-hero"
      aria-labelledby="hk-title"
    >
      <div className="hh-atmosphere" aria-hidden="true">
        <div className="hh-grid" />
        <span className="hh-background-word">HACK</span>
      </div>
      <div className="hk-container hh-inner">
        <div className="hh-topline">
          <span className="hh-kicker">
            <i aria-hidden="true" />
            The hackathon journal
          </span>
          <span className="hh-location">
            <MapPin size={13} aria-hidden="true" />
            {location || "New Delhi, India"}
          </span>
          <span className="hh-edition">People / Ideas / Possibility</span>
        </div>

        <div className="hh-layout">
          <div className="hh-copy">
            <p className="hh-overline">
              <span aria-hidden="true">↳</span> A little chaos. A lot of
              possibility.
            </p>
            <h1 className="hh-title" id="hk-title">
              <span className="hh-title-first">Ideas</span>{" "}
              <span className="hh-title-outline">in the</span>{" "}
              <span className="hh-title-last">
                making<span className="hh-title-stop">.</span>
                <Spark />
              </span>
            </h1>
            <div className="hh-copy-bottom">
              <p className="hh-lede">
                Building things. Sharing perspectives. Finding my people.
                <span> This is my life at hackathons.</span>
              </p>
              <a href={journeyHref} className="hh-explore" data-hk-link>
                <span>Explore the journey</span>
                <span className="hh-action-icon">
                  <ArrowDown size={19} data-hk-arrow aria-hidden="true" />
                </span>
              </a>
            </div>
          </div>

          <div className="hk-hero-visual hh-visual">
            <div className="hh-visual-ring hh-ring-outer" aria-hidden="true" />
            <div className="hh-visual-ring hh-ring-inner" aria-hidden="true" />
            <svg
              className="hh-orbit-path"
              viewBox="0 0 600 600"
              fill="none"
              aria-hidden="true"
            >
              <ellipse
                cx="300"
                cy="300"
                rx="294"
                ry="125"
                transform="rotate(-35 300 300)"
              />
            </svg>
            <div className="hh-photo-label">
              <span aria-hidden="true">●</span> In the room. In our element.
            </div>
            <div className="hk-hero-photo" data-hk-parallax>
              <div className="hk-parallax-inner" data-hk-parallax-inner>
                <HackathonsImage
                  src={hackathonMoments[1].src}
                  alt={hackathonMoments[1].alt}
                  priority
                  sizes="(max-width: 767px) 52vw, 40vw"
                />
              </div>
            </div>
            <div className="hh-sticker">
              <Spark />
              <span>
                Good people.
                <br />
                <strong>Great energy.</strong>
              </span>
            </div>
            <div className="hk-hero-small">
              <HackathonsImage
                src={hackathonMoments[4].src}
                alt={hackathonMoments[4].alt}
                sizes="(max-width: 767px) 18vw, 14vw"
              />
            </div>
            <span className="hh-photo-tag">
              Less solo.
              <br />
              <strong>More together.</strong>
            </span>
            <span className="hh-visual-caption">
              REAL MOMENTS. SHARED POSSIBILITIES.
            </span>
            <Spark className="hh-visual-spark" />
          </div>
        </div>

        <div className="hh-bottom">
          <span className="hh-signoff">
            <Spark />
            <span>
              Field notes by<strong>{name}</strong>
            </span>
          </span>
          <nav className="hh-chapters" aria-label="Hackathon chapters">
            {hasMentors && (
              <a href="#hk-journey">
                <span>01</span>Mentoring
                <ArrowUpRight aria-hidden="true" />
              </a>
            )}
            {hasJudges && (
              <a href="#hk-judging">
                <span>02</span>Judging
                <ArrowUpRight aria-hidden="true" />
              </a>
            )}
            <a href="#hk-archive">
              <span>03</span>Event journal
              <ArrowUpRight aria-hidden="true" />
            </a>
          </nav>
          <a
            href={journeyHref}
            className="hh-scroll"
            aria-label="Scroll to the hackathon journey"
            data-hk-link
          >
            <ArrowDown size={20} data-hk-arrow aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
