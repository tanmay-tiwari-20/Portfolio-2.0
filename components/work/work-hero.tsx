"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Grip, RotateCcw } from "lucide-react";
import type { Project } from "@/lib/validators/schemas";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { getProjectArtDirection } from "@/lib/work-content";
import { useDeskInteraction } from "@/components/work/use-desk-interaction";
import styles from "./desk-hero.module.css";

export default function WorkHero({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const featured = projects.filter((project) => project.featured);
  const prints = (featured.length ? featured : projects).slice(0, 4);
  useDeskInteraction(root, prints.map((project) => project.slug).join("|"));

  return (
    <section
      ref={root}
      data-work-desk-hero
      aria-labelledby="work-title"
      className={styles.hero}
    >
      <div className="relative z-10 mx-auto w-full max-w-[800px] px-5 text-center">
        <p
          data-work-reveal="hero"
          className="mb-3 flex items-center justify-center gap-2.5 text-[10px] font-medium tracking-[0.18em] text-[#79534a] uppercase"
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#b82f2b]"
            aria-hidden="true"
          />{" "}
          A selection from my desk
        </p>
        <h1
          id="work-title"
          aria-label="Selected work — ideas out in the open"
          className="font-display m-0 text-[clamp(2.5rem,min(5vw,8svh),5rem)] leading-[1.02] font-semibold tracking-[-0.065em] text-[#361e22]"
        >
          <span data-work-reveal="hero" className="block">
            Ideas, out in
          </span>
          <em
            data-work-reveal="hero"
            className="block font-[Georgia,serif] text-[1.12em] font-normal tracking-[-0.055em] text-[#b82f2b]"
          >
            the open.
          </em>
        </h1>
        <p
          data-work-reveal="hero"
          className="mx-auto mt-3 mb-0 max-w-[43ch] text-[13px] leading-[1.65] text-[#72554e] sm:text-sm"
        >
          A few things I’ve built. Pick one up, move it around, see where it
          takes you.
        </p>
        <div
          data-work-reveal="hero"
          className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          <a
            data-work-link
            href="#project-index"
            className="inline-flex min-h-11 items-center gap-5 rounded-full bg-[#a52e2b] px-5 py-2.5 text-xs font-medium text-[#fffaf7] transition-colors hover:bg-[#812221]"
          >
            Explore all work
            <ArrowDown data-work-arrow size={14} aria-hidden="true" />
          </a>
          <Link
            data-work-link
            href="/contact"
            className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-[#613d38] transition-colors hover:text-[#a52e2b]"
          >
            Have an idea?
            <ArrowUpRight data-work-arrow size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div
        data-desk-stage
        data-desk-count={prints.length}
        className={styles.stage}
        aria-label="Interactive project desk"
      >
        <span className={styles.deskMark} aria-hidden="true">
          <span>Made with</span>
          <em>curiosity.</em>
        </span>
        {prints.map((project, index) => (
          <div
            key={project.id}
            data-desk-slot
            data-desk-index={index}
            className={styles.slot}
          >
            <article
              data-desk-print
              className={styles.print}
              aria-label={`${project.title} project print`}
            >
              <div data-work-reveal="hero" className={styles.paper}>
                {index === 0 && (
                  <span className={styles.clip} aria-hidden="true" />
                )}
                {index === 2 && (
                  <span className={styles.tape} aria-hidden="true" />
                )}
                <button
                  type="button"
                  data-desk-grab
                  className={styles.imageButton}
                  aria-label={`Open ${project.title}. Drag to move its print.`}
                  aria-describedby="desk-keyboard-help"
                >
                  <span className={styles.imageFrame}>
                    <Image
                      src={getOptimizedUrl(project.cover.url, 1000)}
                      alt={project.cover.alt || `${project.title} preview`}
                      fill
                      sizes="(max-width: 639px) 43vw, (max-width: 1023px) 34vw, 300px"
                      priority={index < 2}
                      draggable={false}
                      className="pointer-events-none object-contain"
                    />
                  </span>
                  <span
                    data-desk-grip
                    className={styles.grip}
                    title="Drag this grip to move the print"
                  >
                    <Grip size={15} aria-hidden="true" />
                  </span>
                </button>
                <div className={styles.caption}>
                  <Link
                    data-desk-open
                    data-work-link
                    href={`/projects/${project.slug}`}
                    className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 text-[#361e22]"
                    aria-label={`Explore ${project.title}`}
                  >
                    <span className="min-w-0">
                      <span className={styles.projectName}>
                        {getProjectArtDirection(project).shortTitle}
                      </span>
                      <span className={styles.projectCategory}>
                        {project.category}
                      </span>
                    </span>
                    <ArrowUpRight
                      data-work-arrow
                      size={16}
                      className="shrink-0 text-[#a52e2b]"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className="m-0 flex items-center gap-2 text-[11px] text-[#72554e]">
          <span
            className="h-1 w-1 rounded-full bg-[#a52e2b]"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            Pick up a print. Make yourself at home.
          </span>
          <span className="sm:hidden">Move with the grip. Tap to explore.</span>
        </p>
        {prints.length > 0 && (
          <button
            type="button"
            data-desk-reset
            className="group inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[11px] font-medium text-[#613d38] transition-colors hover:bg-[#d4b9a8]/40"
          >
            <RotateCcw
              size={13}
              className="transition-transform duration-300 motion-safe:group-hover:-rotate-90"
              aria-hidden="true"
            />
            Tidy desk
          </button>
        )}
      </div>
      <p id="desk-keyboard-help" className="sr-only">
        Use arrow keys to move a focused print, or Shift and arrow keys for
        larger steps. Home or Escape returns it to its starting position. Enter
        opens the project. On a touch screen, drag the small grip to move a
        print.
      </p>
    </section>
  );
}
