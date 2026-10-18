"use client";

import { useState } from "react";
import type { Hackathon } from "@/lib/validators/schemas";
import { ArrowUpRight, Trophy, Users, Calendar } from "lucide-react";

export default function HackathonList({ items }: { items: Hackathon[] }) {
  const [role, setRole] = useState("All Roles");
  const roles = ["All Roles", "Judge", "Mentor", "Organizer"];

  const visible = role === "All Roles" ? items : items.filter((item) => item.role === role);

  return (
    <>
      <div className="filter-row" style={{ marginBottom: 32 }} aria-label="Filter by role">
        {roles.map((value) => (
          <button
            key={value}
            className={`filter-chip ${role === value ? "active" : ""}`}
            onClick={() => setRole(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {visible.map((x, i) => (
          <article
            className="timeline-card reveal"
            key={x.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 20,
              padding: 30,
            }}
          >
            <div style={{ maxWidth: 650 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span
                  className="tag-pill"
                  style={{
                    backgroundColor:
                      x.role === "Judge"
                        ? "var(--spidey-red)"
                        : x.role === "Mentor"
                        ? "var(--spidey-blue)"
                        : "var(--spidey-dark-700)",
                    color: "#ffffff",
                    borderColor: "transparent",
                  }}
                >
                  <Trophy size={13} style={{ display: "inline", marginRight: 4 }} />
                  {x.role.toUpperCase()}
                </span>
                <span style={{ fontSize: 13, color: "var(--spidey-text-dim)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={13} /> {x.date}
                </span>
              </div>

              <h2 className="display" style={{ fontSize: "clamp(22px, 3.2vw, 32px)", margin: "8px 0" }}>
                {x.name}
              </h2>
              <div style={{ fontSize: 14, color: "var(--spidey-red)", fontWeight: 600, marginBottom: 12 }}>
                Organizer: {x.organizer}
              </div>
              <p style={{ color: "var(--spidey-text-dim)", fontSize: 15, margin: 0, lineHeight: 1.55 }}>
                {x.description}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  backgroundColor: "var(--spidey-dark-700)",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-pill)",
                  color: "var(--spidey-paper)",
                  border: "1px solid var(--line)",
                }}
              >
                <Users size={15} color="var(--spidey-blue)" />
                {x.teams} Teams Evaluated
              </span>

              {x.link && (
                <a
                  href={x.link}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-secondary"
                  style={{ minHeight: 40, padding: "0 18px", fontSize: 12 }}
                >
                  Hackathon Link <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
