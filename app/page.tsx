import Link from "next/link";
import Image from "next/image";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { published, repos } from "@/lib/db";
import { ArrowUpRight, Sparkles, Code2, Users, Rocket } from "lucide-react";
import HeroPortrait from "@/components/hero-portrait";
import { MotionLayer } from "@/components/shell";
import Skiper31Text from "@/components/animations/skiper31-text";

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
      <section className="hero section-shell" data-home-hero>
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

      {/* ABOUT / PROFILE */}
      <section
        id="profile-philosophy"
        className="section-shell"
        style={{ padding: "80px 0 100px" }}
      >
        <div className="section-label">
          <span>01 // PROFILE & PHILOSOPHY</span>
          <span className="rule" />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div>
            <h2
              className="display philosophy-statement"
              style={{ fontSize: "clamp(38px, 5vw, 64px)", marginBottom: 24 }}
            >
              Engineering digital products with <em>clarity & care.</em>
            </h2>
            <p
              className="hero-lede reveal"
              style={{ fontSize: 17, marginBottom: 28 }}
            >
              {person?.bio ||
                "I specialize in building full-stack platforms, creative interactive experiences, and open-source tooling where clean architecture meets vivid design."}
            </p>
            <div
              className="philosophy-actions"
              style={{ display: "flex", gap: 14 }}
            >
              <Link href="/experience" className="button button-secondary">
                View The Journey <ArrowUpRight size={18} />
              </Link>
              <Link href="/contact" className="button button-primary">
                Initiate Contact <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div className="timeline-card reveal" style={{ margin: 0 }}>
              <Code2
                size={28}
                color="var(--theme-red)"
                style={{ marginBottom: 14 }}
              />
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                {person?.stats?.[0]?.value || 18}+
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--theme-text-dim)",
                }}
              >
                {person?.stats?.[0]?.label || "Projects Shipped"}
              </div>
            </div>

            <div className="timeline-card reveal" style={{ margin: 0 }}>
              <Users
                size={28}
                color="var(--theme-red)"
                style={{ marginBottom: 14 }}
              />
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                {person?.stats?.[1]?.value || 240}+
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--theme-text-dim)",
                }}
              >
                {person?.stats?.[1]?.label || "Builders Mentored"}
              </div>
            </div>

            <div className="timeline-card reveal" style={{ margin: 0 }}>
              <Sparkles
                size={28}
                color="var(--theme-red)"
                style={{ marginBottom: 14 }}
              />
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                {events.length}+
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--theme-text-dim)",
                }}
              >
                HackShastra Events
              </div>
            </div>

            <div className="timeline-card reveal" style={{ margin: 0 }}>
              <Rocket
                size={28}
                color="var(--theme-red)"
                style={{ marginBottom: 14 }}
              />
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                {person?.stats?.[2]?.value || 6}+
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--theme-text-dim)",
                }}
              >
                {person?.stats?.[2]?.label || "Years Creating"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Skiper31Text />

      {/* SELECTED WORK */}
      <section id="selected-work" className="home-work-section">
        <div className="section-shell home-work-heading">
          <div className="section-label">
            <span>02 // SELECTED WORKS</span>
            <span className="rule" />
            <span style={{ color: "var(--theme-red)" }}>FEATURED</span>
          </div>

          <div className="section-heading-row">
            <div>
              <h2 className="display">
                Built to <em>matter.</em>
              </h2>
              <p
                style={{
                  color: "var(--theme-text-dim)",
                  marginTop: 8,
                  fontSize: 16,
                }}
              >
                A curated selection of production apps, interactive experiences,
                and open-source systems.
              </p>
            </div>
            <Link href="/projects" className="button button-secondary">
              View All Projects ({projects.length}) <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>

        <div className="project-track-viewport" data-home-work-track>
          <div className="project-track">
            {featured.map((p, i) => (
              <Link
                href={`/projects/${p.slug}`}
                key={p.id}
                className="project-card work-project-card"
              >
                <div className="project-image-box">
                  <Image
                    src={getOptimizedUrl(p.cover.url, 1440, 900)}
                    alt={p.cover.alt || p.title}
                    fill
                    sizes="(max-width: 900px) 88vw, 76vw"
                    style={{ objectFit: "cover" }}
                  />
                  <span className="project-badge-top">
                    SELECTED WORK / {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="project-open-btn">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <div className="project-body">
                  <div className="project-meta-info">
                    <div className="project-category">
                      {p.category} · {p.year}
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                  </div>
                  <div className="tags-row">
                    {p.tags.slice(0, 4).map((t) => (
                      <span className="tag-pill" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/projects" className="work-end-card">
              <span className="work-end-index">THERE’S MORE TO EXPLORE</span>
              <span className="work-end-title">
                All projects<span>↗</span>
              </span>
              <span className="work-end-copy">
                A closer look at the products, experiments, and ideas I’ve
                helped bring to life.
              </span>
            </Link>
          </div>
        </div>
      </section>

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

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
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

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
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
