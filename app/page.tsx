import Link from "next/link";
import Image from "next/image";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { published, repos } from "@/lib/db";
import { ArrowUpRight, Sparkles, Code2, Users, Rocket } from "lucide-react";
import HeroPortrait from "@/components/hero-portrait";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profile, projects, experience, events, hackathons] = await Promise.all([
    repos.profile.getAll(),
    published(repos.projects),
    published(repos.experiences),
    published(repos.events),
    published(repos.hackathons),
  ]);

  const person = profile[0];
  const featured = projects.filter((p) => p.featured).slice(0, 4);

  const personJson = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person?.name || "Alex Parker",
    jobTitle: person?.role || "Creative Developer",
    email: person?.email || "",
    address: {
      "@type": "PostalAddress",
      addressLocality: person?.location || "Mumbai",
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
      <section className="hero section-shell">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse-red" />
              <span>SPIDER-SENSE ONLINE // CREATIVE DEVELOPER</span>
              <span style={{ color: "var(--spidey-red)" }}>/</span>
              <span>{person?.location || "MUMBAI, IN"}</span>
            </div>

            <p className="hero-kicker">
              {person?.role || "CREATIVE DEVELOPER & COMMUNITY ARCHITECT"}
            </p>

            <h1 className="display hero-title">
              {person?.heroTitle ? (
                person.heroTitle.includes("great") ? (
                  <>
                    With great code comes <em>great possibility.</em>
                  </>
                ) : (
                  person.heroTitle
                )
              ) : (
                <>
                  With great code comes <em>great possibility.</em>
                </>
              )}
            </h1>

            <p className="hero-lede">
              I’m <strong>{person?.name || "Alex Parker"}</strong> —{" "}
              {person?.tagline ||
                "crafting high-performance digital experiences where bold superhero storytelling meets fluid engineering."}
            </p>

            <div className="hero-actions">
              <Link href="/projects" className="button button-primary">
                Explore Missions <ArrowUpRight size={18} />
              </Link>
              <Link href="/contact" className="button button-secondary">
                Spider-Sense / Contact <ArrowUpRight size={18} />
              </Link>
            </div>

            {/* Awwwards Minimalist Stats Strip */}
            <div className="hero-metrics-strip">
              {(person?.stats || [
                { value: 18, label: "Projects shipped" },
                { value: 240, label: "Builders mentored" },
                { value: 3, label: "Years creating" },
              ]).map((st, i) => (
                <div key={i} className="hero-metric-item">
                  <span className="hero-metric-val">{st.value}+</span>
                  <span className="hero-metric-lbl">{st.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HERO GRAPHIC - DITHER VEIL PORTRAIT */}
          <div className="hero-art" aria-label="Interactive Hero Portrait">
            <HeroPortrait
              imageSrc={
                person?.avatar?.url ||
                "https://res.cloudinary.com/dunacoujw/image/upload/b_rgb:07090e,f_auto,q_auto,w_1200/v1792423733/hero_ppp8ke.png"
              }
            />
          </div>
        </div>

        {/* HERO BOTTOM BAR */}
        <div className="hero-bottom">
          <span>
            SCROLL TO EXPLORE <span className="scroll-arrow">↓</span>
          </span>
          <span>{person?.name || "Alex Parker"} — PORTFOLIO 2026</span>
          <span style={{ color: "var(--spidey-red)" }}>01 / 05</span>
        </div>
      </section>

      {/* TECH SUPERPOWERS MARQUEE STRIP */}
      <section className="marquee-strip" aria-label="Technical Superpowers">
        <div className="marquee-inner">
          {[
            "NEXT.JS 16",
            "TYPESCRIPT",
            "MONGODB",
            "REACT 19",
            "GSAP MOTION",
            "LENIS SCROLL",
            "TAILWIND CSS",
            "NODE.JS",
            "CLOUDINARY",
            "FRAMER MOTION",
            "GRAPHQL",
            "WEB3 FORMS",
          ].concat([
            "NEXT.JS 16",
            "TYPESCRIPT",
            "MONGODB",
            "REACT 19",
            "GSAP MOTION",
            "LENIS SCROLL",
            "TAILWIND CSS",
            "NODE.JS",
            "CLOUDINARY",
            "FRAMER MOTION",
            "GRAPHQL",
            "WEB3 FORMS",
          ]).map((tech, idx) => (
            <div className="marquee-item" key={idx}>
              <span>{tech}</span>
              <span className="marquee-dot" />
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT / ORIGIN STORY */}
      <section className="section-shell" style={{ padding: "80px 0 100px" }}>
        <div className="section-label">
          <span>01 // ORIGIN STORY</span>
          <span className="rule" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40, alignItems: "center" }}>
          <div>
            <h2 className="display reveal" style={{ fontSize: "clamp(38px, 5vw, 64px)", marginBottom: 24 }}>
              Engineering digital products that feel <em>alive & heroic.</em>
            </h2>
            <p className="hero-lede reveal" style={{ fontSize: 17, marginBottom: 28 }}>
              {person?.bio ||
                "I specialize in building full-stack platforms, creative interactive experiences, and open-source tooling where clean architecture meets vivid design."}
            </p>
            <div className="reveal" style={{ display: "flex", gap: 14 }}>
              <Link href="/experience" className="button button-secondary">
                View The Journey <ArrowUpRight size={18} />
              </Link>
              <Link href="/contact" className="button button-blue">
                Dispatch A Signal <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="timeline-card reveal" style={{ margin: 0 }}>
              <Code2 size={28} color="var(--spidey-red)" style={{ marginBottom: 14 }} />
              <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
                {person?.stats?.[0]?.value || 18}+
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--spidey-text-dim)" }}>
                {person?.stats?.[0]?.label || "Missions Shipped"}
              </div>
            </div>

            <div className="timeline-card reveal" style={{ margin: 0 }}>
              <Users size={28} color="var(--spidey-blue)" style={{ marginBottom: 14 }} />
              <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
                {person?.stats?.[1]?.value || 240}+
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--spidey-text-dim)" }}>
                {person?.stats?.[1]?.label || "Builders Mentored"}
              </div>
            </div>

            <div className="timeline-card reveal" style={{ margin: 0 }}>
              <Sparkles size={28} color="var(--spidey-red)" style={{ marginBottom: 14 }} />
              <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
                {events.length}+
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--spidey-text-dim)" }}>
                HackShastra Events
              </div>
            </div>

            <div className="timeline-card reveal" style={{ margin: 0 }}>
              <Rocket size={28} color="var(--spidey-blue)" style={{ marginBottom: 14 }} />
              <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
                {person?.stats?.[2]?.value || 6}+
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--spidey-text-dim)" }}>
                {person?.stats?.[2]?.label || "Years Creating"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SELECTED WORK / MISSIONS */}
      <section className="section-shell" style={{ padding: "40px 0 100px" }}>
        <div className="section-label">
          <span>02 // SELECTED MISSIONS</span>
          <span className="rule" />
          <span style={{ color: "var(--spidey-red)" }}>FEATURED</span>
        </div>

        <div className="section-heading-row">
          <div>
            <h2 className="display">
              Built to <em>matter.</em>
            </h2>
            <p style={{ color: "var(--spidey-text-dim)", marginTop: 8, fontSize: 16 }}>
              A curated selection of production apps, interactive experiences, and open-source systems.
            </p>
          </div>
          <Link href="/projects" className="button button-secondary">
            All Missions ({projects.length}) <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="project-grid">
          {featured.map((p, i) => (
            <Link
              href={`/projects/${p.slug}`}
              key={p.id}
              className="project-card reveal"
            >
              <div className="project-image-box">
                <Image
                  src={getOptimizedUrl(p.cover.url, 1200, 800)}
                  alt={p.cover.alt || p.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
                <span className="project-badge-top">MISSION 0{i + 1}</span>
                <span className="project-open-btn">
                  <ArrowUpRight size={20} />
                </span>
              </div>
              <div className="project-body">
                <div className="project-meta-info">
                  <div className="project-category">{p.category} · {p.year}</div>
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
            <p style={{ color: "var(--spidey-text-dim)", marginTop: 8, fontSize: 16 }}>
              High-growth teams, architectural challenges, and products that scale.
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
                    {e.company} <span style={{ color: "var(--spidey-muted)" }}>// {e.location}</span>
                  </div>
                </div>
                <span className="timeline-period-badge">{e.period}</span>
              </div>
              <p style={{ color: "var(--spidey-text-dim)", fontSize: 15, margin: "14px 0" }}>
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
          <div className="eyebrow" style={{ backgroundColor: "rgba(0, 0, 0, 0.25)", borderColor: "rgba(255, 255, 255, 0.25)", color: "#ffffff", marginBottom: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ffffff" }} />
            <span>COMMUNITY HEADQUARTERS // HACKSHASTRA</span>
          </div>

          <h2>
            Find your people.<br />
            Build the next builder.
          </h2>

          <p style={{ maxWidth: 640, fontSize: 17, lineHeight: 1.6, color: "rgba(255, 255, 255, 0.9)", margin: "0 0 28px 0" }}>
            HackShastra is a vibrant community for curious developers, builders, and designers to learn by doing, share open-source ideas, and build things that matter.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/hackshastra" className="button button-secondary" style={{ backgroundColor: "#ffffff", color: "var(--spidey-dark-900)", border: "none" }}>
              Explore HackShastra <ArrowUpRight size={18} />
            </Link>
            <Link href="/hackathons" className="button" style={{ backgroundColor: "rgba(0, 0, 0, 0.35)", color: "#ffffff", borderColor: "rgba(255, 255, 255, 0.35)" }}>
              Hackathon Mentorship ({hackathons.length}) <ArrowUpRight size={18} />
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
              <span className="eyebrow-line" /> OPEN TO HIGH-IMPACT COLLABORATIONS
            </div>
            <h2 className="display" style={{ fontSize: "clamp(34px, 4.8vw, 58px)", marginBottom: 12 }}>
              Have a heroic mission in mind?
            </h2>
            <p style={{ color: "var(--spidey-text-dim)", fontSize: 16, maxWidth: 540, margin: 0 }}>
              Whether you need a world-class creative developer, a scalable Next.js architecture, or community leadership, let’s make it happen.
            </p>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/contact" className="button button-primary">
              Send Transmission <ArrowUpRight size={18} />
            </Link>
            <a href={`mailto:${person?.email || "hello@example.com"}`} className="button button-blue">
              Direct Mail <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
