"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { freezeViewport, warmCaptureAssets } from "./spider-transition/capture";
import { getNavigationTarget, routeKey } from "./spider-transition/navigation";
import type { TransitionScene } from "./spider-transition/scene";
import { createTransitionAudio } from "./spider-transition/audio";
import { getTransitionResolution } from "./spider-transition/performance";
import {
  CONTACT_TIME,
  DURATION,
  PLAYBACK_RATE,
} from "./spider-transition/motion";
import "./spider-transition/transition.css";

type Flight = {
  controller: AbortController;
  from: string;
  committed: boolean;
  ready: boolean;
  frame: number;
  timeout: number;
  sawPending: boolean;
  focusBefore: HTMLElement | null;
};

/** One global flight. Next retains ownership of routing, redirects and history. */
export default function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [routePending, startRouteTransition] = useTransition();
  const pathname = usePathname();
  const search = useSearchParams();
  const committedKey = `${pathname}${search.size ? `?${search.toString()}` : ""}`;
  const page = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const commit = useRef<(key: string) => void>(() => {});
  const settlement = useRef<(pending: boolean) => void>(() => {});
  const latestKey = useRef(committedKey);

  useLayoutEffect(() => {
    latestKey.current = committedKey;
    commit.current(committedKey);
  }, [committedKey]);

  useEffect(() => {
    settlement.current(routePending);
  }, [routePending]);

  useEffect(() => {
    const surface = page.current!,
      layer = overlay.current!,
      screen = canvas.current!;
    // Isolate the inert copy from page styles and document-wide animation queries.
    const frozen =
      preview.current!.shadowRoot ||
      preview.current!.attachShadow({ mode: "open" });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sound = createTransitionAudio();
    let scene: TransitionScene | undefined;
    let preparation: Promise<TransitionScene> | undefined;
    let disposed = false,
      failed = false;
    let active: Flight | undefined;
    let queued: URL | undefined;
    let idle: number | undefined;
    const root = document.documentElement;

    const prepare = () => {
      if (failed || disposed)
        return Promise.reject(new Error("3D transition unavailable"));
      if (!preparation)
        preparation = import("./spider-transition/scene")
          .then(({ createTransitionScene }) => {
            if (disposed) throw new Error("Transition disposed");
            scene = createTransitionScene(screen);
            scene.warmup(innerWidth, innerHeight);
            return scene;
          })
          .catch((error: unknown) => {
            failed = true;
            throw error;
          });
      return preparation;
    };

    function focusDestination() {
      let hashTarget: HTMLElement | null = null;
      try {
        hashTarget = location.hash
          ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
          : null;
      } catch {}
      const target =
        (hashTarget && surface.contains(hashTarget) ? hashTarget : null) ||
        surface.querySelector<HTMLElement>("main h1") ||
        surface.querySelector<HTMLElement>("main");
      if (!target) return;
      const hadTabIndex = target.hasAttribute("tabindex");
      if (!hadTabIndex) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      if (!hadTabIndex)
        target.addEventListener(
          "blur",
          () => target.removeAttribute("tabindex"),
          { once: true },
        );
    }

    function finish(focus = true) {
      const flight = active;
      if (!flight) return;
      active = undefined;
      flight.controller.abort();
      cancelAnimationFrame(flight.frame);
      clearTimeout(flight.timeout);
      sound.stop(document.hidden);
      layer.hidden = true;
      screen.style.visibility = "hidden";
      frozen.replaceChildren();
      surface.inert = false;
      surface.removeAttribute("aria-busy");
      root.classList.remove("portfolio-transitioning");
      delete root.dataset.spiderTransition;
      scene?.clear();
      window.dispatchEvent(new Event("portfolio:transition-end"));
      if (focus && flight.committed) focusDestination();
      else if (!flight.committed && flight.focusBefore?.isConnected)
        flight.focusBefore.focus({ preventScroll: true });
      const next = queued;
      queued = undefined;
      if (next && routeKey(next.href) !== latestKey.current && !disposed)
        void navigate(next, false);
    }

    async function readyAfterCommit(flight: Flight) {
      const visibleImages = Array.from(surface.querySelectorAll("img")).filter(
        (image) => {
          const rect = image.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < innerHeight && rect.width > 0;
        },
      );
      await Promise.race([
        Promise.all([
          document.fonts.ready,
          ...visibleImages.map((image) => image.decode().catch(() => {})),
        ]),
        new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, 2000);
          flight.controller.signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
        }),
      ]);
      if (active === flight && !flight.controller.signal.aborted) {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (active === flight) flight.ready = true;
          }),
        );
      }
    }

    commit.current = (key) => {
      const flight = active;
      if (flight && key !== flight.from) {
        flight.committed = true;
        // A committed redirect (e.g. /experience -> /about) is equally ready.
        void readyAfterCommit(flight);
      } else if (!flight) {
        window.dispatchEvent(new Event("portfolio:transition-end"));
        focusDestination();
      }
    };

    settlement.current = (pending) => {
      if (!active) return;
      if (pending) active.sawPending = true;
      else if (active.sawPending && !active.committed) finish(false);
    };

    async function navigate(to: URL, pop: boolean) {
      // The existing /experience route is a permanent alias of /about.
      if (to.pathname === "/experience") {
        to = new URL(to);
        to.pathname = "/about";
      }
      if (active) {
        if (!pop) {
          queued = to;
          return;
        }
        queued = undefined;
        finish(false);
      }
      if (reduced.matches || failed) {
        if (!pop) router.push(to.pathname + to.search + to.hash);
        return;
      }
      const from = latestKey.current;
      if (from === routeKey(to.href)) return;
      const flight: Flight = {
        controller: new AbortController(),
        from,
        committed: false,
        ready: false,
        frame: 0,
        timeout: 0,
        sawPending: false,
        focusBefore:
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null,
      };
      active = flight;
      root.dataset.spiderTransition = "capturing";
      let navigationSent = pop;
      try {
        // Synchronous freezing precedes React's commit, including Back / Forward.
        window.dispatchEvent(new Event("portfolio:capture-frame"));
        const snapshot = freezeViewport(
          surface,
          getTransitionResolution(
            innerWidth,
            innerHeight,
            devicePixelRatio || 1,
            navigator.hardwareConcurrency || 8,
          ).captureRatio,
        );
        frozen.replaceChildren(snapshot.preview);
        layer.hidden = false;
        // Measure and cover the original layout before menu/scroll callbacks
        // can change sticky positioning or the header's containing block.
        window.dispatchEvent(new Event("portfolio:transition-start"));
        root.classList.add("portfolio-transitioning");
        surface.inert = true;
        surface.setAttribute("aria-busy", "true");
        // Fail open on a stalled server; the router keeps preparing the request.
        flight.timeout = window.setTimeout(() => finish(), 12000);
        if (!pop) {
          navigationSent = true;
          startRouteTransition(() =>
            router.push(to.pathname + to.search + to.hash),
          );
        }
        // Prepare all sound buffers behind the frozen cover, before any
        // visual frame or attachment/release cue needs them.
        sound.prepare();
        const [engine, texture] = await Promise.all([
          prepare(),
          snapshot.render(flight.controller.signal),
        ]);
        if (active !== flight || flight.controller.signal.aborted) return;
        engine.begin(texture, snapshot.width, snapshot.height);
        screen.style.visibility = "visible";
        frozen.replaceChildren();
        root.dataset.spiderTransition = "swinging";
        sound.begin(snapshot.width, snapshot.height);
        let previous = performance.now(),
          time = 0;
        const tick = (now: number) => {
          if (active !== flight) return;
          try {
            const frameDt = Math.max(0, (now - previous) / 1000);
            const dt = Math.min(frameDt, 1 / 30) * PLAYBACK_RATE;
            previous = now;
            time = Math.min(time + dt, flight.ready ? DURATION : CONTACT_TIME);
            const phase =
              time < CONTACT_TIME
                ? "swinging"
                : flight.ready
                  ? "pulling"
                  : "holding";
            if (root.dataset.spiderTransition !== phase)
              root.dataset.spiderTransition = phase;
            engine.render(time, dt, frameDt);
            sound.update(time);
            if (time >= DURATION) {
              finish();
              return;
            }
            flight.frame = requestAnimationFrame(tick);
          } catch (error) {
            console.warn(
              "[Spider transition] Animation released after render failure.",
              error,
            );
            failed = true;
            finish();
          }
        };
        flight.frame = requestAnimationFrame(tick);
      } catch (error) {
        if (active !== flight) return;
        console.warn(
          "[Spider transition] Native navigation retained; capture/3D unavailable.",
          error,
        );
        finish();
        if (!navigationSent) router.push(to.pathname + to.search + to.hash);
      }
    }

    const click = (event: MouseEvent) => {
      const anchor = event
        .composedPath()
        .find((node) => node instanceof HTMLAnchorElement) as
        HTMLAnchorElement | undefined;
      if (!anchor) return;
      const target = getNavigationTarget(
        anchor.href,
        location.href,
        { download: anchor.hasAttribute("download"), target: anchor.target },
        event,
      );
      if (!target || reduced.matches || failed) return;
      event.preventDefault();
      sound.unlock();
      void navigate(target, false);
    };
    const pop = () => {
      const to = new URL(location.href);
      if (routeKey(to.href) !== latestKey.current) void navigate(to, true);
    };
    const warm = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (
        anchor instanceof HTMLAnchorElement &&
        anchor.origin === location.origin &&
        anchor.pathname !== location.pathname &&
        !anchor.hasAttribute("download") &&
        !anchor.pathname.startsWith("/api/") &&
        (!anchor.target || anchor.target === "_self")
      ) {
        router.prefetch(anchor.pathname + anchor.search);
        if (!reduced.matches) {
          warmCaptureAssets(surface);
          sound.warm();
          void prepare().catch(() => {});
        }
      }
    };
    const interrupt = () => {
      queued = undefined;
      finish();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      failed = true;
      interrupt();
    };
    const keydown = (event: KeyboardEvent) => {
      if (active && event.key === "Escape") interrupt();
    };
    const visibility = () => {
      if (document.hidden) interrupt();
    };
    document.addEventListener("click", click, true);
    document.addEventListener("pointerover", warm, { passive: true });
    document.addEventListener("focusin", warm);
    window.addEventListener("popstate", pop, true);
    window.addEventListener("resize", interrupt);
    window.addEventListener("pagehide", interrupt);
    window.addEventListener("keydown", keydown);
    document.addEventListener("visibilitychange", visibility);
    screen.addEventListener("webglcontextlost", lost);
    reduced.addEventListener("change", interrupt);
    const preload = () => {
      if (!reduced.matches) {
        warmCaptureAssets(surface);
        sound.warm();
        void prepare().catch(() => {});
      }
    };
    if (typeof window.requestIdleCallback === "function")
      idle = window.requestIdleCallback(preload, { timeout: 2000 });
    else idle = window.setTimeout(preload, 1000);

    return () => {
      disposed = true;
      queued = undefined;
      finish(false);
      commit.current = () => {};
      settlement.current = () => {};
      document.removeEventListener("click", click, true);
      document.removeEventListener("pointerover", warm);
      document.removeEventListener("focusin", warm);
      window.removeEventListener("popstate", pop, true);
      window.removeEventListener("resize", interrupt);
      window.removeEventListener("pagehide", interrupt);
      window.removeEventListener("keydown", keydown);
      document.removeEventListener("visibilitychange", visibility);
      screen.removeEventListener("webglcontextlost", lost);
      reduced.removeEventListener("change", interrupt);
      if (idle !== undefined) {
        if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
        else clearTimeout(idle);
      }
      scene?.dispose();
      sound.dispose();
    };
  }, [router, startRouteTransition]);

  return (
    <>
      <div ref={page} data-transition-page>
        {children}
      </div>
      <div
        ref={overlay}
        className="spider-transition"
        data-transition-ignore
        aria-hidden="true"
        inert
        hidden
      >
        <div ref={preview} className="spider-transition__freeze" />
        <canvas ref={canvas} className="spider-transition__canvas" />
      </div>
    </>
  );
}
