"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import React, { useRef } from "react";

type SkiperCharacterProps = {
  char: string;
  index: number;
  centerIndex: number;
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean | null;
  rangeStart: number;
  rangePeak: number;
  rangeEnd: number;
  baseY?: number;
  spreadFactor?: number;
  rotateFactor?: number;
};

/**
 * Individual character emerging upwards from down with 3D perspective rotation,
 * letter-spacing convergence, and parabolic height curve.
 */
function KineticCharacter({
  char,
  index,
  centerIndex,
  scrollYProgress,
  reducedMotion,
  rangeStart,
  rangePeak,
  rangeEnd,
  baseY = 85,
  spreadFactor = 10,
  rotateFactor = 30,
}: SkiperCharacterProps) {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  // Text physically emerges from DOWN:
  const y = useTransform(
    scrollYProgress,
    [rangeStart, rangePeak, rangeEnd],
    [baseY + Math.abs(distanceFromCenter) * 3, 0, -30],
  );

  // 3D forward tilt as it rises:
  const rotateX = useTransform(
    scrollYProgress,
    [rangeStart, rangePeak, rangeEnd],
    [rotateFactor, 0, -14],
  );

  // Subtle horizontal convergence:
  const x = useTransform(
    scrollYProgress,
    [rangeStart, rangePeak],
    [distanceFromCenter * spreadFactor, 0],
  );

  return (
    <motion.span
      className={
        isSpace
          ? "skiper31-char skiper31-char-space"
          : "skiper31-char"
      }
      style={{
        y: reducedMotion ? 0 : y,
        rotateX: reducedMotion ? 0 : rotateX,
        x: reducedMotion ? 0 : x,
      }}
    >
      {char}
    </motion.span>
  );
}

/** Animated line composed of individual kinetic characters */
function KineticLine({
  text,
  scrollYProgress,
  reducedMotion,
  rangeStart,
  rangePeak,
  rangeEnd,
  baseY = 85,
  spreadFactor = 10,
  rotateFactor = 30,
  className,
}: {
  text: string;
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean | null;
  rangeStart: number;
  rangePeak: number;
  rangeEnd: number;
  baseY?: number;
  spreadFactor?: number;
  rotateFactor?: number;
  className?: string;
}) {
  const characters = Array.from(text);
  const centerIndex = Math.floor(characters.length / 2);

  return (
    <span className={className || "skiper31-headline-row"}>
      {characters.map((char, index) => (
        <KineticCharacter
          key={`${index}-${char}`}
          char={char}
          index={index}
          centerIndex={centerIndex}
          scrollYProgress={scrollYProgress}
          reducedMotion={reducedMotion}
          rangeStart={rangeStart}
          rangePeak={rangePeak}
          rangeEnd={rangeEnd}
          baseY={baseY}
          spreadFactor={spreadFactor}
          rotateFactor={rotateFactor}
        />
      ))}
    </span>
  );
}

/**
 * Editorial Red Scroll-Scrubbed Focus Narrative Stage.
 *
 * Narrative Flow:
 * - 01 // ARCHITECTURAL RIGOR: Full-stack systems, clean abstractions, high-throughput APIs.
 * - 02 // INTERACTION & FEEL: Fluid 60fps kinetics, tactile physics, human-first design.
 * - 03 // COMMUNITY LEADERSHIP: HackShastra co-founder, 3,000+ developers mentored across India.
 *
 * Cinematic Focal Lens:
 * - Text stays soft and ghostly faded throughout transit.
 * - In the concentrated focal sweet spot, it snaps into 100% razor-sharp clarity and contrast.
 * - Characters physically emerge upwards from below with 3D perspective rotation.
 */
export default function Skiper31Text() {
  const targetRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });
  const reducedMotion = useReducedMotion();

  // -------------------------------------------------------------
  // BEAT 1: Systems & Architecture (Focal Peak ~0.16)
  // Text is faded and softly blurred most of the time; snaps into
  // crystal clarity in the tight focal window [0.13 - 0.19].
  // -------------------------------------------------------------
  const beat1Y = useTransform(scrollYProgress, [0.0, 0.16, 0.32], [75, 0, -45]);
  const beat1Opacity = useTransform(
    scrollYProgress,
    [0.0, 0.08, 0.13, 0.16, 0.19, 0.25, 0.32],
    [0.10, 0.22, 1.0, 1.0, 1.0, 0.20, 0.0],
  );
  const beat1Blur = useTransform(
    scrollYProgress,
    [0.0, 0.08, 0.13, 0.16, 0.19, 0.25, 0.32],
    ["blur(10px)", "blur(6px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(6px)", "blur(12px)"],
  );
  const beat1Scale = useTransform(scrollYProgress, [0.0, 0.16, 0.32], [0.96, 1.0, 0.98]);

  // -------------------------------------------------------------
  // BEAT 2: Craft & Interaction (Focal Peak ~0.50)
  // Text is faded and softly blurred most of the time; snaps into
  // crystal clarity in the tight focal window [0.47 - 0.53].
  // -------------------------------------------------------------
  const beat2Y = useTransform(scrollYProgress, [0.32, 0.50, 0.68], [85, 0, -45]);
  const beat2Opacity = useTransform(
    scrollYProgress,
    [0.28, 0.38, 0.47, 0.50, 0.53, 0.60, 0.68],
    [0.0, 0.15, 1.0, 1.0, 1.0, 0.18, 0.0],
  );
  const beat2Blur = useTransform(
    scrollYProgress,
    [0.28, 0.38, 0.47, 0.50, 0.53, 0.60, 0.68],
    ["blur(12px)", "blur(6px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(6px)", "blur(12px)"],
  );
  const beat2Scale = useTransform(scrollYProgress, [0.32, 0.50, 0.68], [0.96, 1.0, 0.98]);

  // -------------------------------------------------------------
  // BEAT 3: Community & Momentum (Focal Peak ~0.84)
  // Text is faded and softly blurred most of the time; snaps into
  // crystal clarity in the tight focal window [0.81 - 0.87].
  // -------------------------------------------------------------
  const beat3Y = useTransform(scrollYProgress, [0.66, 0.84, 1.00], [85, 0, -15]);
  const beat3Opacity = useTransform(
    scrollYProgress,
    [0.64, 0.74, 0.81, 0.84, 0.87, 0.95, 1.00],
    [0.0, 0.15, 1.0, 1.0, 1.0, 0.40, 0.1],
  );
  const beat3Blur = useTransform(
    scrollYProgress,
    [0.64, 0.74, 0.81, 0.84, 0.87, 0.95, 1.00],
    ["blur(12px)", "blur(6px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(3px)", "blur(6px)"],
  );
  const beat3Scale = useTransform(scrollYProgress, [0.66, 0.84, 1.00], [0.96, 1.0, 0.99]);

  // Tracker indicators highlighting active focal stage
  const tab1Opacity = useTransform(scrollYProgress, [0.00, 0.16, 0.32], [0.35, 1.0, 0.35]);
  const tab2Opacity = useTransform(scrollYProgress, [0.32, 0.50, 0.68], [0.35, 1.0, 0.35]);
  const tab3Opacity = useTransform(scrollYProgress, [0.66, 0.84, 1.00], [0.35, 1.0, 0.85]);

  const scrubProgress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={targetRef}
      className="skiper31-stage"
      aria-labelledby="skiper31-heading"
    >
      <div className="skiper31-sticky-stage">
        {/* Minimalist Optical Timeline Tracker */}
        <div className="skiper31-timeline-tracker" aria-hidden="true">
          <motion.span
            className="skiper31-tracker-pill"
            style={{ opacity: reducedMotion ? 1 : tab1Opacity }}
          >
            01 // ARCHITECTURE
          </motion.span>
          <span className="skiper31-tracker-dot" />
          <motion.span
            className="skiper31-tracker-pill"
            style={{ opacity: reducedMotion ? 1 : tab2Opacity }}
          >
            02 // INTERACTION
          </motion.span>
          <span className="skiper31-tracker-dot" />
          <motion.span
            className="skiper31-tracker-pill"
            style={{ opacity: reducedMotion ? 1 : tab3Opacity }}
          >
            03 // COMMUNITY
          </motion.span>
          <div className="skiper31-tracker-bar-track">
            <motion.div
              className="skiper31-tracker-bar-fill"
              style={{ width: reducedMotion ? "100%" : scrubProgress }}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* BEAT 1: Systems & Architecture (The Engineer)                  */}
        {/* ============================================================== */}
        <motion.div
          className="skiper31-beat"
          style={{
            y: reducedMotion ? 0 : beat1Y,
            opacity: reducedMotion ? 1 : beat1Opacity,
            scale: reducedMotion ? 1 : beat1Scale,
            filter: reducedMotion ? "none" : beat1Blur,
          }}
          aria-hidden={false}
        >
          <div className="skiper31-beat-inner">
            <div className="skiper31-eyebrow-chip">
              <span className="skiper31-pulse-dot" />
              01 // ARCHITECTURAL RIGOR
            </div>

            <p className="skiper31-sub-phrase">FULL-STACK SCALABILITY & FIRST PRINCIPLES</p>

            <h2 className="skiper31-headline">
              <KineticLine
                text="ENGINEERED"
                scrollYProgress={scrollYProgress}
                reducedMotion={reducedMotion}
                rangeStart={0.0}
                rangePeak={0.16}
                rangeEnd={0.32}
                baseY={70}
                spreadFactor={9}
                rotateFactor={26}
              />
              <KineticLine
                text="WITH DEPTH"
                scrollYProgress={scrollYProgress}
                reducedMotion={reducedMotion}
                rangeStart={0.02}
                rangePeak={0.16}
                rangeEnd={0.32}
                baseY={85}
                spreadFactor={11}
                rotateFactor={32}
              />
            </h2>

            <p className="skiper31-body-statement">
              I build robust, end-to-end web applications where reliability and clean abstractions come first. From resilient TypeScript architectures and high-throughput APIs to modern React runtimes, I create code designed to scale under real-world demand.
            </p>

            <div className="skiper31-pill-row">
              <span className="skiper31-tag">FULL-STACK ARCHITECTURE</span>
              <span className="skiper31-tag">TYPESCRIPT & NEXT.JS</span>
              <span className="skiper31-tag">HIGH-THROUGHPUT APIS</span>
            </div>
          </div>
        </motion.div>

        {/* ============================================================== */}
        {/* BEAT 2: Craft & Interaction (The Creative Developer)           */}
        {/* ============================================================== */}
        <motion.div
          className="skiper31-beat"
          style={{
            y: reducedMotion ? 0 : beat2Y,
            opacity: reducedMotion ? 1 : beat2Opacity,
            scale: reducedMotion ? 1 : beat2Scale,
            filter: reducedMotion ? "none" : beat2Blur,
          }}
          aria-hidden={false}
        >
          <div className="skiper31-beat-inner">
            <div className="skiper31-eyebrow-chip">
              <span className="skiper31-pulse-dot" />
              02 // INTERACTION & FEEL
            </div>

            <p className="skiper31-sub-phrase">TACTILE KINETICS & 60 FPS MOTION</p>

            <h2 id="skiper31-heading" className="skiper31-headline">
              <KineticLine
                text="CRAFTED FOR"
                scrollYProgress={scrollYProgress}
                reducedMotion={reducedMotion}
                rangeStart={0.32}
                rangePeak={0.50}
                rangeEnd={0.68}
                baseY={75}
                spreadFactor={9}
                rotateFactor={28}
              />
              <KineticLine
                text="HUMANS"
                scrollYProgress={scrollYProgress}
                reducedMotion={reducedMotion}
                rangeStart={0.34}
                rangePeak={0.50}
                rangeEnd={0.68}
                baseY={90}
                spreadFactor={12}
                rotateFactor={34}
              />
            </h2>

            <p className="skiper31-body-statement">
              Great software shouldn&apos;t just run — it should feel weightless. I treat the screen as an interactive canvas, pairing strict engineering with physics-driven animation to design digital spaces that are intuitive, responsive, and alive.
            </p>

            <div className="skiper31-pill-row">
              <span className="skiper31-tag">60 FPS MICRO-PHYSICS</span>
              <span className="skiper31-tag">SUB-PIXEL PRECISION</span>
              <span className="skiper31-tag">DESIGN SYSTEM FIDELITY</span>
            </div>
          </div>
        </motion.div>

        {/* ============================================================== */}
        {/* BEAT 3: Community & Momentum (HackShastra & Mentorship)         */}
        {/* ============================================================== */}
        <motion.div
          className="skiper31-beat"
          style={{
            y: reducedMotion ? 0 : beat3Y,
            opacity: reducedMotion ? 1 : beat3Opacity,
            scale: reducedMotion ? 1 : beat3Scale,
            filter: reducedMotion ? "none" : beat3Blur,
          }}
          aria-hidden={false}
        >
          <div className="skiper31-beat-inner">
            <div className="skiper31-eyebrow-chip">
              <span className="skiper31-pulse-dot" />
              03 // COMMUNITY LEADERSHIP
            </div>

            <p className="skiper31-sub-phrase">HACKSHASTRA CO-FOUNDER & MENTOR</p>

            <h2 className="skiper31-headline">
              <KineticLine
                text="BUILDING FOR"
                scrollYProgress={scrollYProgress}
                reducedMotion={reducedMotion}
                rangeStart={0.66}
                rangePeak={0.84}
                rangeEnd={1.00}
                baseY={70}
                spreadFactor={9}
                rotateFactor={26}
              />
              <KineticLine
                text="BUILDERS"
                scrollYProgress={scrollYProgress}
                reducedMotion={reducedMotion}
                rangeStart={0.68}
                rangePeak={0.84}
                rangeEnd={1.00}
                baseY={85}
                spreadFactor={11}
                rotateFactor={32}
              />
            </h2>

            <p className="skiper31-body-statement">
              Technology reaches its true potential when shared. As co-founder of HackShastra, I&apos;ve mentored 3,000+ developers, judged 20+ hackathons across India, and organized tech summits to help creators transition from curiosity to shipping real products.
            </p>

            <div className="skiper31-pill-row">
              <span className="skiper31-tag">HACKSHASTRA CO-FOUNDER</span>
              <span className="skiper31-tag">3,000+ DEVELOPERS MENTORED</span>
              <span className="skiper31-tag">CULTURE OF SHIPPING</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Named alias export for flexibility
export { Skiper31Text as Skiper31 };
