"use client";

import { useEffect } from "react";

export default function AboutMotion() {
  useEffect(() => {
    let disposed = false;
    let initialized = false;
    let readyListener: (() => void) | undefined;
    let context: { revert: () => void } | undefined;

    const showContentWithoutMotion = () => {
      document
        .querySelectorAll<HTMLElement>(
          "[data-about-kicker], [data-about-intro], [data-about-visual], [data-about-heading], [data-about-reveal], [data-about-experience], [data-about-image]",
        )
        .forEach((element) => {
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

        const initialize = () => {
          if (disposed || initialized) return;
          initialized = true;

          context = gsap.context(() => {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
              return;

            const entrance = gsap.timeline({
              defaults: { ease: "power3.out" },
            });
            const kickers = gsap.utils.toArray<HTMLElement>(
              "[data-about-kicker]",
            );
            const intro = gsap.utils.toArray<HTMLElement>(
              "[data-about-intro]",
            );
            const visuals = gsap.utils.toArray<HTMLElement>(
              "[data-about-visual]",
            );

            if (kickers.length) {
              entrance.fromTo(
                kickers,
                { y: 14, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.42 },
              );
            }
            if (intro.length) {
              entrance.fromTo(
                intro,
                { y: 14, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.48, stagger: 0.075 },
                "-=0.2",
              );
            }
            if (visuals.length) {
              entrance.fromTo(
                visuals,
                { y: 18, scale: 0.975, autoAlpha: 0 },
                { y: 0, scale: 1, autoAlpha: 1, duration: 0.62 },
                "-=0.44",
              );
            }

            gsap.utils
              .toArray<HTMLElement>("[data-about-heading]")
              .forEach((heading) => {
                gsap.fromTo(
                  heading,
                  { y: 26, autoAlpha: 0.35 },
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

            gsap.utils
              .toArray<HTMLElement>("[data-about-reveal]")
              .forEach((element, index) => {
                gsap.fromTo(
                  element,
                  { y: 22, autoAlpha: 0 },
                  {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.58,
                    delay: (index % 4) * 0.055,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: element,
                      start: "top 88%",
                      once: true,
                    },
                  },
                );
              });

            gsap.utils
              .toArray<HTMLElement>("[data-about-experience]")
              .forEach((entry, index) => {
                gsap.fromTo(
                  entry,
                  { x: 24, autoAlpha: 0 },
                  {
                    x: 0,
                    autoAlpha: 1,
                    duration: 0.65,
                    delay: index * 0.08,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: entry,
                      start: "top 86%",
                      once: true,
                    },
                  },
                );
              });

            gsap.utils
              .toArray<HTMLElement>("[data-about-image]")
              .forEach((image) => {
                gsap.fromTo(
                  image,
                  { clipPath: "inset(7% 0 0 0)", scale: 1.025 },
                  {
                    clipPath: "inset(0% 0 0 0)",
                    scale: 1,
                    duration: 0.78,
                    ease: "power2.out",
                    scrollTrigger: {
                      trigger: image,
                      start: "top 88%",
                      once: true,
                    },
                  },
                );
              });

            const thread = document.querySelector<HTMLElement>(
              "[data-about-thread]",
            );
            if (thread) {
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
            }
          });

          ScrollTrigger.refresh();
        };

        const root = document.documentElement;
        const preloaderAlreadyComplete =
          root.dataset.preloaderComplete === "true" ||
          (!root.classList.contains("portfolio-loading") &&
            !document.querySelector(".site-preloader"));

        if (preloaderAlreadyComplete) {
          initialize();
        } else {
          readyListener = initialize;
          window.addEventListener(
            "portfolio:preloader-complete",
            initialize,
            { once: true },
          );
        }
      })
      .catch(() => {
        if (disposed) return;
        if (readyListener)
          window.removeEventListener(
            "portfolio:preloader-complete",
            readyListener,
          );
        context?.revert();
        showContentWithoutMotion();
      });

    return () => {
      disposed = true;
      if (readyListener)
        window.removeEventListener(
          "portfolio:preloader-complete",
          readyListener,
        );
      context?.revert();
    };
  }, []);

  return null;
}
