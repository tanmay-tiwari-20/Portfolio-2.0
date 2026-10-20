"use client";

/**
 * React Bits Thought Line, adapted for this project with the already installed
 * Framer Motion and Lucide packages in place of the registry's sibling packages.
 * Source: https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/Micro/ThoughtLine
 */
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { animate, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import "./thought-line.css";

export type ThoughtLineGlyph = "sparkle" | "dot" | "none" | ReactNode;

export interface ThoughtLineProps {
  label?: string;
  doneLabel?: string;
  renderLabel?: (text: string, working: boolean) => ReactNode;
  glyph?: ThoughtLineGlyph;
  steps?: string[];
  collapsible?: boolean;
  collapseOnSettle?: boolean;
  color?: string;
  glyphColor?: string;
  fontSize?: number;
  breathPeriod?: number;
  breathDepth?: number;
  shimmer?: boolean;
  shimmerDuration?: number;
  settleDuration?: number;
  settleBlur?: number;
  working?: boolean;
  settleAfter?: number;
  elapsed?: number;
  showTimer?: boolean;
  onSettle?: (seconds: number) => void;
  className?: string;
  style?: CSSProperties;
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
const GLYPH_DONE = 0.55;
const REDUCED_SETTLE_DURATION_MS = 100;
const EMPTY_STEPS: string[] = [];

const fmt = (deciseconds: number) =>
  deciseconds < 600
    ? `${(deciseconds / 10).toFixed(1)}s`
    : `${Math.floor(deciseconds / 600)}m ${((deciseconds % 600) / 10).toFixed(1)}s`;

const spoken = (deciseconds: number) =>
  deciseconds < 600
    ? `${(deciseconds / 10).toFixed(1)} seconds`
    : `${Math.floor(deciseconds / 600)} minutes ${((deciseconds % 600) / 10).toFixed(1)} seconds`;

const ThoughtLine: React.FC<ThoughtLineProps> = ({
  label = "Thinking…",
  doneLabel = "",
  renderLabel,
  glyph = "sparkle",
  steps = EMPTY_STEPS,
  collapsible = true,
  collapseOnSettle = true,
  color = "currentColor",
  glyphColor = "",
  fontSize = 16,
  breathPeriod = 1.6,
  breathDepth = 0.45,
  shimmer = true,
  shimmerDuration = 1.8,
  settleDuration = 350,
  settleBlur = 2,
  working = true,
  settleAfter = 0,
  elapsed,
  showTimer = true,
  onSettle,
  className = "",
  style,
}) => {
  const reduce = useReducedMotion();
  const [autoSettled, setAutoSettled] = useState(false);
  const [previousWorking, setPreviousWorking] = useState(working);
  if (working !== previousWorking) {
    setPreviousWorking(working);
    if (working && autoSettled) setAutoSettled(false);
  }
  const isWorking = working && !autoSettled;
  const [open, setOpen] = useState(true);
  const [previousIsWorking, setPreviousIsWorking] = useState(isWorking);
  if (isWorking !== previousIsWorking) {
    setPreviousIsWorking(isWorking);
    if (isWorking) setOpen(true);
    else if (collapseOnSettle) setOpen(false);
  }
  const doneText = doneLabel || (showTimer ? "Thought for" : "Done thinking");
  const hasTrace = steps.length > 0;
  const depth = reduce ? Math.min(breathDepth, 0.2) : breathDepth;
  const period = reduce ? breathPeriod * 1.5 : breathPeriod;
  const effectiveSettleDuration = reduce
    ? Math.min(settleDuration, REDUCED_SETTLE_DURATION_MS)
    : settleDuration;
  const trough = 1 - depth;
  const sheen = shimmer && !reduce;
  const glyphRef = useRef<HTMLSpanElement>(null);
  const breathRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const stackRef = useRef<HTMLSpanElement>(null);
  const workRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef<HTMLSpanElement>(null);
  const announcementRef = useRef<HTMLSpanElement>(null);
  const decisecondsRef = useRef(0);
  const previousWorkingRef = useRef(isWorking);
  const latestRef = useRef<{ onSettle?: (seconds: number) => void }>({});
  useEffect(() => {
    latestRef.current = { onSettle };
  }, [onSettle]);

  useEffect(() => {
    const glyphElement = glyphRef.current;
    const breathElement = breathRef.current;
    if (!breathElement) return undefined;

    const settleSeconds = effectiveSettleDuration / 1000;
    const loop = (element: HTMLElement, delay: number) =>
      animate(
        element,
        { opacity: [trough, 1, trough] },
        { duration: period, ease: EASE_IN_OUT, repeat: Infinity, delay },
      );
    let cancelled = false;
    const running: ReturnType<typeof animate>[] = [];

    if (isWorking) {
      if (depth > 0) {
        if (sheen)
          running.push(
            animate(breathElement, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }),
          );
        if (glyphElement) {
          const lead = animate(
            glyphElement,
            { opacity: trough },
            { duration: 0.2, ease: EASE_OUT },
          );
          running.push(lead);
          lead.then(() => {
            if (cancelled) return;
            running.push(loop(glyphElement, 0));
            if (!sheen) running.push(loop(breathElement, 0.14));
          });
        } else if (!sheen) {
          running.push(loop(breathElement, 0.14));
        }
      } else {
        if (glyphElement)
          running.push(
            animate(glyphElement, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }),
          );
        running.push(
          animate(breathElement, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }),
        );
      }
    } else {
      if (glyphElement)
        running.push(
          animate(
            glyphElement,
            { opacity: GLYPH_DONE },
            { duration: settleSeconds, ease: EASE_OUT },
          ),
        );
      running.push(
        animate(
          breathElement,
          { opacity: 1 },
          { duration: settleSeconds, ease: EASE_OUT },
        ),
      );
    }

    return () => {
      cancelled = true;
      running.forEach((animation) => animation.stop());
    };
  }, [isWorking, period, depth, trough, effectiveSettleDuration, glyph, sheen]);

  const paint = (deciseconds: number) => {
    decisecondsRef.current = deciseconds;
    if (timerRef.current) timerRef.current.textContent = fmt(deciseconds);
  };

  useLayoutEffect(() => {
    if (elapsed != null) {
      paint(Math.round(elapsed * 10));
      return undefined;
    }
    if (!isWorking) return undefined;

    const startedAt = performance.now();
    paint(0);
    const interval = window.setInterval(() => {
      const deciseconds = Math.floor((performance.now() - startedAt) / 100);
      paint(deciseconds);
      if (settleAfter > 0 && deciseconds >= Math.round(settleAfter * 10))
        setAutoSettled(true);
    }, 100);

    return () => window.clearInterval(interval);
  }, [isWorking, elapsed, settleAfter]);

  useLayoutEffect(() => {
    const timer = timerRef.current;
    const stack = stackRef.current;
    if (!timer || !stack) return undefined;

    const place = (glide: boolean) => {
      const active = isWorking ? workRef.current : doneRef.current;
      if (!active) return;
      const shift = active.offsetWidth - stack.offsetWidth;
      if (!glide) timer.style.transition = "none";
      timer.style.transform = `translateX(${shift}px)`;
      if (!glide) {
        void timer.offsetWidth;
        timer.style.transition = "";
      }
    };

    place(previousWorkingRef.current !== isWorking);
    previousWorkingRef.current = isWorking;
    const resizeObserver = new ResizeObserver(() => place(false));
    if (workRef.current) resizeObserver.observe(workRef.current);
    if (doneRef.current) resizeObserver.observe(doneRef.current);
    return () => resizeObserver.disconnect();
  }, [isWorking, label, doneText, fontSize, showTimer]);

  useLayoutEffect(() => {
    if (!announcementRef.current) return;
    announcementRef.current.textContent = isWorking
      ? label
      : showTimer
        ? `${doneText} ${spoken(decisecondsRef.current)}`
        : doneText;
  }, [isWorking, label, doneText, showTimer, elapsed]);

  useEffect(() => {
    if (isWorking) return;
    latestRef.current.onSettle?.(decisecondsRef.current / 10);
  }, [isWorking]);

  const toggle = hasTrace && collapsible;
  const head = (
    <>
      {glyph !== "none" ? (
        <span ref={glyphRef} className="thought-line__glyph" aria-hidden="true">
          {glyph === "sparkle" ? (
            <Sparkles size="100%" strokeWidth={2} />
          ) : glyph === "dot" ? (
            <span className="thought-line__dot" />
          ) : (
            glyph
          )}
        </span>
      ) : null}
      <span ref={stackRef} className="thought-line__label" aria-hidden="true">
        <span
          ref={workRef}
          className="thought-line__text"
          data-active={isWorking ? "" : undefined}
        >
          <span
            ref={breathRef}
            className="thought-line__breath"
            data-shimmer={sheen ? "" : undefined}
          >
            {renderLabel ? renderLabel(label, true) : label}
          </span>
        </span>
        <span
          ref={doneRef}
          className="thought-line__text thought-line__text--done"
          data-active={isWorking ? undefined : ""}
        >
          {renderLabel ? renderLabel(doneText, false) : doneText}
        </span>
      </span>
      {showTimer ? (
        <span
          ref={timerRef}
          className="thought-line__timer"
          data-done={isWorking ? undefined : ""}
          aria-hidden="true"
        >
          0.0s
        </span>
      ) : null}
      {collapsible ? (
        <span
          className="thought-line__chevron"
          data-on={hasTrace ? "" : undefined}
          aria-hidden="true"
        >
          <ChevronDown size="1em" strokeWidth={2.2} />
        </span>
      ) : null}
      <span ref={announcementRef} className="thought-line__sr" role="status">
        {isWorking ? label : doneText}
      </span>
    </>
  );

  return (
    <div
      className={`thought-line${className ? ` ${className}` : ""}`}
      data-working={isWorking ? "" : undefined}
      data-open={open && hasTrace ? "" : undefined}
      style={
        {
          "--tl-font": `${fontSize}px`,
          "--tl-color": color,
          "--tl-glyph": glyphColor || color,
          "--tl-settle": `${effectiveSettleDuration}ms`,
          "--tl-blur": `${settleBlur}px`,
          "--tl-shimmer": `${shimmerDuration}s`,
          ...style,
        } as CSSProperties
      }
    >
      {collapsible ? (
        <button
          type="button"
          className="thought-line__head"
          data-toggle={toggle ? "" : undefined}
          aria-expanded={toggle ? open : undefined}
          tabIndex={toggle ? 0 : -1}
          onClick={() => {
            if (toggle) setOpen((value) => !value);
          }}
        >
          {head}
        </button>
      ) : (
        <div className="thought-line__head">{head}</div>
      )}
      {hasTrace ? (
        <div
          className="thought-line__trace"
          data-open={open ? "" : undefined}
          aria-hidden={!open}
        >
          <div className="thought-line__fold">
            <div className="thought-line__steps">
              {steps.map((text, index) => {
                const done = !isWorking || index < steps.length - 1;
                return (
                  <div
                    key={`${index}-${text}`}
                    className="thought-line__step"
                    data-done={done ? "" : undefined}
                  >
                    <span className="thought-line__mark" aria-hidden="true">
                      {done ? (
                        <Check size="1em" strokeWidth={2.5} />
                      ) : (
                        <i className="thought-line__pulse" />
                      )}
                    </span>
                    <span className="thought-line__step-text">{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ThoughtLine;
