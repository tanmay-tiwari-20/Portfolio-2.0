import type { Metadata } from "next";
import ContactForm from "@/components/contact-form";
import { repos } from "@/lib/db";
import { ArrowUpRight, Mail, Share2 } from "lucide-react";
import { MotionLayer } from "@/components/shell";
import { getSocialDisplayLabel } from "@/lib/social-label";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & Transmissions",
  description: "Send a transmission, discuss a project, or connect on social platforms.",
};

export default async function Contact() {
  const [socials, profile] = await Promise.all([
    repos.socials.getAll(),
    repos.profile.getAll(),
  ]);

  const person = profile[0];

  return (
    <>
      <section className="section-shell" style={{ paddingTop: 160, paddingBottom: 60 }}>
        <div className="eyebrow">
          <span className="eyebrow-line" /> SECURE COMMS // TRANSMISSIONS
        </div>
        <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 88px)", margin: "16px 0 20px" }}>
          The next mission<br />
          <em>starts here.</em>
        </h1>
        <p className="hero-lede" style={{ maxWidth: 640 }}>
          Have an ambitious project, an architectural challenge, a hackathon invitation, or just want to talk shop? My communication channels are wide open.
        </p>
      </section>

      <section className="section-shell" style={{ paddingBottom: 120 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 48,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 20 }}>
              FREQUENCY & RADAR
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              {socials.map((s) => {
                const label = getSocialDisplayLabel(s.label, s.href);
                return (
                  <a
                    className="timeline-card"
                    style={{
                      margin: 0,
                      padding: "20px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    key={s.id}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: "var(--spidey-dark-700)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 16,
                          color: "var(--spidey-red)",
                          border: "1px solid var(--line)",
                        }}
                      >
                        <Share2 size={16} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#ffffff" }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--spidey-muted)" }}>
                          {s.handle}
                        </div>
                      </div>
                    </div>
                    <span className="project-open-btn" style={{ position: "static", width: 36, height: 36 }}>
                      <ArrowUpRight size={16} />
                    </span>
                  </a>
                );
              })}

              {person?.email && (
                <a
                  className="timeline-card"
                  style={{
                    margin: 0,
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderColor: "var(--spidey-red)",
                  }}
                  href={`mailto:${person.email}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--radius-pill)",
                        backgroundColor: "var(--spidey-red)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 18,
                        color: "#ffffff",
                      }}
                    >
                      <Mail size={18} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#ffffff" }}>
                        Direct Email
                      </div>
                      <div style={{ fontSize: 13, color: "var(--spidey-text-dim)" }}>
                        {person.email}
                      </div>
                    </div>
                  </div>
                  <span className="project-open-btn" style={{ position: "static", width: 36, height: 36 }}>
                    <ArrowUpRight size={16} />
                  </span>
                </a>
              )}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 20 }}>
              DISPATCH TRANSMISSION
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
      <MotionLayer />
    </>
  );
}
