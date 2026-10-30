import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { published, repos } from "@/lib/db";
import { resolveAboutMoments, resolveAboutPopOut } from "@/lib/about-gallery";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { hackathonMoments } from "@/data/hackathon-moments";
import RadialPopOut from "@/components/about/radial-pop-out";
import AboutPracticeStory from "@/components/about/about-practice-story";
import AboutMotion from "@/components/about/about-motion";
import { MotionLayer } from "@/components/shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Tanmay Tiwari, a creative developer and community builder in New Delhi. Explore the ideas, people, and practice behind his work.",
};

const aboutWrap = "section-shell about-wrap";

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
  const location = profile?.location || "New Delhi, India";
  const biography =
    profile?.bio ||
    "I’m a creative developer who enjoys the full product experience: sturdy engineering, thoughtful visual details, and bringing people together to make useful things.";
  const biographyParts = biography.split(/(HackShastra)/i);
  const gallery = resolveAboutPopOut(settings?.aboutPopOut, profile?.avatar);
  const moments = resolveAboutMoments(settings?.aboutMoments);
  const featuredHackathons = hackathons.slice(0, 4);
  const builderCount =
    profile?.stats?.find((stat) => /builder|mentor/i.test(stat.label))?.value ??
    3000;

  return (
    <div className="about-page relative isolate overflow-hidden bg-[#090708] text-[#fffaf7]">
      <section className="hero about-hero" aria-labelledby="about-title">
        <div className="hero-grid about-hero-grid">
          <div className="about-hero-copy">
            <p className="about-hero-kicker" data-about-kicker>
              <span className="about-hero-kicker-mark" aria-hidden="true" />
              <span>ABOUT / TANMAY TIWARI</span>
              <span className="about-hero-kicker-index">01 — 03</span>
            </p>

            <h1 id="about-title" className="about-editorial-title">
              Care is part
              <span>of the <em>craft.</em></span>
            </h1>

            <p className="about-hero-manifesto" data-about-intro>
              The best part of building is seeing someone else take the idea further.
            </p>

            <div className="about-bio-wrap" data-about-intro>
              <p className="about-hero-bio">
                {biographyParts.map((part, index) =>
                  part.toLowerCase() === "hackshastra" ? (
                    <a
                      href="https://hackshastra.in"
                      target="_blank"
                      rel="noreferrer"
                      key={`${part}-${index}`}
                    >
                      {part}
                    </a>
                  ) : (
                    <span key={`${part}-${index}`}>{part}</span>
                  ),
                )}
              </p>
            </div>

            <div className="about-hero-byline" data-about-intro>
              <span className="about-hero-byline-index">A / 01</span>
              <span className="about-hero-byline-rule" aria-hidden="true" />
              <span>{name}</span>
              <span className="about-hero-byline-rule" aria-hidden="true" />
              <span>{location}</span>
            </div>

            <div className="about-hero-links" data-about-intro>
              <Link className="about-hero-link-primary" href="#the-person">
                How I work <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                className="about-hero-link-secondary"
                href="https://hackshastra.in"
                target="_blank"
                rel="noreferrer"
              >
                HackShastra <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="hero-art about-hero-art" data-about-visual>
            <div className="about-art-orbit about-art-orbit-outer" aria-hidden="true" />
            <div className="about-art-orbit about-art-orbit-inner" aria-hidden="true" />
            <RadialPopOut
              gallery={gallery}
              cardSize={285}
              heroSize={350}
              radius={250}
              jitter={3.5}
              stagger={0.018}
            />
            <div className="about-gallery-caption" aria-hidden="true">
              <span>PEOPLE, PLACES & PRACTICE</span>
              <span>Moments from the work</span>
            </div>
          </div>
        </div>

        <a className="hero-scroll-cue about-scroll-cue" href="#the-person">
          <span className="hero-scroll-line" aria-hidden="true" />
          Scroll to explore
        </a>
      </section>

      <section
        className="marquee-strip about-marquee"
        aria-label="Creative development, full-stack engineering, HackShastra, and community mentoring"
      >
        <div className="marquee-inner" aria-hidden="true">
          {[0, 1].map((copy) => (
            <span className="about-marquee-set" key={copy}>
              {[
                "Creative Development",
                "Full-Stack Engineering",
                "Product Craft",
                "Hackathon Mentoring",
                "Community Building",
                "HackShastra",
              ].map((phrase) => (
                <span className="marquee-item" key={phrase}>
                  {phrase}<span className="marquee-dot" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </section>

      <AboutPracticeStory
        builders={builderCount}
        communityImage={{
          src: moments[0].url,
          alt: moments[0].alt,
          width: hackathonMoments[0].width,
          height: hackathonMoments[0].height,
        }}
      />

      <section id="community" className="about-community" aria-labelledby="community-title">
        <div className={aboutWrap + " about-community-grid"}>
          <div className="about-community-story">
            <div className="about-section-label" data-about-reveal>
              <span>02</span><i aria-hidden="true" /><span>Building together</span>
            </div>
            <h2 id="community-title" className="about-display about-community-title" data-about-heading>
              Good ideas need a room to <em>grow.</em>
            </h2>
            <p className="about-community-lede" data-about-reveal>
              At HackShastra, the work extends past the screen. I help shape the
              tools and events that bring curious builders into the same room,
              then give them a reason to keep building together.
            </p>

            <div className="about-moment-grid" aria-label="Moments from hackathons">
              {moments.map((moment, index) => (
                <figure className={`about-moment-card about-moment-card-${index + 1}`} data-about-image key={moment.id}>
                  <Image
                    src={getOptimizedUrl(moment.url, index === 0 ? 1000 : 700, index === 0 ? 1200 : 700)}
                    alt={moment.alt}
                    width={hackathonMoments[index].width}
                    height={hackathonMoments[index].height}
                    sizes={index === 0 ? "(max-width: 760px) 78vw, 560px" : "(max-width: 760px) 48vw, 340px"}
                    unoptimized
                    className="about-moment-image"
                  />
                  <figcaption>
                    <span>{moment.title}</span>
                    <small>{moment.caption}</small>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <aside className="about-community-archive" aria-label="Hackathon experience">
            <div className="about-archive-heading">
              <div>
                <p className="about-overline">From the community archive</p>
                <h3>Learning out loud.</h3>
              </div>
              <span>{String(featuredHackathons.length).padStart(2, "0")} STORIES</span>
            </div>

            {featuredHackathons.length > 0 ? (
              <div className="about-event-list">
                {featuredHackathons.map((event, index) => (
                  <article className="about-event-row" data-about-reveal key={event.id}>
                    <span className="about-event-date">{event.date || `0${index + 1}`}</span>
                    <div className="about-event-detail">
                      <h4>{event.name}</h4>
                      <p>{event.organizer}</p>
                    </div>
                    <span className="about-event-role">{event.role}</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="about-empty-note">New community stories will appear here as they are published.</p>
            )}

            <div className="about-archive-footer">
              <div className="about-builder-count">
                <strong>{builderCount.toLocaleString()}+</strong>
                <span>builders learning together</span>
              </div>
              <Link className="about-text-link" href="/hackathons">
                Explore the events <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link className="about-community-link" href="https://hackshastra.in" target="_blank" rel="noreferrer">
                Visit HackShastra <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section id="experience" className="about-section about-experience" aria-labelledby="experience-title">
        <div className={aboutWrap}>
          <div className="about-experience-head">
            <div>
              <div className="about-section-label" data-about-reveal>
                <span>03</span><i aria-hidden="true" /><span>Experience</span>
              </div>
              <h2 id="experience-title" className="about-display" data-about-heading>
                A path shaped by people and <em>products.</em>
              </h2>
            </div>
            <p data-about-reveal>
              Roles, collaborations, and the work that has shaped how I build.
            </p>
          </div>

          {experiences.length > 0 ? (
            <div className="about-timeline">
              <span className="about-timeline-thread" data-about-thread aria-hidden="true" />
              {experiences.map((experience, index) => (
                <article className="about-timeline-entry" data-about-experience key={experience.id}>
                  <div className="about-timeline-meta">
                    <span>{experience.period}</span>
                    <small>{experience.location}</small>
                    <i>{String(index + 1).padStart(2, "0")}</i>
                  </div>
                  <div className="about-timeline-card">
                    <div className="about-timeline-card-head">
                      <div>
                        <h3>{experience.role}</h3>
                        <span>{experience.company}</span>
                      </div>
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </div>
                    <p className="about-timeline-description">{experience.description}</p>
                    {experience.achievements.length > 0 && (
                      <ul className="about-achievements">
                        {experience.achievements.map((achievement, achievementIndex) => (
                          <li key={`${experience.id}-achievement-${achievementIndex}`}>{achievement}</li>
                        ))}
                      </ul>
                    )}
                    {experience.tech.length > 0 && (
                      <div className="about-tech-list" aria-label="Technologies">
                        {experience.tech.map((technology) => <span key={technology}>{technology}</span>)}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="about-empty-note">Experience details will appear here when they are published.</p>
          )}
        </div>
      </section>

      <section className={aboutWrap + " about-cta-section"} aria-labelledby="about-cta-title">
        <div className="about-cta-panel" data-about-reveal>
          <div className="about-cta-orbit" aria-hidden="true" />
          <div className="about-cta-copy">
            <p className="about-overline">Have a good problem to solve?</p>
            <h2 id="about-cta-title">Let’s make something <em>worthwhile.</em></h2>
            <p>I’m always glad to meet thoughtful people and hear what they’re working on.</p>
          </div>
          <Link className="button button-primary about-cta-button" href="/contact">
            Start a conversation <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <AboutMotion />
      <MotionLayer />
    </div>
  );
}
