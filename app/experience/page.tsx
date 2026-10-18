import type { Metadata } from "next";
import { published, repos } from "@/lib/db";
import { Briefcase, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Experience & Journey",
  description: "Roles, achievements, and technical leadership across products and teams.",
};

export default async function ExperiencePage() {
  const items = await published(repos.experiences);

  return (
    <>
      <section className="section-shell" style={{ paddingTop: 160, paddingBottom: 60 }}>
        <div className="eyebrow">
          <span className="eyebrow-line" /> CHRONICLES // 2020—PRESENT
        </div>
        <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 88px)", margin: "16px 0 20px" }}>
          Battle-tested<br />
          <em>engineering journey.</em>
        </h1>
        <p className="hero-lede" style={{ maxWidth: 640 }}>
          A timeline of real-world impact, distributed systems, architectural decisions, and collaborating with teams to build software people rely on.
        </p>
      </section>

      <section className="section-shell" style={{ paddingBottom: 120 }}>
        <div style={{ display: "grid", gap: 28 }}>
          {items.map((x, i) => (
            <article className="timeline-card reveal" key={x.id} style={{ padding: 36 }}>
              <div className="timeline-header" style={{ marginBottom: 16 }}>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--spidey-red)",
                        backgroundColor: "var(--spidey-dark-700)",
                        padding: "4px 10px",
                        borderRadius: "var(--radius-pill)",
                      }}
                    >
                      CHAPTER 0{i + 1}
                    </span>
                    <span style={{ color: "var(--spidey-muted)", fontSize: 13 }}>
                      {x.location}
                    </span>
                  </div>
                  <h2
                    className="display"
                    style={{ fontSize: "clamp(24px, 3.5vw, 36px)", color: "#ffffff", margin: "4px 0" }}
                  >
                    {x.role}
                  </h2>
                  <div style={{ fontSize: 16, color: "var(--spidey-red)", fontWeight: 700 }}>
                    {x.company}
                  </div>
                </div>

                <div
                  className="timeline-period-badge"
                  style={{
                    backgroundColor: "var(--spidey-dark-700)",
                    border: "1px solid var(--spidey-dark-500)",
                    color: "#ffffff",
                    fontSize: 13,
                    padding: "8px 18px",
                  }}
                >
                  <Briefcase size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />
                  {x.period}
                </div>
              </div>

              <p style={{ color: "var(--spidey-text-dim)", fontSize: 16, lineHeight: 1.6, margin: "16px 0 20px" }}>
                {x.description}
              </p>

              {x.achievements && x.achievements.length > 0 && (
                <div style={{ margin: "20px 0" }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--spidey-muted)",
                      marginBottom: 12,
                    }}
                  >
                    Key Missions & Impact
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                    {x.achievements.map((a, aidx) => (
                      <li
                        key={aidx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          color: "var(--spidey-paper)",
                          fontSize: 14,
                          lineHeight: 1.5,
                        }}
                      >
                        <CheckCircle2
                          size={18}
                          color="var(--spidey-red)"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--spidey-blue)",
                  }}
                >
                  Tech Stack:
                </span>
                <div className="tags-row" style={{ marginTop: 0 }}>
                  {x.tech.map((t) => (
                    <span className="tag-pill" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
