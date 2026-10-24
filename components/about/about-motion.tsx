"use client";

import { useEffect } from "react";

export default function AboutMotion() {
  useEffect(() => {
    let disposed = false;
    let context: { revert: () => void } | undefined;
    const animeRuns: Array<{ revert: () => unknown }> = [];
    const animeObservers: Array<{ revert: () => unknown }> = [];

    void Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("animejs"),
    ])
      .then(([{ gsap }, { ScrollTrigger }, { animate, onScroll }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);

        context = gsap.context(() => {
          const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          if (reducedMotion) return;

          const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
          entrance
            .fromTo(
              "[data-about-kicker]",
              { y: 18, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.55 },
            )
            .fromTo(
              "[data-about-hero-line]",
              { yPercent: 115, rotate: 2 },
              { yPercent: 0, rotate: 0, duration: 0.85, stagger: 0.09 },
              "-=0.28",
            )
            .fromTo(
              "[data-about-intro]",
              { y: 22, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.65 },
              "-=0.42",
            )
            .fromTo(
              "[data-about-stat]",
              { y: 16, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.55, stagger: 0.1 },
              "-=0.34",
            )
            .fromTo(
              "[data-about-visual]",
              { y: 26, scale: 0.94, rotate: 2, opacity: 0 },
              { y: 0, scale: 1, rotate: 0, opacity: 1, duration: 0.9 },
              "-=0.58",
            );

          const marqueeTrack = document.querySelector<HTMLElement>(
            "[data-about-marquee-track]",
          );
          if (marqueeTrack) {
            gsap.to(marqueeTrack, {
              xPercent: -50,
              duration: 32,
              ease: "none",
              repeat: -1,
            });
          }

          gsap.utils
            .toArray<HTMLElement>("[data-about-heading]")
            .forEach((heading) => {
              gsap.fromTo(
                heading,
                { x: -30, opacity: 0, clipPath: "inset(0 0 12% 0)" },
                {
                  x: 0,
                  opacity: 1,
                  clipPath: "inset(0 0 0% 0)",
                  duration: 0.82,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: heading,
                    start: "top 82%",
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
              { scaleY: 0, transformOrigin: "top center" },
              {
                scaleY: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: thread,
                  start: "top 76%",
                  end: "bottom 78%",
                  scrub: 0.5,
                },
              },
            );
          }

          const details = Array.from(
            document.querySelectorAll<HTMLElement>("[data-about-experience]"),
          );
          if (details.length) {
            gsap.fromTo(
              details,
              { x: 28, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                stagger: 0.12,
                duration: 0.7,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: details[0],
                  start: "top 82%",
                  once: true,
                },
              },
            );
          }

          document
            .querySelectorAll<HTMLElement>("[data-about-anime-item]")
            .forEach((item, index) => {
              const bounds = item.getBoundingClientRect();
              if (bounds.top < window.innerHeight && bounds.bottom > 0) return;
              const observer = onScroll({
                target: item,
                axis: "y",
                enter: { target: "start", container: "90%" },
                leave: { target: "start", container: "72%" },
                sync: true,
                repeat: false,
              });
              animeObservers.push(observer);
              animeRuns.push(
                animate(item, {
                  translateY: [24, 0],
                  opacity: [0, 1],
                  ease: "out(3)",
                  duration: 620,
                  delay: Math.min(index * 55, 330),
                  autoplay: observer,
                }),
              );
            });
        });

        ScrollTrigger.refresh();
      })
      .catch(() => {
        context?.revert();
        animeObservers.forEach((observer) => observer.revert());
        animeRuns.forEach((animation) => animation.revert());
      });

    return () => {
      disposed = true;
      animeObservers.forEach((observer) => observer.revert());
      animeRuns.forEach((animation) => animation.revert());
      context?.revert();
    };
  }, []);

  return null;
}
