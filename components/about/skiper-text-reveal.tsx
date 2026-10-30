"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type SkiperTextRevealProps = {
  children: string;
  highlight?: string;
  highlightTextClass?: string;
  highlightBgClass?: string;
  highlightLink?: string;
  className?: string;
  duration?: number;
};

type WordData = {
  word: string;
  cleanWord: string;
  lineIndex: number;
  wordIndex: number;
  trailingChar: string;
};

export default function SkiperTextReveal({
  children,
  highlight = "HackShastra",
  highlightTextClass = "!text-[#ff7a6b] font-black",
  highlightBgClass = "!bg-[#ef463e]/20 border border-[#ef463e]/50 shadow-[0_0_18px_rgba(239,70,62,0.35)]",
  highlightLink = "https://hackshastra.in",
  className = "",
  duration = 1.8,
}: SkiperTextRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const progress = useMotionValue(shouldReduceMotion ? 1 : 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [preloaderComplete, setPreloaderComplete] = useState(false);
  const uniqueId = useId();

  useEffect(() => {
    const markReady = () => setPreloaderComplete(true);
    const root = document.documentElement;

    if (
      root.dataset.preloaderComplete === "true" ||
      (!root.classList.contains("portfolio-loading") &&
        !document.querySelector(".site-preloader"))
    ) {
      markReady();
      return;
    }

    window.addEventListener("portfolio:preloader-complete", markReady, {
      once: true,
    });
    return () =>
      window.removeEventListener("portfolio:preloader-complete", markReady);
  }, []);

  // Split lines and words according to skiper70 specification
  const lines = children.split(/\n+/);
  const wordsList: WordData[] = [];

  lines.forEach((line, lIdx) => {
    line
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .forEach((rawWord, wIdx) => {
        // Strip trailing punctuation (like comma or period) for exact match
        const match = rawWord.match(/^([^,.]+)([,.]?)$/);
        const cleanWord = match ? match[1] : rawWord;
        const trailingChar = match ? match[2] : "";

        wordsList.push({
          word: rawWord,
          cleanWord,
          lineIndex: lIdx,
          wordIndex: wIdx,
          trailingChar,
        });
      });
  });

  const totalWords = wordsList.length;

  useEffect(() => {
    if (shouldReduceMotion) {
      progress.set(1);
      return;
    }
    if (!preloaderComplete) return;

    const controls = animate(progress, 1, {
      duration,
      ease: "linear",
      delay: 0.16,
    });

    return () => controls.stop();
  }, [progress, shouldReduceMotion, preloaderComplete, duration]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-3 font-normal leading-[1.75] text-[#cfc5bf] ${className}`}
    >
      {lines.map((line, lIdx) => {
        const lineWords = line.split(/\s+/).filter((w) => w.length > 0);
        const lineStart = wordsList.findIndex((item) => item.lineIndex === lIdx);
        return (
          <div key={`${uniqueId}-line-${lIdx}`} className="flex flex-wrap items-center">
            {lineWords.map((rawWord, wIdx) => {
              const overallIdx = lineStart + wIdx;
              const wordItem = wordsList[overallIdx];
              if (!wordItem) return null;

              return (
                <WordReveal
                  key={`${uniqueId}-${lIdx}-${wIdx}`}
                  progress={progress}
                  wordIndex={overallIdx}
                  totalWords={totalWords}
                  rawWord={rawWord}
                  cleanWord={wordItem.cleanWord}
                  trailingChar={wordItem.trailingChar}
                  highlight={highlight}
                  highlightTextClass={highlightTextClass}
                  highlightBgClass={highlightBgClass}
                  highlightLink={highlightLink}
                  revealActive={preloaderComplete && !shouldReduceMotion}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function WordReveal({
  progress,
  wordIndex,
  totalWords,
  rawWord,
  cleanWord,
  trailingChar,
  highlight,
  highlightTextClass,
  highlightBgClass,
  highlightLink,
  revealActive,
}: {
  progress: MotionValue<number>;
  wordIndex: number;
  totalWords: number;
  rawWord: string;
  cleanWord: string;
  trailingChar: string;
  highlight: string;
  highlightTextClass: string;
  highlightBgClass: string;
  highlightLink: string;
  revealActive: boolean;
}) {
  // Skiper70 exact mathematical distribution formula
  const m = wordIndex / totalWords;
  const spread = 15 / totalWords;
  const f = 1 / (1 + spread);
  const p = m * f;
  const x = (m + spread) * f;
  const h = x - p;

  const g = useTransform(progress, [p, x], [0, 1]);
  const b = useTransform(progress, [p + 0.55 * h, x], [0.72, 0]);
  const v = useTransform(progress, [p + 0.55 * h, x], [0, 1]);
  const lift = useTransform(progress, [p, x], [8, 0]);
  const blur = useTransform(progress, [p, x], ["blur(6px)", "blur(0px)"]);

  const isHighlighted = cleanWord.toLowerCase() === highlight.toLowerCase();

  if (isHighlighted) {
    return (
      <motion.span
        className="relative mx-1 my-0.5 inline-flex items-center"
        style={{
          opacity: revealActive ? g : 1,
          y: revealActive ? lift : 0,
          filter: revealActive ? blur : "blur(0px)",
        }}
      >
        {/* Persistent highlighted pill with link to HackShastra */}
        <a
          href={highlightLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`group relative inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 font-bold tracking-wide no-underline transition-all duration-300 hover:scale-105 ${highlightBgClass} ${highlightTextClass}`}
          title={`Visit ${cleanWord} website (${highlightLink})`}
        >
          <span className="relative z-10 transition-colors group-hover:text-white">
            {cleanWord}
          </span>
          <ArrowUpRight
            size={12}
            className="relative z-10 text-current transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </a>
        {trailingChar && (
          <span className="ml-0.5 text-[#cfc5bf]">{trailingChar}</span>
        )}
      </motion.span>
    );
  }

  return (
    <motion.span
      className="relative mx-1 inline-block text-white/90 lg:mx-1.5"
      style={{
        opacity: revealActive ? g : 1,
        y: revealActive ? lift : 0,
        filter: revealActive ? blur : "blur(0px)",
      }}
    >
      {/* Skiper70 box background that flashes during the reveal */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[88%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white/30 shadow-[0_0_16px_rgba(255,255,255,0.14)]"
        style={{ opacity: revealActive ? b : 0 }}
      />
      {/* Word text */}
      <motion.span
        className="relative z-10"
        style={{ opacity: revealActive ? v : 1 }}
      >
        {rawWord}
      </motion.span>
    </motion.span>
  );
}

