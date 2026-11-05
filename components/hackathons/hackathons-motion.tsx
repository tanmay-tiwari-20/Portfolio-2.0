"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** GSAP animates composition layers; Anime animates the separate link arrows. */
export default function HackathonsMotion({
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
        (node) => node.closest("[data-hackathons-scope]") === root,
      );
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia("(max-width: 767px)");
    const wide = matchMedia("(min-width: 1024px)");
    const hover = matchMedia("(hover: hover) and (pointer: fine)");
    let disposed = false;
    let initialized = false;
    let entered = false;
    let startFrame = 0;
    let refreshFrame = 0;
    let observer: ResizeObserver | undefined;
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
    const refresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => {
        if (!disposed && initialized && !covered()) refreshMotion?.();
      });
    };
    const ready = () => {
      cancelAnimationFrame(startFrame);
      startFrame = requestAnimationFrame(() => {
        if (disposed || covered() || !root.isConnected) return;
        if (initialized) resumeMotion?.();
        else initialize?.();
        refresh();
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
    wide.addEventListener("change", preferenceChanged);
    hover.addEventListener("change", preferenceChanged);

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
          root.dataset.hackathonsMotion = reduced.matches ? "reduced" : "ready";
          const firstEntry = !entered;
          entered = true;
          if (reduced.matches) return;

          const context = gsap.context(() => {}, root);
          const animations: gsap.core.Animation[] = [];
          const reveals = new Map<Element, gsap.core.Animation>();
          const paused = new Set<gsap.core.Animation>();
          const suspended = new Set<
            NonNullable<gsap.core.Animation["scrollTrigger"]>
          >();
          const arrows = new Map<Element, ReturnType<typeof animate>>();
          const pausedArrows = new Set<ReturnType<typeof animate>>();
          const arrowStyles = new Map<Element, string | null>();
          const arrowStates = new WeakMap<
            Element,
            { pointing: boolean; focused: boolean }
          >();
          const unbind: Array<() => void> = [];
          const freezeInteractions: Array<() => void> = [];
          const resetInteractions: Array<() => void> = [];

          const pruneArrows = () => {
            arrows.forEach((animation, arrow) => {
              if (
                root.contains(arrow) &&
                arrow.closest("[data-hackathons-scope]") === root
              )
                return;
              animation.revert();
              const originalStyle = arrowStyles.get(arrow);
              if (originalStyle === null) arrow.removeAttribute("style");
              else if (originalStyle !== undefined)
                arrow.setAttribute("style", originalStyle);
              pausedArrows.delete(animation);
              arrows.delete(arrow);
              arrowStyles.delete(arrow);
              arrowStates.delete(arrow);
            });
          };

          disposeMotion = () => {
            unbind.forEach((remove) => remove());
            arrows.forEach((animation) => animation.revert());
            arrowStyles.forEach((style, arrow) => {
              if (style === null) arrow.removeAttribute("style");
              else arrow.setAttribute("style", style);
            });
            context.revert();
            arrows.clear();
            arrowStyles.clear();
            pausedArrows.clear();
            paused.clear();
            suspended.clear();
            reveals.clear();
          };
          pauseMotion = () => {
            freezeInteractions.forEach((freeze) => freeze());
            pruneArrows();
            animations.forEach((animation) => {
              if (animation.scrollTrigger) {
                suspended.add(animation.scrollTrigger);
                // Preserve the exact frame captured by the shared route transition.
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
            pruneArrows();
            suspended.forEach((trigger) => trigger.enable(false, false));
            suspended.clear();
            paused.forEach((animation) => animation.resume());
            paused.clear();
            pausedArrows.forEach((animation) => animation.resume());
            pausedArrows.clear();
            resetInteractions.forEach((reset) => reset());
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
                const flows = select("[data-hk-hero-flow]");
                const intro = select("[data-hk-intro]");
                if (flows.length || intro.length) {
                  // Curves settle first, followed by the editorial content. Keep
                  // SSR copy readable: the entrance never hides text or waits
                  // for imagery before allowing the page to be used.
                  const entrance = gsap.timeline();
                  if (flows.length) {
                    entrance.fromTo(
                      flows,
                      {
                        y: compact.matches ? 24 : 64,
                        scaleY: 0.86,
                        transformOrigin: "50% 100%",
                      },
                      {
                        y: 0,
                        scaleY: 1,
                        duration: 1.35,
                        stagger: 0.09,
                        ease: "power3.out",
                      },
                      0,
                    );
                  }
                  if (intro.length) {
                    entrance.fromTo(
                      intro,
                      { y: compact.matches ? 12 : 24 },
                      {
                        y: 0,
                        duration: 1.1,
                        stagger: 0.055,
                        ease: "power3.out",
                      },
                      flows.length ? 0.22 : 0,
                    );
                  }
                  animations.push(entrance);
                }
              }

              select("[data-hk-line]").forEach((line) => {
                if (line.getBoundingClientRect().top < innerHeight) return;
                const animation = gsap.fromTo(
                  line,
                  {
                    clipPath: "inset(0 0 100% 0)",
                    y: compact.matches ? 8 : 20,
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

              select("[data-hk-image]").forEach((frame) => {
                if (frame.getBoundingClientRect().top < innerHeight) return;
                const animation = gsap.fromTo(
                  frame,
                  { clipPath: "inset(0 0 16% 0)" },
                  {
                    clipPath: "inset(0 0 0% 0)",
                    clearProps: "clipPath",
                    duration: compact.matches ? 0.7 : 1.1,
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
              });

              select("[data-hk-rule]").forEach((rule) => {
                if (rule.getBoundingClientRect().top < innerHeight) return;
                animations.push(
                  gsap.fromTo(
                    rule,
                    { scaleX: 0, transformOrigin: "left center" },
                    {
                      scaleX: 1,
                      duration: 1.1,
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

              select("[data-hk-sequence]").forEach((sequence) => {
                const steps = Array.from(
                  sequence.querySelectorAll("[data-hk-step]"),
                );
                steps.forEach((step) => {
                  if (step.getBoundingClientRect().top < innerHeight) return;
                  const animation = gsap.fromTo(
                    step,
                    { x: compact.matches ? 10 : 24 },
                    {
                      x: 0,
                      duration: 0.75,
                      ease: "power3.out",
                      scrollTrigger: {
                        trigger: step,
                        start: "top 90%",
                        once: true,
                      },
                    },
                  );
                  animations.push(animation);
                  reveals.set(step, animation);
                });
              });

              select("[data-hk-progress]").forEach((progress) => {
                const journey = progress.closest("[data-hk-journey]");
                if (!journey) return;
                animations.push(
                  gsap.fromTo(
                    progress,
                    { scaleY: 0, transformOrigin: "center top" },
                    {
                      scaleY: 1,
                      ease: "none",
                      scrollTrigger: {
                        trigger: journey,
                        start: "top 60%",
                        end: "bottom 65%",
                        scrub: 0.35,
                      },
                    },
                  ),
                );
              });

              select("[data-hk-reading-progress]").forEach((progress) => {
                animations.push(
                  gsap.fromTo(
                    progress,
                    { scaleX: 0, transformOrigin: "left center" },
                    {
                      scaleX: 1,
                      ease: "none",
                      scrollTrigger: {
                        trigger: root,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.2,
                      },
                    },
                  ),
                );
              });

              if (!compact.matches) {
                select(".hk-judge-title").forEach((heading) => {
                  const section = heading.closest(".hk-judging");
                  if (!section) return;
                  const words = heading.querySelectorAll(
                    "[data-hk-judge-word]",
                  );
                  words.forEach((word, index) => {
                    const direction = index % 2 === 0 ? 1 : -1;
                    animations.push(
                      gsap.fromTo(
                        word,
                        { x: -18 * direction },
                        {
                          x: 18 * direction,
                          ease: "none",
                          scrollTrigger: {
                            trigger: section,
                            start: "top 90%",
                            end: "bottom 20%",
                            scrub: 0.65,
                          },
                        },
                      ),
                    );
                  });
                });

                select("[data-hk-parallax]").forEach((frame) => {
                  const image = frame.querySelector("[data-hk-parallax-inner]");
                  if (!image) return;
                  animations.push(
                    gsap.fromTo(
                      image,
                      { yPercent: -2.5 },
                      {
                        yPercent: 2.5,
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

              if (wide.matches && hover.matches) {
                select<HTMLElement>(".hk-hero-visual").forEach((visual) => {
                  const layers = [
                    {
                      selector: ".hk-hero-photo",
                      depth: 7,
                      tilt: 2.5,
                      turn: 0.6,
                    },
                    {
                      selector: ".hk-hero-small",
                      depth: 12,
                      tilt: 3,
                      turn: 1,
                    },
                  ].flatMap(({ selector, depth, tilt, turn }) => {
                    const element = visual.querySelector<HTMLElement>(selector);
                    if (!element) return [];
                    // Preserve the current CSS rotation, including unrotated
                    // organic masks. Pointer movement never owns the entrance
                    // wrapper or the inner image's scroll parallax.
                    const rotation =
                      Number(gsap.getProperty(element, "rotation")) || 0;
                    gsap.set(element, { transformPerspective: 900 });
                    const options = { duration: 0.8, ease: "power3.out" };
                    const moveX = gsap.quickTo(element, "x", options);
                    const moveY = gsap.quickTo(element, "y", options);
                    const tiltX = gsap.quickTo(element, "rotationX", options);
                    const tiltY = gsap.quickTo(element, "rotationY", options);
                    const rotate = gsap.quickTo(element, "rotation", options);
                    animations.push(
                      moveX.tween,
                      moveY.tween,
                      tiltX.tween,
                      tiltY.tween,
                      rotate.tween,
                    );
                    return [
                      {
                        rotation,
                        depth,
                        tilt,
                        turn,
                        moveX,
                        moveY,
                        tiltX,
                        tiltY,
                        rotate,
                      },
                    ];
                  });
                  if (!layers.length) return;

                  let pointerFrame = 0;
                  let pointer: { x: number; y: number } | undefined;
                  const cancelPointer = () => {
                    cancelAnimationFrame(pointerFrame);
                    pointerFrame = 0;
                    pointer = undefined;
                  };
                  const rest = () => {
                    cancelPointer();
                    if (covered() || disposed) return;
                    layers.forEach((layer) => {
                      layer.moveX(0);
                      layer.moveY(0);
                      layer.tiltX(0);
                      layer.tiltY(0);
                      layer.rotate(layer.rotation);
                    });
                  };
                  const move = (event: PointerEvent) => {
                    if (event.pointerType === "touch" || covered() || disposed)
                      return;
                    pointer = { x: event.clientX, y: event.clientY };
                    if (pointerFrame) return;
                    pointerFrame = requestAnimationFrame(() => {
                      pointerFrame = 0;
                      if (!pointer || covered() || disposed) return;
                      const bounds = visual.getBoundingClientRect();
                      if (!bounds.width || !bounds.height) return;
                      const x = Math.max(
                        -1,
                        Math.min(
                          1,
                          ((pointer.x - bounds.left) / bounds.width - 0.5) * 2,
                        ),
                      );
                      const y = Math.max(
                        -1,
                        Math.min(
                          1,
                          ((pointer.y - bounds.top) / bounds.height - 0.5) * 2,
                        ),
                      );
                      layers.forEach((layer) => {
                        layer.moveX(x * layer.depth);
                        layer.moveY(y * layer.depth * 0.7);
                        layer.tiltX(-y * layer.tilt);
                        layer.tiltY(x * layer.tilt);
                        layer.rotate(layer.rotation + x * layer.turn);
                      });
                    });
                  };
                  visual.addEventListener("pointermove", move);
                  visual.addEventListener("pointerleave", rest);
                  visual.addEventListener("pointercancel", rest);
                  window.addEventListener("blur", rest);
                  freezeInteractions.push(cancelPointer);
                  resetInteractions.push(rest);
                  unbind.push(() => {
                    cancelPointer();
                    visual.removeEventListener("pointermove", move);
                    visual.removeEventListener("pointerleave", rest);
                    visual.removeEventListener("pointercancel", rest);
                    window.removeEventListener("blur", rest);
                  });
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

            // Delegation also covers links created by filtering or opening the archive.
            const updateArrow = (
              event: Event,
              kind: "pointing" | "focused",
              active: boolean,
            ) => {
              pruneArrows();
              if (
                covered() ||
                reduced.matches ||
                !(event.target instanceof Element)
              )
                return;
              const link = event.target.closest<HTMLElement>("[data-hk-link]");
              if (!link || link.closest("[data-hackathons-scope]") !== root)
                return;
              const related = (event as FocusEvent | PointerEvent)
                .relatedTarget;
              if (related instanceof Node && link.contains(related)) return;
              const arrow = link.querySelector<HTMLElement | SVGElement>(
                "[data-hk-arrow]",
              );
              if (!arrow) return;
              if (!arrowStyles.has(arrow))
                arrowStyles.set(arrow, arrow.getAttribute("style"));
              const state = arrowStates.get(arrow) ?? {
                pointing: false,
                focused: false,
              };
              state[kind] = active && (kind === "focused" || hover.matches);
              arrowStates.set(arrow, state);
              const offset = arrow.classList.contains("lucide-arrow-down")
                ? [0, 4]
                : arrow.classList.contains("lucide-arrow-up")
                  ? [0, -4]
                  : arrow.classList.contains("lucide-arrow-right")
                    ? [4, 0]
                    : [3, -3];
              const previous = arrows.get(arrow);
              previous?.cancel();
              if (previous) pausedArrows.delete(previous);
              arrows.set(
                arrow,
                animate(arrow, {
                  translateX: state.pointing || state.focused ? offset[0] : 0,
                  translateY: state.pointing || state.focused ? offset[1] : 0,
                  duration: 200,
                  ease: "out(3)",
                }),
              );
            };
            const enter = (event: PointerEvent) =>
              updateArrow(event, "pointing", true);
            const leave = (event: PointerEvent) =>
              updateArrow(event, "pointing", false);
            const focus = (event: FocusEvent) =>
              updateArrow(event, "focused", true);
            const blur = (event: FocusEvent) =>
              updateArrow(event, "focused", false);
            root.addEventListener("pointerover", enter);
            root.addEventListener("pointerout", leave);
            root.addEventListener("focusin", focus);
            root.addEventListener("focusout", blur);
            unbind.push(() => {
              root.removeEventListener("pointerover", enter);
              root.removeEventListener("pointerout", leave);
              root.removeEventListener("focusin", focus);
              root.removeEventListener("focusout", blur);
            });

            // MutationObserver batches archive changes in one microtask. Release
            // removed nodes even when no subsequent pointer/focus event occurs.
            const archiveObserver = new MutationObserver((records) => {
              if (records.some((record) => record.removedNodes.length))
                pruneArrows();
            });
            archiveObserver.observe(root, { childList: true, subtree: true });
            unbind.push(() => archiveObserver.disconnect());
          } catch {
            disposeMotion();
            pauseMotion = undefined;
            resumeMotion = undefined;
            root.dataset.hackathonsMotion = "static";
          }
        };

        if (typeof ResizeObserver !== "undefined") {
          let width = -1;
          let height = -1;
          observer = new ResizeObserver(([entry]) => {
            if (!entry) return;
            const bounds = entry.contentRect;
            if (width === bounds.width && height === bounds.height) return;
            width = bounds.width;
            height = bounds.height;
            refresh();
          });
          observer.observe(root);
        }
        void document.fonts?.ready.then(() => {
          if (!disposed) refresh();
        });
        ready();
      })
      .catch(() => {
        disposeMotion?.();
        if (!disposed) root.dataset.hackathonsMotion = "static";
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
      wide.removeEventListener("change", preferenceChanged);
      hover.removeEventListener("change", preferenceChanged);
    };
  }, [pathname]);

  return (
    <div ref={scope} className={className} data-hackathons-scope>
      {children}
    </div>
  );
}
