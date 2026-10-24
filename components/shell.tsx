"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import type { SocialLink } from "@/lib/validators/schemas";

import StaggeredMenu from "@/components/animations/staggered-menu";

const navItems = [
  { label: "Home", href: "/", sublabel: "Overview & Index" },
  { label: "About", href: "/about", sublabel: "Journey & Vision" },
  { label: "Work", href: "/projects", sublabel: "Featured Works" },
  {
    label: "HackShastra",
    href: "/hackshastra",
    sublabel: "Flagship Hackathon",
  },
  { label: "Hackathons", href: "/hackathons", sublabel: "Awards & Builds" },
  { label: "Contact", href: "/contact", sublabel: "Direct Communication" },
];

export function SiteNav({ socials }: { socials: SocialLink[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`site-header-clean ${menuOpen ? "menu-is-open" : ""}`}>
      {/* Brand: Pure SVG Icon & Clean Name */}
      <Link className="clean-brand" href="/" aria-label="Tanmay Tiwari">
        <Image
          src="/icon.svg"
          alt="Tanmay Tiwari"
          width={30}
          height={30}
          className="brand-logo-icon"
          priority
        />
        <span className="brand-name-title">
          TANMAY <span className="brand-name-accent">TIWARI</span>
        </span>
      </Link>

      {/* Right: Pure Staggered Menu Trigger */}
      <div className="clean-header-right">
        <Link className="header-contact-link" href="/contact">
          Let’s talk <ArrowUpRight size={14} />
        </Link>
        <StaggeredMenu
          items={navItems}
          socials={socials}
          prelayerColors={["#1c1516", "#ef463e"]}
          accentColor="#ef463e"
          onStateChange={setMenuOpen}
        />
      </div>
    </header>
  );
}

export function Footer(_props: { name?: string; email?: string }) {
  void _props;
  return null;
}

export function MotionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    // Disable smooth scrolling on admin dashboard & login to prevent interference with forms & modals
    if (pathname?.startsWith("/secret-admin")) return;

    let disposed = false;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        disposed = true;
      };
    }

    let lenis:
      | {
          raf: (t: number) => void;
          destroy: () => void;
          on: (event: "scroll", callback: () => void) => () => void;
        }
      | undefined;
    let frame = 0;
    let refreshFrame = 0;
    let gsapCtx: { revert: () => void } | undefined;
    const animeAnimations: Array<{ revert: () => unknown }> = [];
    const animeObservers: Array<{
      ready: boolean;
      reverted: boolean;
      target: HTMLElement | null;
      refresh: () => unknown;
      revert: () => unknown;
    }> = [];
    const iconAnimations = new Map<SVGElement, { revert: () => unknown }>();
    const interactionListeners: Array<{
      element: HTMLElement;
      event: string;
      listener: EventListener;
    }> = [];
    let gsapMedia: { revert: () => void } | undefined;
    let cleanedUp = false;

    const cleanupMotion = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(refreshFrame);
      interactionListeners.forEach(({ element, event, listener }) =>
        element.removeEventListener(event, listener),
      );
      iconAnimations.forEach((animation) => animation.revert());
      iconAnimations.clear();
      animeObservers.forEach((observer) => observer.revert());
      animeAnimations.forEach((animation) => animation.revert());
      gsapMedia?.revert();
      gsapCtx?.revert();
      lenis?.destroy();
    };

    (async () => {
      try {
        const [
          { default: Lenis },
          { gsap },
          { ScrollTrigger },
          { animate, createTimeline, onScroll, stagger },
        ] = await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("animejs"),
        ]);
        if (disposed) return;

        gsap.registerPlugin(ScrollTrigger);

        lenis = new Lenis({
          duration: 0.85,
          smoothWheel: true,
          anchors: true,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });

        lenis.on("scroll", ScrollTrigger.update);

        const tick = (time: number) => {
          lenis?.raf(time * 1000);
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);

        gsapCtx = gsap.context(() => {
          const homeHero =
            document.querySelector<HTMLElement>("[data-home-hero]");
          if (homeHero) {
            const intro = createTimeline({ defaults: { ease: "out(3)" } });
            const kicker = homeHero.querySelector<HTMLElement>(".hero-kicker");
            const names =
              homeHero.querySelectorAll<HTMLElement>(".hero-name-line");
            const copy = homeHero.querySelectorAll<HTMLElement>(
              ".hero-manifesto, .hero-lede, .hero-actions",
            );
            const portrait = homeHero.querySelector<HTMLElement>(
              ".hero-portrait-container",
            );
            const note = homeHero.querySelector<HTMLElement>(".portrait-note");
            const metrics = homeHero.querySelector<HTMLElement>(
              ".hero-metrics-strip",
            );
            const scrollCue =
              homeHero.querySelector<HTMLElement>(".hero-scroll-cue");

            if (kicker)
              intro.add(
                kicker,
                { y: [12, 0], opacity: [0, 1], duration: 480 },
                0,
              );
            if (names.length)
              intro.add(
                names,
                {
                  y: [34, 0],
                  opacity: [0, 1],
                  duration: 650,
                  delay: stagger(75),
                },
                90,
              );
            if (copy.length)
              intro.add(
                copy,
                {
                  y: [16, 0],
                  opacity: [0, 1],
                  duration: 480,
                  delay: stagger(60),
                },
                270,
              );
            if (portrait)
              intro.add(
                portrait,
                { y: [22, 0], opacity: [0, 1], duration: 760 },
                240,
              );
            if (note) intro.add(note, { opacity: [0, 1], duration: 420 }, 520);
            if (metrics)
              intro.add(
                metrics,
                { y: [10, 0], opacity: [0, 1], duration: 420 },
                600,
              );
            if (scrollCue)
              intro.add(scrollCue, { opacity: [0, 1], duration: 350 }, 680);
            animeAnimations.push(intro);
          }

          const cinematicFooter = document.querySelector<HTMLElement>(
            "[data-cinematic-footer]",
          );
          if (cinematicFooter) {
            const plane = cinematicFooter.querySelector<HTMLElement>(
              "[data-footer-plane]",
            );
            const background = cinematicFooter.querySelector<HTMLElement>(
              "[data-footer-background]",
            );
            const colorReveal = cinematicFooter.querySelector<HTMLElement>(
              "[data-footer-color-reveal]",
            );
            const title = cinematicFooter.querySelector<HTMLElement>(
              "[data-footer-title]",
            );
            const light = cinematicFooter.querySelector<HTMLElement>(
              "[data-footer-light]",
            );
            const grid =
              cinematicFooter.querySelector<HTMLElement>("[data-footer-grid]");
            const orbit = cinematicFooter.querySelector<HTMLElement>(
              "[data-footer-orbit]",
            );
            const revealItems = cinematicFooter.querySelectorAll<HTMLElement>(
              "[data-footer-reveal]",
            );
            const getFooterRevealScale = () => {
              if (!plane || !colorReveal) return 1;
              const diameter =
                colorReveal.offsetWidth ||
                Math.max(window.innerWidth, window.innerHeight) * 2;
              const farthestCorner = Math.hypot(
                plane.clientWidth / 2,
                plane.clientHeight / 2,
              );
              return (farthestCorner * 2.16) / diameter;
            };

            // The 25vh overlap places this trigger when the hackathon section's
            // trailing edge has moved to roughly 80% of the viewport.
            const createFooterRevealObserver = () => {
              const observer = onScroll({
                target: cinematicFooter,
                axis: "y",
                enter: { target: "start", container: "55%" },
                leave: { target: "start", container: "0%" },
                sync: true,
                repeat: false,
              });
              animeObservers.push(observer);
              return observer;
            };
            if (title) {
              const titleReveal = createFooterRevealObserver();
              animeAnimations.push(
                animate(title, {
                  y: [46, 0],
                  opacity: [0, 1],
                  duration: 760,
                  ease: "out(4)",
                  autoplay: titleReveal,
                }),
              );
            }
            if (revealItems.length) {
              const itemsReveal = createFooterRevealObserver();
              animeAnimations.push(
                animate(revealItems, {
                  y: [26, 0],
                  opacity: [0, 1],
                  duration: 650,
                  delay: stagger(65),
                  ease: "out(4)",
                  autoplay: itemsReveal,
                }),
              );
            }

            const footerMatchMedia = gsap.matchMedia();
            gsapMedia = footerMatchMedia;
            footerMatchMedia.add(
              {
                mobile: "(max-width: 639px)",
                tablet: "(min-width: 640px) and (max-width: 1023px)",
                desktop: "(min-width: 1024px)",
                reduceMotion: "(prefers-reduced-motion: reduce)",
              },
              (context) => {
                const conditions = context.conditions;
                if (conditions?.reduceMotion) {
                  if (background) {
                    gsap.set(background, { backgroundColor: "#090708" });
                  }
                  if (colorReveal) {
                    gsap.set(colorReveal, { scale: getFooterRevealScale() });
                  }
                  gsap.set([plane, title, ...revealItems], {
                    clearProps: "transform,opacity,filter",
                  });
                  return;
                }
                if (!plane || !background || !title) return;

                const isMobile = Boolean(conditions?.mobile);
                const isTablet = Boolean(conditions?.tablet);
                const timeline = gsap.timeline({
                  defaults: { ease: "none" },
                  scrollTrigger: {
                    trigger: cinematicFooter,
                    start: "top 55%",
                    end: "top top",
                    scrub: 0.45,
                    invalidateOnRefresh: true,
                  },
                });

                timeline.fromTo(
                  plane,
                  {
                    scale: isMobile ? 0.99 : isTablet ? 0.985 : 0.98,
                    z: isMobile ? -18 : isTablet ? -26 : -36,
                    yPercent: isMobile ? 34 : isTablet ? 37 : 40,
                    rotateX: isMobile ? 4 : isTablet ? 5 : 6,
                    rotateY: 0,
                    opacity: 0.88,
                    borderRadius: isMobile
                      ? "40px 40px 0px 0px"
                      : isTablet
                        ? "54px 54px 0px 0px"
                        : "68px 68px 0px 0px",
                    transformOrigin: "50% 50% 0px",
                  },
                  {
                    scale: 1,
                    z: 0,
                    yPercent: 0,
                    rotateX: 0,
                    rotateY: 0,
                    opacity: 1,
                    borderRadius: isMobile
                      ? "32px 32px 0px 0px"
                      : isTablet
                        ? "44px 44px 0px 0px"
                        : "56px 56px 0px 0px",
                    duration: 1,
                  },
                  0,
                );

                if (colorReveal) {
                  timeline.fromTo(
                    colorReveal,
                    { scale: 0.015 },
                    {
                      scale: getFooterRevealScale,
                      duration: 1,
                    },
                    0,
                  );
                }

                if (grid) {
                  timeline.fromTo(
                    grid,
                    { yPercent: isMobile ? 3 : 8, opacity: 0.04 },
                    { yPercent: -3, opacity: 1, duration: 1 },
                    0,
                  );
                }
                if (light) {
                  timeline.fromTo(
                    light,
                    { scale: 0.72, opacity: 0.16 },
                    {
                      scale: isMobile ? 0.98 : 1.1,
                      opacity: 0.76,
                      duration: 1,
                    },
                    0,
                  );
                }
                if (orbit) {
                  timeline.fromTo(
                    orbit,
                    { scale: 0.78, rotation: -12, opacity: 0.08 },
                    { scale: 1, rotation: 0, opacity: 0.55, duration: 1 },
                    0,
                  );
                }
              },
            );
          }

          document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
            const bounds = el.getBoundingClientRect();
            const initiallyVisible =
              bounds.top < window.innerHeight && bounds.bottom > 0;
            if (initiallyVisible) return;

            const observer = onScroll({
              target: el,
              axis: "y",
              // Anime v4 strings put the container threshold first. Object form keeps
              // the intended short entrance interval explicit and avoids long fades.
              enter: { target: "start", container: "94%" },
              leave: { target: "start", container: "80%" },
              // Lenis already smooths the native scroll position; scrub exactly to it
              // so fast scrolls and anchor jumps cannot leave a reveal half complete.
              sync: true,
              repeat: false,
            });
            animeObservers.push(observer);
            animeAnimations.push(
              animate(el, {
                y: [24, 0],
                opacity: [0, 1],
                ease: "out(3)",
                duration: 480,
                autoplay: observer,
              }),
            );
          });

          const bindArrowFeedback = (
            element: HTMLElement,
            icon: SVGElement | null,
          ) => {
            if (!icon) return;
            const setActive = (active: boolean) => {
              iconAnimations.get(icon)?.revert();
              iconAnimations.delete(icon);
              const animation = animate(icon, {
                translateX: active ? 3 : 0,
                translateY: active ? -1 : 0,
                duration: 170,
                ease: "out(3)",
              });
              iconAnimations.set(icon, animation);
            };
            const enter = (() => setActive(true)) as EventListener;
            const leave = (() => setActive(false)) as EventListener;
            ["pointerenter", "focusin"].forEach((event) => {
              element.addEventListener(event, enter);
              interactionListeners.push({ element, event, listener: enter });
            });
            ["pointerleave", "focusout"].forEach((event) => {
              element.addEventListener(event, leave);
              interactionListeners.push({ element, event, listener: leave });
            });
          };

          document
            .querySelectorAll<HTMLElement>(
              ".button, .header-contact-link, [data-cinematic-footer-link]",
            )
            .forEach((element) => {
              bindArrowFeedback(
                element,
                element.querySelector<SVGElement>("svg"),
              );
            });
          document
            .querySelectorAll<HTMLElement>(".project-card")
            .forEach((element) => {
              bindArrowFeedback(
                element,
                element.querySelector<SVGElement>(".project-open-btn svg"),
              );
            });

          const refreshMotion = () => {
            if (disposed) return;
            // The pinned gallery changes document flow, so refresh GSAP first and
            // then recalculate Anime's element offsets against the settled layout.
            ScrollTrigger.refresh();
            animeObservers.forEach((observer) => {
              const target = observer.target;
              if (observer.reverted || !observer.ready) return;
              if (!target || !target.isConnected) {
                observer.revert();
                return;
              }
              observer.refresh();
            });
          };
          refreshFrame = requestAnimationFrame(refreshMotion);
          void document.fonts?.ready.then(() => {
            if (!disposed) refreshMotion();
          });
        });
        if (disposed) cleanupMotion();
      } catch (err) {
        cleanupMotion();
        console.warn("Motion layer init:", err);
      }
    })();

    return () => {
      disposed = true;
      cleanupMotion();
    };
  }, [pathname]);

  return null;
}
