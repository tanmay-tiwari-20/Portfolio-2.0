import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUpRight, Maximize2 } from "lucide-react";
import type { ImageAsset, Project } from "@/lib/validators/schemas";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import {
  getProjectArtDirection,
  getProjectNeighbors,
} from "@/lib/work-content";
import { MotionLayer } from "@/components/shell";
import WorkMotion from "@/components/work/work-motion";
import {
  ProjectImage,
  ProjectLinks,
} from "@/components/work/project-primitives";

const shell = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-14";
const label =
  "text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--work-muted,#72554e)]";
const title = "font-display font-semibold leading-[1.05] tracking-[-0.065em]";
const heroSection = `${shell} pb-10 pt-3 sm:pb-12`;
const sectionHeading = "text-[clamp(2rem,min(3.6vw,6.5svh),3.6rem)]";
const accent = {
  scarlet: "text-[#a52e2b]",
  violet: "text-[#675071]",
  amber: "text-[#84582e]",
  blue: "text-[#3b586b]",
  sage: "text-[#426454]",
  neutral: "text-[#655553]",
} as const;
type Direction = ReturnType<typeof getProjectArtDirection>;

const featureHeadings: Record<string, [string, string]> = {
  unoverse: ["Play together.", "Your way."],
  spools: ["From a post", "to a circle."],
  "hackshastra-website": ["Built around", "community."],
  baithak: ["Every meeting,", "in one place."],
  "3d-shirt-showcaser": ["Change the look.", "See it live."],
  resumify: ["From upload", "to insight."],
  "apple-iphone-15-pro-website": ["Exploring form", "and motion."],
};

function ProjectMeta({ project }: { project: Project }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
      data-work-reveal="hero"
    >
      <p className="work-folio-tab m-0 max-w-[38ch] px-4 py-2 text-[10px] font-medium tracking-[0.11em] uppercase">
        {project.category}
      </p>
      <p className="m-0 font-[Georgia,serif] text-sm italic text-[#79534a]">
        {project.year}
      </p>
    </div>
  );
}

function HeroTools({ project }: { project: Project }) {
  if (!project.tags.length) return null;
  return (
    <p
      className="m-0 max-w-[58ch] text-[11px] leading-[1.9] text-[var(--work-muted,#72554e)]"
      data-work-reveal="hero"
    >
      {project.tags.slice(0, 4).join(" / ")}
    </p>
  );
}

function Screenshot({
  project,
  asset,
  hero = false,
  className = "",
  sizes = "(max-width: 700px) 100vw, 90vw",
  viewport,
}: {
  project: Project;
  asset?: ImageAsset;
  hero?: boolean;
  className?: string;
  sizes?: string;
  viewport?: "hero" | "wide" | "split";
}) {
  const image = asset || project.cover;
  return (
    <figure className={`m-0 min-w-0 ${className}`}>
      <a
        href={getOptimizedUrl(image.url, 2400)}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block rounded-sm focus-visible:outline-offset-8"
        aria-label={`Open ${image.alt || project.title} screenshot at full size (opens in a new tab)`}
        data-work-link
      >
        <ProjectImage
          project={project}
          asset={asset}
          priority={hero}
          hero={hero}
          sizes={sizes}
          viewport={viewport}
          annotation={hero ? "clip" : "tape"}
        />
        <span
          className="absolute right-4 bottom-12 flex h-9 w-9 items-center justify-center rounded-full bg-[#613d38]/90 text-[#fffaf7] shadow-sm transition-colors group-hover:bg-[#a52e2b]"
          aria-hidden="true"
        >
          <Maximize2 size={14} data-work-arrow />
        </span>
      </a>
      <figcaption className="mt-2 text-right text-[10px] leading-normal tracking-[0.06em] text-[var(--work-muted,#72554e)]">
        Open full image <span aria-hidden="true">↗</span>
      </figcaption>
    </figure>
  );
}

function ProjectHero({ project, art }: { project: Project; art: Direction }) {
  const headingSize =
    project.title.length > 18
      ? "text-[clamp(2.3rem,min(5.1vw,8.5svh),5.8rem)]"
      : "text-[clamp(3rem,min(7.3vw,9.7svh),6.8rem)]";
  if (art.layout === "studio") {
    return (
      <section className={heroSection} aria-labelledby="project-title">
        <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div className="min-w-0">
            <ProjectMeta project={project} />
            <h1
              id="project-title"
              className={`${title} mt-5 mb-4 break-words text-[clamp(2.3rem,min(4.5vw,7.8svh),5rem)]`}
              data-work-reveal="hero"
            >
              {project.title}
              <span className="text-[#a52e2b]">.</span>
            </h1>
            <p
              className={`m-0 max-w-[20ch] font-[Georgia,serif] text-[clamp(1.7rem,min(2.8vw,4.6svh),2.7rem)] leading-[1.17] italic ${accent[art.tone]}`}
              data-work-reveal="hero"
            >
              {art.statement}
            </p>
            <p
              className="mt-4 mb-0 max-w-[40ch] text-[14px] leading-[1.65] text-[var(--work-muted,#72554e)]"
              data-work-reveal="hero"
            >
              {art.summary}
            </p>
            <div className="mt-5 border-t border-dashed border-[var(--work-line,#72554e33)] pt-4">
              <HeroTools project={project} />
              <div className="mt-4" data-work-reveal="hero">
                <ProjectLinks project={project} />
              </div>
            </div>
          </div>
          <div className="min-w-0 pt-3 lg:pt-0">
            <Screenshot
              project={project}
              hero
              sizes="(max-width: 1023px) 90vw, 49vw"
              viewport="split"
            />
          </div>
        </div>
      </section>
    );
  }
  if (art.layout === "editorial") {
    return (
      <section className={heroSection} aria-labelledby="project-title">
        <ProjectMeta project={project} />
        <h1
          id="project-title"
          className={`${title} ${headingSize} mt-4 mb-6 break-words lg:mb-5`}
          data-work-reveal="hero"
        >
          {project.title}
          <span className="text-[#a52e2b]">.</span>
        </h1>
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <div
              className="work-note relative mb-5 max-w-[29rem] px-5 py-5 sm:px-6"
              data-work-reveal="hero"
            >
              <p
                className={`m-0 max-w-[20ch] font-[Georgia,serif] text-[clamp(1.8rem,min(2.9vw,4.8svh),3rem)] leading-[1.14] italic ${accent[art.tone]}`}
              >
                {art.statement}
              </p>
              <p className="mt-3 mb-0 max-w-[40ch] text-[14px] leading-[1.65] text-[#72554e]">
                {art.summary}
              </p>
            </div>
            <HeroTools project={project} />
            <div className="mt-4" data-work-reveal="hero">
              <ProjectLinks project={project} />
            </div>
          </div>
          <Screenshot
            project={project}
            hero
            sizes="(max-width: 1023px) 90vw, 60vw"
            viewport="split"
          />
        </div>
      </section>
    );
  }
  return (
    <section className={heroSection} aria-labelledby="project-title">
      <ProjectMeta project={project} />
      <div className="mt-3 grid items-end gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <h1
          id="project-title"
          className={`${title} ${headingSize} m-0 max-w-[18ch] break-words`}
          data-work-reveal="hero"
        >
          {project.title}
          <span className="text-[#a52e2b]">.</span>
        </h1>
        <div
          className="max-w-[48ch] border-l-2 border-[#b82f2b]/30 pl-5 lg:justify-self-end"
          data-work-reveal="hero"
        >
          <p
            className={`m-0 max-w-[26ch] font-[Georgia,serif] text-[clamp(1.6rem,min(2.3vw,4svh),2.5rem)] leading-[1.17] italic ${accent[art.tone]}`}
          >
            {art.statement}
          </p>
          <p className="mt-3 mb-0 text-[13px] leading-[1.65] text-[var(--work-muted,#72554e)]">
            {art.summary}
          </p>
        </div>
      </div>
      <div className="mt-3 mb-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-1 border-t border-dashed border-[var(--work-line,#72554e33)] pt-2">
        <HeroTools project={project} />
        <div data-work-reveal="hero">
          <ProjectLinks project={project} compact />
        </div>
      </div>
      <Screenshot
        project={project}
        hero
        sizes="(max-width: 700px) 90vw, 86vw"
        viewport="hero"
      />
    </section>
  );
}

function ProjectOverview({ project }: { project: Project }) {
  return (
    <section
      className={`${shell} py-6 sm:py-9`}
      aria-labelledby="project-overview"
    >
      <p
        className="work-folio-tab m-0 ml-5 w-fit px-5 py-2 text-[10px] font-medium tracking-[0.13em] uppercase"
        data-work-reveal
      >
        Project notes
      </p>
      <div className="work-sheet grid gap-7 p-6 sm:p-8 md:grid-cols-[0.7fr_1.3fr] md:gap-10 lg:p-10">
        <div data-work-reveal>
          <p className={`${label} m-0 mb-4`}>The idea</p>
          <h2
            id="project-overview"
            className={`${title} ${sectionHeading} m-0 max-w-[10ch] scroll-mt-28`}
          >
            A closer{" "}
            <em className="font-[Georgia,serif] font-normal text-[#a52e2b]">
              look.
            </em>
          </h2>
        </div>
        <div
          className="min-w-0 border-l border-[#b82f2b]/25 pl-5 sm:pl-7"
          data-work-reveal
        >
          <p className="m-0 max-w-[60ch] text-[clamp(1rem,1.3vw,1.2rem)] leading-[1.8] text-[var(--work-muted,#72554e)]">
            {project.description}
          </p>
          <dl className="mt-6 grid grid-cols-[1fr_auto] gap-5 border-t border-dashed border-[var(--work-line,#72554e33)] pt-5">
            <div>
              <dt className={label}>Discipline</dt>
              <dd className="m-0 mt-2 max-w-[30ch] text-[13px] text-[var(--work-ink,#321b20)]">
                {project.category}
              </dd>
            </div>
            <div>
              <dt className={label}>Year</dt>
              <dd className="m-0 mt-2 font-[Georgia,serif] text-base italic text-[#79534a]">
                {project.year}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function ProjectFeatures({
  art,
  project,
}: {
  art: Direction;
  project: Project;
}) {
  if (!art.features.length) return null;
  const isWorkflow = art.layout === "editorial";
  const [heading, ending] = featureHeadings[project.slug] || [
    "Inside",
    "the experience.",
  ];
  return (
    <section
      className={`${shell} py-9 sm:py-12`}
      aria-labelledby="project-features"
    >
      <div
        className="mb-7 flex flex-wrap items-end justify-between gap-6"
        data-work-reveal
      >
        <div>
          <p className={`${label} m-0 mb-3`}>Inside the experience</p>
          <h2
            id="project-features"
            className={`${title} ${sectionHeading} m-0 max-w-[19ch]`}
          >
            {heading}{" "}
            <em
              className={`font-[Georgia,serif] font-normal ${accent[art.tone]}`}
            >
              {ending}
            </em>
          </h2>
        </div>
        <span
          className="hidden rotate-[-5deg] font-[Georgia,serif] text-lg italic text-[#a52e2b] sm:inline"
          aria-hidden="true"
        >
          the details ↓
        </span>
      </div>
      <ol
        className={`work-sheet m-0 list-none border-t-[3px] border-t-[#a52e2b] px-5 py-2 sm:px-8 ${isWorkflow ? "grid sm:grid-cols-2 xl:grid-cols-3" : ""}`}
      >
        {art.features.map((feature, index) => (
          <li
            key={feature.title}
            className={
              isWorkflow
                ? "relative min-w-0 py-6 sm:pr-8 lg:pr-10"
                : "grid min-w-0 gap-4 border-b border-[var(--work-line,#72554e33)] py-6 last:border-b-0 sm:grid-cols-[3rem_1fr] sm:gap-7 lg:grid-cols-[3rem_1.1fr_1fr] lg:gap-10"
            }
            data-work-reveal
          >
            <span
              className={`font-[Georgia,serif] text-2xl italic ${accent[art.tone]} ${isWorkflow ? "mb-5 block border-b border-[#b82f2b]/20 pb-3" : ""}`}
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3
              className={`${title} m-0 text-[clamp(1.35rem,min(2.1vw,3.8svh),2.15rem)] ${isWorkflow ? "mb-4 max-w-[15ch]" : "max-w-[18ch]"}`}
            >
              {feature.title}
            </h3>
            <p
              className={`m-0 max-w-[43ch] text-[14px] leading-[1.8] text-[var(--work-muted,#72554e)] ${!isWorkflow ? "sm:col-start-2 lg:col-start-auto" : ""}`}
            >
              {feature.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProjectGallery({ project }: { project: Project }) {
  const images = project.gallery.filter(
    (image, index, all) =>
      image.url !== project.cover.url &&
      all.findIndex((item) => item.url === image.url) === index,
  );
  if (!images.length) return null;
  return (
    <section
      className={`${shell} py-9 sm:py-12`}
      aria-labelledby="project-gallery-title"
    >
      <div className="mb-8" data-work-reveal>
        <p className={`${label} m-0 mb-3`}>In detail</p>
        <h2
          id="project-gallery-title"
          className={`${title} ${sectionHeading} m-0`}
        >
          The contact{" "}
          <em className="font-[Georgia,serif] font-normal text-[#a52e2b]">
            sheet.
          </em>
        </h2>
      </div>
      <div className="grid items-start gap-x-8 gap-y-10 md:grid-cols-12">
        {images.map((asset, index) => (
          <Screenshot
            key={asset.url}
            project={project}
            asset={asset}
            className={
              index % 3 === 0
                ? "md:col-span-12"
                : index % 3 === 1
                  ? "md:col-span-7"
                  : "md:col-span-5 md:mt-12"
            }
            sizes={index % 3 === 0 ? "90vw" : "(max-width: 767px) 90vw, 55vw"}
            viewport={index % 3 === 0 ? "wide" : "split"}
          />
        ))}
      </div>
    </section>
  );
}

function ProjectStack({ art }: { art: Direction }) {
  if (!art.stack.length) return null;
  return (
    <section
      className={`${shell} py-9 sm:py-12`}
      aria-labelledby="project-stack"
    >
      <div className="rounded-sm bg-[#713139] p-2.5 shadow-[0_14px_38px_-24px_#321b2066] sm:p-3">
        <div className="work-sheet grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-10 lg:p-10">
          <div data-work-reveal>
            <p className={`${label} m-0 mb-4`}>Under the surface</p>
            <h2
              id="project-stack"
              className={`${title} ${sectionHeading} m-0 max-w-[9ch]`}
            >
              The building{" "}
              <em className="font-[Georgia,serif] font-normal text-[#a52e2b]">
                blocks.
              </em>
            </h2>
            <span
              className="mt-6 hidden h-px w-16 bg-[#a52e2b]/40 lg:block"
              aria-hidden="true"
            />
          </div>
          <dl className="m-0 min-w-0 border-l border-[#b82f2b]/25 pl-5 sm:pl-7">
            {art.stack.map((group, index) => (
              <div
                key={group.label}
                className={
                  index
                    ? "mt-5 border-t border-[var(--work-line,#72554e33)] pt-5"
                    : ""
                }
                data-work-reveal
              >
                <dt className={`${label} mb-2`}>{group.label}</dt>
                <dd className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display text-[clamp(1.05rem,1.65vw,1.55rem)] font-medium leading-[1.7] tracking-[-0.025em] text-[var(--work-ink,#321b20)]">
                  {group.items.map((item, itemIndex) => (
                    <span
                      className="inline-flex min-w-0 items-baseline gap-3"
                      key={item}
                    >
                      {itemIndex > 0 && (
                        <span
                          className="text-[0.6em] text-[#a52e2b]/60"
                          aria-hidden="true"
                        >
                          /
                        </span>
                      )}
                      <span className="break-words">{item}</span>
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function ProjectNavigation({
  project,
  projects,
}: {
  project: Project;
  projects: Project[];
}) {
  const { previous, next } = getProjectNeighbors(projects, project.slug);
  return (
    <nav className={`${shell} py-10 sm:py-14`} aria-label="Project navigation">
      <div
        className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-[var(--work-line,#72554e33)] pb-3"
        data-work-reveal
      >
        <p className={`${label} m-0`}>Next on the desk</p>
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center gap-2 text-xs text-[var(--work-muted,#72554e)] transition-colors hover:text-[#a52e2b]"
          data-work-link
        >
          <ArrowLeft size={14} data-work-arrow aria-hidden="true" /> All work
        </Link>
      </div>
      {next && (
        <Link
          href={`/projects/${next.slug}`}
          className="group grid min-w-0 items-center gap-7 pb-9 md:grid-cols-[1.2fr_0.8fr] md:gap-12"
          data-work-link
        >
          <div className="min-w-0" data-work-reveal>
            <p className={`${label} m-0 mb-4`}>
              Next project <span aria-hidden="true">↗</span>
            </p>
            <h2
              className={`${title} ${sectionHeading} m-0 flex items-end gap-5 transition-colors group-hover:text-[#a52e2b]`}
            >
              <span className="min-w-0 break-words">{next.title}</span>
              <ArrowUpRight
                className="mb-1 hidden h-[0.7em] w-[0.7em] shrink-0 text-[#a52e2b] sm:block"
                strokeWidth={1}
                data-work-arrow
                aria-hidden="true"
              />
            </h2>
            <p className="mt-4 mb-0 text-xs text-[var(--work-muted,#72554e)]">
              {next.category}
              <span className="px-2" aria-hidden="true">
                /
              </span>
              {next.year}
            </p>
          </div>
          <ProjectImage
            project={next}
            sizes="(max-width: 767px) 90vw, 36vw"
            annotation="tape"
            className="transition-transform duration-300 motion-safe:group-hover:-translate-y-1"
          />
        </Link>
      )}
      {previous && (
        <Link
          href={`/projects/${previous.slug}`}
          className="group grid min-w-0 grid-cols-[1fr_5rem] items-center gap-5 border-t border-dashed border-[var(--work-line,#72554e33)] py-6 sm:grid-cols-[1fr_9rem]"
          data-work-link
        >
          <div className="min-w-0" data-work-reveal>
            <p className={`${label} m-0 mb-2`}>Previous project</p>
            <span className="inline-flex min-w-0 items-center gap-3 font-display text-[clamp(1rem,2vw,1.7rem)] font-medium leading-[1.25] tracking-[-0.035em] transition-colors group-hover:text-[#a52e2b]">
              <ArrowLeft
                size={18}
                className="shrink-0"
                data-work-arrow
                aria-hidden="true"
              />
              <span className="min-w-0 break-words">{previous.title}</span>
            </span>
          </div>
          <ProjectImage
            project={previous}
            sizes="144px"
            bare
            annotation="none"
          />
        </Link>
      )}
    </nav>
  );
}

export default function ProjectCaseStudy({
  project,
  projects,
}: {
  project: Project;
  projects: Project[];
}) {
  const art = getProjectArtDirection(project);
  return (
    <WorkMotion
      key={project.slug}
      className="work-desk-surface relative isolate min-w-0 overflow-x-clip"
    >
      <div data-work-paper-hero>
        <div
          className={`${shell} flex flex-wrap items-center justify-between gap-4 pt-24 lg:pt-[90px]`}
        >
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-3 text-xs text-[var(--work-muted,#72554e)] transition-colors hover:text-[#a52e2b]"
            data-work-link
          >
            <ArrowLeft size={15} data-work-arrow aria-hidden="true" /> All work
          </Link>
          <a
            href="#project-overview"
            className="inline-flex min-h-11 items-center gap-3 text-xs text-[var(--work-muted,#72554e)] transition-colors hover:text-[#a52e2b]"
            data-work-link
          >
            Read the notes{" "}
            <ArrowDown size={14} data-work-arrow aria-hidden="true" />
          </a>
        </div>
        <ProjectHero project={project} art={art} />
      </div>
      <ProjectOverview project={project} />
      <ProjectFeatures art={art} project={project} />
      <ProjectGallery project={project} />
      <ProjectStack art={art} />
      <ProjectNavigation project={project} projects={projects} />
      <MotionLayer />
    </WorkMotion>
  );
}
