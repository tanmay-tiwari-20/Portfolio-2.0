"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

type AboutPracticeStoryProps = {
  builders: number;
  communityImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

type Chapter = {
  number: string;
  label: string;
  title: string;
  body: string;
  tags: string[];
};

const chapters: Chapter[] = [
  {
    number: "01",
    label: "Engineering / foundations",
    title: "Make it hold up.",
    body: "I like clear structure and reliable foundations. Good engineering should make the next decision easier, from the first interaction to the data behind it.",
    tags: ["Full stack", "TypeScript", "Product systems"],
  },
  {
    number: "02",
    label: "Craft / interaction",
    title: "Make it feel alive.",
    body: "The details carry intent: hierarchy, movement, type, and the moment an interface responds. I care about making useful things feel natural to use.",
    tags: ["Interaction", "Motion", "Visual systems"],
  },
  {
    number: "03",
    label: "Community / practice",
    title: "Make room to build.",
    body: "The work gets better when more people can take part. Through HackShastra, I help builders learn by making things together.",
    tags: ["HackShastra", "Learning by doing", "3,000+ builders"],
  },
];

export default function AboutPracticeStory({
  builders,
  communityImage,
}: AboutPracticeStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeChapter, setActiveChapter] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const value = scrollYProgress.get();
    setActiveChapter(value < 0.34 ? 0 : value < 0.67 ? 1 : 2);
  }, [scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const nextChapter = value < 0.34 ? 0 : value < 0.67 ? 1 : 2;
    setActiveChapter((current) =>
      current === nextChapter ? current : nextChapter,
    );
  });

  return (
    <section
      ref={sectionRef}
      id="the-person"
      className={`about-practice${reduceMotion ? " about-practice--reduced" : ""}`}
      aria-labelledby="about-practice-title"
    >
      <div className="about-practice-sticky">
        <div className="section-shell about-practice-shell">
          <div className="about-practice-lead">
            <div className="about-section-label">
              <span>01</span><i aria-hidden="true" /><span>How I work</span>
            </div>
            <h2 id="about-practice-title">
              A practice made of <em>three parts.</em>
            </h2>
            <p>
              Keep scrolling. Each part changes the way I approach the next.
            </p>
            <div className="about-practice-steps" aria-label="Practice chapters">
              {chapters.map((chapter, index) => (
                <div
                  className={`about-practice-step${activeChapter === index ? " is-active" : ""}`}
                  aria-current={activeChapter === index ? "step" : undefined}
                  key={chapter.number}
                >
                  <span>{chapter.number}</span>
                  <span>{chapter.label.split(" /")[0]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="about-practice-stage">
            <div className="about-practice-progress" aria-hidden="true">
              <motion.span style={{ width: reduceMotion ? "100%" : progressWidth }} />
            </div>

            <div className="about-practice-scenes">
              {reduceMotion ? (
                chapters.map((chapter, index) => (
                  <PracticeScene
                    builders={builders}
                    chapter={chapter}
                    communityImage={communityImage}
                    index={index}
                    key={chapter.number}
                    reducedMotion
                  />
                ))
              ) : (
                <AnimatePresence initial={false} mode="wait">
                  <PracticeScene
                    builders={builders}
                    chapter={chapters[activeChapter]}
                    communityImage={communityImage}
                    index={activeChapter}
                    key={chapters[activeChapter].number}
                    reducedMotion={false}
                  />
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PracticeScene({
  builders,
  chapter,
  communityImage,
  index,
  reducedMotion,
}: {
  builders: number;
  chapter: Chapter;
  communityImage: AboutPracticeStoryProps["communityImage"];
  index: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.article
      className={`about-practice-scene about-practice-scene-${index + 1}`}
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -18, scale: 0.99 }}
      transition={reducedMotion ? undefined : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="about-practice-copy">
        <p className="about-practice-kicker">
          <span>{chapter.number}</span>{chapter.label}
        </p>
        <h3>{chapter.title}</h3>
        <p className="about-practice-description">{chapter.body}</p>
        <div className="about-practice-tags">
          {chapter.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        {index === 2 && (
          <Link
            className="about-practice-link"
            href="https://hackshastra.in"
            target="_blank"
            rel="noreferrer"
          >
            Visit HackShastra <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className={`about-practice-visual about-practice-visual-${index + 1}`} aria-hidden="true">
        {index === 0 && (
          <div className="about-system-card">
            <div className="about-system-topline">
              <span><i /><i /><i /></span>
              <small>PRODUCT / SYSTEMS</small>
              <span>01:24</span>
            </div>
            <div className="about-system-stack">
              <span className="about-system-node about-system-node-top">A clear interface</span>
              <i />
              <div className="about-system-split">
                <span className="about-system-node">Thoughtful logic</span>
                <span className="about-system-node">Reliable data</span>
              </div>
              <i />
              <span className="about-system-node about-system-node-bottom">A product people can trust</span>
            </div>
            <div className="about-system-foot"><span>STRUCTURE FIRST</span><span>READY TO GROW <b>↗</b></span></div>
          </div>
        )}
        {index === 1 && (
          <div className="about-craft-card">
            <span className="about-craft-caption">DETAIL CHANGES THE FEELING</span>
            <div className="about-craft-type">Aa<span>.</span></div>
            <div className="about-craft-rule" />
            <div className="about-craft-controls"><i /><i /><i /><span>RESPONSIVE / INTENTIONAL / ALIVE</span></div>
            <div className="about-craft-orb" />
          </div>
        )}
        {index === 2 && (
          <div className="about-community-scene-image">
            <Image
              src={communityImage.src}
              alt={communityImage.alt}
              width={communityImage.width}
              height={communityImage.height}
              sizes="(max-width: 760px) 75vw, 440px"
              unoptimized
            />
            <div className="about-community-scene-count">
              <strong>{builders.toLocaleString()}+</strong>
              <span>builders, learning together</span>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}
