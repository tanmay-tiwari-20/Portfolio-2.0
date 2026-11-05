import { ArrowDown, ArrowUpRight } from "lucide-react";
import { hackathonMoments } from "@/data/hackathon-moments";
import HackathonsImage from "./hackathons-image";

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
  return (
    <section
      id="hk-top"
      className="hk-hero hk-screen hh-hero"
      aria-labelledby="hk-title"
    >
      <div className="hh-atmosphere" aria-hidden="true">
        <div className="hh-flow hh-flow-back" data-hk-hero-flow>
          <svg viewBox="0 0 1000 900" preserveAspectRatio="none">
            <path
              d="M1050 -90C565 -80 315 210 405 485C520 836 161 781 -160 1040L1050 1040Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="hh-flow hh-flow-middle" data-hk-hero-flow>
          <svg viewBox="0 0 1000 900" preserveAspectRatio="none">
            <path
              d="M1120 -50C695 60 400 271 531 528C694 848 300 871 10 1030L1120 1030Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="hh-flow hh-flow-front" data-hk-hero-flow>
          <svg viewBox="0 0 1000 900" preserveAspectRatio="none">
            <path
              d="M1100 150C841 213 620 379 686 580C754 794 494 849 235 1000L1100 1000Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
      <div className="hk-container hh-inner">
        <div className="hh-topline" data-hk-intro>
          <span className="hh-kicker">
            <i aria-hidden="true" />
            Hackathons / In good company
          </span>
          <span className="hh-location">{location || "New Delhi, India"}</span>
        </div>

        <div className="hh-layout">
          <div className="hh-copy">
            <p className="hh-overline" data-hk-intro>
              A little curiosity. A shared spark.
            </p>
            <h1 className="hh-title" id="hk-title">
              <span data-hk-intro>Where ideas</span>
              <span data-hk-intro>
                come <em>alive.</em>
              </span>
            </h1>
            <p className="hh-lede" data-hk-intro>
              The ideas, conversations, and people that keep me coming back to
              hackathons.
            </p>
            <div className="hh-actions" data-hk-intro>
              <a
                href={hasMentors ? "#hk-journey" : "#hk-archive"}
                className="hh-explore"
                data-hk-link
              >
                <span>Explore the journey</span>
                <span className="hh-action-icon">
                  <ArrowDown size={18} data-hk-arrow aria-hidden="true" />
                </span>
              </a>
              <a href="#hk-archive" className="hh-journal-link" data-hk-link>
                Inside the journal{" "}
                <ArrowUpRight size={17} data-hk-arrow aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="hk-hero-visual hh-visual" data-hk-intro>
            <div className="hh-photo-outline" aria-hidden="true" />
            <div className="hk-hero-photo" data-hk-parallax>
              <div className="hk-parallax-inner" data-hk-parallax-inner>
                <HackathonsImage
                  src={hackathonMoments[1].src}
                  alt={hackathonMoments[1].alt}
                  priority
                  sizes="(max-width: 767px) 88vw, (max-width: 1023px) 46vw, 43vw"
                />
              </div>
              <span className="hh-photo-caption">
                Different minds.
                <br />
                Something new.
              </span>
            </div>
            <div className="hk-hero-small">
              <HackathonsImage
                src={hackathonMoments[4].src}
                alt={hackathonMoments[4].alt}
                sizes="(max-width: 767px) 35vw, 19vw"
              />
            </div>
            <div className="hh-photo-note" aria-hidden="true">
              <span className="hh-note-line" />
              Good things start
              <br />
              with a conversation.
            </div>
          </div>
        </div>

        <div className="hh-bottom" data-hk-intro>
          <span className="hh-signoff">
            A personal field journal<span>by {name}</span>
          </span>
          <nav className="hh-chapters" aria-label="Hackathon chapters">
            {hasMentors && (
              <a href="#hk-journey">
                <span>01</span>Mentoring
              </a>
            )}
            {hasJudges && (
              <a href="#hk-judging">
                <span>02</span>Judging
              </a>
            )}
            <a href="#hk-archive">
              <span>03</span>Event journal
            </a>
          </nav>
          <a
            href={hasMentors ? "#hk-journey" : "#hk-archive"}
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
