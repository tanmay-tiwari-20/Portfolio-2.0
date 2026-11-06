"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CodeXml,
  Plus,
  UsersRound,
} from "lucide-react";
import { hackshastra } from "@/data/hackshastra";
import BrandImage from "./brand-image";
import BrandLink from "./brand-link";
import styles from "./hackshastra-hero.module.css";

const moments = [
  {
    src: hackshastra.arena,
    alt: "HackShastra builders gathered at a community event",
    title: "Strangers to teammates.",
    label: "The builder collective",
  },
  {
    src: hackshastra.celebration,
    alt: "HackShastra community celebrating together on stage",
    title: "Small starts. Big moments.",
    label: "Made of people",
  },
  {
    ...hackshastra.moments[0],
    title: "Good company. Great ideas.",
    label: "Better together",
  },
];

const sections = [
  ["hs-story", "The idea"],
  ["hs-practice", "In practice"],
  ["hs-events", "The gatherings"],
  ["hs-people", "Our people"],
  ["hs-connect", "Your next step"],
];

export default function HackShastraHero() {
  const [active, setActive] = useState(0);
  const visual = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reset = () => {
      cancelAnimationFrame(frame.current);
      visual.current?.style.removeProperty("--pointer-x");
      visual.current?.style.removeProperty("--pointer-y");
    };
    reduced.addEventListener("change", reset);
    window.addEventListener("portfolio:transition-start", reset);
    return () => {
      reset();
      reduced.removeEventListener("change", reset);
      window.removeEventListener("portfolio:transition-start", reset);
    };
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      !window.matchMedia(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      visual.current?.style.setProperty("--pointer-x", `${x * 7}deg`);
      visual.current?.style.setProperty("--pointer-y", `${-y * 5}deg`);
    });
  }

  function resetPointer() {
    cancelAnimationFrame(frame.current);
    visual.current?.style.removeProperty("--pointer-x");
    visual.current?.style.removeProperty("--pointer-y");
  }

  return (
    <section className={styles.hero} aria-labelledby="hs-title" data-hs-hero>
      <div className={styles.atmosphere} aria-hidden="true" />
      <div className={styles.topline} data-hackshastra-intro>
        <div className={styles.brand}>
          <Image
            src={hackshastra.logo}
            alt=""
            width={38}
            height={38}
            unoptimized
            className={styles.logo}
          />
          <span>HackShastra</span>
        </div>
        <p className={styles.origin}>India · Est. 2024</p>
      </div>

      <div className={styles.main}>
        <div className={styles.copy}>
          <p className={styles.eyebrow} data-hackshastra-intro>
            <span /> A home for the ones who build
          </p>
          <h1
            id="hs-title"
            aria-label="HackShastra: Big ideas. Built together."
            className={styles.title}
            data-hackshastra-intro
          >
            <span>
              Big ideas<span className={styles.period}>.</span>{" "}
            </span>
            <span>
              Built{" "}
              <CodeXml
                className={styles.titleSymbol}
                strokeWidth={1.4}
                aria-hidden="true"
              />
            </span>
            <span className={styles.together}>together.</span>
          </h1>
          <p className={styles.lede} data-hackshastra-intro>
            HackShastra is a student-led technology community, co-founded by
            Tanmay Tiwari. A place for bold ideas, shared learning, and building
            together.
          </p>
          <div className={styles.actions} data-hackshastra-intro>
            <BrandLink href={hackshastra.website} className={styles.primary}>
              Enter HackShastra
            </BrandLink>
            <a href="#hs-story" className={styles.storyLink}>
              Our story <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div
          className={styles.visual}
          ref={visual}
          onPointerMove={move}
          onPointerLeave={resetPointer}
        >
          <div className={styles.orbit} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className={styles.crossTop} aria-hidden="true">
            <Plus size={20} strokeWidth={1} />
          </span>
          <span className={styles.crossBottom} aria-hidden="true">
            <Plus size={20} strokeWidth={1} />
          </span>
          <p className={styles.visualLabel}>
            Real people. Unreal possibilities.
          </p>
          <div className={styles.stack}>
            {moments.map((moment, index) => {
              const position =
                (index - active + moments.length) % moments.length;
              return (
                <figure
                  key={moment.src}
                  className={styles.photo}
                  data-position={position}
                  aria-hidden={position !== 0}
                >
                  <div className={styles.image}>
                    <BrandImage
                      src={moment.src}
                      alt={moment.alt}
                      sizes="(max-width: 759px) 76vw, 40vw"
                      priority={index === 0}
                    />
                  </div>
                  <figcaption>
                    <span>{moment.title}</span>
                    <span className={styles.photoNumber}>
                      0{index + 1} / 03
                    </span>
                  </figcaption>
                </figure>
              );
            })}
            <button
              type="button"
              className={styles.nextPhoto}
              onClick={() => setActive((value) => (value + 1) % moments.length)}
              aria-label="Show next community photo"
            />
          </div>
          <div className={styles.sticker} aria-hidden="true">
            <UsersRound size={26} strokeWidth={1.4} />
            <span>
              You don’t have
              <br />
              to build alone.
            </span>
          </div>
          <div className={styles.photoControls}>
            <p aria-live="polite" aria-atomic="true">
              {moments[active].label}
            </p>
            <div className={styles.dots} aria-label="Community photos">
              {moments.map((moment, index) => (
                <button
                  key={moment.src}
                  type="button"
                  aria-label={`Show photo ${index + 1}: ${moment.title}`}
                  aria-pressed={active === index}
                  onClick={() => setActive(index)}
                >
                  <span />
                </button>
              ))}
            </div>
            <ArrowRight size={16} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <a href="#hs-story" className={styles.scrollCue}>
          <span>
            <ArrowDown size={16} aria-hidden="true" />
          </span>
          <span>
            Scroll to
            <br />
            find your people
          </span>
        </a>
        <nav aria-label="HackShastra page sections" className={styles.index}>
          {sections.map(([id, label], index) => (
            <a key={id} href={`#${id}`}>
              <span>0{index + 1}</span>
              {label}
              {index === sections.length - 1 && (
                <ArrowUpRight size={14} aria-hidden="true" />
              )}
            </a>
          ))}
        </nav>
        <span className={styles.bottomMark} aria-hidden="true">
          Build. Belong. Become.
        </span>
      </div>
    </section>
  );
}
