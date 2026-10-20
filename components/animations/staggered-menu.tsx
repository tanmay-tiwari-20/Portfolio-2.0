"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ArrowUpRight } from "lucide-react";

export interface StaggeredMenuItem {
  label: string;
  href: string;
  sublabel?: string;
}

export interface StaggeredMenuSocialItem {
  label: string;
  href: string;
}

export interface StaggeredMenuProps {
  items?: StaggeredMenuItem[];
  socials?: StaggeredMenuSocialItem[];
  prelayerColors?: string[];
  accentColor?: string;
  onStateChange?: (isOpen: boolean) => void;
}

const DEFAULT_ITEMS: StaggeredMenuItem[] = [
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

const DEFAULT_SOCIALS: StaggeredMenuSocialItem[] = [
  { label: "GitHub", href: "https://github.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
  { label: "X / Twitter", href: "https://x.com/" },
  { label: "WhatsApp", href: "https://wa.me/910000000000" },
  { label: "Instagram", href: "https://instagram.com/" },
];

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeMounted = () => () => {};
const getClientMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

export default function StaggeredMenu({
  items = DEFAULT_ITEMS,
  socials = DEFAULT_SOCIALS,
  prelayerColors = ["#161720", "#ff1a4b"], // Obsidian Charcoal -> Radiant Carmine Red
  accentColor = "#ff003c",
  onStateChange,
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getClientMountedSnapshot,
    getServerMountedSnapshot,
  );
  const openRef = useRef(false);
  const path = usePathname();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);

  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const [textLines, setTextLines] = useState<string[]>(["Menu", "Close"]);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Timeline | gsap.core.Tween | null>(
    null,
  );
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);

  // Lock body scroll when open
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

  // Initial GSAP setup when portaled elements are mounted
  useEffect(() => {
    if (!mounted) return;

    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;

      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(
          preContainer.querySelectorAll(".sm-prelayer"),
        ) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      // Position offscreen initially
      gsap.set([panel, ...preLayers], { xPercent: 100, x: 0, opacity: 1 });
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, x: 0, opacity: 1 });
      }

      // Setup both bars as identical horizontal bars centered
      gsap.set(plusH, { transformOrigin: "50% 50%", rotate: 0 });
      gsap.set(plusV, { transformOrigin: "50% 50%", rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
      gsap.set(textInner, { yPercent: 0 });
    });

    return () => ctx.revert();
  }, [mounted]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel) return null;
    const layers = preLayersRef.current
      ? (Array.from(
          preLayersRef.current.querySelectorAll(".sm-prelayer"),
        ) as HTMLElement[])
      : [];

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }

    const itemEls = Array.from(
      panel.querySelectorAll(".sm-panel-itemLabel"),
    ) as HTMLElement[];
    const subEls = Array.from(
      panel.querySelectorAll(".sm-panel-sublabel"),
    ) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll(".sm-item-index"),
    ) as HTMLElement[];
    const bottomEls = Array.from(
      panel.querySelectorAll(".sm-bottom-section"),
    ) as HTMLElement[];

    gsap.set([panel, ...layers], { xPercent: 100, x: 0 });
    if (itemEls.length) gsap.set(itemEls, { yPercent: 100, opacity: 0 });
    if (subEls.length) gsap.set(subEls, { opacity: 0, x: -10 });
    if (numberEls.length) gsap.set(numberEls, { opacity: 0 });
    if (bottomEls.length) gsap.set(bottomEls, { opacity: 0, y: 20 });

    if (prefersReducedMotion()) {
      gsap.set([panel, ...layers], { xPercent: 0, x: 0 });
      if (backdrop) gsap.set(backdrop, { opacity: 1 });
      if (itemEls.length) gsap.set(itemEls, { yPercent: 0, opacity: 1 });
      if (subEls.length) gsap.set(subEls, { opacity: 1, x: 0 });
      if (numberEls.length) gsap.set(numberEls, { opacity: 1 });
      if (bottomEls.length) gsap.set(bottomEls, { opacity: 1, y: 0 });
      openTlRef.current = null;
      return null;
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    if (backdrop) {
      tl.fromTo(
        backdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
        0,
      );
    }

    // Stagger sliding prelayers
    layers.forEach((el, i) => {
      tl.fromTo(
        el,
        { xPercent: 100, x: 0 },
        { xPercent: 0, x: 0, duration: 0.55 },
        i * 0.08,
      );
    });

    const panelInsertTime = (layers.length ? layers.length * 0.08 : 0) + 0.04;
    const panelDuration = 0.65;

    // Main stealth dark panel slides in
    tl.fromTo(
      panel,
      { xPercent: 100, x: 0 },
      { xPercent: 0, x: 0, duration: panelDuration },
      panelInsertTime,
    );

    // Stagger menu item titles with clean modern motion (no jitter)
    if (itemEls.length) {
      const itemsStart = panelInsertTime + 0.14;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.05,
        },
        itemsStart,
      );

      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
            stagger: 0.05,
          },
          itemsStart + 0.03,
        );
      }

      if (subEls.length) {
        tl.to(
          subEls,
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            ease: "power2.out",
            stagger: 0.05,
          },
          itemsStart + 0.05,
        );
      }
    }

    // Bottom section fade in
    if (bottomEls.length) {
      tl.to(
        bottomEls,
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "power3.out",
        },
        panelInsertTime + 0.32,
      );
    }

    openTlRef.current = tl;
    return tl;
  }, []);

  const playOpen = useCallback(() => {
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    const tl = buildOpenTimeline();
    if (tl) {
      tl.play(0);
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;

    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel) return;
    const layers = preLayersRef.current
      ? (Array.from(
          preLayersRef.current.querySelectorAll(".sm-prelayer"),
        ) as HTMLElement[])
      : [];

    closeTweenRef.current?.kill();

    const itemEls = Array.from(
      panel.querySelectorAll(".sm-panel-itemLabel"),
    ) as HTMLElement[];

    if (prefersReducedMotion()) {
      gsap.set([panel, ...layers], { xPercent: 100, x: 0 });
      if (backdrop) gsap.set(backdrop, { opacity: 0 });
      if (itemEls.length) gsap.set(itemEls, { yPercent: 100, opacity: 0 });
      setOpen(false);
      onStateChange?.(false);
      closeTweenRef.current = null;
      return;
    }

    const closeTl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        setOpen(false);
        onStateChange?.(false);
        gsap.set([panel, ...layers], { xPercent: 100, x: 0 });
        if (itemEls.length) gsap.set(itemEls, { yPercent: 100, opacity: 0 });
      },
    });

    // 1. Items tuck down smoothly
    if (itemEls.length) {
      closeTl.to(
        itemEls,
        { opacity: 0, yPercent: 30, duration: 0.2, stagger: 0.02 },
        0,
      );
    }

    // 2. Main panel smoothly slides out
    closeTl.to(
      panel,
      { xPercent: 100, x: 0, duration: 0.42, ease: "power3.inOut" },
      0.05,
    );

    // 3. Prelayers slide out right behind it
    if (layers.length) {
      layers
        .slice()
        .reverse()
        .forEach((layer, idx) => {
          closeTl.to(
            layer,
            { xPercent: 100, x: 0, duration: 0.36, ease: "power3.inOut" },
            0.1 + idx * 0.04,
          );
        });
    }

    // 4. Backdrop smoothly fades out
    if (backdrop) {
      closeTl.to(
        backdrop,
        { opacity: 0, duration: 0.36, ease: "power2.out" },
        0.1,
      );
    }

    closeTweenRef.current = closeTl;
  }, [onStateChange]);

  // Icon morph: '+' <-> '×'
  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    const h = plusHRef.current;
    const v = plusVRef.current;
    if (!icon || !h || !v) return;

    spinTweenRef.current?.kill();

    if (prefersReducedMotion()) {
      gsap.set(h, { rotate: opening ? 45 : 0 });
      gsap.set(v, { rotate: opening ? 135 : 90 });
      return;
    }

    if (opening) {
      spinTweenRef.current = gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .to(h, { rotate: 45, duration: 0.45 }, 0)
        .to(v, { rotate: 135, duration: 0.45 }, 0);
    } else {
      spinTweenRef.current = gsap
        .timeline({ defaults: { ease: "power3.inOut" } })
        .to(h, { rotate: 0, duration: 0.32 }, 0)
        .to(v, { rotate: 90, duration: 0.32 }, 0);
    }
  }, []);

  // Text cycle: 'MENU' <-> 'CLOSE'
  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;

    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? "MENU" : "CLOSE";
    const targetLabel = opening ? "CLOSE" : "MENU";

    if (prefersReducedMotion()) {
      setTextLines([currentLabel, targetLabel]);
      gsap.set(inner, { yPercent: -50 });
      return;
    }

    const cycles = 3;

    const seq: string[] = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === "MENU" ? "CLOSE" : "MENU";
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);

    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });

    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;

    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.45 + lineCount * 0.05,
      ease: "power4.out",
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;

    animateIcon(target);
    animateText(target);

    if (target) {
      setOpen(true);
      onStateChange?.(true);
      playOpen();
    } else {
      playClose();
    }
  }, [playOpen, playClose, animateIcon, animateText, onStateChange]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      animateIcon(false);
      animateText(false);
      playClose();
    }
  }, [playClose, animateIcon, animateText]);

  // Close menu on route change
  useEffect(() => {
    if (openRef.current) {
      closeMenu();
    }
  }, [path, closeMenu]);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openRef.current) {
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu]);

  return (
    <>
      {/* Top Navbar Toggle Button */}
      <button
        className={`staggered-menu-trigger ${open ? "menu-open" : ""}`}
        onClick={toggleMenu}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="staggered-nav-panel"
        type="button"
      >
        <span className="trigger-text-wrapper" aria-hidden="true">
          <span ref={textInnerRef} className="trigger-text-inner">
            {textLines.map((line, idx) => (
              <span key={idx} className="trigger-line">
                {line}
              </span>
            ))}
          </span>
        </span>

        {/* Morphing + / × Icon */}
        <span ref={iconRef} className="trigger-icon" aria-hidden="true">
          <span ref={plusHRef} className="icon-bar icon-bar-h" />
          <span ref={plusVRef} className="icon-bar icon-bar-v" />
        </span>
      </button>

      {/* Fullscreen Staggered Menu Overlay Container Portaled directly to document.body */}
      {mounted &&
        createPortal(
          <div
            className={`staggered-menu-overlay ${open ? "active" : ""}`}
            style={{ "--menu-accent": accentColor } as React.CSSProperties}
            aria-hidden={!open}
          >
            {/* Backdrop Dark Scrim */}
            <div
              ref={backdropRef}
              className={`staggered-backdrop ${open ? "visible" : ""}`}
              onClick={closeMenu}
              aria-hidden="true"
            />

            {/* Pre-Layers (Obsidian Charcoal & Radiant Carmine Red) */}
            <div
              ref={preLayersRef}
              className="staggered-prelayers"
              aria-hidden="true"
            >
              {prelayerColors.map((color, idx) => (
                <div
                  key={idx}
                  className="sm-prelayer"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Main Navigation Panel (Stealth Nightfall Dark, Fits 100% Canvas Without Scroll) */}
            <aside
              id="staggered-nav-panel"
              ref={panelRef}
              className="staggered-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Site Navigation"
            >
              {/* Staggered Navigation Link List */}
              <nav className="panel-nav" aria-label="Primary Navigation">
                <ul className="panel-nav-list" role="list">
                  {items.map((item, idx) => {
                    const isActive = path === item.href;
                    const indexStr = (idx + 1).toString().padStart(2, "0");
                    return (
                      <li key={item.href} className="panel-nav-item">
                        <Link
                          href={item.href}
                          onClick={closeMenu}
                          className={`panel-nav-link ${isActive ? "active" : ""}`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span className="sm-item-index">{indexStr}</span>
                          <div className="panel-nav-text-col">
                            <div className="panel-nav-label-wrap">
                              <span className="sm-panel-itemLabel">
                                {item.label}
                              </span>
                            </div>
                            {item.sublabel && (
                              <span className="sm-panel-sublabel">
                                {item.sublabel}
                              </span>
                            )}
                          </div>
                          <ArrowUpRight
                            className="panel-item-arrow"
                            size={24}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Bottom Panel Section: Socials & Coordinates Only (No Direct Action Box) */}
              <div className="sm-bottom-section">
                <div className="panel-footer-row">
                  <div className="panel-socials">
                    <span className="socials-kicker">CONNECT WITH ME</span>
                    <div className="socials-links-grid">
                      {socials.map((soc) => (
                        <a
                          key={soc.label}
                          href={soc.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-pill-link"
                        >
                          <span>{soc.label}</span>
                          <ArrowUpRight
                            size={11}
                            className="social-pill-arrow"
                          />
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="panel-coordinates">
                    <span>NEW DELHI, IN</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
