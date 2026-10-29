"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
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
  duration = 2.4,
}: SkiperTextRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const progress = useMotionValue(shouldReduceMotion ? 1 : 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();

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

    const controls = animate(progress, 1, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.25,
    });

    return () => controls.stop();
  }, [progress, shouldReduceMotion, duration]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-3 font-normal leading-[1.75] text-[#cfc5bf] ${className}`}
    >
      {lines.map((line, lIdx) => {
        const lineWords = line.split(/\s+/).filter((w) => w.length > 0);
        return (
          <div key={`${uniqueId}-line-${lIdx}`} className="flex flex-wrap items-center">
            {lineWords.map((rawWord, wIdx) => {
              const overallIdx = wordsList.findIndex(
                (item) => item.lineIndex === lIdx && item.wordIndex === wIdx,
              );
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
}) {
  // Skiper70 exact mathematical distribution formula
  const m = wordIndex / totalWords;
  const f =
    1 /
    Math.min(
      1 + 15 / totalWords,
      1 + (totalWords - 1) / totalWords + 15 / totalWords,
    );
  const p = m * f;
  const x = (m + 15 / totalWords) * f;
  const h = x - p;

  const g = useTransform(progress, [p, x], [0, 1]);
  const b = useTransform(progress, [p + 0.9 * h, x], [1, 0]);
  const v = useTransform(progress, [p + 0.9 * h, x], [0, 1]);

  const isHighlighted = cleanWord.toLowerCase() === highlight.toLowerCase();

  if (isHighlighted) {
    return (
      <motion.span
        className="relative mx-1 my-0.5 inline-flex items-center"
        style={{ opacity: g }}
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
      style={{ opacity: g }}
    >
      {/* Skiper70 box background that flashes during the reveal */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[82%] w-[108%] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white/10"
        style={{ opacity: b }}
      />
      {/* Word text */}
      <motion.span className="relative z-10" style={{ opacity: v }}>
        {rawWord}
      </motion.span>
    </motion.span>
  );
}

