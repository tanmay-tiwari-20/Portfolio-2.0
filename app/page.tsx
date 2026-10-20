import Link from "next/link";
import Image from "next/image";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { published, repos } from "@/lib/db";
import { ArrowUpRight, Sparkles, Code2, Users, Rocket } from "lucide-react";
import HeroPortrait from "@/components/hero-portrait";
import { MotionLayer } from "@/components/shell";
import Skiper31Text from "@/components/animations/skiper31-text";
import HomeProjectShowcase from "@/components/home-project-showcase";
import HomeProfilePhilosophy from "@/components/home-profile-philosophy";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profile, projects, experience, events, hackathons] = await Promise.all(
    [
      repos.profile.getAll(),
      published(repos.projects),
      published(repos.experiences),
      published(repos.events),
      published(repos.hackathons),
    ],
  );

  const person = profile[0];
  const featured = projects.filter((p) => p.featured).slice(0, 4);
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

      {/* SECTION 01 // PROFILE & PHILOSOPHY DOSSIER */}
      <HomeProfilePhilosophy
        bio={person?.bio}
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
      <section className="section-shell" style={{ padding: "40px 0 100px" }}>
        <div className="section-label">
          <span>03 // THE JOURNEY</span>
          <span className="rule" />
        </div>

        <div className="section-heading-row">
          <div>
            <h2 className="display">
              Battle-tested <em>experience.</em>
            </h2>
            <p
              style={{
                color: "var(--spidey-text-dim)",
                marginTop: 8,
                fontSize: 16,
              }}
            >
              High-growth teams, architectural challenges, and products that
              scale.
            </p>
          </div>
          <Link href="/experience" className="button button-secondary">
            Full Experience Timeline <ArrowUpRight size={18} />
          </Link>
        </div>

        <div>
          {experience.slice(0, 3).map((e) => (
            <article className="timeline-card reveal" key={e.id}>
              <div className="timeline-header">
                <div>
                  <h3 className="timeline-role">{e.role}</h3>
                  <div className="timeline-company">
                    {e.company}{" "}
                    <span style={{ color: "var(--spidey-muted)" }}>
                      · {e.location}
                    </span>
                  </div>
                </div>
                <span className="timeline-period-badge">{e.period}</span>
              </div>
              <p
                style={{
                  color: "var(--spidey-text-dim)",
                  fontSize: 15,
                  margin: "14px 0",
                }}
              >
                {e.description}
              </p>
              <div className="tags-row">
                {e.tech.map((t) => (
                  <span className="tag-pill" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* HACKSHASTRA & COMMUNITY HERO BAND (ROUNDED, VIBRANT RED, NO GRADIENTS) */}
      <section className="section-shell">
        <div className="community-band-rounded reveal">
          <div
            className="eyebrow"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              borderColor: "rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
              }}
            />
            <span>COMMUNITY HEADQUARTERS // HACKSHASTRA</span>
          </div>

          <h2>
            Find your people.
            <br />
            Build the next builder.
          </h2>

          <p
            style={{
              maxWidth: 640,
              fontSize: 17,
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.9)",
              margin: "0 0 28px 0",
            }}
          >
            HackShastra is a vibrant community for curious developers, builders,
            and designers to learn by doing, share open-source ideas, and build
            things that matter.
          </p>

          <div className="community-actions" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link
              href="/hackshastra"
              className="button button-secondary"
              style={{
                backgroundColor: "#ffffff",
                color: "var(--spidey-dark-900)",
                border: "none",
              }}
            >
              Explore HackShastra <ArrowUpRight size={18} />
            </Link>
            <Link
              href="/hackathons"
              className="button"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.35)",
                color: "#ffffff",
                borderColor: "rgba(255, 255, 255, 0.35)",
              }}
            >
              Hackathon Mentorship ({hackathons.length}){" "}
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="community-stats-grid">
            <div className="community-stat-item">
              <strong>{events.length}+</strong>
              <span>COMMUNITY GATHERINGS</span>
            </div>
            <div className="community-stat-item">
              <strong>{events.reduce((n, x) => n + x.attendees, 0)}+</strong>
              <span>BUILDERS ATTENDED</span>
            </div>
            <div className="community-stat-item">
              <strong>{hackathons.reduce((n, x) => n + x.teams, 0)}+</strong>
              <span>TEAMS MENTORED</span>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BOX (ROUNDED, HIGH CONTRAST) */}
      <section className="section-shell">
        <div className="cta-box-rounded reveal">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              <span className="eyebrow-accent-bar" /> OPEN TO HIGH-IMPACT
              COLLABORATIONS
            </div>
            <h2
              className="display"
              style={{ fontSize: "clamp(34px, 4.8vw, 58px)", marginBottom: 12 }}
            >
              Have a bold vision in mind?
            </h2>
            <p
              style={{
                color: "var(--theme-text-dim)",
                fontSize: 16,
                maxWidth: 540,
                margin: 0,
              }}
            >
              Whether you need a world-class creative developer, scalable
              Next.js architecture, or community leadership, let’s build it.
            </p>
          </div>

          <div className="cta-actions" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/contact" className="button button-primary">
              Initiate Contact <ArrowUpRight size={18} />
            </Link>
            <a
              href={`mailto:${person?.email || "workwithtakneekitanmay@gmail.com"}`}
              className="button button-secondary"
            >
              Direct Mail <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
      </section>
      <MotionLayer />
    </>
  );
}
