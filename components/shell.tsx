"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ArrowUp, Send } from "lucide-react";

import StaggeredMenu from "@/components/animations/staggered-menu";

const navItems = [
  { label: "Home", href: "/", sublabel: "Overview & Index" },
  { label: "Work", href: "/projects", sublabel: "Featured Works" },
  { label: "Experience", href: "/experience", sublabel: "Career & Roles" },
  { label: "HackShastra", href: "/hackshastra", sublabel: "Flagship Hackathon" },
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
        <StaggeredMenu
          items={navItems}
          socials={socialItems}
          prelayerColors={["#161720", "#ff1a4b"]}
          accentColor="#ff003c"
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
            Turning bold concepts into<br />
            <em>enduring software.</em>
          </h2>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <a href={`mailto:${email}`} className="button button-primary">
            Initiate Contact <ArrowUpRight size={18} />
          </a>
          <button onClick={scrollToTop} className="button button-secondary" aria-label="Back to top">
            Back to top <ArrowUp size={16} />
          </button>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {name}. All rights reserved.</span>
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
  }, [pathname]);

  return null;
}
