import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { published, repos } from "@/lib/db";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { ArrowUpRight, ArrowLeft, Globe, GitBranch } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = (await published(repos.projects)).find((x) => x.slug === slug);
  return {
    title: p?.title || "Mission Details",
    description: p?.description,
  };
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const projects = await published(repos.projects);
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();

  return (
    <>
      <section className="section-shell" style={{ paddingTop: 160, paddingBottom: 40 }}>
        <Link
          href="/projects"
          className="text-link"
          style={{ marginBottom: 24, display: "inline-flex" }}
        >
          <ArrowLeft size={16} /> Back to all missions
        </Link>
        <div className="eyebrow" style={{ display: "flex", width: "fit-content" }}>
          <span className="eyebrow-line" /> {p.category} // {p.year}
        </div>
        <h1 className="display" style={{ fontSize: "clamp(44px, 6.5vw, 80px)", margin: "16px 0 20px" }}>
          {p.title}
        </h1>
        <p className="hero-lede" style={{ maxWidth: 720 }}>
          {p.description}
        </p>
      </section>

      <section className="section-shell" style={{ paddingBottom: 120 }}>
        <div
          style={{
            position: "relative",
            height: "clamp(340px, 55vw, 640px)",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            border: "1px solid var(--line)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
          }}
        >
          <Image
            src={getOptimizedUrl(p.cover.url, 2000, 1200)}
            alt={p.cover.alt || p.title}
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover" }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 48,
            marginTop: 60,
          }}
        >
          <div className="timeline-card" style={{ height: "fit-content" }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              MISSION INTEL
            </div>
            <div style={{ fontSize: 13, color: "var(--spidey-muted)", marginBottom: 16 }}>
              Year: <strong style={{ color: "#fff" }}>{p.year}</strong> · Category:{" "}
              <strong style={{ color: "#fff" }}>{p.category}</strong>
            </div>

            <div className="tags-row" style={{ marginBottom: 24 }}>
              {p.tags.map((t) => (
                <span className="tag-pill" key={t}>
                  {t}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {p.liveUrl && p.liveUrl !== "#" && (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-primary"
                  style={{ flex: 1, minHeight: 46 }}
                >
                  <Globe size={16} /> Live Demo <ArrowUpRight size={16} />
                </a>
              )}
              {p.githubUrl && p.githubUrl !== "#" && (
                <a
                  href={p.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-secondary"
                  style={{ flex: 1, minHeight: 46 }}
                >
                  <GitBranch size={16} /> Codebase <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h2 className="display" style={{ fontSize: "clamp(32px, 4.5vw, 54px)", marginBottom: 20 }}>
              The Mission <em>Breakdown.</em>
            </h2>
            <p style={{ color: "var(--spidey-text-dim)", fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
              {p.description}
            </p>
            <p style={{ color: "var(--spidey-muted)", fontSize: 15, lineHeight: 1.6 }}>
              Engineered with clean separation of concerns, high-velocity performance, responsive design for all screen formats, and accessibility baked directly into every interactive component.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
