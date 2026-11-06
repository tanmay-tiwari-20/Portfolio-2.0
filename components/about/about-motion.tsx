"use client";

import { useEffect } from "react";
import { useInitialPageEntrance } from "@/components/animations/page-entrance";

export default function AboutMotion() {
  const initialPageEntrance = useInitialPageEntrance();

  useEffect(() => {
    let disposed = false;
    let initialized = false;
    let context: gsap.Context | undefined;
    let detailsContext: gsap.Context | undefined;
    let entrance: gsap.core.Timeline | undefined;
    let initialize: (() => void) | undefined;
    let scheduleDetailsRefresh: (() => void) | undefined;
    let rebuildDetails: (() => void) | undefined;
    let detailsDirty = false;
    let readyFrame = 0;
    const paused = new Set<gsap.core.Animation>();
    const suspended = new Set<
      NonNullable<gsap.core.Animation["scrollTrigger"]>
    >();
    let removeDetailsPreferenceListener: (() => void) | undefined;
    let detailsObserver: ResizeObserver | undefined;
    let settleFrame = 0;
    let refreshFrame = 0;
    const aboutRoot = document.querySelector<HTMLElement>(".about-page");
    if (aboutRoot) aboutRoot.dataset.aboutEntranceComplete = "false";

    const covered = () => {
      const html = document.documentElement;
      return (
        Boolean(html.dataset.spiderTransition) ||
        html.classList.contains("portfolio-transitioning") ||
        html.classList.contains("portfolio-loading")
      );
    };
    const pause = () => {
      window.cancelAnimationFrame(readyFrame);
      window.cancelAnimationFrame(settleFrame);
      window.cancelAnimationFrame(refreshFrame);
      const animations: gsap.core.Tween[] = detailsContext?.getTweens() ?? [];
      if (entrance) {
        if (!entrance.paused() && entrance.progress() < 1) {
          paused.add(entrance);
          entrance.pause();
        }
      }
      animations.forEach((animation) => {
        // Preserve the exact painted frame, including scrubbed detail layers.
        const trigger = animation.scrollTrigger;
        if (
          trigger &&
          !(trigger.vars.once && trigger.progress === 1) &&
          !suspended.has(trigger)
        ) {
          const scrub = trigger.getTween();
          if (scrub && !scrub.paused() && scrub.progress() < 1)
            paused.add(scrub);
          suspended.add(trigger);
          trigger.disable(false, false);
        }
        if (!animation.paused() && animation.progress() < 1) {
          paused.add(animation);
          animation.pause();
        }
      });
    };
    const ready = () => {
      window.cancelAnimationFrame(readyFrame);
      readyFrame = window.requestAnimationFrame(() => {
        readyFrame = 0;
        // transition-end can immediately start a queued navigation.
        if (disposed || covered() || !aboutRoot?.isConnected) return;
        if (!initialized) initialize?.();
        else {
          suspended.forEach((trigger) => trigger.enable(false, false));
          suspended.clear();
          paused.forEach((animation) => animation.resume());
          paused.clear();
          if (detailsDirty) rebuildDetails?.();
          scheduleDetailsRefresh?.();
        }
      });
    };
    const removeLifecycle = () => {
      window.removeEventListener("portfolio:capture-frame", pause);
      window.removeEventListener("portfolio:transition-start", pause);
      window.removeEventListener("portfolio:transition-end", ready);
      window.removeEventListener("portfolio:preloader-complete", ready);
      window.cancelAnimationFrame(readyFrame);
      paused.clear();
      suspended.clear();
    };
    window.addEventListener("portfolio:capture-frame", pause);
    window.addEventListener("portfolio:transition-start", pause);
    window.addEventListener("portfolio:transition-end", ready);
    window.addEventListener("portfolio:preloader-complete", ready);

    const markEntranceComplete = () => {
      if (disposed || !aboutRoot?.isConnected) return;
      aboutRoot.dataset.aboutEntranceComplete = "true";
      aboutRoot.dispatchEvent(new Event("portfolio:about-entrance-complete"));
    };

    const showContentWithoutMotion = () => {
      document
        .querySelectorAll<HTMLElement>(
          "[data-about-kicker], [data-about-intro], [data-about-visual], [data-about-heading], [data-about-reveal], [data-about-experience], [data-about-image]",
        )
        .forEach((element) => {
          if (element.closest("#the-person")) return;
          element.style.opacity = "1";
          element.style.visibility = "visible";
          element.style.transform = "none";
          element.style.clipPath = "none";
        });
    };

    // The practice story owns its Framer Motion values. Never share transform
    // targets with it, the hero, or another route that is leaving the page.
    const detailElements = (selector: string) =>
      Array.from(
        aboutRoot?.querySelectorAll<HTMLElement>(selector) ?? [],
      ).filter((element) => !element.closest(".about-hero, #the-person"));

    const showDetailsWithoutMotion = () => {
      detailElements(
        "[data-about-heading], [data-about-reveal], [data-about-experience], [data-about-image], [data-about-parallax], [data-about-drift], [data-about-line], [data-about-thread]",
      ).forEach((element) => {
        element.style.opacity = "1";
        element.style.visibility = "visible";
        element.style.transform = "none";
        element.style.clipPath = "none";
      });
    };

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);

        const detailsPreference = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );

        scheduleDetailsRefresh = () => {
          if (disposed || !initialized || covered()) return;
          window.cancelAnimationFrame(settleFrame);
          window.cancelAnimationFrame(refreshFrame);
          // React may commit the stacked/sticky story after the media event.
          // Wait through that layout, then coalesce measurements into one pass.
          settleFrame = window.requestAnimationFrame(() => {
            settleFrame = 0;
            refreshFrame = window.requestAnimationFrame(() => {
              refreshFrame = 0;
              if (!disposed && !covered() && aboutRoot?.isConnected)
                ScrollTrigger.refresh();
            });
          });
        };

        const detailsRoot = aboutRoot?.querySelector<HTMLElement>(
          "[data-about-details]",
        );
        if (detailsRoot && typeof ResizeObserver !== "undefined") {
          let previousWidth = -1;
          let previousHeight = -1;
          detailsObserver = new ResizeObserver(([entry]) => {
            if (!entry) return;
            // contentRect describes layout size, ignoring parallax transforms.
            // Unchanged dimensions cannot schedule a refresh feedback loop.
            const { width, height } = entry.contentRect;
            if (width === previousWidth && height === previousHeight) return;
            previousWidth = width;
            previousHeight = height;
            scheduleDetailsRefresh?.();
          });
          detailsObserver.observe(detailsRoot);
        }

        const initializeDetails = () => {
          detailsDirty = false;
          detailsContext?.revert();
          detailsContext = undefined;
          if (disposed || !aboutRoot || detailsPreference.matches) return;

          // Keep this context separate so preference changes and section-level
          // failures cannot interrupt or replay the protected hero entrance.
          const nextContext = gsap.context(() => {}, aboutRoot);
          detailsContext = nextContext;
          try {
            nextContext.add(() => {
              detailElements("[data-about-heading]").forEach((heading) => {
                // A transition can reveal a restored scroll position or hash
                // destination. Only prepare entrances below the visible page.
                if (heading.getBoundingClientRect().top < innerHeight) return;
                gsap.fromTo(
                  heading,
                  { y: 24, autoAlpha: 0.35 },
                  {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.76,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: heading,
                      start: "top 84%",
                      once: true,
                    },
                  },
                );
              });

              detailElements(
                "[data-about-reveal]:not([data-about-heading])",
              ).forEach((element, index) => {
                if (element.getBoundingClientRect().top < innerHeight) return;
                gsap.fromTo(
                  element,
                  { y: 18, autoAlpha: 0 },
                  {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.62,
                    delay: (index % 4) * 0.045,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: element,
                      start: "top 90%",
                      once: true,
                    },
                  },
                );
              });

              detailElements("[data-about-experience]").forEach(
                (entry, index) => {
                  if (entry.getBoundingClientRect().top < innerHeight) return;
                  gsap.fromTo(
                    entry,
                    { y: 22, autoAlpha: 0 },
                    {
                      y: 0,
                      autoAlpha: 1,
                      duration: 0.7,
                      delay: Math.min(index * 0.055, 0.165),
                      ease: "power3.out",
                      scrollTrigger: {
                        trigger: entry,
                        start: "top 88%",
                        once: true,
                      },
                    },
                  );
                },
              );

              detailElements(
                "[data-about-image]:not([data-about-parallax])",
              ).forEach((frame) => {
                if (frame.getBoundingClientRect().top < innerHeight) return;
                gsap.fromTo(
                  frame,
                  { clipPath: "inset(8% 0 0 0)" },
                  {
                    clipPath: "inset(0% 0 0 0)",
                    duration: 0.9,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: frame,
                      start: "top 90%",
                      once: true,
                    },
                  },
                );
              });

              detailElements("[data-about-parallax]").forEach((image) => {
                if (!image.parentElement) return;
                gsap.fromTo(
                  image,
                  { yPercent: -4, scale: 1.1 },
                  {
                    yPercent: 4,
                    scale: 1.1,
                    ease: "none",
                    scrollTrigger: {
                      trigger: image.parentElement,
                      start: "top bottom",
                      end: "bottom top",
                      scrub: 0.65,
                      invalidateOnRefresh: true,
                    },
                  },
                );
              });

              detailElements("[data-about-drift]").forEach((layer) => {
                gsap.fromTo(
                  layer,
                  { yPercent: -3 },
                  {
                    yPercent: 3,
                    ease: "none",
                    scrollTrigger: {
                      trigger: layer.closest("section") ?? layer,
                      start: "top bottom",
                      end: "bottom top",
                      scrub: 1,
                    },
                  },
                );
              });

              detailElements("[data-about-line]").forEach((line) => {
                if (line.getBoundingClientRect().top < innerHeight) return;
                gsap.fromTo(
                  line,
                  { scaleX: 0, transformOrigin: "0% 50%" },
                  {
                    scaleX: 1,
                    duration: 0.9,
                    ease: "power2.out",
                    scrollTrigger: {
                      trigger: line,
                      start: "top 90%",
                      once: true,
                    },
                  },
                );
              });

              detailElements("[data-about-thread]").forEach((thread) => {
                gsap.fromTo(
                  thread,
                  { scaleY: 0 },
                  {
                    scaleY: 1,
                    ease: "none",
                    scrollTrigger: {
                      trigger: thread.parentElement,
                      start: "top 76%",
                      end: "bottom 76%",
                      scrub: 0.65,
                      invalidateOnRefresh: true,
                    },
                  },
                );
              });
            });
          } catch {
            nextContext.revert();
            detailsContext = undefined;
            showDetailsWithoutMotion();
          }
        };
        rebuildDetails = initializeDetails;

        const onDetailsPreferenceChange = () => {
          if (disposed || !initialized) return;
          if (covered()) {
            detailsDirty = true;
            return;
          }
          initializeDetails();
          scheduleDetailsRefresh?.();
        };
        detailsPreference.addEventListener("change", onDetailsPreferenceChange);
        removeDetailsPreferenceListener = () =>
          detailsPreference.removeEventListener(
            "change",
            onDetailsPreferenceChange,
          );

        initialize = () => {
          if (disposed || initialized || covered()) return;
          initialized = true;

          context = gsap.context(() => {
            if (
              !initialPageEntrance ||
              window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ) {
              markEntranceComplete();
              return;
            }

            entrance = gsap.timeline({
              defaults: { ease: "power3.out" },
              onComplete: markEntranceComplete,
            });
            const kickers = gsap.utils.toArray<HTMLElement>(
              "[data-about-kicker]",
            );
            const intro = gsap.utils.toArray<HTMLElement>("[data-about-intro]");
            const visuals = gsap.utils.toArray<HTMLElement>(
              "[data-about-visual]",
            );

            if (kickers.length) {
              entrance.fromTo(
                kickers,
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.42 },
              );
            }
            if (intro.length) {
              entrance.fromTo(
                intro,
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.48, stagger: 0.075 },
                "-=0.2",
              );
            }
            if (visuals.length) {
              entrance.fromTo(
                visuals,
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.62 },
                "-=0.44",
              );
            }
          });

          initializeDetails();
          ScrollTrigger.refresh();
        };

        ready();
      })
      .catch(() => {
        if (disposed) return;
        removeLifecycle();
        context?.revert();
        detailsContext?.revert();
        removeDetailsPreferenceListener?.();
        detailsObserver?.disconnect();
        window.cancelAnimationFrame(settleFrame);
        window.cancelAnimationFrame(refreshFrame);
        showContentWithoutMotion();
        showDetailsWithoutMotion();
        markEntranceComplete();
      });

    return () => {
      disposed = true;
      removeLifecycle();
      context?.revert();
      detailsContext?.revert();
      removeDetailsPreferenceListener?.();
      detailsObserver?.disconnect();
      window.cancelAnimationFrame(settleFrame);
      window.cancelAnimationFrame(refreshFrame);
      if (aboutRoot) delete aboutRoot.dataset.aboutEntranceComplete;
    };
  }, [initialPageEntrance]);

  return null;
}
