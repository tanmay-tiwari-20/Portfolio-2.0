import type { Metadata } from "next";
import { published, repos } from "@/lib/db";
import HackathonList from "@/components/hackathon-list";
import { MotionLayer } from "@/components/shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hackathons & Mentorship",
  description: "Judging and mentoring hackathon teams and emerging builders.",
};

export default async function Hackathons() {
  const items = (await published(repos.hackathons)).filter((item) => item.role === "Judge" || item.role === "Mentor");
  const judges = items.filter((i) => i.role === "Judge").length;
  const mentors = items.filter((i) => i.role === "Mentor").length;
  const teams = items.reduce((n, i) => n + i.teams, 0);

  return (
    <>
      <section className="section-shell" style={{ paddingTop: 160, paddingBottom: 60 }}>
        <div className="eyebrow">
          <span className="eyebrow-line" /> PAYING IT FORWARD // HACKATHONS
        </div>
        <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 88px)", margin: "16px 0 20px" }}>
          Build the<br />
          <em>next builder.</em>
        </h1>
        <p className="hero-lede" style={{ maxWidth: 640 }}>
          Some of my favorite weekends are spent helping teams validate technical architectures, unblock bugs at 3 AM, and bring breakthrough ideas to life.
        </p>
      </section>

      {/* STATS OVERVIEW */}
      <section className="section-shell" style={{ marginBottom: 50 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}
        >
          <div className="timeline-card" style={{ margin: 0, textAlign: "center", padding: 28 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 900, color: "var(--spidey-red)" }}>
              {items.length}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--spidey-text-dim)", marginTop: 4 }}>
              Hackathons
            </div>
          </div>

          <div className="timeline-card" style={{ margin: 0, textAlign: "center", padding: 28 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 900, color: "var(--spidey-blue)" }}>
              {judges}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--spidey-text-dim)", marginTop: 4 }}>
              Judging Roles
            </div>
          </div>

          <div className="timeline-card" style={{ margin: 0, textAlign: "center", padding: 28 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 900, color: "#00ff88" }}>
              {mentors}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--spidey-text-dim)", marginTop: 4 }}>
              Mentorship Roles
            </div>
          </div>

          <div className="timeline-card" style={{ margin: 0, textAlign: "center", padding: 28 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 900, color: "#ffffff" }}>
              {teams}+
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--spidey-text-dim)", marginTop: 4 }}>
              Teams Mentored
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell" style={{ paddingBottom: 120 }}>
        <HackathonList items={items} />
      </section>
      <MotionLayer />
    </>
  );
}
