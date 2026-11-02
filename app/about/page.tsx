import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { published, repos } from "@/lib/db";
import {
  resolveAboutMoments,
  resolveAboutPopOut,
  resolveAboutPracticeImage,
} from "@/lib/about-gallery";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { BUILDERS_MENTORED_COUNT } from "@/lib/profile-metrics";
import { hackathonMoments } from "@/data/hackathon-moments";
import RadialPopOut from "@/components/about/radial-pop-out";
import AboutPracticeStory from "@/components/about/about-practice-story";
import AboutMotion from "@/components/about/about-motion";
import SignatureReveal from "@/components/about/signature-reveal";
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
  const location = profile?.location || "New Delhi, India";
  const gallery = resolveAboutPopOut(settings?.aboutPopOut, profile?.avatar);
  const centerId =
    gallery.images.find((image) => image.id === gallery.centerId)?.id ??
    gallery.images[0]?.id;
  const signatureImageSources = gallery.images
    .filter((image) => image.id !== centerId)
    .slice(0, 6)
    .map((image) => getOptimizedUrl(image.url, 960));
  const moments = resolveAboutMoments(settings?.aboutMoments);
  const practiceImage = resolveAboutPracticeImage(settings?.aboutPracticeImage);
  const practiceImage2 = resolveAboutPracticeImage(settings?.aboutPracticeImage2);
  const featuredHackathons = hackathons.slice(0, 4);
  const builderCount = BUILDERS_MENTORED_COUNT;

  return (
    <div className="about-page relative isolate overflow-hidden bg-[#090708] text-[#fffaf7]">
      <section className="hero about-hero" aria-labelledby="about-title">
        <div className="hero-grid about-hero-grid">
          <div className="about-hero-copy min-w-0">
            <p
              className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[9px] leading-normal font-medium tracking-[0.14em] text-[var(--theme-paper)]/65 uppercase sm:mb-7 [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:mb-4 [@media(min-width:761px)_and_(max-height:600px)]:mb-3"
              data-about-kicker
            >
              <span className="h-px w-6 bg-[#edbd83]" aria-hidden="true" />
              <span>Tanmay Tiwari</span>
              <span className="text-[#edbd83]/50" aria-hidden="true">
                /
              </span>
              <span>{location}</span>
            </p>

            <h1
              id="about-title"
              className="m-0 font-display text-[clamp(2.2rem,4.5vw,4.1rem)] leading-[1.08] font-semibold tracking-[-0.065em] text-[var(--theme-paper)] max-[760px]:text-[clamp(2rem,9.5vw,3.9rem)] [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:text-[clamp(2.2rem,4vw,3.5rem)] [@media(min-width:761px)_and_(max-height:600px)]:text-[clamp(1.875rem,3.6vw,2.2rem)]"
              data-about-intro
            >
              <span className="block">From 3D games</span>
              <em className="mt-1 block font-[Georgia,serif] text-[1.08em] leading-[1.05] font-normal tracking-[-0.055em] text-[#edbd83]">
                to hackathon halls.
              </em>
            </h1>

            <div
              className="mt-6 max-w-[47ch] text-[14px] leading-[1.75] text-[var(--theme-paper)]/75 sm:text-[15px] [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:mt-4 [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:text-[13px] [@media(min-width:761px)_and_(max-height:600px)]:mt-3 [@media(min-width:761px)_and_(max-height:600px)]:text-[12px] [@media(min-width:761px)_and_(max-height:600px)]:leading-[1.55]"
              data-about-intro
            >
              <p className="m-0">
                I’m Tanmay, a full-stack developer and{" "}
                <span className="whitespace-nowrap">
                  co-founder of{" "}
                  <a
                    href="https://hackshastra.in"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--theme-paper)] underline decoration-[#edbd83]/60 underline-offset-4 transition-colors duration-200 hover:text-[#edbd83] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#edbd83]"
                  >
                    HackShastra
                  </a>
                  .
                </span>
              </p>
              <p className="mt-3 mb-0 [@media(min-width:761px)_and_(max-height:600px)]:mt-2 [@media(min-width:761px)_and_(max-height:450px)]:hidden">
                I build web products, organise hackathons, and mentor students
                turning ideas into working projects.
              </p>
            </div>

            <div
              className="mt-5 w-full max-w-[20rem] md:mt-6 md:max-w-[28rem] [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:mt-3 [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:max-w-[min(28rem,56vh)] [@media(min-width:761px)_and_(max-height:600px)]:mt-2 [@media(min-width:761px)_and_(max-height:600px)]:max-w-[min(24rem,48vh)]"
              data-about-intro
            >
              <SignatureReveal imageSources={signatureImageSources} />
            </div>

            <div
              className="mt-4 flex max-w-[28rem] flex-wrap items-center gap-x-7 gap-y-1 border-t border-[var(--theme-paper)]/20 pt-2 [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:mt-2 [@media(min-width:761px)_and_(max-height:600px)]:pt-0"
              data-about-intro
            >
              <Link
                className="group inline-flex min-h-11 items-center gap-2 text-[11px] font-semibold text-[var(--theme-paper)] transition-colors duration-200 hover:text-[#edbd83] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#edbd83]"
                href="#the-person"
              >
                More about me
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                className="group inline-flex min-h-11 items-center gap-2 text-[11px] font-medium text-[var(--theme-paper)]/65 transition-colors duration-200 hover:text-[var(--theme-paper)] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#edbd83]"
                href="https://hackshastra.in"
                target="_blank"
                rel="noreferrer"
              >
                Explore HackShastra
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          <div className="hero-art about-hero-art" data-about-visual>
            <div className="about-art-orbit about-art-orbit-outer" aria-hidden="true" />
            <div className="about-art-orbit about-art-orbit-inner" aria-hidden="true" />
            <RadialPopOut
              gallery={gallery}
              cardSize={245}
              heroSize={350}
              radius={250}
              jitter={3.5}
              stagger={0.018}
              shift={0.025}
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
        practiceImage={practiceImage ? { src: practiceImage.url, alt: practiceImage.alt } : undefined}
        practiceImage2={practiceImage2 ? { src: practiceImage2.url, alt: practiceImage2.alt } : undefined}
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
