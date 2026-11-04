"use client";

import { useEffect, type RefObject } from "react";
import {
  clampDeskPosition,
  getDeskBounds,
  getDeskReleaseVelocity,
  isDeskDrag,
  stepDeskMotion,
  type DeskMotion,
  type DeskPoint,
  type DeskSample,
  type DeskSize,
} from "@/lib/work-desk-physics";

type Print = {
  node: HTMLElement;
  slot: HTMLElement;
  grab: HTMLButtonElement;
  link: HTMLAnchorElement;
  size: DeskSize;
  home: DeskPoint;
  state: DeskMotion;
  suppressClickUntil: number;
};

/** Physics owns the paper transform; WorkMotion owns its separate entrance wrapper. */
export function useDeskInteraction(
  rootRef: RefObject<HTMLElement | null>,
  identity: string,
) {
  useEffect(() => {
    const root = rootRef.current;
    const stage = root?.querySelector<HTMLElement>("[data-desk-stage]");
    if (!root || !stage) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let dimensions = {
      width: stage.clientWidth,
      height: stage.clientHeight,
      inset: 10,
    };
    let frame = 0;
    let resizeFrame = 0;
    let previousTime = 0;
    let disposed = false;
    let visible = true;
    let measured = false;
    let needsMeasure = true;
    let zIndex = 5;
    let active: {
      print: Print;
      id: number;
      origin: DeskPoint;
      start: DeskPoint;
      samples: DeskSample[];
      dragged: boolean;
      startedOnGrip: boolean;
    } | null = null;
    const unbind: Array<() => void> = [];
    const prints: Print[] = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-desk-print]"),
    ).map((node) => ({
      node,
      slot: node.closest<HTMLElement>("[data-desk-slot]")!,
      grab: node.querySelector<HTMLButtonElement>("[data-desk-grab]")!,
      link: node.querySelector<HTMLAnchorElement>("[data-desk-open]")!,
      size: { width: 0, height: 0 },
      home: { x: 0, y: 0 },
      state: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotation: 0,
        angularVelocity: 0,
        restRotation: 0,
      },
      suppressClickUntil: 0,
    }));
    const covered = () =>
      Boolean(document.documentElement.dataset.spiderTransition) ||
      document.documentElement.classList.contains("portfolio-transitioning") ||
      document.documentElement.classList.contains("portfolio-loading");
    const paint = (print: Print) => {
      const { x, y, rotation } = print.state;
      print.node.style.transform = `translate(-50%, -50%) translate3d(${x - print.home.x}px, ${y - print.home.y}px, 0) rotate(${rotation}deg)`;
    };
    const bringForward = (print: Print) => {
      print.slot.style.zIndex = String(++zIndex);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    };
    const tick = (time: number) => {
      frame = 0;
      if (
        disposed ||
        !visible ||
        document.hidden ||
        covered() ||
        reduced.matches
      )
        return;
      const dt = previousTime ? (time - previousTime) / 1000 : 1 / 60;
      previousTime = time;
      let moving = false;
      for (const print of prints) {
        if (active?.print === print) continue;
        const result = stepDeskMotion(print.state, dt, dimensions, print.size);
        print.state = result.state;
        paint(print);
        moving ||= !result.settled;
      }
      if (moving) frame = requestAnimationFrame(tick);
      else previousTime = 0;
    };
    const wake = () => {
      if (
        !frame &&
        measured &&
        !disposed &&
        visible &&
        !document.hidden &&
        !covered() &&
        !reduced.matches
      )
        frame = requestAnimationFrame(tick);
    };
    const release = (cancelled = false) => {
      if (!active) return;
      const drag = active;
      active = null;
      delete drag.print.node.dataset.dragging;
      if (drag.print.grab.hasPointerCapture(drag.id))
        drag.print.grab.releasePointerCapture(drag.id);
      if (drag.dragged || drag.startedOnGrip)
        drag.print.suppressClickUntil = performance.now() + 450;
      const velocity =
        !cancelled && drag.dragged && !reduced.matches
          ? getDeskReleaseVelocity(drag.samples, performance.now())
          : { vx: 0, vy: 0 };
      Object.assign(drag.print.state, velocity, {
        angularVelocity: reduced.matches
          ? 0
          : Math.max(-45, Math.min(45, velocity.vx * 0.03)),
      });
      if (reduced.matches) {
        drag.print.state.rotation = drag.print.state.restRotation;
        paint(drag.print);
      }
      wake();
    };
    const measure = () => {
      if (disposed) return;
      if (covered() || document.hidden) {
        needsMeasure = true;
        return;
      }
      release(true);
      stop();
      dimensions = {
        width: stage.clientWidth,
        height: stage.clientHeight,
        inset: 10,
      };
      for (const print of prints) {
        const angle =
          Number.parseFloat(
            getComputedStyle(print.slot).getPropertyValue("--desk-angle"),
          ) || 0;
        print.size = {
          width: print.node.offsetWidth,
          height: print.node.offsetHeight,
        };
        print.home = { x: print.slot.offsetLeft, y: print.slot.offsetTop };
        const point = clampDeskPosition(
          print.home,
          getDeskBounds(dimensions, print.size, angle),
        );
        print.state = {
          ...point,
          vx: 0,
          vy: 0,
          rotation: angle,
          angularVelocity: 0,
          restRotation: angle,
        };
        paint(print);
      }
      measured = true;
      needsMeasure = false;
    };
    const ready = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (disposed || covered() || document.hidden) return;
        if (!measured || needsMeasure) measure();
        wake();
      });
    };
    const localPoint = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };

    for (const print of prints) {
      const down = (event: PointerEvent) => {
        if (!event.isPrimary || event.button !== 0 || active || covered())
          return;
        // The image still permits vertical scrolling on touch. Only its small
        // visible grip opts into two-dimensional touch dragging.
        if (
          event.pointerType === "touch" &&
          !(event.target as Element).closest("[data-desk-grip]")
        )
          return;
        if (event.pointerType !== "touch") event.preventDefault();
        if (!measured) measure();
        print.grab.focus({ preventScroll: true });
        const point = localPoint(event);
        bringForward(print);
        print.state.vx = print.state.vy = print.state.angularVelocity = 0;
        active = {
          print,
          id: event.pointerId,
          origin: point,
          start: { x: print.state.x, y: print.state.y },
          samples: [{ ...point, time: performance.now() }],
          dragged: false,
          startedOnGrip: Boolean(
            (event.target as Element).closest("[data-desk-grip]"),
          ),
        };
        print.grab.setPointerCapture(event.pointerId);
      };
      const move = (event: PointerEvent) => {
        if (!active || active.print !== print || active.id !== event.pointerId)
          return;
        const point = localPoint(event);
        active.dragged ||= isDeskDrag(active.origin, point);
        active.samples.push({ ...point, time: performance.now() });
        active.samples = active.samples.slice(-8);
        if (!active.dragged) return;
        print.node.dataset.dragging = "true";
        const dx = point.x - active.origin.x;
        const dy = point.y - active.origin.y;
        const rotation =
          print.state.restRotation +
          (reduced.matches ? 0 : Math.max(-7, Math.min(7, dx * 0.035)));
        Object.assign(
          print.state,
          clampDeskPosition(
            { x: active.start.x + dx, y: active.start.y + dy },
            getDeskBounds(dimensions, print.size, rotation),
          ),
          { rotation },
        );
        paint(print);
      };
      const up = (event: PointerEvent) => {
        if (active?.print === print && active.id === event.pointerId) release();
      };
      const cancel = () => {
        if (active?.print === print) release(true);
      };
      const click = (event: MouseEvent) => {
        if (
          covered() ||
          (event.detail > 0 &&
            (performance.now() < print.suppressClickUntil ||
              (event.target as Element).closest("[data-desk-grip]")))
        ) {
          event.preventDefault();
          return;
        }
        // The drag target is a button, so the document-level route capture
        // cannot fire prematurely. A deliberate click uses the real Link.
        print.link.click();
      };
      const key = (event: KeyboardEvent) => {
        if (covered()) return;
        const delta = event.shiftKey ? 32 : 16;
        const vectors: Record<string, DeskPoint> = {
          ArrowLeft: { x: -delta, y: 0 },
          ArrowRight: { x: delta, y: 0 },
          ArrowUp: { x: 0, y: -delta },
          ArrowDown: { x: 0, y: delta },
        };
        if (!vectors[event.key] && !["Home", "Escape"].includes(event.key))
          return;
        event.preventDefault();
        release(true);
        const offset = vectors[event.key];
        const next = offset
          ? { x: print.state.x + offset.x, y: print.state.y + offset.y }
          : print.home;
        Object.assign(
          print.state,
          clampDeskPosition(
            next,
            getDeskBounds(dimensions, print.size, print.state.restRotation),
          ),
          {
            vx: 0,
            vy: 0,
            angularVelocity: 0,
            rotation: print.state.restRotation,
          },
        );
        bringForward(print);
        paint(print);
      };
      const focus = () => bringForward(print);
      print.grab.addEventListener("pointerdown", down);
      print.grab.addEventListener("pointermove", move);
      print.grab.addEventListener("pointerup", up);
      print.grab.addEventListener("pointercancel", cancel);
      print.grab.addEventListener("lostpointercapture", cancel);
      print.grab.addEventListener("click", click);
      print.grab.addEventListener("keydown", key);
      print.node.addEventListener("focusin", focus);
      unbind.push(() => {
        print.grab.removeEventListener("pointerdown", down);
        print.grab.removeEventListener("pointermove", move);
        print.grab.removeEventListener("pointerup", up);
        print.grab.removeEventListener("pointercancel", cancel);
        print.grab.removeEventListener("lostpointercapture", cancel);
        print.grab.removeEventListener("click", click);
        print.grab.removeEventListener("keydown", key);
        print.node.removeEventListener("focusin", focus);
      });
    }

    const freeze = () => {
      release(true);
      stop();
      cancelAnimationFrame(resizeFrame);
      resizeFrame = 0;
    };
    const visibility = () => {
      if (document.hidden) freeze();
      else ready();
    };
    const preference = () => {
      freeze();
      if (!measured) return;
      for (const print of prints) {
        print.state.vx = print.state.vy = print.state.angularVelocity = 0;
        print.state.rotation = print.state.restRotation;
        paint(print);
      }
    };
    const reset = root.querySelector<HTMLButtonElement>("[data-desk-reset]");
    reset?.addEventListener("click", measure);
    const resize = new ResizeObserver(() => {
      needsMeasure = true;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measure);
    });
    resize.observe(stage);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) ready();
      else freeze();
    });
    visibilityObserver.observe(stage);
    window.addEventListener("portfolio:capture-frame", freeze);
    window.addEventListener("portfolio:transition-start", freeze);
    window.addEventListener("portfolio:transition-end", ready);
    window.addEventListener("focus", ready);
    window.addEventListener("pageshow", ready);
    window.addEventListener("blur", freeze);
    window.addEventListener("pagehide", freeze);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", preference);
    measure();
    void document.fonts.ready.then(() => {
      if (!disposed) measure();
    });
    return () => {
      disposed = true;
      freeze();
      cancelAnimationFrame(resizeFrame);
      resize.disconnect();
      visibilityObserver.disconnect();
      unbind.forEach((remove) => remove());
      reset?.removeEventListener("click", measure);
      window.removeEventListener("portfolio:capture-frame", freeze);
      window.removeEventListener("portfolio:transition-start", freeze);
      window.removeEventListener("portfolio:transition-end", ready);
      window.removeEventListener("focus", ready);
      window.removeEventListener("pageshow", ready);
      window.removeEventListener("blur", freeze);
      window.removeEventListener("pagehide", freeze);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", preference);
    };
  }, [rootRef, identity]);
}
