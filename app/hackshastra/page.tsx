import type { Metadata } from "next";
import { published, repos } from "@/lib/db";
import { ArrowUpRight, Calendar, MapPin, Users } from "lucide-react";
import { MotionLayer } from "@/components/shell";
import EventPoster from "@/components/event-poster";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HackShastra Community",
  description: "A community for curious developers and builders to learn by doing and build things together.",
};

export default async function HackShastra() {
  const [events, profiles] = await Promise.all([
    published(repos.events),
    repos.profile.getAll(),
  ]);

  const totalAttendees = events.reduce((n, e) => n + e.attendees, 0);
  const upcomingCount = events.filter((e) => e.status === "upcoming").length;

  return (
    <>
      <section className="section-shell" style={{ paddingTop: 160, paddingBottom: 60 }}>
        <div className="eyebrow">
          <span className="eyebrow-line" /> THE BUILDER ALLIANCE // HACKSHASTRA
        </div>
        <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 88px)", margin: "16px 0 20px" }}>
          Find your people.<br />
          <em>Build together.</em>
        </h1>
        <p className="hero-lede" style={{ maxWidth: 640 }}>
          HackShastra creates room for curious people to learn by doing, share open-source discoveries, and turn raw ambition into production code.
        </p>

        <div className="hero-actions" style={{ marginTop: 32 }}>
          <a
            href={`mailto:${profiles[0]?.email || "hello@example.com"}?subject=HackShastra Community Inquiry`}
            className="button button-primary"
          >
            Join The Next Gathering <ArrowUpRight size={18} />
          </a>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="section-shell" style={{ marginBottom: 60 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          <div className="timeline-card" style={{ margin: 0, textAlign: "center", padding: 32 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 900, color: "var(--spidey-red)" }}>
              {events.length}+
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--spidey-text-dim)", marginTop: 6 }}>
              Total Gatherings
            </div>
          </div>

          <div className="timeline-card" style={{ margin: 0, textAlign: "center", padding: 32 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 900, color: "var(--spidey-blue)" }}>
              {totalAttendees}+
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--spidey-text-dim)", marginTop: 6 }}>
              Builders Connected
            </div>
          </div>

          <div className="timeline-card" style={{ margin: 0, textAlign: "center", padding: 32 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 900, color: "#00ff88" }}>
              {upcomingCount}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--spidey-text-dim)", marginTop: 6 }}>
              Upcoming Missions
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS LIST */}
      <section className="section-shell" style={{ paddingBottom: 120 }}>
        <div className="section-label">
          <span>COMMUNITY EVENTS // PAST & UPCOMING</span>
          <span className="rule" />
        </div>

        <div style={{ display: "grid", gap: 24 }}>
          {events.map((e) => (
            <article
              className="timeline-card reveal"
              key={e.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 24,
                padding: 32,
              }}
            >
              <EventPoster url={e.image?.url} alt={e.image?.alt || `${e.title} event poster`} />
              <div style={{ maxWidth: 680 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <span
                    className="tag-pill"
                    style={{
                      backgroundColor: e.status === "upcoming" ? "var(--spidey-red)" : "var(--spidey-dark-700)",
                      color: "#ffffff",
                      borderColor: e.status === "upcoming" ? "var(--spidey-red)" : "var(--line)",
                    }}
                  >
                    {e.status === "upcoming" ? "UPCOMING EVENT" : "PAST GATHERING"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--spidey-text-dim)" }}>
                    <Calendar size={14} color="var(--spidey-red)" /> {e.date}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--spidey-text-dim)" }}>
                    <MapPin size={14} color="var(--spidey-blue)" /> {e.venue}
                  </span>
                </div>

                <h2 className="display" style={{ fontSize: "clamp(24px, 3.5vw, 36px)", margin: "8px 0 12px" }}>
                  {e.title}
                </h2>
                <p style={{ color: "var(--spidey-text-dim)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                  {e.description}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--spidey-paper)",
                    backgroundColor: "var(--spidey-dark-700)",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <Users size={16} color="var(--spidey-red)" />
                  <span>{e.attendees}+ Builders</span>
                </div>

                {e.link && (
                  <a
                    href={e.link}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-secondary"
                    style={{ minHeight: 42, padding: "0 20px" }}
                  >
                    Event Details <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <MotionLayer />
    </>
  );
}
