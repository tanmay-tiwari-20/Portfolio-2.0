"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Experience } from "@/lib/validators/schemas";

type Props = {
  experiences: Experience[];
};

export default function HomeExperienceJourney({ experiences }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const companies = Array.from(
    new Set(experiences.map(({ company }) => company.trim()).filter(Boolean)),
  );
  const highlightedCompanies = companies.slice(0, 2);
  const remainingCompanies = companies.length - highlightedCompanies.length;
  const overview = companies.length
    ? `Recent roles with ${highlightedCompanies.join(" and ")}${
        remainingCompanies ? ` and ${remainingCompanies} more` : ""
      }.`
    : "Recent roles and contributions.";

  useEffect(() => {
    const section = sectionRef.current;
    const progress = progressRef.current;
    if (!section || !progress) return;

    const milestones = Array.from(
      section.querySelectorAll<HTMLElement>(".journey-milestone"),
    );
    if (milestones.length === 0) return;

    const companyNames = milestones
      .map((milestone) =>
        milestone.querySelector<HTMLElement>(".journey-company-name"),
      )
      .filter((companyName): companyName is HTMLElement =>
        Boolean(companyName),
      );
    const detailCopy = Array.from(
      section.querySelectorAll<HTMLElement>(
        ".journey-role, .journey-description",
      ),
    );
    const indexMarks = Array.from(
      section.querySelectorAll<HTMLElement>(".journey-milestone-index"),
    );
    const headingLines = Array.from(
      section.querySelectorAll<HTMLElement>(".journey-heading-line"),
    );
    const animatedElements = [
      ...companyNames,
      ...detailCopy,
      ...indexMarks,
      ...headingLines,
    ];

    let disposed = false;
    let context: { revert: () => void } | undefined;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;

        gsap.registerPlugin(ScrollTrigger);
        context = gsap.context(() => {
          const motion = gsap.matchMedia();

          motion.add("(prefers-reduced-motion: no-preference)", () => {
            gsap.fromTo(
              progress,
              { scaleX: 0 },
              {
                scaleX: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top 70%",
                  end: "bottom 45%",
                  scrub: 0.45,
                  invalidateOnRefresh: true,
                },
              },
            );

            headingLines.forEach((line) => {
              gsap.fromTo(
                line,
                { opacity: 0.25, y: 64, rotateX: -14 },
                {
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  ease: "none",
                  scrollTrigger: {
                    trigger: section,
                    start: "top 92%",
                    end: "top 38%",
                    scrub: 0.55,
                    invalidateOnRefresh: true,
                  },
                },
              );
            });

            milestones.forEach((milestone, index) => {
              const companyName = milestone.querySelector<HTMLElement>(
                ".journey-company-name",
              );
              const indexMark = milestone.querySelector<HTMLElement>(
                ".journey-milestone-index",
              );
              const role =
                milestone.querySelector<HTMLElement>(".journey-role");
              const description = milestone.querySelector<HTMLElement>(
                ".journey-description",
              );
              const direction = index % 2 === 0 ? -1 : 1;
              const isNarrow = () =>
                window.matchMedia("(max-width: 640px)").matches;
              const sequence = gsap.timeline({
                scrollTrigger: {
                  trigger: milestone,
                  start: "top 90%",
                  end: "bottom 64%",
                  scrub: 0.25,
                  invalidateOnRefresh: true,
                },
              });

              if (indexMark) {
                sequence.fromTo(
                  indexMark,
                  {
                    opacity: 0.12,
                    x: () => direction * (isNarrow() ? 24 : 54),
                    scale: 0.55,
                    rotate: direction * -14,
                  },
                  {
                    opacity: 0.8,
                    x: 0,
                    scale: 1,
                    rotate: 0,
                    ease: "none",
                    duration: 0.75,
                  },
                  0,
                );
              }

              if (companyName) {
                sequence.fromTo(
                  companyName,
                  {
                    opacity: 0.25,
                    y: () => (isNarrow() ? 32 : 48),
                    scale: 0.92,
                  },
                  {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    ease: "none",
                    duration: 0.68,
                  },
                  0.02,
                );
              }

              if (role) {
                sequence.fromTo(
                  role,
                  { opacity: 0.2, y: 22 },
                  {
                    opacity: 1,
                    y: 0,
                    ease: "none",
                    duration: 0.34,
                  },
                  0.3,
                );
              }

              if (description) {
                sequence.fromTo(
                  description,
                  { opacity: 0.2, y: 18 },
                  {
                    opacity: 1,
                    y: 0,
                    ease: "none",
                    duration: 0.34,
                  },
                  0.68,
                );
              }
            });
          });

          motion.add("(prefers-reduced-motion: reduce)", () => {
            gsap.set(progress, { scaleX: 1 });
            gsap.set(animatedElements, { clearProps: "opacity,transform" });
          });

          return () => motion.revert();
        }, section);

        ScrollTrigger.refresh();
        void document.fonts?.ready.then(() => {
          if (!disposed) ScrollTrigger.refresh();
        });
      })
      .catch(() => {
        context?.revert();
        if (disposed) return;
        progress.style.transform = "scaleX(1)";
        animatedElements.forEach((element) => {
          element.style.opacity = "1";
          element.style.transform = "none";
        });
      });

    return () => {
      disposed = true;
      context?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="home-journey section-shell"
      aria-labelledby="journey-title"
    >
      <div className="journey-section-label reveal">
        <span>03 / The journey</span>
        <span className="journey-label-rule" aria-hidden="true" />
      </div>

      <div className="journey-heading-row reveal">
        <h2 className="display" id="journey-title">
          <span className="journey-heading-line">Shipping software.</span>
          <em className="journey-heading-line">Building community.</em>
        </h2>
        <div className="journey-heading-aside">
          <p className="journey-overview">{overview}</p>
          <Link href="/experience" className="journey-more-link">
            Explore the full journey
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="journey-progress" aria-hidden="true">
        <span ref={progressRef} className="journey-progress-fill" />
      </div>

      {experiences.length ? (
        <div className="journey-stage">
          {experiences.map((experience, index) => (
            <article className="journey-milestone reveal" key={experience.id}>
              <span className="journey-milestone-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="journey-milestone-meta">
                <p className="journey-period">{experience.period}</p>
                <p className="journey-location">{experience.location}</p>
              </div>
              <h3 className="journey-company-name">{experience.company}</h3>
              <p className="journey-role">{experience.role}</p>
              {experience.description.trim() && (
                <p className="journey-description">{experience.description}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="journey-empty">No roles published yet.</p>
      )}
    </section>
  );
}
