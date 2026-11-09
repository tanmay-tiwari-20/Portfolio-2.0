"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, useMotionValue } from "framer-motion";
import { waitForPreloaderReady } from "@/lib/preloader-ready";
import { hackshastra } from "@/data/hackshastra";
import type { PreloaderExitDetail } from "./page-transition";
import styles from "./site-preloader.module.css";

const COUNT_DURATION_MS = 3000;

type IntroDetails = {
  name: string;
  role: string;
  location: string;
};

function DetailCards({ name, role, location }: IntroDetails) {
  const details = [
    {
      label: "THE PERSON",
      title: name,
      note: "The person behind the pixels.",
      kind: "person",
    },
    {
      label: "THE CRAFT",
      title: role,
      note: "Design meets engineering.",
      kind: "craft",
    },
    {
      label: "THE COMMUNITY",
      title: "HackShastra",
      note: "Co-founder. Builder. Collaborator.",
      kind: "community",
    },
    {
      label: "THE APPROACH",
      title: "A little more human.",
      note: "Making the web feel that way.",
      kind: "approach",
    },
    {
      label: "BASED IN",
      title: location,
      note: "Ideas can travel anywhere.",
      kind: "location",
    },
    {
      label: "THE WORK",
      title: "Thoughtfully built.",
      note: "From the first idea to the final detail.",
      kind: "work",
    },
  ];

  return (
    <div className={styles.cards} aria-label="A little about me">
      {details.map((detail, index) => (
        <article
          key={detail.kind}
          data-preloader-detail
          className={`${styles.card} ${styles[detail.kind]}`}
          style={{ "--order": index } as CSSProperties}
        >
          <div className={styles.cardBody}>
            <div className={styles.cardTop}>
              <span>{detail.label}</span>
              <span className={styles.cardIndex}>0{index + 1}</span>
            </div>
            <span
              className={`${styles.cardGlyph} ${styles[detail.kind + "Glyph"]}`}
              aria-hidden="true"
            >
              {detail.kind === "person" || detail.kind === "community" ? (
                <Image
                  src={
                    detail.kind === "person" ? "/icon.svg" : hackshastra.logo
                  }
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  loading="eager"
                  className={styles.cardLogo}
                />
              ) : detail.kind === "craft" ? (
                "</>"
              ) : detail.kind === "approach" ? (
                "*"
              ) : detail.kind === "location" ? (
                "↗"
              ) : (
                "[]"
              )}
            </span>
            <p className={styles.cardTitle}>{detail.title}</p>
            <p className={styles.cardNote}>{detail.note}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

/** One introduction per document; the existing Spider scene owns its handoff. */
export default function SitePreloader(details: IntroDetails) {
  const pathname = usePathname();
  const [active, setActive] = useState(true);
  const [handingOff, setHandingOff] = useState(false);
  const layer = useRef<HTMLDivElement>(null);
  const number = useRef<HTMLSpanElement>(null);
  const progress = useMotionValue(0);
  const finish = useRef<() => void>(() => {});
  const excluded = pathname?.startsWith("/secret-admin");
  const [initiallyExcluded] = useState(excluded);
  const initialPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== initialPath.current) finish.current();
  }, [pathname]);

  useEffect(() => {
    const html = document.documentElement;
    if (
      initiallyExcluded ||
      html.dataset.preloaderComplete === "true" ||
      !html.classList.contains("portfolio-loading")
    ) {
      const frame = requestAnimationFrame(() => setActive(false));
      return () => cancelAnimationFrame(frame);
    }

    const controller = new AbortController();
    const { signal } = controller;
    const page = document.querySelector<HTMLElement>("[data-preloader-page]");
    if (!page || !layer.current) return;
    const wasInert = page.inert;
    page.inert = true;
    page.setAttribute("aria-busy", "true");
    const start = Number(html.dataset.preloaderStartedAt) || performance.now();
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let exitTimer = 0;
    let controllerTimer = 0;
    let counterTimer = 0;
    let paintTimer = 0;
    let counterFrame = 0;
    let done = false;
    let resourcesReady = false;
    let target = 0;
    let exiting = false;
    let handoffStarted = false;
    let previousTick = performance.now();

    const warm = () => {
      if (!signal.aborted)
        window.dispatchEvent(new Event("portfolio:preloader-prepare"));
    };
    const warmTimer = window.setTimeout(warm, 80);
    window.addEventListener("portfolio:preloader-controller-ready", warm, {
      signal,
    });
    const unsubscribe = progress.on("change", (value) => {
      if (number.current)
        number.current.textContent = String(
          Math.floor(value * 100 + 0.000001),
        ).padStart(2, "0");
    });
    signal.addEventListener("abort", unsubscribe, { once: true });

    const release = (event?: Event) => {
      if (done || signal.aborted) return;
      done = true;
      clearTimeout(exitTimer);
      clearTimeout(controllerTimer);
      clearTimeout(counterTimer);
      clearTimeout(paintTimer);
      clearTimeout(warmTimer);
      cancelAnimationFrame(counterFrame);
      html.classList.remove("portfolio-loading");
      html.dataset.preloaderState = "complete";
      html.dataset.preloaderComplete = "true";
      page.inert = wasInert;
      page.removeAttribute("aria-busy");
      setActive(false);
      controller.abort();
      if (event?.type !== "portfolio:preloader-complete")
        window.dispatchEvent(new Event("portfolio:preloader-complete"));
    };
    finish.current = release;

    const covered = () => {
      if (done || signal.aborted) return;
      html.dataset.preloaderState = "revealing";
      if (layer.current) layer.current.style.visibility = "hidden";
      window.dispatchEvent(new Event("portfolio:preloader-reveal"));
    };
    const requestHandoff = () => {
      if (signal.aborted || done || !layer.current) return true;
      const request = new CustomEvent<PreloaderExitDetail>(
        "portfolio:preloader-exit",
        {
          cancelable: true,
          detail: {
            surface: layer.current,
            onCovered: covered,
            onComplete: release,
          },
        },
      );
      const accepted = !window.dispatchEvent(request);
      if (accepted) {
        clearTimeout(controllerTimer);
        window.removeEventListener(
          "portfolio:preloader-controller-ready",
          retryHandoff,
        );
        if (!done) {
          window.dispatchEvent(new Event("portfolio:preloader-handoff"));
          exitTimer = window.setTimeout(release, 10000);
        }
      }
      return accepted;
    };
    const retryHandoff = () => {
      requestHandoff();
    };
    const handoff = () => {
      if (handoffStarted || done || signal.aborted) return;
      handoffStarted = true;
      clearTimeout(paintTimer);
      cancelAnimationFrame(counterFrame);
      if (requestHandoff()) return;
      // A fast cached page may finish before the route controller hydrates.
      // Wait for its explicit handshake instead of occasionally dropping the effect.
      window.addEventListener(
        "portfolio:preloader-controller-ready",
        retryHandoff,
        { signal },
      );
      controllerTimer = window.setTimeout(() => {
        if (!requestHandoff()) {
          covered();
          release();
        }
      }, 2000);
    };

    const count = () => {
      if (signal.aborted || done) return;
      const now = performance.now();
      const current = progress.get();
      // Follow a three-second clock, smoothing delayed readiness updates.
      // Bound catch-up after long tasks instead of requiring 100 separate frames.
      const timedTarget = Math.min(
        target,
        Math.max(0, (now - start) / COUNT_DURATION_MS),
      );
      const next = preference.matches
        ? target
        : Math.min(
            timedTarget,
            current + Math.min(Math.max(now - previousTick, 0) * 0.00075, 0.04),
          );
      previousTick = now;
      if (next > current) progress.set(next);
      if (resourcesReady && next >= 1) {
        if (!exiting) {
          exiting = true;
          setHandingOff(true);
          // Paint 100%, then hand off immediately without an extra display hold.
          counterFrame = requestAnimationFrame(() => {
            counterFrame = requestAnimationFrame(handoff);
          });
          paintTimer = window.setTimeout(handoff, 100);
        }
        return;
      }
      counterTimer = window.setTimeout(count, 16);
    };
    window.addEventListener("portfolio:preloader-complete", release, {
      signal,
    });
    window.addEventListener("pagehide", release, { signal });
    preference.addEventListener(
      "change",
      () => {
        if (preference.matches) release();
      },
      { signal },
    );
    window.dispatchEvent(new Event("portfolio:preloader-hydrated"));
    counterTimer = window.setTimeout(count, 0);

    void waitForPreloaderReady({
      root: page,
      signal,
      onProgress: (value) => {
        if (!signal.aborted && !done) target = Math.max(target, value);
      },
    })
      .then(() => {
        if (signal.aborted || done) return;
        resourcesReady = true;
        target = 1;
      })
      .catch(release);

    return () => {
      controller.abort();
      clearTimeout(exitTimer);
      clearTimeout(controllerTimer);
      clearTimeout(counterTimer);
      clearTimeout(paintTimer);
      clearTimeout(warmTimer);
      cancelAnimationFrame(counterFrame);
      page.inert = wasInert;
      page.removeAttribute("aria-busy");
      finish.current = () => {};
    };
  }, [initiallyExcluded, progress]);

  if (excluded || !active) return null;

  return (
    <div
      ref={layer}
      className={`site-preloader ${styles.preloader}`}
      data-preloader-handoff={handingOff ? "true" : undefined}
      aria-label={`${details.name} portfolio introduction`}
    >
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.environment}>
        <div className={styles.orbit} aria-hidden="true" />
        <div className={styles.orbitInner} aria-hidden="true" />
        <DetailCards {...details} />
        <div className={styles.center}>
          <p className={styles.eyebrow}>
            <span /> A FEW THINGS ABOUT ME
          </p>
          <div className={styles.counter} aria-hidden="true">
            <span ref={number} data-preloader-progress>
              00
            </span>
            <span className={styles.percent}>%</span>
          </div>
          <p className={styles.tagline} data-preloader-tagline>
            Making the web
            <br />
            <span>a little more human.</span>
          </p>
          <div className={styles.centerRule} aria-hidden="true">
            <motion.div style={{ scaleX: progress }} />
          </div>
        </div>
        <span className={styles.particleOne} aria-hidden="true" />
        <span className={styles.particleTwo} aria-hidden="true" />
        <span className={styles.particleThree} aria-hidden="true">
          +
        </span>
        <span className={styles.particleFour} aria-hidden="true">
          +
        </span>
      </div>
      <div
        className={styles.screenReaderOnly}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {handingOff
          ? `${details.name}’s portfolio is ready.`
          : `Assembling ${details.name}’s portfolio.`}
      </div>
    </div>
  );
}
