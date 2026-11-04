"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { Project } from "@/lib/validators/schemas";
import { getProjectArtDirection } from "@/lib/work-content";
import {
  ProjectImage,
  ProjectLinks,
} from "@/components/work/project-primitives";
import WorkMotion from "@/components/work/work-motion";

function ProjectEntry({ project, index }: { project: Project; index: number }) {
  const art = getProjectArtDirection(project);
  const largePrint = art.layout === "cinema";
  const printFirst = index % 2 === 0;
  const href = `/projects/${project.slug}`;
  return (
    <article
      id={`work-${project.slug}`}
      aria-labelledby={`title-${project.slug}`}
      className="relative grid scroll-mt-8 items-center gap-8 border-b border-dashed border-[#72554e40] py-12 last:border-b-0 lg:grid-cols-12 lg:gap-12 lg:py-[clamp(44px,7svh,84px)]"
    >
      <div
        data-work-reveal
        className={`min-w-0 ${largePrint ? "lg:col-span-4" : "lg:col-span-5"} ${printFirst ? "lg:order-2" : ""}`}
      >
        <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-medium tracking-[0.12em] text-[#72554e] uppercase">
          <span className="border border-[#a52e2b]/35 px-2 py-1 font-mono text-[#a52e2b]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{project.category}</span>
        </p>
        <h2
          id={`title-${project.slug}`}
          aria-label={project.title}
          className="font-display m-0 text-[clamp(2.2rem,min(3.9vw,6.8svh),3.8rem)] leading-[1.08] font-medium tracking-[-0.06em] text-[#361e22]"
        >
          <Link
            data-work-link
            href={href}
            className="inline-flex max-w-full items-start gap-3 transition-colors hover:text-[#a52e2b]"
          >
            <span className="min-w-0 break-words">{art.shortTitle}</span>
            <ArrowUpRight
              data-work-arrow
              className="mt-[0.2em] h-[0.55em] w-[0.55em] shrink-0 text-[#a52e2b]"
              aria-hidden="true"
            />
          </Link>
        </h2>
        <div
          className={
            art.layout === "studio"
              ? "work-note mt-6 px-5 py-4"
              : "mt-5 border-l-2 border-[#b82f2b]/35 pl-4"
          }
        >
          <p className="m-0 font-[Georgia,serif] text-[clamp(1.3rem,2vw,1.75rem)] leading-[1.3] italic text-[#a52e2b]">
            {art.statement}
          </p>
        </div>
        <p className="mt-5 mb-0 max-w-[43ch] text-[14px] leading-[1.8] text-[#72554e]">
          {art.summary}
        </p>
        <p className="mt-5 mb-0 max-w-[46ch] border-t border-[#72554e30] pt-4 text-[11px] leading-[1.9] text-[#613d38]">
          {project.tags.slice(0, 5).join(" / ")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1">
          <Link
            data-work-link
            href={href}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#a52e2b] underline decoration-[#a52e2b]/30 underline-offset-4 transition-colors hover:text-[#682722]"
          >
            Open project
            <ArrowUpRight data-work-arrow size={14} aria-hidden="true" />
          </Link>
          <ProjectLinks project={project} compact />
        </div>
      </div>
      <div
        className={`min-w-0 py-3 ${largePrint ? "lg:col-span-8" : "lg:col-span-7"} ${printFirst ? "lg:order-1" : ""}`}
      >
        <Link
          data-work-link
          href={href}
          aria-label={`Explore the ${project.title} project`}
          className={`group relative block transition-transform duration-500 motion-safe:hover:-translate-y-1 ${index % 3 === 0 ? "lg:-rotate-[1.1deg]" : index % 3 === 1 ? "lg:rotate-[1.2deg]" : "lg:-rotate-[0.6deg]"} motion-safe:lg:hover:rotate-0`}
        >
          <ProjectImage
            project={project}
            viewport={largePrint ? "wide" : "split"}
            annotation={index % 2 === 0 ? "clip" : "tape"}
            sizes="(max-width: 1023px) 90vw, (max-width: 1600px) 55vw, 850px"
          />
          <span className="absolute right-5 bottom-14 flex h-10 w-10 items-center justify-center rounded-full border border-[#72554e]/20 bg-[#fffaf1] text-[#a52e2b] shadow-sm">
            <ArrowUpRight data-work-arrow size={18} aria-hidden="true" />
          </span>
        </Link>
      </div>
    </article>
  );
}

export default function ProjectGallery({ projects }: { projects: Project[] }) {
  const [selectedTag, setSelectedTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const tags = useMemo(
    () =>
      Array.from(new Set(projects.flatMap((project) => project.tags))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [projects],
  );
  const visible = useMemo(
    () =>
      projects.filter(
        (project) =>
          (!selectedTag || project.tags.includes(selectedTag)) &&
          [
            project.title,
            project.description,
            project.category,
            ...project.tags,
          ]
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.trim().toLowerCase()),
      ),
    [projects, searchQuery, selectedTag],
  );
  const filtered = Boolean(selectedTag || searchQuery);
  return (
    <section
      id="project-index"
      aria-label="Explore projects"
      className="work-desk-surface scroll-mt-4 px-5 pt-7 pb-8 sm:px-9 lg:px-14"
    >
      <div className="mx-auto max-w-[1440px]">
        <span className="work-folio-tab ml-4">Project index</span>
        <div className="work-sheet flex flex-col justify-between gap-5 px-5 py-5 sm:px-7 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display m-0 text-[clamp(1.5rem,2.4vw,2rem)] font-medium tracking-[-0.045em]">
              Take a closer{" "}
              <em className="font-[Georgia,serif] text-[#a52e2b]">look.</em>
            </h2>
            <p
              className="mt-1 mb-0 text-[11px] text-[#72554e]"
              aria-live="polite"
              aria-atomic="true"
            >
              {visible.length} {visible.length === 1 ? "project" : "projects"}{" "}
              to explore
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#886960]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search projects"
                placeholder="Find a project or technology"
                className="min-h-11 w-full rounded-sm border border-[#72554e]/25 bg-[#f3e9dd]/60 py-2 pr-8 pl-9 text-xs text-[#361e22] placeholder:text-[#72554e] focus:border-[#a52e2b]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute top-0 right-0 flex h-11 w-9 items-center justify-center text-[#72554e]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              aria-label="Filter by technology or topic"
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
              className="min-h-11 min-w-0 rounded-sm border border-[#72554e]/25 bg-[#fffaf1] px-3 text-xs text-[#613d38] sm:max-w-56"
            >
              <option value="">All technologies & topics</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setSelectedTag("");
              setSearchQuery("");
            }}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs text-[#a52e2b]"
          >
            <X size={14} aria-hidden="true" /> Reset filters
          </button>
        )}
        {visible.length ? (
          <WorkMotion
            key={`${selectedTag}:${searchQuery.trim()}`}
            className="min-w-0"
          >
            {visible.map((project) => (
              <ProjectEntry
                key={project.id}
                project={project}
                index={projects.indexOf(project)}
              />
            ))}
          </WorkMotion>
        ) : (
          <div className="py-14 sm:py-24">
            <h3 className="font-display text-3xl tracking-[-0.04em]">
              {projects.length
                ? "Nothing in this drawer."
                : "New work is on its way."}
            </h3>
            <p className="mt-4 text-sm text-[#72554e]">
              {projects.length
                ? "Try another search or reset the filters to see the collection."
                : "Come back soon to explore the next project."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
