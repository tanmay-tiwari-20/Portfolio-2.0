"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ThoughtLine from "./thought-line";

type LoaderPhase = "loading" | "settling" | "exiting" | "done";

const MINIMUM_DISPLAY_MS = 360;
const DOCUMENT_LOAD_FAILSAFE_MS = 12_000;
const SETTLE_DURATION_MS = 380;
const REDUCED_SETTLE_DURATION_MS = 100;
const EXIT_FALLBACK_MS = 520;

export default function Preloader() {
  const [phase, setPhase] = useState<LoaderPhase>("loading");
  const exitStartedRef = useRef(false);
  const exitFinishedRef = useRef(false);
  const settleTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const root = document.documentElement;
    if (phase === "done") {
      root.classList.remove("portfolio-loading");
      root.dataset.preloaderComplete = "true";
      window.dispatchEvent(new Event("portfolio:preloader-complete"));
    } else {
      root.dataset.preloaderComplete = "false";
      root.classList.add("portfolio-loading");
    }
  }, [phase]);

  useEffect(
    () => () => document.documentElement.classList.remove("portfolio-loading"),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let ready = false;
    let minimumTimer: number | undefined;
    let failsafeTimer: number | undefined;
    const hydratedAt = performance.now();

    const revealReadyState = () => {
      if (ready || cancelled) return;
      ready = true;
      if (failsafeTimer !== undefined) window.clearTimeout(failsafeTimer);

      const remainingMinimum = Math.max(
        0,
        MINIMUM_DISPLAY_MS - (performance.now() - hydratedAt),
      );
      minimumTimer = window.setTimeout(() => {
        if (!cancelled) setPhase("settling");
      }, remainingMinimum);
    };

    if (document.readyState === "complete") {
      revealReadyState();
    } else {
      window.addEventListener("load", revealReadyState, { once: true });
      failsafeTimer = window.setTimeout(
        revealReadyState,
        DOCUMENT_LOAD_FAILSAFE_MS,
      );
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", revealReadyState);
      if (minimumTimer !== undefined) window.clearTimeout(minimumTimer);
      if (failsafeTimer !== undefined) window.clearTimeout(failsafeTimer);
    };
  }, []);

  const beginExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = reducedMotion
      ? REDUCED_SETTLE_DURATION_MS
      : SETTLE_DURATION_MS;

    settleTimerRef.current = window.setTimeout(
      () => setPhase("exiting"),
      duration,
    );
  }, []);

  const finishExit = useCallback(() => {
    if (exitFinishedRef.current) return;
    exitFinishedRef.current = true;
    setPhase("done");
  }, []);

  useEffect(() => {
    if (phase !== "settling") return undefined;

    const settleFailsafe = window.setTimeout(() => {
      if (exitStartedRef.current) return;
      exitStartedRef.current = true;
      setPhase("exiting");
    }, SETTLE_DURATION_MS + 250);

    return () => window.clearTimeout(settleFailsafe);
  }, [phase]);

  useEffect(() => {
    if (phase !== "exiting") return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const fallback = window.setTimeout(finishExit, 150);
      return () => window.clearTimeout(fallback);
    }

    const fallback = window.setTimeout(finishExit, EXIT_FALLBACK_MS);
    return () => window.clearTimeout(fallback);
  }, [phase, finishExit]);

  useEffect(
    () => () => {
      if (settleTimerRef.current !== undefined)
        window.clearTimeout(settleTimerRef.current);
    },
    [],
  );

  if (phase === "done") return null;

  return (
    <div
      className="site-preloader"
      data-exiting={phase === "exiting" ? "" : undefined}
      role="region"
      aria-label="Loading portfolio"
      aria-busy={phase === "loading"}
      onTransitionEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.propertyName === "opacity"
        ) {
          finishExit();
        }
      }}
    >
      <noscript>
        <style>{".site-preloader{display:none!important}"}</style>
      </noscript>
      <div className="site-preloader__content">
        <ThoughtLine
          label="Building the web"
          doneLabel="Ready to explore"
          glyph="sparkle"
          color="var(--theme-paper)"
          glyphColor="var(--theme-paper)"
          fontSize={48}
          breathPeriod={1.8}
          breathDepth={0.2}
          shimmer
          shimmerDuration={2.2}
          settleDuration={SETTLE_DURATION_MS}
          settleBlur={1.5}
          working={phase === "loading"}
          settleAfter={0}
          showTimer={false}
          collapsible={false}
          onSettle={beginExit}
          className="site-preloader__thought"
        />
      </div>
    </div>
  );
}
