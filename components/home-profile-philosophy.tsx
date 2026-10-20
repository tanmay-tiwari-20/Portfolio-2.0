"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type StatItem = {
  label: string;
  value: number;
};

type Props = {
  bio?: string;
  stats?: StatItem[];
  eventsCount: number;
  hackathonsCount: number;
};

/**
 * Interactive 3D Tactile Stat Card with GSAP-like spring physics,
 * specular lighting, and animated SVG micro-interaction.
 */
function TactileStatCard({
  index,
  number,
  label,
  subtitle,
  children,
}: {
  index: string;
  number: string;
  label: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -9;
    const rotY = ((x - centerX) / centerX) * 9;

    cardRef.current.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;

    if (glareRef.current) {
      glareRef.current.style.opacity = "1";
      glareRef.current.style.background = `radial-gradient(circle 180px at ${x}px ${y}px, rgba(255, 250, 247, 0.12) 0%, transparent 80%)`;
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }
    setIsHovered(false);
  }, []);

  return (
    <div
      ref={cardRef}
      className={`tactile-card ${isHovered ? "is-hovered" : ""}`}
      onPointerEnter={() => setIsHovered(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Precision Reticles in Corners */}
      <div className="card-reticle card-reticle-tl" aria-hidden="true" />
      <div className="card-reticle card-reticle-tr" aria-hidden="true" />
      <div className="card-reticle card-reticle-bl" aria-hidden="true" />
      <div className="card-reticle card-reticle-br" aria-hidden="true" />

      {/* Top Header Row */}
      <div className="tactile-card-top">
        <span className="tactile-card-index">{index} //</span>
        <div className="tactile-card-icon-stage">{children}</div>
      </div>

      {/* Main Metric Presentation */}
      <div className="tactile-card-body">
        <span className="tactile-card-number">{number}</span>
        <h3 className="tactile-card-label">{label}</h3>
        <span className="tactile-card-sub">{subtitle}</span>
      </div>

      {/* Bottom Glowing Accent Conduit */}
      <div className="tactile-card-conduit" aria-hidden="true" />

      {/* Dynamic Specular Glare */}
      <div ref={glareRef} className="tactile-card-glare" aria-hidden="true" />
    </div>
  );
}

export default function HomeProfilePhilosophy({
  bio,
  stats,
  eventsCount,
  hackathonsCount,
}: Props) {
  const projectsCount = stats?.[0]?.value || 18;
  const buildersCount = stats?.[1]?.value || 240;
  const yearsCount = stats?.[2]?.value || 3;

  return (
    <section id="profile-philosophy" className="section-shell philosophy-showcase-section">
      {/* Section Architectural Header Label */}
      <div className="section-label">
        <span className="hero-kicker-dot" />
        <span>01 // PROFILE & PHILOSOPHY</span>
        <span className="rule" />
        <span className="philosophy-spec-code">CRAFT & METRICS</span>
      </div>

      {/* TOP ROW: THE EDITORIAL STATEMENT & NARRATIVE HORIZON */}
      <div className="philosophy-horizon-row">
        <div className="horizon-statement-col">
          <h2 className="display philosophy-horizon-title">
            Engineering digital products with <em>clarity & care.</em>
          </h2>
        </div>

        <div className="horizon-narrative-col">
          <p className="philosophy-horizon-lede">
            {bio ||
              "I build resilient full-stack systems and fluid 60 FPS interactive web platforms, pairing clean architectural abstractions with human-first design."}
          </p>

          <div className="philosophy-actions">
            <Link href="/experience" className="button button-secondary mr-3">
              <span>View The Journey</span>
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/contact" className="button button-primary">
              <span>Initiate Contact</span>
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: 4 TACTILE INTERACTIVE STAT MODULES */}
      <div className="tactile-cards-track">
        {/* Module 1: Projects Shipped */}
        <TactileStatCard
          index="01"
          number={`${projectsCount}+`}
          label="Projects Shipped"
          subtitle="Full-Stack Platforms & Creative UI"
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            className="micro-svg micro-cube-svg"
            aria-hidden="true"
          >
            {/* Isometric Wireframe Cube with Pulsing Vertex */}
            <path
              d="M24 7 L40 16 L24 25 L8 16 Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M8 16 L8 32 L24 41 L24 25"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M40 16 L40 32 L24 41"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="25" r="2.5" fill="var(--theme-red)" className="vertex-pulse" />
          </svg>
        </TactileStatCard>

        {/* Module 2: Builders Mentored */}
        <TactileStatCard
          index="02"
          number={`${buildersCount > 500 ? buildersCount : "3,000"}+`}
          label="Builders Mentored"
          subtitle="HackShastra & Hackathons"
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            className="micro-svg micro-nodes-svg"
            aria-hidden="true"
          >
            {/* Community Constellation Nodes with Animated Conduits */}
            <circle cx="24" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="34" r="3.5" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="36" cy="34" r="3.5" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M24 16 L12 30.5 M24 16 L36 30.5 M15.5 34 L32.5 34"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="3 3"
              strokeOpacity="0.65"
              className="conduit-dash"
            />
            <circle cx="24" cy="12" r="2" fill="var(--theme-red)" />
          </svg>
        </TactileStatCard>

        {/* Module 3: HackShastra Gatherings */}
        <TactileStatCard
          index="03"
          number={`${eventsCount || 6}+`}
          label="HackShastra Events"
          subtitle="Nationwide Summits & Sprints"
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            className="micro-svg micro-radar-svg"
            aria-hidden="true"
          >
            {/* Radar Orbit with Animated Sweep */}
            <circle
              cx="24"
              cy="24"
              r="18"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeOpacity="0.25"
            />
            <circle
              cx="24"
              cy="24"
              r="10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            <circle cx="24" cy="24" r="3" fill="var(--theme-red)" />
            <line
              x1="24"
              y1="24"
              x2="42"
              y2="24"
              stroke="var(--theme-red)"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="radar-needle"
            />
          </svg>
        </TactileStatCard>

        {/* Module 4: Years Creating */}
        <TactileStatCard
          index="04"
          number={`0${yearsCount}+`}
          label="Years Creating"
          subtitle="First Principles & 60 FPS Craft"
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            className="micro-svg micro-infinity-svg"
            aria-hidden="true"
          >
            {/* Flowing Infinity Loop */}
            <path
              d="M14 24 C14 18, 19 14, 24 24 C29 34, 34 30, 34 24 C34 18, 29 14, 24 24 C19 34, 14 30, 14 24 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              className="infinity-stream"
            />
            <circle cx="24" cy="24" r="2.5" fill="var(--theme-red)" />
          </svg>
        </TactileStatCard>
      </div>
    </section>
  );
}
