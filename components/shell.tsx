"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ArrowUp } from "lucide-react";

import StaggeredMenu from "@/components/animations/staggered-menu";

const navItems = [
  { label: "Home", href: "/", sublabel: "Overview & Index" },
  { label: "Work", href: "/projects", sublabel: "Featured Works" },
  { label: "Experience", href: "/experience", sublabel: "Career & Roles" },
  {
    label: "HackShastra",
    href: "/hackshastra",
    sublabel: "Flagship Hackathon",
  },
  { label: "Hackathons", href: "/hackathons", sublabel: "Awards & Builds" },
  { label: "Contact", href: "/contact", sublabel: "Direct Communication" },
];

const socialItems = [
  { label: "GitHub", href: "https://github.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
  { label: "X / Twitter", href: "https://x.com/" },
  { label: "WhatsApp", href: "https://wa.me/910000000000" },
  { label: "Instagram", href: "https://instagram.com/" },
];

export function SiteNav() {
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
          socials={socialItems}
          prelayerColors={["#1c1516", "#ef463e"]}
          accentColor="#ef463e"
          onStateChange={setMenuOpen}
        />
      </div>
    </header>
  );
}

export function Footer({
  name = "Tanmay Tiwari",
  email = "workwithtakneekitanmay@gmail.com",
}: {
  name?: string;
  email?: string;
}) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer-modern section-shell">
      <div className="footer-top">
        <div>
          <h2 className="display">
            Turning bold concepts into
            <br />
            <em>enduring software.</em>
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <a href={`mailto:${email}`} className="button button-primary">
            Initiate Contact <ArrowUpRight size={18} />
          </a>
          <button
            onClick={scrollToTop}
            className="button button-secondary"
            aria-label="Back to top"
          >
            Back to top <ArrowUp size={16} />
          </button>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {name}. All rights reserved.
        </span>
        <span>Engineered with architectural discipline & precision.</span>
      </div>
    </footer>
  );
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
    let gsapMedia:
      | {
          add: (conditions: string, callback: () => void) => unknown;
          revert: () => void;
        }
      | undefined;
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
            .querySelectorAll<HTMLElement>(".button, .header-contact-link")
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
