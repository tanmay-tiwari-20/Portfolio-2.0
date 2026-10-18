"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/lib/validators/schemas";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { ArrowUpRight, Search, Globe, GitBranch } from "lucide-react";

export default function ProjectGallery({ projects }: { projects: Project[] }) {
  const [selectedTag, setSelectedTag] = useState("All Missions");
  const [searchQuery, setSearchQuery] = useState("");

  const tags = useMemo(
    () => ["All Missions", ...Array.from(new Set(projects.flatMap((p) => p.tags)))],
    [projects]
  );

  const visible = useMemo(() => {
    return projects.filter((p) => {
      const matchesTag =
        selectedTag === "All Missions" || p.tags.includes(selectedTag);
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [projects, selectedTag, searchQuery]);

  return (
    <div>
      {/* Search and Filter Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 36,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tags.map((t) => (
            <button
              type="button"
              className={`filter-chip ${selectedTag === t ? "active" : ""}`}
              key={t}
              onClick={() => setSelectedTag(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: 260 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--spidey-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search missions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              paddingLeft: 40,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: "var(--radius-pill)",
              fontSize: 13,
            }}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            backgroundColor: "var(--spidey-dark-800)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--line)",
          }}
        >
          <h3 className="display" style={{ fontSize: 28, marginBottom: 8 }}>
            No missions found
          </h3>
          <p style={{ color: "var(--spidey-muted)", fontSize: 15 }}>
            Try resetting your search query or tag filter.
          </p>
          <button
            onClick={() => {
              setSelectedTag("All Missions");
              setSearchQuery("");
            }}
            className="button button-primary"
            style={{ marginTop: 16 }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {visible.map((p, i) => (
            <div className="project-card reveal" key={p.id}>
              <Link href={`/projects/${p.slug}`} className="project-image-box">
                <Image
                  src={getOptimizedUrl(p.cover.url, 1200, 800)}
                  alt={p.cover.alt || p.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
                <span className="project-badge-top">0{i + 1} // {p.year}</span>
                <span className="project-open-btn">
                  <ArrowUpRight size={20} />
                </span>
              </Link>

              <div className="project-body">
                <div className="project-meta-info">
                  <div className="project-category">{p.category}</div>
                  <Link href={`/projects/${p.slug}`}>
                    <h3>{p.title}</h3>
                  </Link>
                  <p>{p.description}</p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    marginTop: "auto",
                    paddingTop: 16,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <div className="tags-row" style={{ marginTop: 0 }}>
                    {p.tags.map((t) => (
                      <span className="tag-pill" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    {p.liveUrl && p.liveUrl !== "#" && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                        style={{ padding: "6px 12px", fontSize: 11 }}
                        title="Live Site"
                      >
                        <Globe size={14} /> Live
                      </a>
                    )}
                    {p.githubUrl && p.githubUrl !== "#" && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                        style={{ padding: "6px 12px", fontSize: 11 }}
                        title="GitHub Repository"
                      >
                        <GitBranch size={14} /> Code
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
