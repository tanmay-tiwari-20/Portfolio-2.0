import type { Metadata } from "next";
import { published, repos } from "@/lib/db";
import ProjectGallery from "@/components/project-gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Missions & Work",
  description: "A showcase of production web applications, open source tools, and creative experiments.",
};

export default async function ProjectsPage() {
  const items = await published(repos.projects);

  return (
    <>
      <section className="section-shell" style={{ paddingTop: 160, paddingBottom: 60 }}>
        <div className="eyebrow">
          <span className="eyebrow-line" /> CLASSIFIED MISSIONS // 2023—2026
        </div>
        <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 88px)", margin: "16px 0 20px" }}>
          Crafting ideas into<br />
          <em>digital reality.</em>
        </h1>
        <p className="hero-lede" style={{ maxWidth: 640 }}>
          From enterprise fintech architectures to playful community platforms and creative 3D web experiments — each project built with intent and care.
        </p>
      </section>

      <section className="section-shell" style={{ paddingBottom: 120 }}>
        <ProjectGallery projects={items} />
      </section>
    </>
  );
}
