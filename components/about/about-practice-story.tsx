"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import { createDefaultAboutPageContent } from "@/lib/about-page-content";
import type { AboutPageContent } from "@/lib/validators/schemas";
import {
  ABOUT_STORY_MEDIA,
  ABOUT_STORY_STOPS,
  aboutStoryActiveChapter,
  aboutStoryFrame,
  canPinAboutStory,
  fitsAboutStoryStage,
} from "@/lib/about-story-motion";
import styles from "./about-practice-story.module.css";
import { cloudinaryLoader } from "@/lib/cloudinary/urls";

type StoryImage = {
  src: string;
  alt: string;
  title?: string;
  fit?: "cover" | "contain";
};

type AboutPracticeStoryProps = {
  builders: number;
  practiceImage?: StoryImage;
  practiceImage2?: StoryImage;
  workImage?: StoryImage;
  craftImage?: StoryImage;
  content?: AboutPageContent["practice"];
  communityImage: StoryImage & { width: number; height: number };
};

const defaultContent = createDefaultAboutPageContent().practice;

function subscribeToStoryMedia(onChange: () => void) {
  const media = window.matchMedia(ABOUT_STORY_MEDIA);
  media.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}

const storyViewport = () =>
  `${window.innerWidth}:${window.innerHeight}:${window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0}`;
const staticServerSnapshot = () => "0:0:1";
const firstServerChapter = () => 0;

function followChapterLink(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  if (document.documentElement.classList.contains("lenis")) {
    // Keep the native hash jump from racing Lenis. The click still bubbles to
    // its existing anchors:true listener, which owns the complete scroll.
    event.preventDefault();
    return;
  }
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    event.preventDefault();
    document.getElementById(event.currentTarget.hash.slice(1))?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  }
}

export default function AboutPracticeStory({
  builders,
  practiceImage,
  practiceImage2,
  workImage,
  craftImage,
  content = defaultContent,
  communityImage,
}: AboutPracticeStoryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewport = useSyncExternalStore(
    subscribeToStoryMedia,
    storyViewport,
    staticServerSnapshot,
  );
  const [width, height, reduced] = viewport.split(":").map(Number);
  const chapters = content.chapters;
  const contentKey = useMemo(() => JSON.stringify(chapters), [chapters]);
  const fitKey = `${viewport}:${contentKey}:${workImage?.title ?? ""}:${craftImage?.title ?? ""}:${practiceImage?.title ?? ""}:${practiceImage2?.title ?? ""}:${communityImage.title ?? ""}`;
  const [overflowKey, setOverflowKey] = useState<string | null>(null);
  const enhanced =
    canPinAboutStory(width, height, Boolean(reduced)) && overflowKey !== fitKey;
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
    trackContentSize: true,
  });
  const subscribeToChapter = useCallback(
    (onChange: () => void) => scrollYProgress.on("change", onChange),
    [scrollYProgress],
  );
  const currentChapter = useCallback(() => {
    return aboutStoryActiveChapter(scrollYProgress.get());
  }, [scrollYProgress]);
  // React updates only when the chapter changes; the scrub itself bypasses renders.
  const activeChapter = useSyncExternalStore(
    subscribeToChapter,
    currentChapter,
    firstServerChapter,
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!enhanced || !stage) return;
    let disposed = false;
    let frame = 0;
    const measure = () => {
      if (disposed) return;
      const fits = [
        ...stage.querySelectorAll<HTMLElement>("[data-story-chapter]"),
      ].every((chapter) => {
        const copy = chapter.querySelector<HTMLElement>("[data-story-copy]");
        const figure = chapter.querySelector<HTMLElement>(
          "[data-story-figure]",
        );
        const visual = chapter.querySelector<HTMLElement>(
          "[data-story-visual]",
        );
        return (
          copy &&
          figure &&
          visual &&
          fitsAboutStoryStage({
            stageHeight: chapter.clientHeight,
            copyTop: copy.offsetTop,
            copyHeight: copy.scrollHeight,
            figureTop: figure.offsetTop,
            figureHeight: figure.scrollHeight,
            visualHeight: visual.clientHeight,
          })
        );
      });
      if (!fits) setOverflowKey(fitKey);
    };
    const schedule = () => {
      if (disposed) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : undefined;
    observer?.observe(stage);
    stage
      .querySelectorAll<HTMLElement>("[data-story-copy], [data-story-figure]")
      .forEach((element) => observer?.observe(element));
    schedule();
    void document.fonts?.ready.then(schedule);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [enhanced, fitKey]);

  const fallbackImages = [
    {
      ...(workImage || communityImage),
      product: workImage?.fit
        ? workImage.fit === "contain"
        : Boolean(workImage),
    },
    {
      ...(practiceImage2 || craftImage || communityImage),
      product: practiceImage2?.fit
        ? practiceImage2.fit === "contain"
        : practiceImage2
          ? false
          : craftImage?.fit
            ? craftImage.fit === "contain"
            : Boolean(craftImage),
    },
    {
      ...(practiceImage || communityImage),
      product: practiceImage?.fit === "contain",
    },
  ];
  const images = chapters.map((chapter, index) =>
    chapter.image
      ? {
          src: chapter.image.url,
          alt: chapter.image.alt,
          product: chapter.image.fit === "contain",
        }
      : fallbackImages[index],
  );

  return (
    <section
      id="the-person"
      className={styles.story}
      aria-labelledby="about-practice-title"
      data-enhanced={enhanced ? "true" : undefined}
    >
      <div ref={trackRef} className={styles.track}>
        {enhanced &&
          ABOUT_STORY_STOPS.map((stop, index) => (
            <span
              key={stop}
              id={`practice-scroll-stop-${index + 1}`}
              className={styles.scrollStop}
              style={{ top: `calc((100% - var(--story-viewport)) * ${stop})` }}
              aria-hidden="true"
            />
          ))}
        <div className={styles.sticky}>
          <header className={styles.introduction}>
            <div className={styles.sectionLabel}>
              <span>01 / THE APPROACH</span>
              <span className={styles.labelRule} aria-hidden="true" />
              <span>THREE CONNECTED PARTS</span>
            </div>
            <div className={styles.introductionGrid}>
              <h2 id="about-practice-title" className={styles.sectionTitle}>
                {content.title}
                <span>
                  {content.subtitle} <em>{content.accent}</em>
                </span>
              </h2>
              <p className={styles.introductionNote}>
                {content.note}
                <ArrowDown size={22} strokeWidth={1.25} aria-hidden="true" />
              </p>
            </div>
          </header>
          <div className={styles.chapterBar}>
            <span className={styles.chapterBarLabel}>A CLOSER LOOK</span>
            <nav className={styles.chapterNav} aria-label="Explore how I work">
              {chapters.map((chapter, index) => (
                <a
                  href={`#practice-${enhanced ? "scroll-stop" : "chapter"}-${index + 1}`}
                  key={index}
                  onClick={followChapterLink}
                  aria-controls={`practice-chapter-${index + 1}`}
                  aria-current={
                    enhanced && activeChapter === index ? "step" : undefined
                  }
                >
                  <span>0{index + 1}</span>
                  <span>{chapter.label}</span>
                </a>
              ))}
            </nav>
          </div>

          <div ref={stageRef} className={styles.stage}>
            {chapters.map((chapter, index) => (
              <PracticeChapter
                key={index}
                index={index}
                chapter={chapter}
                image={images[index]}
                builders={builders}
                progress={scrollYProgress}
                enhanced={enhanced}
                active={activeChapter === index}
              />
            ))}
          </div>

          <div className={styles.storyFooter} aria-hidden="true">
            <span>0{activeChapter + 1} / 03</span>
            <div className={styles.progressTrack}>
              <motion.span style={{ scaleX: enhanced ? scrollYProgress : 1 }} />
            </div>
            <span>
              KEEP EXPLORING <ArrowDown size={13} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PracticeChapter({
  chapter,
  index,
  image,
  builders,
  progress,
  enhanced,
  active,
}: {
  chapter: AboutPageContent["practice"]["chapters"][number];
  index: number;
  image: StoryImage & { product: boolean };
  builders: number;
  progress: MotionValue<number>;
  enhanced: boolean;
  active: boolean;
}) {
  const opacity = useTransform(
    progress,
    (value) => aboutStoryFrame(index, value).opacity,
  );
  const travel = useTransform(
    progress,
    (value) => aboutStoryFrame(index, value).y,
  );
  const imageScale = useTransform(
    progress,
    (value) => aboutStoryFrame(index, value).imageScale,
  );
  const imageClip = useTransform(
    progress,
    (value) => `inset(0% ${aboutStoryFrame(index, value).revealInset}% 0% 0%)`,
  );
  const imageTravel = useTransform(travel, (value) => value * -0.35);

  return (
    <motion.article
      id={`practice-chapter-${index + 1}`}
      className={`${styles.chapter} ${styles[`chapter${index + 1}`]}`}
      data-story-chapter
      aria-labelledby={`practice-chapter-title-${index + 1}`}
      aria-hidden={enhanced && !active ? true : undefined}
      inert={enhanced && !active}
      style={{
        opacity: enhanced ? opacity : 1,
        pointerEvents: enhanced && !active ? "none" : "auto",
      }}
    >
      <motion.div
        className={styles.chapterCopy}
        data-story-copy
        style={{ y: enhanced ? travel : 0 }}
      >
        <p className={styles.chapterEyebrow}>
          <span>0{index + 1}</span>
          <span>{chapter.label}</span>
        </p>
        <h3
          id={`practice-chapter-title-${index + 1}`}
          className={styles.chapterTitle}
        >
          {chapter.title} <em>{chapter.accent}</em>
        </h3>
        <p className={styles.chapterDescription}>{chapter.body}</p>
        <div className={styles.chapterDetails}>
          {chapter.details.map((detail) => (
            <span key={detail}>{detail}</span>
          ))}
        </div>
        {index === 2 && (
          <Link
            className={styles.communityLink}
            href="https://hackshastra.in"
            target="_blank"
            rel="noreferrer"
          >
            Meet HackShastra <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        )}
      </motion.div>

      <motion.figure
        className={styles.figure}
        data-story-figure
        style={{ y: enhanced ? imageTravel : 0 }}
      >
        <motion.div
          className={`${styles.imageWindow} ${image.product ? styles.productWindow : ""}`}
          data-story-visual
          style={{ clipPath: enhanced ? imageClip : "none" }}
        >
          <motion.div
            className={styles.imageMotion}
            style={{
              scale: enhanced ? imageScale : 1,
            }}
          >
            <Image
              src={image.src}
              loader={cloudinaryLoader}
              alt={image.alt}
              fill
              sizes="(min-width: 1440px) 650px, (min-width: 700px) 51vw, 100vw"
              className={styles.photograph}
            />
          </motion.div>
          {index === 2 && (
            <div className={styles.communityCount}>
              <strong>
                {builders.toLocaleString()}
                <span>+</span>
              </strong>
              <span>BUILDERS MENTORED</span>
            </div>
          )}
        </motion.div>
        <span className={styles.imageIndex} aria-hidden="true">
          0{index + 1}
        </span>
        <figcaption className={styles.caption}>
          <span>
            {image.title && <strong>{image.title} · </strong>}
            {chapter.caption}
          </span>
          <span>0{index + 1} — 03</span>
        </figcaption>
      </motion.figure>
    </motion.article>
  );
}
