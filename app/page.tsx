import Link from "next/link";
import { published, repos } from "@/lib/db";
import { ArrowUpRight } from "lucide-react";
import HeroPortrait from "@/components/hero-portrait";
import { MotionLayer } from "@/components/shell";
import Skiper31Text from "@/components/animations/skiper31-text";
import HomeProjectShowcase from "@/components/home-project-showcase";
import HomeProfilePhilosophy from "@/components/home-profile-philosophy";
import HomeExperienceJourney from "@/components/home-experience-journey";
import HomeHackShastraStory from "@/components/home-hackshastra-story";
import HomeHackathonsJourney from "@/components/home-hackathons-journey";
import CinematicFooter from "@/components/cinematic-footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profile, projects, experience, events, hackathons, socials] =
    await Promise.all([
      repos.profile.getAll(),
      published(repos.projects),
      published(repos.experiences),
      published(repos.events),
      published(repos.hackathons),
      published(repos.socials),
    ]);

  const person = profile[0];
  const featured = projects.filter((p) => p.featured).slice(0, 4);
  const hackathonStoryEvents = hackathons
    .filter((event) => event.role === "Judge" || event.role === "Mentor")
    .map(({ id, name, role, link }) => ({ id, name, role, link }));
  const fullName = (person?.name || "Tanmay Tiwari").trim() || "Tanmay Tiwari";
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts.shift() || "Tanmay";
  const lastName = nameParts.join(" ");
  const projectTechnologies = Array.from(
    new Set(
      featured.flatMap((project) =>
        project.tags.map((tag) => tag.trim()).filter(Boolean),
      ),
    ),
  ).slice(0, 12);
  const marqueeTechnologies = projectTechnologies.length
    ? projectTechnologies
    : [
        "Full-stack development",
        "Interactive experiences",
        "Open-source software",
      ];

  const personJson = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person?.name || "Tanmay Tiwari",
    jobTitle: person?.role || "Creative Developer",
    email: person?.email || "",
    address: {
      "@type": "PostalAddress",
      addressLocality: person?.location || "New Delhi",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJson).replace(/</g, "\\u003c"),
        }}
      />

      {/* HERO SECTION */}
      <section className="hero" data-home-hero>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">
              <span className="hero-kicker-dot" />
              {person?.role || "SOFTWARE ENGINEER & COMMUNITY BUILDER"}
              <span className="hero-kicker-location">
                {person?.location || "New Delhi, India"}
              </span>
            </p>

            <h1 className="hero-name" aria-label={fullName}>
              <span className="hero-name-line">{firstName}</span>
              {lastName && (
                <span className="hero-name-line hero-name-accent">
                  {lastName}
                  <span className="hero-name-period">.</span>
                </span>
              )}
            </h1>

            <p className="hero-manifesto">
              {person?.heroTitle || "With great code comes great possibility."}
            </p>

            <p className="hero-lede">
              I’m <strong>{person?.name || "Tanmay Tiwari"}</strong> —{" "}
              {person?.tagline ||
                "crafting high-performance digital experiences where thoughtful design meets fluid engineering."}
            </p>

            <div className="hero-actions">
              <Link href="/projects" className="button button-primary">
                Explore my work <ArrowUpRight size={18} />
              </Link>
              <Link href="/contact" className="button button-secondary">
                Let’s talk <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="hero-metrics-strip">
              {(
                person?.stats || [
                  { value: 18, label: "Projects shipped" },
                  { value: 240, label: "Builders mentored" },
                  { value: 3, label: "Years creating" },
                ]
              ).map((st, i) => (
                <div key={i} className="hero-metric-item">
                  <span className="hero-metric-val">{st.value}+</span>
                  <span className="hero-metric-lbl">{st.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HERO GRAPHIC - DITHER VEIL PORTRAIT */}
          <div
            className="hero-art"
            role="img"
            aria-label={person?.avatar?.alt || `Portrait of ${fullName}`}
          >
            <div className="portrait-note" aria-hidden="true">
              <svg viewBox="0 0 130 74" fill="none">
                <path d="M4 5c40 0 81 16 100 42m0 0-18-8m18 8 3-20" />
              </svg>
              <span>
                the person
                <br />
                behind the pixels
              </span>
            </div>
            <div className="portrait-index" aria-hidden="true">
              01 <span>/</span> CREATIVE DEVELOPER
            </div>
            <HeroPortrait
              imageSrc={
                person?.avatar?.url ||
                "https://res.cloudinary.com/dunacoujw/image/upload/b_rgb:07090e,f_auto,q_auto,w_1200/v1792423733/hero_ppp8ke.png"
              }
            />
          </div>
        </div>
        <a className="hero-scroll-cue" href="#selected-work">
          <span className="hero-scroll-line" />
          Scroll to explore
        </a>
      </section>

      {/* TOOLS & TECHNOLOGIES MARQUEE STRIP */}
      <section
        className="marquee-strip"
        aria-label="Tools and technologies used in selected projects"
      >
        <div className="marquee-inner">
          {[...marqueeTechnologies, ...marqueeTechnologies].map((tech, idx) => (
            <div className="marquee-item" key={idx}>
              <span>{tech.toUpperCase()}</span>
              <span className="marquee-dot" />
            </div>
          ))}
        </div>
      </section>

      {/* PROFILE & PHILOSOPHY DOSSIER */}
      <HomeProfilePhilosophy
        bio={person?.bio}
        name={person?.name}
        role={person?.role}
        stats={person?.stats}
        eventsCount={events.length}
        hackathonsCount={hackathons.length}
      />

      <Skiper31Text />

      {/* SELECTED WORK SHOWCASE */}
      <HomeProjectShowcase
        projects={featured}
        totalProjectCount={projects.length}
      />

      {/* THE JOURNEY / EXPERIENCE PEEK */}
      <HomeExperienceJourney experiences={experience} />

      <HomeHackShastraStory founderName={person?.name || "Tanmay Tiwari"} />

      <HomeHackathonsJourney
        events={hackathonStoryEvents}
        email={person?.email || "workwithtakneekitanmay@gmail.com"}
      />

      <CinematicFooter socials={socials} />
      <MotionLayer />
    </>
  );
}
