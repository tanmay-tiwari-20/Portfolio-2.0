import Image from "next/image";
import { ArrowUpRight, GitBranch } from "lucide-react";
import type { ImageAsset, Project } from "@/lib/validators/schemas";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import {
  getProjectArtDirection,
  getProjectLinks,
  type ProjectTone,
} from "@/lib/work-content";

const mats: Record<ProjectTone, string> = {
  scarlet: "bg-[#e4cbbf]",
  violet: "bg-[#dcd2df]",
  amber: "bg-[#e9d8b8]",
  blue: "bg-[#cfdce0]",
  sage: "bg-[#d5dfcf]",
  neutral: "bg-[#dfd8d0]",
};

/** The paper owns the full height budget; only its image well is clipped. */
export function ProjectImage({
  project,
  asset = project.cover,
  priority = false,
  className = "",
  hero = false,
  sizes = "(max-width: 767px) 92vw, (max-width: 1536px) 80vw, 1400px",
  bare = false,
  viewport,
  annotation = "none",
  caption,
}: {
  project: Project;
  asset?: ImageAsset;
  priority?: boolean;
  className?: string;
  hero?: boolean;
  sizes?: string;
  bare?: boolean;
  viewport?: "hero" | "wide" | "split";
  annotation?: "tape" | "clip" | "none";
  caption?: string;
}) {
  const { tone } = getProjectArtDirection(project);
  const knownRatio =
    asset.width && asset.height && asset.width > 0 && asset.height > 0;
  const wide = viewport === "wide";
  return (
    <div
      className={`work-print relative flex min-w-0 flex-col ${bare ? "work-print-small" : ""} ${viewport === "hero" ? "lg:h-[clamp(220px,40svh,560px)]" : wide ? "md:h-[clamp(240px,55svh,720px)]" : viewport === "split" ? "lg:h-[clamp(240px,44svh,600px)]" : ""} ${className}`}
    >
      {!bare && annotation !== "none" && (
        <span
          className={annotation === "tape" ? "work-tape" : "work-clip"}
          aria-hidden="true"
        />
      )}
      <div
        data-work-image={hero ? "hero" : ""}
        data-work-viewport={viewport}
        className={`relative min-h-0 overflow-hidden ${mats[tone]} ${wide ? "md:flex-1" : viewport ? "lg:flex-1" : ""}`}
      >
        <div
          data-work-image-inner
          className={`relative w-full ${knownRatio ? "" : "aspect-video"} ${wide ? "md:aspect-auto md:h-full" : viewport ? "lg:aspect-auto lg:h-full" : ""}`}
          style={
            knownRatio
              ? { aspectRatio: `${asset.width} / ${asset.height}` }
              : undefined
          }
        >
          <Image
            src={getOptimizedUrl(asset.url, priority ? 2000 : 1600)}
            alt={
              asset.alt && asset.alt !== project.title
                ? asset.alt
                : `Screenshot of ${project.title}`
            }
            fill
            sizes={sizes}
            priority={priority}
            className="object-contain"
          />
        </div>
      </div>
      {!bare && (
        <div className="flex min-h-10 shrink-0 items-center justify-between gap-4 px-1 pt-2 text-[10px] text-[#72554e]">
          <span className="min-w-0 truncate font-medium">
            {caption ?? (asset.alt || project.title)}
          </span>
          <span className="shrink-0 font-mono text-[9px] tracking-wider">
            {project.year}
          </span>
        </div>
      )}
    </div>
  );
}

export function ProjectLinks({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  const { live, github } = getProjectLinks(project);
  if (!live && !github) return null;
  return (
    <div
      className={`flex flex-wrap items-center ${compact ? "gap-x-5 gap-y-1" : "gap-3"}`}
    >
      {live && (
        <a
          data-work-link
          href={live}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${project.title} live (opens in a new tab)`}
          className={
            compact
              ? "inline-flex min-h-11 items-center gap-2 text-xs text-(--work-muted) transition-colors hover:text-(--work-accent)"
              : "inline-flex min-h-12 items-center justify-center gap-6 rounded-full bg-[#9e302f] px-6 py-3 text-sm font-medium text-[#fffaf7] transition-colors hover:bg-[#792525]"
          }
        >
          {compact ? "Live site" : "Visit live site"}
          <ArrowUpRight data-work-arrow size={16} aria-hidden="true" />
        </a>
      )}
      {github && (
        <a
          data-work-link
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${project.title} source code (opens in a new tab)`}
          className={
            compact
              ? "inline-flex min-h-11 items-center gap-2 text-xs text-(--work-muted) transition-colors hover:text-(--work-accent)"
              : "inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-(--work-line) px-5 py-3 text-sm text-(--work-ink) transition-colors hover:border-(--work-accent)"
          }
        >
          <GitBranch size={15} aria-hidden="true" />
          {compact ? "Source" : "Source code"}
          <ArrowUpRight data-work-arrow size={15} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
