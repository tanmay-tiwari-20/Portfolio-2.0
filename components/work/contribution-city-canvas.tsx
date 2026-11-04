"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import {
  CITY_DURATION,
  createCityLayout,
  drawCity,
  getBuildingGeometry,
  getPeakAnnotation,
  hitTestCity,
  type CityLayout,
} from "@/lib/contribution-city";
import type { ContributionData } from "@/lib/github-contributions";
import styles from "./contribution-city.module.css";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

export default function ContributionCityCanvas({
  data,
  children,
}: {
  data: ContributionData;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const peak = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLParagraphElement>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const driver = useRef<{
    replay: () => void;
    selectDate: (date: string) => void;
  } | null>(null);
  const districts = createCityLayout(data, 350, 560).districts;

  useEffect(() => {
    const host = root.current;
    const surface = canvas.current;
    if (!host || !surface) return;
    if (!("IntersectionObserver" in window) || !("ResizeObserver" in window))
      return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = surface.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;
    // Arm the reveal before scrolling into view; SSR stays visible without JS.
    host.dataset.canvasArmed = "true";
    const context = ctx;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let layout: CityLayout | null = null;
    let frame = 0;
    let elapsed = 0;
    let lastTime: number | null = null;
    let visible = false;
    let started = false;
    let transitionPaused = false;
    let disposed = false;
    let failed = false;
    let dirty = true;
    let selected: number | null = null;
    let pinned: number | null = null;
    let keyboardIndex = data.maxDay
      ? data.days.findIndex((day) => day.date === data.maxDay?.date)
      : 0;

    const covered = () =>
      transitionPaused ||
      Boolean(document.documentElement.dataset.spiderTransition) ||
      document.documentElement.classList.contains("portfolio-transitioning") ||
      document.documentElement.classList.contains("portfolio-loading");
    const canDraw = () =>
      visible && !document.hidden && !covered() && !disposed && !failed;
    const time = () => (reduced.matches ? Infinity : elapsed);

    function measure() {
      const box = surface!.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface!.width = Math.round(box.width * dpr);
      surface!.height = Math.round(box.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout = createCityLayout(data, box.width, box.height);
      dirty = false;
    }

    function paint() {
      try {
        if (dirty) measure();
        if (!layout) return;
        drawCity(context, layout, time(), selected);
        host!.dataset.canvasReady = "true";
        host!.dataset.cityState =
          reduced.matches || elapsed >= CITY_DURATION ? "complete" : "building";
        const annotation = getPeakAnnotation(layout, time());
        if (peak.current) {
          peak.current.style.opacity =
            selected === null ? String(annotation?.progress ?? 0) : "0";
          if (annotation) {
            peak.current.style.left = `${annotation.end.x}px`;
            peak.current.style.top = `${annotation.end.y - 50}px`;
          }
        }
        if (tooltip.current) {
          const building = layout.buildings.find(
            (item) => item.index === selected,
          );
          tooltip.current.hidden = !building;
          if (building) {
            const roof = getBuildingGeometry(building, time()).roof;
            const w = tooltip.current.offsetWidth || 192;
            tooltip.current.style.left = `${Math.max(8, Math.min(layout.width - w - 8, roof.x - w / 2))}px`;
            tooltip.current.style.top = `${Math.max(8, Math.min(layout.height - 72, roof.y - 80))}px`;
          }
        }
      } catch {
        failed = true;
        host!.dataset.canvasArmed = "false";
        host!.dataset.canvasReady = "false";
        if (peak.current) peak.current.style.opacity = "0";
        if (tooltip.current) tooltip.current.hidden = true;
      }
    }

    function tick(now: number) {
      frame = 0;
      if (!canDraw()) {
        lastTime = null;
        return;
      }
      if (!started) {
        started = true;
        lastTime = now;
      }
      if (lastTime !== null)
        elapsed = Math.min(
          CITY_DURATION,
          elapsed + Math.max(0, now - lastTime),
        );
      lastTime = now;
      paint();
      if (!reduced.matches && elapsed < CITY_DURATION && !failed)
        frame = requestAnimationFrame(tick);
      else lastTime = null;
    }

    function schedule() {
      if (!frame && canDraw()) frame = requestAnimationFrame(tick);
    }
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
    }
    function select(index: number | null, announce = false) {
      selected = index;
      const day = index === null ? null : data.days[index];
      if (day) {
        keyboardIndex = index!;
        const count = `${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}`;
        if (tooltip.current) {
          tooltip.current.querySelector("strong")!.textContent = count;
          tooltip.current.querySelector("span")!.textContent = formatDate(
            day.date,
          );
        }
        if (dateInput.current) dateInput.current.value = day.date;
        if (announce && live.current)
          live.current.textContent = `${formatDate(day.date)}: ${count}.${pinned !== null ? " Selected." : ""}`;
      } else if (announce && live.current)
        live.current.textContent = "Selection cleared.";
      schedule();
    }

    const pointAt = (event: PointerEvent) => {
      const rect = surface!.getBoundingClientRect();
      return layout
        ? hitTestCity(
            layout,
            event.clientX - rect.left,
            event.clientY - rect.top,
            time(),
          )
        : null;
    };
    const move = (event: PointerEvent) => {
      if (pinned !== null || event.pointerType === "touch") return;
      const index = pointAt(event);
      if (index !== selected) select(index);
    };
    const leave = () => {
      if (pinned === null) select(null);
    };
    const click = (event: PointerEvent) => {
      const index = pointAt(event);
      pinned = pinned === index ? null : index;
      select(pinned, true);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        pinned = null;
        select(null, true);
        return;
      }
      let index = selected ?? keyboardIndex;
      switch (event.key) {
        case "ArrowRight":
          index += 7;
          break;
        case "ArrowLeft":
          index -= 7;
          break;
        case "ArrowDown":
          index += 1;
          break;
        case "ArrowUp":
          index -= 1;
          break;
        case "Home":
          index = 0;
          break;
        case "End":
          index = data.days.length - 1;
          break;
        case "Enter":
        case " ":
          break;
        default:
          return;
      }
      event.preventDefault();
      pinned = Math.max(0, Math.min(data.days.length - 1, index));
      select(pinned, true);
    };
    const pause = () => {
      transitionPaused = true;
      stop();
    };
    const resume = () => {
      transitionPaused = false;
      schedule();
    };
    const visibility = () => {
      if (document.hidden) stop();
      else schedule();
    };
    const preference = () => {
      stop();
      if (reduced.matches) elapsed = CITY_DURATION;
      schedule();
    };
    const resize = () => {
      dirty = true;
      schedule();
    };
    const focus = () => {
      if (selected === null) select(keyboardIndex, true);
    };
    driver.current = {
      replay() {
        stop();
        elapsed = 0;
        started = false;
        pinned = null;
        selected = null;
        if (dateInput.current) dateInput.current.value = "";
        if (live.current)
          live.current.textContent = reduced.matches
            ? "Completed city. Reduced motion is enabled."
            : "Replaying city construction.";
        schedule();
      },
      selectDate(value) {
        const index = data.days.findIndex((day) => day.date === value);
        pinned = index < 0 ? null : index;
        select(pinned, true);
      },
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible =
          entry.isIntersecting && (started || entry.intersectionRatio >= 0.2);
        if (visible) schedule();
        else stop();
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(surface);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(surface);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerleave", leave);
    surface.addEventListener("pointerup", click);
    surface.addEventListener("keydown", key);
    surface.addEventListener("focus", focus);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", preference);
    window.addEventListener("portfolio:capture-frame", pause);
    window.addEventListener("portfolio:transition-start", pause);
    window.addEventListener("portfolio:transition-end", resume);
    window.addEventListener("portfolio:preloader-complete", resume);

    return () => {
      disposed = true;
      stop();
      driver.current = null;
      host.dataset.canvasArmed = "false";
      observer.disconnect();
      resizeObserver.disconnect();
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", leave);
      surface.removeEventListener("pointerup", click);
      surface.removeEventListener("keydown", key);
      surface.removeEventListener("focus", focus);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", preference);
      window.removeEventListener("portfolio:capture-frame", pause);
      window.removeEventListener("portfolio:transition-start", pause);
      window.removeEventListener("portfolio:transition-end", resume);
      window.removeEventListener("portfolio:preloader-complete", resume);
    };
  }, [data]);

  return (
    <div ref={root} className={styles.experience}>
      <div className={styles.canvasStage}>
        <div className={styles.fallback}>{children}</div>
        <canvas
          ref={canvas}
          className={styles.canvas}
          tabIndex={0}
          role="group"
          aria-roledescription="interactive contribution city"
          aria-label={`GitHub contribution city for ${data.username}`}
          aria-describedby="contribution-city-description contribution-city-help"
        />
        {data.maxDay && (
          <div ref={peak} className={styles.peak} aria-hidden="true">
            <span>Most active day</span>
            <strong>{data.maxDay.contributionCount} contributions</strong>
            <time dateTime={data.maxDay.date}>
              {formatDate(data.maxDay.date)}
            </time>
          </div>
        )}
        <div ref={tooltip} className={styles.tooltip} hidden aria-hidden="true">
          <strong />
          <span />
        </div>
        <div className={styles.districtDates} aria-hidden="true">
          {districts.map((district) => (
            <span key={district.index} style={{ top: district.bottom - 20 }}>
              {district.startDate.slice(0, 7)} <span>—</span>{" "}
              {district.endDate.slice(0, 7)}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.toolbar}>
        <p className={styles.cityNote}>
          <span aria-hidden="true">↗</span> One day. One building.
        </p>
        <div
          className={styles.legend}
          aria-label="Building colours range from no activity to the fourth GitHub quartile"
        >
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i key={level} data-level={level} aria-hidden="true" />
          ))}
          <span>More</span>
        </div>
        <button
          className={styles.replay}
          type="button"
          onClick={() => driver.current?.replay()}
        >
          <RotateCcw size={13} aria-hidden="true" /> Replay
        </button>
      </div>
      <div className={styles.interaction}>
        <p id="contribution-city-help">
          Hover to explore. Tap to keep a day selected.
          <span>
            {" "}
            Keyboard: arrows to move, Home / End to jump, Esc to clear.
          </span>
        </p>
        <label>
          Find a day{" "}
          <input
            ref={dateInput}
            type="date"
            min={data.startDate}
            max={data.endDate}
            onChange={(event) => driver.current?.selectDate(event.target.value)}
          />
        </label>
      </div>
      <p
        ref={live}
        className={styles.srOnly}
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
}
