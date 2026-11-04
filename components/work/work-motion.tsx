"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * GSAP owns reveal wrappers; Anime owns only the arrow inside a work link.
 * Keep these targets separate from the global `.reveal` and `.button` hooks.
 * Content is visible in the server render and remains usable if motion fails.
 */
export default function WorkMotion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const select = <T extends Element = HTMLElement>(selector: string) =>
      Array.from(root.querySelectorAll<T>(selector)).filter(
        (element) => element.closest("[data-work-motion-scope]") === root,
      );

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia("(max-width: 767px)");
    const hover = matchMedia("(hover: hover) and (pointer: fine)");
    let disposed = false;
    let initialized = false;
    let startFrame = 0;
    let refreshFrame = 0;
    let observer: ResizeObserver | undefined;
    let initialize: (() => void) | undefined;
    let disposeMotion: (() => void) | undefined;
    let pauseMotion: (() => void) | undefined;
    let resumeMotion: (() => void) | undefined;
    let refreshMotion: (() => void) | undefined;

    const covered = () => {
      const documentRoot = document.documentElement;
      return (
        Boolean(documentRoot.dataset.spiderTransition) ||
        documentRoot.classList.contains("portfolio-transitioning") ||
        documentRoot.classList.contains("portfolio-loading")
      );
    };

    const scheduleRefresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => {
        if (!disposed && initialized && !covered()) refreshMotion?.();
      });
    };

    const ready = () => {
      cancelAnimationFrame(startFrame);
      startFrame = requestAnimationFrame(() => {
        // A queued global navigation can begin during transition-end itself.
        if (disposed || covered() || !root.isConnected) return;
        if (initialized) resumeMotion?.();
        else initialize?.();
        scheduleRefresh();
      });
    };

    const pause = () => {
      cancelAnimationFrame(startFrame);
      pauseMotion?.();
    };

    const preferenceChanged = () => {
      disposeMotion?.();
      disposeMotion = undefined;
      pauseMotion = undefined;
      resumeMotion = undefined;
      initialized = false;
      ready();
    };

    // Freeze before the outgoing page is copied. After arrival, attach scroll
    // and hover motion without hiding content the transition already exposed.
    window.addEventListener("portfolio:capture-frame", pause);
    window.addEventListener("portfolio:transition-start", pause);
    window.addEventListener("portfolio:transition-end", ready);
    window.addEventListener("portfolio:preloader-complete", ready);
    reduced.addEventListener("change", preferenceChanged);
    compact.addEventListener("change", preferenceChanged);

    void Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("animejs"),
    ])
      .then(([{ gsap }, { ScrollTrigger }, { animate }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        refreshMotion = () => ScrollTrigger.refresh();

        initialize = () => {
          if (disposed || initialized || covered()) return;
          initialized = true;
          root.dataset.workMotion = "ready";
          if (reduced.matches) return;

          const animations: gsap.core.Animation[] = [];
          const paused = new Set<gsap.core.Animation>();
          const suspendedTriggers = new Set<
            NonNullable<gsap.core.Animation["scrollTrigger"]>
          >();
          const arrows = new Map<Element, ReturnType<typeof animate>>();
          const pausedArrows = new Set<ReturnType<typeof animate>>();
          const revealAnimations = new Map<Element, gsap.core.Animation>();
          const originalStyles = new Map<Element, string | null>();
          const unbind: Array<() => void> = [];
          const context = gsap.context(() => {}, root);

          disposeMotion = () => {
            unbind.forEach((remove) => remove());
            arrows.forEach((animation) => animation.revert());
            originalStyles.forEach((style, element) => {
              if (style === null) element.removeAttribute("style");
              else element.setAttribute("style", style);
            });
            arrows.clear();
            paused.clear();
            pausedArrows.clear();
            suspendedTriggers.clear();
            revealAnimations.clear();
            context.revert();
          };

          pauseMotion = () => {
            animations.forEach((animation) => {
              if (
                animation.scrollTrigger &&
                !suspendedTriggers.has(animation.scrollTrigger)
              ) {
                suspendedTriggers.add(animation.scrollTrigger);
                // Keep the exact captured appearance. Disabling without a
                // revert prevents native scroll/refresh from playing it again.
                animation.scrollTrigger.disable(false, true);
              }
              if (
                !animation.paused() &&
                (animation.reversed()
                  ? animation.progress() > 0
                  : animation.progress() < 1)
              ) {
                paused.add(animation);
                animation.pause();
              }
            });
            arrows.forEach((animation) => {
              if (!animation.paused && !animation.completed) {
                pausedArrows.add(animation);
                animation.pause();
              }
            });
          };
          resumeMotion = () => {
            suspendedTriggers.forEach((trigger) =>
              trigger.enable(false, false),
            );
            suspendedTriggers.clear();
            paused.forEach((animation) => animation.resume());
            paused.clear();
            pausedArrows.forEach((animation) => animation.resume());
            pausedArrows.clear();
          };

          try {
            context.add(() => {
              select(
                '[data-work-reveal]:not([data-work-reveal="hero"])',
              ).forEach((element) => {
                // Imports and transition-end run after the page is visible.
                // Only prepare content below the viewport; never hide and
                // replay the hero, visible content, or a restored history view.
                if (element.getBoundingClientRect().top < innerHeight) return;
                const animation = gsap.fromTo(
                  element,
                  { y: compact.matches ? 16 : 28, opacity: 0 },
                  {
                    y: 0,
                    opacity: 1,
                    duration: 0.7,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: element,
                      start: "top 93%",
                      end: "bottom top",
                      toggleActions: "play none none reverse",
                    },
                  },
                );
                animations.push(animation);
                revealAnimations.set(element, animation);
              });

              select("[data-work-image]").forEach((frame) => {
                const isHero = frame.dataset.workImage === "hero";
                if (isHero || frame.getBoundingClientRect().top < innerHeight)
                  return;
                const image = frame.querySelector<HTMLElement>(
                  "[data-work-image-inner]",
                );
                const timeline = gsap.timeline({
                  scrollTrigger: {
                    trigger: frame,
                    start: "top 92%",
                    end: "bottom top",
                    toggleActions: "play none none reverse",
                  },
                });
                animations.push(timeline);
                revealAnimations.set(frame, timeline);
                timeline.fromTo(
                  frame,
                  { clipPath: "inset(0% 0% 16% 0%)" },
                  {
                    clipPath: "inset(0% 0% 0% 0%)",
                    duration: compact.matches ? 0.75 : 1.1,
                    ease: "power3.out",
                  },
                  0,
                );
                if (image) {
                  timeline.fromTo(
                    image,
                    {
                      scale: frame.hasAttribute("data-work-viewport")
                        ? 0.985
                        : compact.matches
                          ? 1.025
                          : 1.055,
                    },
                    { scale: 1, duration: 1.15, ease: "power3.out" },
                    0,
                  );
                }
              });
            });

            const revealFocused = (event: FocusEvent) => {
              const target = event.target;
              if (!(target instanceof Element) || covered()) return;
              // Opacity does not remove links from the keyboard order. Show
              // their content immediately when Tab scrolls a link into view.
              revealAnimations.forEach((animation, element) => {
                if (element.contains(target) || target.contains(element))
                  animation.progress(1).pause();
              });
            };
            root.addEventListener("focusin", revealFocused);
            unbind.push(() =>
              root.removeEventListener("focusin", revealFocused),
            );

            select<HTMLElement>("[data-work-link]").forEach((link) => {
              const arrow = link.querySelector<HTMLElement | SVGElement>(
                "[data-work-arrow]",
              );
              if (!arrow) return;
              originalStyles.set(arrow, arrow.getAttribute("style"));
              const offset = arrow.classList.contains("lucide-arrow-left")
                ? [-4, 0]
                : arrow.classList.contains("lucide-arrow-down")
                  ? [0, 4]
                  : [4, -4];
              let pointing = false;
              let focused = false;
              const update = () => {
                if (covered() || reduced.matches) return;
                arrows.get(arrow)?.cancel();
                arrows.set(
                  arrow,
                  animate(arrow, {
                    translateX: pointing || focused ? offset[0] : 0,
                    translateY: pointing || focused ? offset[1] : 0,
                    duration: 240,
                    ease: "out(3)",
                  }),
                );
              };
              const enter = () => {
                pointing = hover.matches;
                update();
              };
              const leave = () => {
                pointing = false;
                update();
              };
              const focus = () => {
                focused = true;
                update();
              };
              const blur = () => {
                focused = false;
                update();
              };
              link.addEventListener("pointerenter", enter);
              link.addEventListener("pointerleave", leave);
              link.addEventListener("focusin", focus);
              link.addEventListener("focusout", blur);
              unbind.push(() => {
                link.removeEventListener("pointerenter", enter);
                link.removeEventListener("pointerleave", leave);
                link.removeEventListener("focusin", focus);
                link.removeEventListener("focusout", blur);
              });
            });
          } catch {
            // Reverting restores the complete, readable server-rendered page.
            disposeMotion();
            pauseMotion = undefined;
            resumeMotion = undefined;
            root.dataset.workMotion = "static";
          }
        };

        if (typeof ResizeObserver !== "undefined") {
          let width = -1;
          let height = -1;
          observer = new ResizeObserver(([entry]) => {
            if (!entry) return;
            const bounds = entry.contentRect;
            if (bounds.width === width && bounds.height === height) return;
            width = bounds.width;
            height = bounds.height;
            scheduleRefresh();
          });
          observer.observe(root);
        }
        void document.fonts?.ready.then(() => {
          if (!disposed) scheduleRefresh();
        });
        ready();
      })
      .catch(() => {
        if (!disposed) root.dataset.workMotion = "static";
        disposeMotion?.();
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(startFrame);
      cancelAnimationFrame(refreshFrame);
      observer?.disconnect();
      disposeMotion?.();
      window.removeEventListener("portfolio:capture-frame", pause);
      window.removeEventListener("portfolio:transition-start", pause);
      window.removeEventListener("portfolio:transition-end", ready);
      window.removeEventListener("portfolio:preloader-complete", ready);
      reduced.removeEventListener("change", preferenceChanged);
      compact.removeEventListener("change", preferenceChanged);
    };
  }, [pathname]);

  return (
    <div ref={scope} className={className} data-work-motion-scope>
      {children}
    </div>
  );
}
