"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** GSAP owns content wrappers; Anime owns the arrows inside interactive links. */
export default function ContactMotion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const hover = matchMedia("(hover: hover) and (pointer: fine)");
    const select = (selector: string) =>
      Array.from(root.querySelectorAll<HTMLElement>(selector));
    let disposed = false,
      initialized = false;
    let frame = 0,
      refreshFrame = 0;
    let initialize: (() => void) | undefined;
    let cleanup: (() => void) | undefined;
    let pause: (() => void) | undefined;
    let resume: (() => void) | undefined;
    let refresh: (() => void) | undefined;
    const covered = () =>
      document.documentElement.classList.contains("portfolio-transitioning") ||
      document.documentElement.classList.contains("portfolio-loading") ||
      Boolean(document.documentElement.dataset.spiderTransition);
    const scheduleRefresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => {
        if (!disposed && initialized && !covered()) refresh?.();
      });
    };
    const ready = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (disposed || covered() || !root.isConnected) return;
        if (initialized) resume?.();
        else initialize?.();
        scheduleRefresh();
      });
    };
    const freeze = () => {
      cancelAnimationFrame(frame);
      pause?.();
    };
    const preferenceChanged = () => {
      cleanup?.();
      cleanup = pause = resume = undefined;
      initialized = false;
      ready();
    };
    window.addEventListener("portfolio:capture-frame", freeze);
    window.addEventListener("portfolio:transition-start", freeze);
    window.addEventListener("portfolio:transition-end", ready);
    window.addEventListener("portfolio:preloader-complete", ready);
    reduced.addEventListener("change", preferenceChanged);
    const observer = new ResizeObserver(scheduleRefresh);
    observer.observe(root);

    void Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("animejs"),
    ])
      .then(([{ gsap }, { ScrollTrigger }, { animate }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        refresh = () => ScrollTrigger.refresh();
        initialize = () => {
          if (initialized || disposed || covered()) return;
          initialized = true;
          root.dataset.contactMotion = reduced.matches ? "reduced" : "ready";
          if (reduced.matches) return;
          const context = gsap.context(() => {}, root);
          const animations: gsap.core.Animation[] = [];
          const paused = new Set<gsap.core.Animation>();
          const triggers = new Set<
            NonNullable<gsap.core.Animation["scrollTrigger"]>
          >();
          const reveals = new Map<HTMLElement, gsap.core.Animation>();
          const arrows = new Map<Element, ReturnType<typeof animate>>();
          const pausedArrows = new Set<ReturnType<typeof animate>>();
          const styles = new Map<Element, string | null>();
          const unbind: Array<() => void> = [];
          cleanup = () => {
            unbind.forEach((remove) => remove());
            arrows.forEach((animation) => animation.revert());
            styles.forEach((style, element) => {
              if (style === null) element.removeAttribute("style");
              else element.setAttribute("style", style);
            });
            context.revert();
            paused.clear();
            triggers.clear();
            pausedArrows.clear();
            arrows.clear();
            reveals.clear();
          };
          pause = () => {
            animations.forEach((animation) => {
              if (animation.scrollTrigger && animation.progress() < 1) {
                triggers.add(animation.scrollTrigger);
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
          resume = () => {
            triggers.forEach((trigger) => trigger.enable(false, false));
            triggers.clear();
            paused.forEach((animation) => animation.resume());
            paused.clear();
            pausedArrows.forEach((animation) => animation.resume());
            pausedArrows.clear();
          };
          try {
            context.add(() => {
              select("[data-contact-reveal]").forEach((element) => {
                if (
                  element.getBoundingClientRect().top < innerHeight ||
                  element.contains(document.activeElement)
                )
                  return;
                const animation = gsap.fromTo(
                  element,
                  { y: 20, opacity: 0 },
                  {
                    y: 0,
                    opacity: 1,
                    duration: 0.7,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: element,
                      start: "top 94%",
                      once: true,
                    },
                  },
                );
                animations.push(animation);
                reveals.set(element, animation);
              });
            });
            const revealFocused = (event: FocusEvent) => {
              if (!(event.target instanceof Element) || covered()) return;
              const target = event.target;
              reveals.forEach((animation, element) => {
                if (element.contains(target)) {
                  animation.progress(1).pause();
                  animation.scrollTrigger?.kill(false, true);
                }
              });
            };
            root.addEventListener("focusin", revealFocused);
            unbind.push(() =>
              root.removeEventListener("focusin", revealFocused),
            );
            select("[data-contact-action]").forEach((link) => {
              let arrow: Element | null = null;
              let pointing = false,
                focused = false;
              const update = () => {
                if (covered() || reduced.matches) return;
                // Submission swaps the arrow for a loader; animate the current node on retry.
                const current = link.querySelector("[data-contact-arrow]");
                if (current !== arrow) {
                  if (arrow) {
                    const previous = arrows.get(arrow);
                    previous?.revert();
                    if (previous) pausedArrows.delete(previous);
                    arrows.delete(arrow);
                    styles.delete(arrow);
                  }
                  arrow = current;
                  if (arrow) styles.set(arrow, arrow.getAttribute("style"));
                }
                if (!arrow) return;
                arrows.get(arrow)?.cancel();
                const active = pointing || focused;
                const down = arrow.classList.contains("lucide-arrow-down");
                const downRight = arrow.classList.contains(
                  "lucide-arrow-down-right",
                );
                arrows.set(
                  arrow,
                  animate(arrow, {
                    translateX: active && !down ? 3 : 0,
                    translateY: active ? (down || downRight ? 3 : -3) : 0,
                    duration: 220,
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
            cleanup();
            pause = resume = undefined;
            root.dataset.contactMotion = "static";
          }
        };
        void document.fonts.ready.then(() => {
          if (!disposed) scheduleRefresh();
        });
        ready();
      })
      .catch(() => {
        cleanup?.();
        if (!disposed) root.dataset.contactMotion = "static";
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(refreshFrame);
      observer.disconnect();
      cleanup?.();
      window.removeEventListener("portfolio:capture-frame", freeze);
      window.removeEventListener("portfolio:transition-start", freeze);
      window.removeEventListener("portfolio:transition-end", ready);
      window.removeEventListener("portfolio:preloader-complete", ready);
      reduced.removeEventListener("change", preferenceChanged);
    };
  }, []);

  return (
    <div ref={scope} className={className} data-contact-motion-scope>
      {children}
    </div>
  );
}
