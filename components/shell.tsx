"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X, ArrowUp } from "lucide-react";

const links = [
  ["Home", "/"],
  ["Work", "/projects"],
  ["Experience", "/experience"],
  ["HackShastra", "/hackshastra"],
  ["Hackathons", "/hackathons"],
  ["Contact", "/contact"],
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [path]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="site-nav">
      <Link className="brand" href="/" aria-label="Portfolio Home">
        <span className="brand-emblem">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
          </svg>
        </span>
        <span>
          SPIDER<span className="brand-dot">.DEV</span>
        </span>
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Main navigation">
        {links.map(([label, href]) => {
          const isActive = path === href;
          return (
            <Link key={href} className={isActive ? "active" : ""} href={href}>
              {label}
            </Link>
          );
        })}
      </nav>

      <Link className="availability" href="/contact">
        <span className="pulse" />
        <span>Available for projects</span>
      </Link>
    </header>
  );
}

export function Footer({
  name = "Alex Parker",
  email = "hello@example.com",
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
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            <span className="eyebrow-line" /> Friendly Neighborhood Builder
          </div>
          <h2 className="display">
            With great code comes<br />
            <em>great possibility.</em>
          </h2>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <a href={`mailto:${email}`} className="button button-primary">
            Let’s talk <ArrowUpRight size={18} />
          </a>
          <button onClick={scrollToTop} className="button button-secondary" aria-label="Back to top">
            Back to top <ArrowUp size={16} />
          </button>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {name}. All rights reserved.</span>
        <span>Crafted with Marvel-grade care & Spider-Sense.</span>
        <Link href="/secret-admin" className="text-link" style={{ fontSize: 11, padding: "4px 12px" }}>
          Command Center 🔒
        </Link>
      </div>
    </footer>
  );
}

export function MotionLayer() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let disposed = false;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        disposed = true;
      };
    }

    let lenis: { raf: (t: number) => void; destroy: () => void; on: (event: "scroll", callback: () => void) => () => void } | undefined;
    let frame = 0;
    let gsapCtx: { revert: () => void } | undefined;

    (async () => {
      try {
        const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        gsap.registerPlugin(ScrollTrigger);

        lenis = new Lenis({
          duration: 1.1,
          smoothWheel: true,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });

        lenis.on("scroll", ScrollTrigger.update);

        const tick = (time: number) => {
          lenis?.raf(time * 1000);
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);

        gsapCtx = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
            gsap.fromTo(
              el,
              { y: 20, opacity: 0.35 },
              {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 95%",
                  once: true,
                },
              }
            );
          });
          ScrollTrigger.refresh();
        });

        cleanup = () => {
          cancelAnimationFrame(frame);
          lenis?.destroy();
          gsapCtx?.revert();
          ScrollTrigger.getAll().forEach((t) => t.kill());
        };
        if (disposed) cleanup();
      } catch (err) {
        console.warn("Motion layer init:", err);
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return null;
}

export function CustomCursor() {
  useEffect(() => {
    if (
      !matchMedia("(pointer:fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const el = document.createElement("div");
    el.className = "cursor-dot";
    document.body.appendChild(el);

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let animId = 0;

    const move = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const render = () => {
      currentX += (mouseX - currentX) * 0.22;
      currentY += (mouseY - currentY) * 0.22;
      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    const over = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a, button, input, select, textarea, .filter-chip")) {
        el.classList.add("hover");
      }
    };

    const out = () => {
      el.classList.remove("hover");
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerout", out, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      el.remove();
    };
  }, []);

  return null;
}
