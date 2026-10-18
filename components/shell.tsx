"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X, ArrowUp, Send } from "lucide-react";

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
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [path]);

  // Track scroll position for dynamic navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <header className={`site-nav-capsule ${scrolled ? "scrolled" : ""}`}>
      {/* Brand with Spidey Emblem */}
      <Link className="nav-brand" href="/" aria-label="Tanmay Tiwari Portfolio Home">
        <span className="nav-spidey-avatar">
          <svg viewBox="0 0 100 100" width="22" height="22" aria-hidden="true">
            <path d="M50 4 C24 4 10 26 10 54 C10 74 28 92 50 96 C72 92 90 74 90 54 C90 26 76 4 50 4 Z" fill="#ff1e27"/>
            <path d="M50 4 L50 96M10 54 Q50 68 90 54M16 38 Q50 50 84 38M22 24 Q50 34 78 24M18 70 Q50 78 82 70" stroke="#08090d" strokeWidth="2.5" fill="none"/>
            <path d="M46 44 C42 42 22 47 18 63 C22 66 36 67 46 54 Z" fill="#08090d"/>
            <path d="M44 46 C40 44 25 49 22 61 C26 63 36 64 44 54 Z" fill="#ffffff"/>
            <path d="M54 44 C58 42 78 47 82 63 C78 66 64 67 54 54 Z" fill="#08090d"/>
            <path d="M56 46 C60 44 75 49 78 61 C74 63 64 64 56 54 Z" fill="#ffffff"/>
          </svg>
        </span>
        <span className="brand-text">
          TANMAY<span className="brand-dot">.DEV</span>
        </span>
      </Link>

      {/* Desktop Navigation Links */}
      <nav className="nav-menu-desktop" aria-label="Main navigation">
        {links.map(([label, href]) => {
          const isActive = path === href;
          return (
            <Link key={href} className={`nav-item ${isActive ? "active" : ""}`} href={href}>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right Actions: Availability & Direct Contact */}
      <div className="nav-right-actions">
        <div className="status-badge" title="Available for freelance and full-time opportunities">
          <span className="status-dot" />
          <span className="status-text">Available</span>
        </div>
        <Link href="/contact" className="nav-cta-btn">
          <span>Let’s Talk</span>
          <ArrowUpRight size={15} />
        </Link>
      </div>

      {/* Mobile Menu Hamburger */}
      <button
        className="menu-toggle-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-nav-drawer ${open ? "open" : ""}`} aria-label="Mobile navigation">
        <div className="mobile-nav-inner">
          {links.map(([label, href], idx) => {
            const isActive = path === href;
            return (
              <Link key={href} className={`mobile-nav-link ${isActive ? "active" : ""}`} href={href}>
                <span className="mobile-nav-num">0{idx + 1}</span>
                <span>{label}</span>
                <ArrowUpRight size={18} className="mobile-nav-arrow" />
              </Link>
            );
          })}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
            <Link href="/contact" className="button button-primary" style={{ width: "100%" }}>
              Initiate Transmission <Send size={16} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer({
  name = "Tanmay Tiwari",
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
            <span className="eyebrow-line" /> Digital Architect & Creative Engineer
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
        <span>Crafted with engineering discipline & Spider-Sense.</span>
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
              { y: 22, opacity: 0.35 },
              {
                y: 0,
                opacity: 1,
                duration: 0.55,
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
