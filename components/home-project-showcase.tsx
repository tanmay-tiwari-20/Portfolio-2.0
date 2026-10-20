"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Code2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Grid,
  MonitorPlay,
} from "lucide-react";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";

export type ProjectShowcaseItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  year: string;
  cover: { url: string; alt?: string };
  tags: string[];
  featured: boolean;
  liveUrl?: string;
  githubUrl?: string;
};

type Props = {
  projects: ProjectShowcaseItem[];
  totalProjectCount: number;
};

export default function HomeProjectShowcase({
  projects,
  totalProjectCount,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"theater" | "grid">("theater");
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // References for DOM and animation engines
  const stageRef = useRef<HTMLDivElement>(null);
  const card3dRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const contentPanelRef = useRef<HTMLDivElement>(null);
  const tagsWrapRef = useRef<HTMLDivElement>(null);
  const imageBoxRef = useRef<HTMLAnchorElement>(null);

  // Engine references
  const gsapRef = useRef<any>(null);
  const animeRef = useRef<any>(null);
  const scrollTriggerRef = useRef<any>(null);

  const activeProject = projects[activeIndex] || projects[0];

  // 1. Initialize Motion Libraries (GSAP + ScrollTrigger + Anime.js)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mq.matches);

    let isDisposed = false;

    (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }, anime] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("animejs"),
        ]);

        if (isDisposed) return;

        gsap.registerPlugin(ScrollTrigger);
        gsapRef.current = gsap;
        scrollTriggerRef.current = ScrollTrigger;
        animeRef.current = anime;

        // Reveal the showcase stage on scroll
        if (stageRef.current && !mq.matches) {
          gsap.fromTo(
            stageRef.current,
            { opacity: 0, y: 36 },
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: {
                trigger: stageRef.current,
                start: "top 85%",
                once: true,
              },
            },
          );
        }
      } catch (err) {
        console.warn("Failed to initialize project showcase animations:", err);
      }
    })();

    return () => {
      isDisposed = true;
    };
  }, []);

  // 2. Animate Project Changes using Anime.js
  useEffect(() => {
    if (!animeRef.current || isReducedMotion || viewMode !== "theater") return;
    const { createTimeline, stagger } = animeRef.current;

    const tl = createTimeline({
      defaults: { ease: "out(3)" },
    });

    // Image crossfade & punch
    if (imageBoxRef.current) {
      tl.add(
        imageBoxRef.current,
        {
          opacity: [0.35, 1],
          scale: [0.97, 1],
          duration: 440,
        },
        0,
      );
    }

    // Text elements emergence
    if (contentPanelRef.current) {
      const kicker = contentPanelRef.current.querySelector(
        ".showcase-meta-kicker",
      );
      const title = contentPanelRef.current.querySelector(".showcase-title");
      const desc = contentPanelRef.current.querySelector(".showcase-desc");
      const actions = contentPanelRef.current.querySelector(".showcase-actions");

      if (kicker)
        tl.add(kicker, { opacity: [0, 1], y: [8, 0], duration: 300 }, 40);
      if (title)
        tl.add(title, { opacity: [0, 1], y: [16, 0], duration: 380 }, 80);
      if (desc)
        tl.add(desc, { opacity: [0, 1], y: [14, 0], duration: 420 }, 140);
      if (actions)
        tl.add(actions, { opacity: [0, 1], y: [12, 0], duration: 360 }, 220);
    }

    // Staggered tech pills
    if (tagsWrapRef.current) {
      const pills = tagsWrapRef.current.querySelectorAll(
        ".showcase-tag-pill",
      );
      if (pills.length) {
        tl.add(
          pills,
          {
            opacity: [0, 1],
            y: [8, 0],
            duration: 280,
            delay: stagger(25),
          },
          180,
        );
      }
    }
  }, [activeIndex, isReducedMotion, viewMode]);

  // 3. 3D Mouse Tilt with Cursor Light Glare
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isReducedMotion || !card3dRef.current || !gsapRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Normalization from -1 to 1
      const normX = (x - centerX) / centerX;
      const normY = (y - centerY) / centerY;

      const maxTilt = 6.5; // degrees
      const rotateY = normX * maxTilt;
      const rotateX = -normY * maxTilt;

      gsapRef.current.to(card3dRef.current, {
        rotateX,
        rotateY,
        transformPerspective: 1200,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });

      if (glareRef.current) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.16) 0%, transparent 60%)`;
      }
    },
    [isReducedMotion],
  );

  const handlePointerLeave = useCallback(() => {
    if (!card3dRef.current || !gsapRef.current) return;
    gsapRef.current.to(card3dRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.45)",
      overwrite: "auto",
    });

    if (glareRef.current) {
      glareRef.current.style.background = "none";
    }
  }, []);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : projects.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < projects.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <section
      id="selected-work"
      className="home-work-section section-shell"
      ref={stageRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Selected Projects Showcase"
    >
      {/* SECTION HEADER: Echoing the Hero Design System */}
      <div className="home-work-heading">
        <div className="section-label">
          <span className="hero-kicker-dot" />
          <span>02 // SELECTED WORKS</span>
          <span className="rule" />
          <span className="showcase-counter-chip">
            CURATED BUILDS [{String(projects.length).padStart(2, "0")}]
          </span>
        </div>

        <div className="section-heading-row">
          <div>
            <h2 className="display">
              Built to <em>matter.</em>
            </h2>
            <p className="showcase-lede">
              A curated selection of real-time multiplayer systems, interactive
              platforms, and modular web architectures.
            </p>
          </div>

          {/* Action & View Switcher Bar */}
          <div className="showcase-top-actions">
            <div className="showcase-view-pills" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "theater"}
                onClick={() => setViewMode("theater")}
                className={`showcase-view-btn ${
                  viewMode === "theater" ? "is-active" : ""
                }`}
                title="Cinematic Theater Mode"
              >
                <MonitorPlay size={14} />
                <span>Theater</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={`showcase-view-btn ${
                  viewMode === "grid" ? "is-active" : ""
                }`}
                title="Overview Grid Mode"
              >
                <Grid size={14} />
                <span>Grid</span>
              </button>
            </div>

            <Link href="/projects" className="button button-secondary">
              All Projects ({totalProjectCount}) <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: CINEMATIC THEATER STAGE */}
      {viewMode === "theater" && activeProject && (
        <div className="showcase-theater-stage">
          <div className="showcase-theater-grid">
            {/* Visual Deck (3D Tilt & Dither Shader Overlay) */}
            <div
              className="showcase-visual-column"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              {/* Playful Hand-Drawn Annotation in empty space pointing dynamically to the project card */}
              <div className="showcase-hand-annotation" aria-hidden="true">
                <span className="annotation-label">production build</span>
                <svg
                  className="annotation-arrow-svg"
                  viewBox="0 0 110 70"
                  fill="none"
                >
                  <path
                    d="M95 10 C 72 4, 38 14, 24 38 C 18 48, 22 56, 32 58 C 42 60, 48 50, 42 42 C 34 32, 16 38, 8 58"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 52 L 7 59 L 4 45"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="showcase-card-3d" ref={card3dRef}>
                {/* Architectural Corner Reticles */}
                <div className="reticle-corner reticle-top-left" aria-hidden="true" />
                <div className="reticle-corner reticle-top-right" aria-hidden="true" />
                <div className="reticle-corner reticle-bottom-left" aria-hidden="true" />
                <div className="reticle-corner reticle-bottom-right" aria-hidden="true" />

                {/* Creative Studio Window Chrome */}
                <div className="showcase-studio-header">
                  {/* Subtle Studio Window Controls */}
                  <div className="studio-window-controls" aria-hidden="true">
                    <span className="studio-dot" />
                    <span className="studio-dot" />
                    <span className="studio-dot" />
                  </div>

                  {/* Frosted Production URL Capsule */}
                  <div className="studio-url-capsule" title={activeProject.title}>
                    <svg
                      className="studio-lock-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      aria-hidden="true"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="studio-url-text">
                      {activeProject.liveUrl && activeProject.liveUrl !== "#"
                        ? activeProject.liveUrl
                            .replace(/^https?:\/\//, "")
                            .replace(/\/$/, "")
                        : `${activeProject.slug}.tanmaytiwari.dev`}
                    </span>
                  </div>

                  {/* Editorial Architectural Meta */}
                  <div className="studio-meta-tag">
                    <span className="studio-tech-label">
                      {activeProject.category.toUpperCase()} · {activeProject.year}
                    </span>
                  </div>
                </div>

                {/* Main Viewport */}
                <Link
                  href={`/projects/${activeProject.slug}`}
                  className="showcase-image-viewport"
                  ref={imageBoxRef}
                  tabIndex={-1}
                >
                  <Image
                    src={getOptimizedUrl(activeProject.cover.url, 1440, 920)}
                    alt={activeProject.cover.alt || activeProject.title}
                    fill
                    priority
                    sizes="(max-width: 900px) 96vw, 55vw"
                    className="showcase-image"
                  />

                  {/* Scanline / Dither Veil Texture */}
                  <div className="showcase-scanline-veil" aria-hidden="true" />

                  {/* Dynamic Glare Reflection */}
                  <div className="showcase-glare" ref={glareRef} aria-hidden="true" />

                  {/* Quick-Open Corner Floating Button */}
                  <div className="showcase-float-open">
                    <span>EXPLORE PROJECT</span>
                    <ArrowUpRight size={18} />
                  </div>
                </Link>

                {/* Ambient Backlight Glow */}
                <div className="showcase-ambient-glow" aria-hidden="true" />
              </div>
            </div>

            {/* Project Details Panel (The Narrative) */}
            <div className="showcase-info-column" ref={contentPanelRef}>
              <div className="showcase-meta-kicker">
                <span className="showcase-kicker-num">0{activeIndex + 1}</span>
                <span className="showcase-kicker-slash">/</span>
                <span className="showcase-kicker-cat">
                  {activeProject.category.toUpperCase()}
                </span>
              </div>

              <h3 className="showcase-title">{activeProject.title}</h3>

              <p className="showcase-desc">{activeProject.description}</p>

              {/* Tech Stack Badges */}
              <div className="showcase-tags-container" ref={tagsWrapRef}>
                <span className="showcase-tags-label">ARCHITECTURE & STACK:</span>
                <div className="showcase-tags-row">
                  {activeProject.tags.map((tag) => (
                    <span className="showcase-tag-pill" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Direct Action Suite */}
              <div className="showcase-actions">
                {activeProject.liveUrl && activeProject.liveUrl !== "#" ? (
                  <a
                    href={activeProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-primary showcase-live-btn"
                  >
                    <span>Launch Live Experience</span>
                    <ExternalLink size={17} />
                  </a>
                ) : null}

                {activeProject.githubUrl && activeProject.githubUrl !== "#" ? (
                  <a
                    href={activeProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-secondary"
                  >
                    <Code2 size={18} />
                    <span>Source Code</span>
                  </a>
                ) : null}

                <Link
                  href={`/projects/${activeProject.slug}`}
                  className="showcase-details-link"
                >
                  <span>Project Specs & Architecture</span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive Project Switcher Dock (Bottom Navigation) */}
          <div className="showcase-dock" role="tablist">
            <div className="showcase-dock-controls">
              <button
                type="button"
                onClick={handlePrev}
                className="showcase-nav-arrow"
                aria-label="Previous project"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="showcase-dock-items">
                {projects.map((p, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveIndex(idx)}
                      className={`showcase-dock-item ${
                        isActive ? "is-active" : ""
                      }`}
                    >
                      <div className="dock-item-header">
                        <span className="dock-item-index">
                          0{idx + 1}
                        </span>
                        <span className="dock-item-dot" />
                        <span className="dock-item-title">{p.title}</span>
                      </div>
                      <span className="dock-item-category">{p.category}</span>
                      <div className="dock-item-track">
                        <div
                          className="dock-item-fill"
                          style={{ width: isActive ? "100%" : "0%" }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="showcase-nav-arrow"
                aria-label="Next project"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MAGAZINE GRID */}
      {viewMode === "grid" && (
        <div className="showcase-grid-view">
          {projects.map((p, i) => (
            <div key={p.id} className="showcase-grid-card">
              <Link
                href={`/projects/${p.slug}`}
                className="grid-card-media"
                tabIndex={-1}
              >
                <Image
                  src={getOptimizedUrl(p.cover.url, 960, 600)}
                  alt={p.cover.alt || p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="grid-card-img"
                />
                <span className="grid-card-index">0{i + 1}</span>
                <span className="grid-card-arrow">
                  <ArrowUpRight size={18} />
                </span>
              </Link>

              <div className="grid-card-body">
                <div className="grid-card-cat">
                  {p.category} · {p.year}
                </div>
                <h3 className="grid-card-title">
                  <Link href={`/projects/${p.slug}`}>{p.title}</Link>
                </h3>
                <p className="grid-card-desc">{p.description}</p>

                <div className="grid-card-tags">
                  {p.tags.slice(0, 4).map((t) => (
                    <span key={t} className="grid-tag-pill">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="grid-card-actions">
                  <Link
                    href={`/projects/${p.slug}`}
                    className="grid-action-link"
                  >
                    <span>Read Case Study</span>
                    <ArrowUpRight size={14} />
                  </Link>

                  {p.liveUrl && p.liveUrl !== "#" ? (
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid-live-badge"
                    >
                      <span className="live-pulse-dot" />
                      Live Demo
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
