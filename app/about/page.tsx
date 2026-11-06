import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { published, repos } from "@/lib/db";
import {
  resolveAboutMoments,
  resolveAboutPopOut,
  resolveAboutPracticeImage,
} from "@/lib/about-gallery";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { resolveAboutPageContent } from "@/lib/about-page-content";
import { BUILDERS_MENTORED_COUNT } from "@/lib/profile-metrics";
import RadialPopOut from "@/components/about/radial-pop-out";
import AboutDetails from "@/components/about/about-details";
import AboutMotion from "@/components/about/about-motion";
import SignatureReveal from "@/components/about/signature-reveal";
import { MotionLayer } from "@/components/shell";
import styles from "./about-hero.module.css";
import { pageMetadata, pageGraph } from "@/lib/seo";
import SeoJsonLd from "@/components/seo-json-ld";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata("about");

export default async function AboutPage() {
  const [profiles, settingsRows, experiences, hackathons, projects] =
    await Promise.all([
      published(repos.profile),
      published(repos.settings),
      published(repos.experiences),
      published(repos.hackathons),
      published(repos.projects),
    ]);

  const profile = profiles[0];
  const settings = settingsRows[0];
  const aboutContent = resolveAboutPageContent(settings?.aboutPage);
  const location = profile?.location || "New Delhi, India";
  const gallery = resolveAboutPopOut(settings?.aboutPopOut, profile?.avatar);
  const centerId =
    gallery.images.find((image) => image.id === gallery.centerId)?.id ??
    gallery.images[0]?.id;
  const signatureImageSources = gallery.images
    .filter((image) => image.id !== centerId)
    .slice(0, 6)
    .map((image) => getOptimizedUrl(image.url, 960));
  const moments = resolveAboutMoments(settings?.aboutMoments);
  const practiceImage = resolveAboutPracticeImage(settings?.aboutPracticeImage);
  const practiceImage2 = resolveAboutPracticeImage(
    settings?.aboutPracticeImage2,
  );
  const featuredHackathons = hackathons.slice(0, 4);
  const builderCount = BUILDERS_MENTORED_COUNT;
  const workProject =
    projects.find((project) => project.slug === "unoverse") ?? projects[0];
  const craftProject =
    projects.find((project) => project.slug === "hackshastra-website") ??
    projects[1];

  return (
    <div className="about-page relative isolate overflow-hidden bg-[#090708] text-[#fffaf7]">
      <SeoJsonLd data={pageGraph("about")} />
      <section className="hero about-hero" aria-labelledby="about-title">
        <div className={styles.texture} aria-hidden="true" />
        <div className="hero-grid about-hero-grid">
          <div className="about-hero-copy min-w-0">
            <p
              className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[9px] leading-normal font-medium tracking-[0.14em] text-(--theme-paper)/65 uppercase sm:mb-7 [@media(min-width:1061px)_and_(min-height:821px)]:text-[10px] [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:mb-4 [@media(min-width:761px)_and_(max-height:600px)]:mb-3"
              data-about-kicker
            >
              <span className="h-px w-6 bg-[#edbd83]" aria-hidden="true" />
              <span>About Tanmay Tiwari</span>
              <span className="text-[#edbd83]/50" aria-hidden="true">
                /
              </span>
              <span>{location}</span>
            </p>

            <h1
              id="about-title"
              aria-label="About Tanmay Tiwari: From 3D games to hackathon halls."
              className="m-0 font-display text-[clamp(2.2rem,4.5vw,4.1rem)] leading-[1.08] font-semibold tracking-[-0.065em] text-(--theme-paper) max-[760px]:text-[clamp(2rem,9.5vw,3.9rem)] [@media(min-width:1061px)_and_(min-height:821px)]:text-[clamp(2.2rem,5vw,4.6rem)] [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:text-[clamp(2.2rem,4vw,3.5rem)] [@media(min-width:761px)_and_(max-height:600px)]:text-[clamp(1.875rem,3.6vw,2.2rem)]"
              data-about-intro
            >
              <span className="block">From 3D games</span>{" "}
              <em className="mt-1 block font-[Georgia,serif] text-[1.08em] leading-[1.05] font-normal tracking-[-0.055em] text-[#edbd83]">
                to hackathon halls.
              </em>
            </h1>

            <div className={styles.bio} data-about-intro>
              <p className="m-0">
                I’m Tanmay Tiwari, a{" "}
                <span className={styles.highlight}>full-stack developer</span>{" "}
                and{" "}
                <span className="whitespace-nowrap">
                  co-founder of{" "}
                  <a
                    href="https://hackshastra.in"
                    target="_blank"
                    rel="noreferrer"
                    className={`${styles.highlight} ${styles.company} underline decoration-[#edbd83]/60 underline-offset-4 transition-colors duration-200 hover:text-[#edbd83] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#edbd83]`}
                  >
                    HackShastra
                  </a>
                  .
                </span>
              </p>
              <p className={styles.summary}>
                I build web products, organise hackathons, and mentor students
                turning ideas into{" "}
                <span className={`${styles.highlight} ${styles.outcome}`}>
                  working projects
                </span>
                .
              </p>
            </div>

            <div
              className="mt-5 w-full max-w-[20rem] md:mt-6 md:max-w-md [@media(min-width:1061px)_and_(min-height:821px)]:max-w-124 [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:mt-3 [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:max-w-[min(28rem,56vh)] [@media(min-width:761px)_and_(max-height:600px)]:mt-2 [@media(min-width:761px)_and_(max-height:600px)]:max-w-[min(24rem,48vh)]"
              data-about-intro
            >
              <SignatureReveal
                imageSources={signatureImageSources}
                className="[@media(min-width:1061px)_and_(min-height:821px)]:max-w-full"
              />
            </div>

            <div
              className="mt-4 flex max-w-md flex-wrap items-center gap-x-7 gap-y-1 border-t border-(--theme-paper)/20 pt-2 [@media(min-width:1061px)_and_(min-height:821px)]:max-w-124 [@media(min-width:761px)_and_(min-height:601px)_and_(max-height:740px)]:mt-2 [@media(min-width:761px)_and_(max-height:600px)]:pt-0"
              data-about-intro
            >
              <Link
                className="group inline-flex min-h-11 items-center gap-2 text-[11px] font-semibold text-(--theme-paper) transition-colors duration-200 hover:text-[#edbd83] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#edbd83] [@media(min-width:1061px)_and_(min-height:821px)]:text-[12px]"
                href="#the-person"
              >
                More about me
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                className="group inline-flex min-h-11 items-center gap-2 text-[11px] font-medium text-(--theme-paper)/65 transition-colors duration-200 hover:text-(--theme-paper) focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#edbd83] [@media(min-width:1061px)_and_(min-height:821px)]:text-[12px]"
                href="/hackshastra"
              >
                Explore HackShastra
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          <div className="hero-art about-hero-art" data-about-visual>
            <div
              className="about-art-orbit about-art-orbit-outer"
              aria-hidden="true"
            />
            <div
              className="about-art-orbit about-art-orbit-inner"
              aria-hidden="true"
            />
            <RadialPopOut
              gallery={gallery}
              cardSize={245}
              heroSize={350}
              radius={250}
              jitter={3.5}
              stagger={0.018}
              shift={0.025}
            />
            <div className="about-gallery-caption" aria-hidden="true">
              <span>PEOPLE, PLACES & PRACTICE</span>
              <span>Moments from the work</span>
            </div>
          </div>
        </div>

        <a className="hero-scroll-cue about-scroll-cue" href="#the-person">
          <span className="hero-scroll-line" aria-hidden="true" />
          Scroll to explore
        </a>
      </section>

      <AboutDetails
        content={aboutContent}
        builders={builderCount}
        location={location}
        moments={moments}
        experiences={experiences}
        hackathons={featuredHackathons}
        practiceImage={practiceImage}
        practiceImage2={practiceImage2}
        workImage={
          workProject
            ? {
                src: getOptimizedUrl(workProject.cover.url, 1400),
                alt: workProject.cover.alt || workProject.title,
                title: workProject.title,
                fit: workProject.cover.fit ?? "contain",
              }
            : undefined
        }
        craftImage={
          craftProject
            ? {
                src: getOptimizedUrl(craftProject.cover.url, 1400),
                alt: craftProject.cover.alt || craftProject.title,
                title: craftProject.title,
                fit: craftProject.cover.fit ?? "contain",
              }
            : undefined
        }
      />
      <AboutMotion />
      <MotionLayer />
    </div>
  );
}
