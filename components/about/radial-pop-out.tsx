"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Images } from "lucide-react";
import type { AboutPopOutConfig } from "@/lib/validators/schemas";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";

export type RadialPopOutItem = {
  src: string;
  alt?: string;
  id?: string;
};

export type RadialPopOutProps = {
  gallery?: AboutPopOutConfig;
  hero?: RadialPopOutItem;
  items?: RadialPopOutItem[];
  cardSize?: number;
  heroSize?: number;
  radius?: number;
  jitter?: number;
  stagger?: number;
  maxTilt?: number;
  shift?: number;
  className?: string;
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function RadialPopOut({
  gallery,
  hero: customHero,
  items: customItems,
  cardSize = 245,
  heroSize = 310,
  radius = 290,
  jitter = 7,
  stagger = 0.025,
  maxTilt = 10,
  shift = 0.16,
  className = "",
}: RadialPopOutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const centerCardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const isTouchDeviceRef = useRef(false);

  // Resolve hero and items from props or gallery
  const { hero, items } = useMemo(() => {
    if (customHero && customItems) {
      return { hero: customHero, items: customItems };
    }
    if (gallery && gallery.images?.length > 0) {
      const centerImg =
        gallery.images.find((image) => image.id === gallery.centerId) ??
        gallery.images[0];
      const orbitImgs = gallery.images.filter(
        (image) => image.id !== centerImg?.id,
      );
      return {
        hero: {
          src: getOptimizedUrl(centerImg.url, 1200),
          alt: centerImg.alt || "Tanmay Tiwari",
          id: centerImg.id,
        },
        items: orbitImgs.map((img) => ({
          src: getOptimizedUrl(img.url, 960),
          alt: img.alt || "Moment",
          id: img.id,
        })),
      };
    }
    return {
      hero: customHero || { src: "", alt: "Featured" },
      items: customItems || [],
    };
  }, [gallery, customHero, customItems]);

  const effectiveRadius = radius ?? Math.round(1.2 * cardSize);
  const effectiveHeroSize = heroSize ?? Math.round(1.28 * cardSize);

  // True bounding diameter: from center to outer card edge
  const baseDimension = Math.round((effectiveRadius + cardSize * 0.55) * 2);

  useIsomorphicLayoutEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent) return;

    const updateScale = () => {
      const parentRect = parent.getBoundingClientRect();
      const parentWidth = parentRect.width;

      // Strict viewport height bounding:
      // Leave ~80px vertical breathing room so the enlarged cards never exceed view height
      const viewportHeight = window.innerHeight;
      const maxAvailableHeight = Math.max(300, viewportHeight - 80);
      const parentHeight = parentRect.height > 0 ? parentRect.height : maxAvailableHeight;
      const effectiveHeight = Math.min(parentHeight, maxAvailableHeight);

      const availableDimension = Math.min(
        parentWidth > 0 ? parentWidth : baseDimension,
        effectiveHeight,
      );

      if (availableDimension > 0) {
        setScale(Math.min(1, availableDimension / baseDimension));
      }
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(parent);
    window.addEventListener("resize", updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [baseDimension]);

  // Touch outside listener on mobile to dismiss pop-out cleanly
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideInteraction = (e: Event) => {
      if (
        centerCardRef.current &&
        !centerCardRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        resetTilt();
      }
    };

    window.addEventListener("pointerdown", handleOutsideInteraction);
    return () => {
      window.removeEventListener("pointerdown", handleOutsideInteraction);
    };
  }, [isOpen]);

  const scaledCardSize = cardSize * scale;
  const scaledHeroSize = effectiveHeroSize * scale;
  const scaledRadius = effectiveRadius * scale;
  const itemCount = items.length;

  // Deterministic jitter and radial coordinates (starting from 12 o'clock / -90deg)
  const positions = useMemo(() => {
    return items.map((_, index) => {
      const angle = (index / Math.max(itemCount, 1)) * Math.PI * 2 - Math.PI / 2;
      const pseudoRandom = 233280 * Math.sin(9301 * index + 49297);
      const frac = pseudoRandom - Math.floor(pseudoRandom);
      const rotate = (frac * 2 - 1) * jitter;
      return {
        x: Math.cos(angle) * scaledRadius,
        y: Math.sin(angle) * scaledRadius,
        rotate,
      };
    });
  }, [items, itemCount, scaledRadius, jitter]);

  const containerDimension = baseDimension * scale;

  // Interactive 3D tilt & magnetic cursor spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = {
    stiffness: 140,
    damping: 22,
    mass: 0.7,
    restDelta: 0.001,
  };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const shiftAmount = scaledHeroSize * shift;
  const translateX = useTransform(smoothMouseX, [-1, 1], [-shiftAmount, shiftAmount]);
  const translateY = useTransform(smoothMouseY, [-1, 1], [-shiftAmount, shiftAmount]);
  const rotateY = useTransform(smoothMouseX, [-1, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(smoothMouseY, [-1, 1], [maxTilt, -maxTilt]);

  const heroTransform = useMotionTemplate`translate3d(${translateX}px, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  const resetTilt = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // DESKTOP: ONLY HOVER over center image opens it; leaving center image IMMEDIATELY closes it.
  // MOBILE: ONLY TOUCH/TAP on center image toggles it; tapping outside dismisses it.
  const handleCenterPointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") {
      isTouchDeviceRef.current = false;
      setIsOpen(true);
    }
  };

  const handleCenterPointerLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") {
      setIsOpen(false);
      resetTilt();
    }
  };

  const handleCenterPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || e.pointerType === "pen") {
      isTouchDeviceRef.current = true;
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative mx-auto flex items-center justify-center select-none ${className}`}
      style={{
        width: containerDimension,
        height: containerDimension,
        perspective: 1000,
      }}
    >
      {/* Ambient background orbital guides and cosmic glow */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10"
        aria-hidden="true"
      >
        {/* Soft crimson core spotlight */}
        <div
          className={`absolute rounded-full transition-all duration-700 ease-out ${
            isOpen
              ? "scale-110 opacity-100"
              : "scale-90 opacity-60"
          }`}
          style={{
            width: scaledRadius * 2.15,
            height: scaledRadius * 2.15,
            background:
              "radial-gradient(circle at 50% 50%, rgba(239,70,62,0.2) 0%, rgba(239,70,62,0.06) 45%, transparent 70%)",
          }}
        />

        {/* Orbit ring dashed */}
        <div
          className={`absolute rounded-full border border-dashed transition-all duration-700 ease-out ${
            isOpen
              ? "scale-105 border-[#ef463e]/30 opacity-100"
              : "scale-100 border-white/[0.08] opacity-60"
          }`}
          style={{
            width: scaledRadius * 2,
            height: scaledRadius * 2,
          }}
        />

        {/* Outer subtle boundary ring */}
        <div
          className="absolute rounded-full border border-white/[0.04]"
          style={{
            width: scaledRadius * 2.35,
            height: scaledRadius * 2.35,
          }}
        />
      </div>

      {/* Scattered Radial Cards — pointer-events-none ensures hovering off center card isn't blocked */}
      <AnimatePresence>
        {isOpen &&
          items.map((item, index) => {
            const pos = positions[index] || { x: 0, y: 0, rotate: 0 };
            return (
              <motion.div
                key={item.id ?? `${index}-${item.src}`}
                aria-hidden={true}
                className="pointer-events-none absolute z-20"
                style={{
                  width: scaledCardSize,
                  height: scaledCardSize,
                }}
                initial={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 0.55,
                  opacity: 0,
                }}
                animate={
                  shouldReduceMotion
                    ? {
                        x: pos.x,
                        y: pos.y,
                        rotate: pos.rotate,
                        scale: 1,
                        opacity: 1,
                        transition: { duration: 0.15 },
                      }
                    : {
                        x: pos.x,
                        y: pos.y,
                        rotate: pos.rotate,
                        scale: 1,
                        opacity: 1,
                        transition: {
                          type: "spring",
                          stiffness: 260,
                          damping: 22,
                          mass: 0.8,
                          restDelta: 0.001,
                          delay: index * stagger,
                        },
                      }
                }
                exit={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 0.7,
                  opacity: 0,
                  transition: {
                    duration: 0.2,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
              >
                <CardItem src={item.src} alt={item.alt || ""} />
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* Center Hero Card — hover on mouse, tap on touch */}
      {hero && (
        <div
          ref={centerCardRef}
          className="relative z-30 touch-manipulation"
          style={{
            width: scaledHeroSize,
            height: scaledHeroSize,
          }}
          onPointerEnter={handleCenterPointerEnter}
          onPointerLeave={handleCenterPointerLeave}
          onPointerDown={handleCenterPointerDown}
          onMouseMove={(e) => {
            if (shouldReduceMotion || isTouchDeviceRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
            mouseX.set(Math.max(-1, Math.min(1, nx)));
            mouseY.set(Math.max(-1, Math.min(1, ny)));
          }}
        >
          <motion.div
            className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-3xl border border-white/25 bg-[#160f10] p-0 shadow-[0_22px_60px_rgba(0,0,0,0.7),0_0_45px_rgba(239,70,62,0.22)] ring-1 ring-white/20 transition-all duration-300 hover:border-[#ff6558]/70 hover:ring-[#ef463e]/40 focus:outline-none"
            style={{
              transform: heroTransform,
              transformStyle: "preserve-3d",
            }}
            role="button"
            tabIndex={0}
            aria-label={
              hero.alt
                ? `${hero.alt}. ${isOpen ? "Close gallery photos" : "Hover or tap to reveal gallery photos"}`
                : "Reveal gallery moments"
            }
            aria-expanded={isOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
              }
            }}
          >
            <CardItem src={hero.src} alt={hero.alt || ""} isHero={true} />

            {/* Clean instruction badge (strictly non-pulsing) */}
            <span
              className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/85 shadow-[0_4px_14px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 ${
                isOpen
                  ? "scale-90 opacity-0"
                  : "scale-100 opacity-90 group-hover:opacity-100 group-hover:border-white/35"
              }`}
            >
              <Images size={11} className="text-[#ff6558]" aria-hidden="true" />
              <span className="hidden sm:inline">Hover to expand</span>
              <span className="inline sm:hidden">Tap to view</span>
            </span>
          </motion.div>
        </div>
      )}

      {/* Screen reader status */}
      <span className="sr-only" role="status" aria-live="polite">
        {isOpen
          ? `${items.length} orbiting cards popped out`
          : "Radial pop out collection"}
      </span>
    </div>
  );
}

function CardItem({
  src,
  alt,
  isHero = false,
}: {
  src: string;
  alt: string;
  isHero?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#160f10] ${
        isHero
          ? "rounded-3xl"
          : "rounded-2xl border border-white/20 shadow-[0_16px_42px_rgba(0,0,0,0.7),0_0_28px_rgba(239,70,62,0.18)] ring-1 ring-white/15"
      }`}
    >
      {failed || !src ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(145deg,#25191b,#120c0d)] p-3 text-center text-[10px] font-medium text-white/50">
          <Images size={18} className="mb-1 text-[#ef463e]/60" />
          <span>Archive</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          draggable={false}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="pointer-events-none h-full w-full select-none object-cover transition-transform duration-500 ease-out hover:scale-105"
        />
      )}
    </div>
  );
}
