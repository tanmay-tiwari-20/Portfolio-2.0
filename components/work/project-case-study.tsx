import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Images,
  Maximize2,
} from "lucide-react";
import type { ImageAsset, Project } from "@/lib/validators/schemas";
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
import {
  ProjectScreenshotProvider,
  ProjectScreenshotTrigger,
} from "@/components/work/project-screenshot-viewer";

const shell = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-14";
const label =
  "text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--work-muted,#72554e)]";
const title = "font-display font-semibold leading-[1.05] tracking-[-0.065em]";
const heroSection = `${shell} pb-8 pt-4 sm:pb-10 sm:pt-6`;
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
      className="m-0 max-w-[58ch] text-[11px] leading-[1.9] text-(--work-muted,#72554e)"
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
  number = 1,
}: {
  project: Project;
  asset?: ImageAsset;
  hero?: boolean;
  className?: string;
  sizes?: string;
  viewport?: "hero" | "wide" | "split";
  number?: number;
}) {
  const image = asset || project.cover;
  return (
    <figure className={`project-screenshot m-0 min-w-0 ${className}`}>
      <ProjectScreenshotTrigger
        imageUrl={image.url}
        className="project-screenshot-trigger group relative block w-full text-left"
        ariaLabel={`View ${image.alt || project.title} screenshot`}
      >
        <ProjectImage
          project={project}
          asset={asset}
          priority={hero}
          hero={hero}
          sizes={sizes}
          viewport={viewport}
          annotation="none"
          caption={
            hero
              ? `${project.title} · Project preview`
              : image.alt || `${project.title} · Screenshot ${number}`
          }
          className="project-screenshot-print"
        />
        <span
          className="project-screenshot-expand absolute right-5 top-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#361e22]/90 px-3 text-[11px] font-medium text-[#fffaf7] shadow-sm transition-colors group-hover:bg-[#a52e2b]"
          aria-hidden="true"
        >
          <Maximize2 size={14} />
          <span className="hidden sm:inline">View screenshot</span>
        </span>
      </ProjectScreenshotTrigger>
      <figcaption className="mt-3 flex items-center justify-between gap-4 text-[10px] leading-normal tracking-[0.08em] text-(--work-muted,#72554e)">
        <span className="font-mono">
          {String(number).padStart(2, "0")} /{" "}
          {hero ? "PROJECT PREVIEW" : "SCREENSHOT"}
        </span>
        <span>
          Click to explore <span aria-hidden="true">＋</span>
        </span>
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
              className={`${title} mt-5 mb-4 wrap-break-word text-[clamp(2.3rem,min(4.5vw,7.8svh),5rem)]`}
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
              className="mt-4 mb-0 max-w-[40ch] text-[14px] leading-[1.65] text-(--work-muted,#72554e)"
              data-work-reveal="hero"
            >
              {art.summary}
            </p>
            <div className="mt-5 border-t border-dashed border-(--work-line,#72554e33) pt-4">
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
          className={`${title} ${headingSize} mt-4 mb-6 wrap-break-word lg:mb-5`}
          data-work-reveal="hero"
        >
          {project.title}
          <span className="text-[#a52e2b]">.</span>
        </h1>
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <div
              className="work-note relative mb-5 max-w-116 px-5 py-5 sm:px-6"
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
          className={`${title} ${headingSize} m-0 max-w-[18ch] wrap-break-word`}
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
          <p className="mt-3 mb-0 text-[13px] leading-[1.65] text-(--work-muted,#72554e)">
            {art.summary}
          </p>
        </div>
      </div>
      <div className="mt-3 mb-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-1 border-t border-dashed border-(--work-line,#72554e33) pt-2">
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
            Project{" "}
            <em className="font-[Georgia,serif] font-normal text-[#a52e2b]">
              overview.
            </em>
          </h2>
        </div>
        <div
          className="min-w-0 border-l border-[#b82f2b]/25 pl-5 sm:pl-7"
          data-work-reveal
        >
          <p className="m-0 max-w-[60ch] text-[clamp(1rem,1.3vw,1.2rem)] leading-[1.8] text-(--work-muted,#72554e)">
            {project.description}
          </p>
          {project.slug === "hackshastra-website" && (
            <p className="mt-4 mb-0 text-sm leading-relaxed text-(--work-muted,#72554e)">
              <Link
                href="/hackshastra"
                className="underline underline-offset-4 transition-colors hover:text-[#a52e2b]"
              >
                Explore the HackShastra community and its events
              </Link>{" "}
              behind this platform.
            </p>
          )}
          <dl className="mt-6 grid grid-cols-[1fr_auto] gap-5 border-t border-dashed border-(--work-line,#72554e33) pt-5">
            <div>
              <dt className={label}>Discipline</dt>
              <dd className="m-0 mt-2 max-w-[30ch] text-[13px] text-(--work-ink,#321b20)">
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
                : "grid min-w-0 gap-4 border-b border-(--work-line,#72554e33) py-6 sm:grid-cols-[3rem_1fr] sm:gap-7 lg:grid-cols-[3rem_1.1fr_1fr] lg:gap-10"
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
              className={`m-0 max-w-[43ch] text-[14px] leading-[1.8] text-(--work-muted,#72554e) ${!isWorkflow ? "sm:col-start-2 lg:col-start-auto" : ""}`}
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
      <div
        className="mb-8 flex flex-wrap items-end justify-between gap-5"
        data-work-reveal
      >
        <div>
          <p className={`${label} m-0 mb-3`}>A closer look</p>
          <h2
            id="project-gallery-title"
            className={`${title} ${sectionHeading} m-0 scroll-mt-28`}
          >
            Project{" "}
            <em className="font-[Georgia,serif] font-normal text-[#a52e2b]">
              screenshots.
            </em>
          </h2>
          <p className="mt-4 mb-0 max-w-[45ch] text-sm leading-relaxed text-(--work-muted)">
            Explore the screens and details. Select any image for a closer look.
          </p>
        </div>
        <ProjectScreenshotTrigger
          imageUrl={images[0].url}
          className="project-browse-button inline-flex min-h-11 items-center gap-3 rounded-full border border-(--work-line) bg-[#fffaf1] px-5 text-xs font-medium"
          ariaLabel={`Browse all ${images.length + 1} screenshots of ${project.title}`}
        >
          <Images size={15} aria-hidden="true" />
          Browse all{" "}
          <span className="text-(--work-muted)">
            {String(images.length + 1).padStart(2, "0")}
          </span>
        </ProjectScreenshotTrigger>
      </div>
      <div className="grid items-start gap-x-7 gap-y-9 md:grid-cols-2">
        {images.map((asset, index) => (
          <Screenshot
            key={asset.url}
            project={project}
            asset={asset}
            number={index + 2}
            className={
              images.length % 2 === 1 && index === 0 ? "md:col-span-2" : ""
            }
            sizes={
              images.length % 2 === 1 && index === 0
                ? "90vw"
                : "(max-width: 767px) 90vw, 44vw"
            }
            viewport={images.length % 2 === 1 && index === 0 ? "wide" : "split"}
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
              Technologies{" "}
              <em className="font-[Georgia,serif] font-normal text-[#a52e2b]">
                & tools.
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
                    ? "mt-5 border-t border-(--work-line,#72554e33) pt-5"
                    : ""
                }
                data-work-reveal
              >
                <dt className={`${label} mb-2`}>{group.label}</dt>
                <dd className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display text-[clamp(1.05rem,1.65vw,1.55rem)] font-medium leading-[1.7] tracking-tight text-(--work-ink,#321b20)">
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
                      <span className="wrap-break-word">{item}</span>
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
        className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-(--work-line,#72554e33) pb-3"
        data-work-reveal
      >
        <p className={`${label} m-0`}>Next on the desk</p>
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center gap-2 text-xs text-(--work-muted,#72554e) transition-colors hover:text-[#a52e2b]"
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
              <span className="min-w-0 wrap-break-word">{next.title}</span>
              <ArrowUpRight
                className="mb-1 hidden h-[0.7em] w-[0.7em] shrink-0 text-[#a52e2b] sm:block"
                strokeWidth={1}
                data-work-arrow
                aria-hidden="true"
              />
            </h2>
            <p className="mt-4 mb-0 text-xs text-(--work-muted,#72554e)">
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
          className="group grid min-w-0 grid-cols-[1fr_5rem] items-center gap-5 border-t border-dashed border-(--work-line,#72554e33) py-6 sm:grid-cols-[1fr_9rem]"
          data-work-link
        >
          <div className="min-w-0" data-work-reveal>
            <p className={`${label} m-0 mb-2`}>Previous project</p>
            <span className="inline-flex min-w-0 items-center gap-3 font-display text-[clamp(1rem,2vw,1.7rem)] font-medium leading-tight tracking-[-0.035em] transition-colors group-hover:text-[#a52e2b]">
              <ArrowLeft
                size={18}
                className="shrink-0"
                data-work-arrow
                aria-hidden="true"
              />
              <span className="min-w-0 wrap-break-word">{previous.title}</span>
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
  const screenshots = [project.cover, ...project.gallery].filter(
    (image, index, all) =>
      all.findIndex((item) => item.url === image.url) === index,
  );
  return (
    <ProjectScreenshotProvider
      key={project.slug}
      images={screenshots}
      title={project.title}
    >
      <WorkMotion
        key={project.slug}
        className="work-desk-surface project-case-study relative isolate min-w-0 overflow-x-clip"
      >
        <div data-work-paper-hero>
          <div
            className={`${shell} flex flex-wrap items-center justify-between gap-4 pt-24 lg:pt-22.5`}
          >
            <nav aria-label="Breadcrumb">
              <ol className="m-0 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0 text-xs text-(--work-muted,#72554e)">
                <li>
                  <Link
                    href="/"
                    className="inline-flex min-h-11 items-center transition-colors hover:text-[#a52e2b]"
                  >
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href="/projects"
                    className="inline-flex min-h-11 items-center transition-colors hover:text-[#a52e2b]"
                  >
                    Work
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="max-w-[32ch] break-words">
                  {project.title}
                </li>
              </ol>
            </nav>
            <a
              href="#project-overview"
              className="inline-flex min-h-11 items-center gap-3 text-xs text-(--work-muted,#72554e) transition-colors hover:text-[#a52e2b]"
              data-work-link
            >
              Read the notes{" "}
              <ArrowDown size={14} data-work-arrow aria-hidden="true" />
            </a>
          </div>
          <ProjectHero project={project} art={art} />
        </div>
        <div className={`${shell} mb-3 sm:mb-6`}>
          <div className="project-section-index flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-y border-(--work-line) py-3">
            <nav
              aria-label="On this project"
              className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-medium"
            >
              <a href="#project-overview">Overview</a>
              {screenshots.length > 1 && (
                <a href="#project-gallery-title">Screenshots</a>
              )}
              {art.features.length > 0 && (
                <a href="#project-features">Experience</a>
              )}
              {art.stack.length > 0 && <a href="#project-stack">Tech stack</a>}
            </nav>
            <ProjectScreenshotTrigger
              imageUrl={project.cover.url}
              className="project-browse-button inline-flex min-h-11 items-center gap-2 text-xs font-medium text-[#a52e2b]"
              ariaLabel={`Browse screenshots of ${project.title}`}
            >
              <Images size={15} aria-hidden="true" />
              {screenshots.length}{" "}
              {screenshots.length === 1 ? "screenshot" : "screenshots"}
              <Maximize2 size={12} aria-hidden="true" />
            </ProjectScreenshotTrigger>
          </div>
        </div>
        <ProjectOverview project={project} />
        <ProjectGallery project={project} />
        <ProjectFeatures art={art} project={project} />
        <ProjectStack art={art} />
        <ProjectNavigation project={project} projects={projects} />
        <MotionLayer />
      </WorkMotion>
    </ProjectScreenshotProvider>
  );
}
