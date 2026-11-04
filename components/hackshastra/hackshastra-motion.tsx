"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** GSAP owns composition wrappers; Anime owns only link arrows. */
export default function HackShastraMotion({
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
        (element) => element.closest("[data-hackshastra-scope]") === root,
      );
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia("(max-width: 767px)");
    const hover = matchMedia("(hover: hover) and (pointer: fine)");
    let disposed = false;
    let initialized = false;
    let entered = false;
    let startFrame = 0;
    let refreshFrame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let initialize: (() => void) | undefined;
    let disposeMotion: (() => void) | undefined;
    let pauseMotion: (() => void) | undefined;
    let resumeMotion: (() => void) | undefined;
    let refreshMotion: (() => void) | undefined;

    const covered = () => {
      const html = document.documentElement;
      return (
        Boolean(html.dataset.spiderTransition) ||
        html.classList.contains("portfolio-transitioning") ||
        html.classList.contains("portfolio-loading")
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
        // A queued navigation can start during transition-end itself.
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
          root.dataset.hackshastraMotion = reduced.matches
            ? "reduced"
            : "ready";
          const firstEntry = !entered;
          entered = true;
          if (reduced.matches) return;

          const context = gsap.context(() => {}, root);
          const animations: gsap.core.Animation[] = [];
          const reveals = new Map<Element, gsap.core.Animation>();
          const paused = new Set<gsap.core.Animation>();
          const suspendedTriggers = new Set<
            NonNullable<gsap.core.Animation["scrollTrigger"]>
          >();
          const arrows = new Map<Element, ReturnType<typeof animate>>();
          const pausedArrows = new Set<ReturnType<typeof animate>>();
          const arrowStyles = new Map<Element, string | null>();
          const unbind: Array<() => void> = [];

          disposeMotion = () => {
            unbind.forEach((remove) => remove());
            arrows.forEach((animation) => animation.revert());
            arrowStyles.forEach((style, arrow) => {
              if (style === null) arrow.removeAttribute("style");
              else arrow.setAttribute("style", style);
            });
            context.revert();
            arrows.clear();
            pausedArrows.clear();
            paused.clear();
            suspendedTriggers.clear();
            reveals.clear();
          };
          pauseMotion = () => {
            animations.forEach((animation) => {
              if (animation.scrollTrigger) {
                suspendedTriggers.add(animation.scrollTrigger);
                // Freeze the exact frame that the global transition captures.
                animation.scrollTrigger.disable(false, true);
              }
              if (!animation.paused() && animation.progress() < 1) {
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
              const navigation = performance.getEntriesByType(
                "navigation",
              )[0] as PerformanceNavigationTiming | undefined;
              if (
                firstEntry &&
                scrollY < 2 &&
                !location.hash &&
                navigation?.type !== "back_forward"
              ) {
                // Never hide the already-readable hero while imports load.
                const intro = select("[data-hackshastra-intro]");
                if (intro.length) {
                  animations.push(
                    gsap.fromTo(
                      intro,
                      { y: compact.matches ? 12 : 24 },
                      {
                        y: 0,
                        duration: 0.85,
                        stagger: 0.075,
                        ease: "power3.out",
                      },
                    ),
                  );
                }
              }

              select("[data-hackshastra-line]").forEach((line) => {
                // Restored scroll positions and visible content stay intact.
                if (line.getBoundingClientRect().top < innerHeight) return;
                const animation = gsap.fromTo(
                  line,
                  {
                    clipPath: "inset(0 0 100% 0)",
                    y: compact.matches ? 8 : 16,
                  },
                  {
                    clipPath: "inset(0 0 0% 0)",
                    y: 0,
                    clearProps: "clipPath",
                    duration: 0.85,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: line,
                      start: "top 94%",
                      once: true,
                    },
                  },
                );
                animations.push(animation);
                reveals.set(line, animation);
              });

              select<HTMLElement>("[data-hackshastra-image]").forEach(
                (frame) => {
                  if (frame.getBoundingClientRect().top < innerHeight) return;
                  const animation = gsap.fromTo(
                    frame,
                    { clipPath: "inset(0 0 14% 0)" },
                    {
                      clipPath: "inset(0 0 0% 0)",
                      clearProps: "clipPath",
                      duration: compact.matches ? 0.7 : 1.15,
                      ease: "power3.out",
                      scrollTrigger: {
                        trigger: frame,
                        start: "top 94%",
                        once: true,
                      },
                    },
                  );
                  animations.push(animation);
                  reveals.set(frame, animation);
                },
              );

              select("[data-hackshastra-rule]").forEach((rule) => {
                if (rule.getBoundingClientRect().top < innerHeight) return;
                animations.push(
                  gsap.fromTo(
                    rule,
                    { scaleX: 0, transformOrigin: "left center" },
                    {
                      scaleX: 1,
                      duration: 1,
                      ease: "power2.out",
                      scrollTrigger: {
                        trigger: rule,
                        start: "top 94%",
                        once: true,
                      },
                    },
                  ),
                );
              });

              if (!compact.matches) {
                select("[data-hackshastra-parallax]").forEach((frame) => {
                  const image = frame.querySelector<HTMLElement>(
                    "[data-hackshastra-parallax-inner]",
                  );
                  if (!image) return;
                  animations.push(
                    gsap.fromTo(
                      image,
                      { yPercent: -3 },
                      {
                        yPercent: 3,
                        ease: "none",
                        scrollTrigger: {
                          trigger: frame,
                          start: "top bottom",
                          end: "bottom top",
                          scrub: 0.5,
                        },
                      },
                    ),
                  );
                });
              }
            });

            const revealFocused = (event: FocusEvent) => {
              const target = event.target;
              if (!(target instanceof Element) || covered()) return;
              reveals.forEach((animation, element) => {
                if (element.contains(target) || target.contains(element)) {
                  animation.progress(1).pause();
                  animation.scrollTrigger?.kill();
                }
              });
            };
            root.addEventListener("focusin", revealFocused);
            unbind.push(() =>
              root.removeEventListener("focusin", revealFocused),
            );

            select<HTMLElement>("[data-hackshastra-link]").forEach((link) => {
              const arrow = link.querySelector<HTMLElement | SVGElement>(
                "[data-hackshastra-arrow]",
              );
              if (!arrow) return;
              arrowStyles.set(arrow, arrow.getAttribute("style"));
              const offset = arrow.classList.contains("lucide-arrow-left")
                ? [-4, 0]
                : arrow.classList.contains("lucide-arrow-down")
                  ? [0, 4]
                  : arrow.classList.contains("lucide-arrow-right")
                    ? [4, 0]
                    : [3, -3];
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
                    duration: 200,
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
            disposeMotion();
            pauseMotion = undefined;
            resumeMotion = undefined;
            root.dataset.hackshastraMotion = "static";
          }
        };

        if (typeof ResizeObserver !== "undefined") {
          let width = -1;
          let height = -1;
          resizeObserver = new ResizeObserver(([entry]) => {
            if (!entry) return;
            const bounds = entry.contentRect;
            if (bounds.width === width && bounds.height === height) return;
            width = bounds.width;
            height = bounds.height;
            scheduleRefresh();
          });
          resizeObserver.observe(root);
        }
        void document.fonts?.ready.then(() => {
          if (!disposed) scheduleRefresh();
        });
        ready();
      })
      .catch(() => {
        disposeMotion?.();
        if (!disposed) root.dataset.hackshastraMotion = "static";
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(startFrame);
      cancelAnimationFrame(refreshFrame);
      resizeObserver?.disconnect();
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
    <div ref={scope} className={className} data-hackshastra-scope>
      {children}
    </div>
  );
}
