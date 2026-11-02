"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, Images } from "lucide-react";
import type { AboutPopOutConfig } from "@/lib/validators/schemas";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { createRadialPopLayout } from "@/lib/radial-pop-layout";

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
  maxTilt = 3.5,
  shift = 0.055,
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

  useEffect(() => {
    // Warm the first orbit cards before hover so the motion never reveals a
    // blank frame while the browser starts fetching an image.
    items.slice(0, 6).forEach((item) => {
      if (!item.src) return;
      const image = new window.Image();
      image.decoding = "async";
      image.fetchPriority = "low";
      image.src = item.src;
    });
  }, [items]);

  const effectiveRadius = radius ?? Math.round(1.2 * cardSize);
  const effectiveHeroSize = heroSize ?? Math.round(1.28 * cardSize);

  const layout = useMemo(
    () => createRadialPopLayout({
      count: items.length,
      cardSize,
      heroSize: effectiveHeroSize,
      heroPadding: effectiveHeroSize * Math.abs(shift),
      radius: effectiveRadius,
      jitter,
    }),
    [items.length, cardSize, effectiveHeroSize, effectiveRadius, jitter, shift],
  );
  const baseDimension = layout.dimension;

  useIsomorphicLayoutEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent) return;

    const updateScale = () => {
      // Use layout dimensions, not getBoundingClientRect(), because that
      // includes the page transition's temporary transform on first entry.
      const parentWidth = parent.clientWidth;

      // Strict viewport height bounding:
      // Leave ~80px vertical breathing room so the enlarged cards never exceed view height
      const viewportHeight = window.innerHeight;
      const maxAvailableHeight = Math.max(300, viewportHeight - 80);
      const parentHeight = parent.clientHeight > 0
        ? parent.clientHeight
        : maxAvailableHeight;
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
    const layoutFrame = window.requestAnimationFrame(updateScale);

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(parent);
    window.addEventListener("resize", updateScale);
    return () => {
      window.cancelAnimationFrame(layoutFrame);
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [baseDimension]);

  const scaledCardSize = cardSize * scale;
  const scaledHeroSize = effectiveHeroSize * scale;
  const scaledRadius = effectiveRadius * scale;
  const containerDimension = baseDimension * scale;
  const closedCardScale = Math.min(0.9, (effectiveHeroSize / cardSize) * 0.85);

  // Interactive 3D tilt & magnetic cursor spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = {
    stiffness: 180,
    damping: 24,
    mass: 0.75,
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

  const resetTilt = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Touch outside listener on mobile to dismiss pop-out cleanly.
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
  }, [isOpen, resetTilt]);

  // The fan follows the portrait's hover state. Orbit cards are decorative,
  // so leaving the portrait starts the same smooth motion back to center.
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
          className={`absolute rounded-full transition-all duration-700 ease-out motion-reduce:transition-none ${
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
          className={`absolute rounded-full border border-dashed transition-all duration-700 ease-out motion-reduce:transition-none ${
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

      {/* Keep the cards mounted so a hover reversal continues from the current
          position and velocity instead of restarting an entrance animation. */}
      {items.map((item, index) => {
        const pos = layout.positions[index];
        return (
          <motion.div
            key={item.id ?? `${index}-${item.src}`}
            aria-hidden={true}
            className="pointer-events-none absolute z-20"
            style={{
              width: scaledCardSize,
              height: scaledCardSize,
              left: "50%",
              top: "50%",
              marginLeft: -scaledCardSize / 2,
              marginTop: -scaledCardSize / 2,
            }}
            initial={false}
            animate={{
              x: isOpen ? pos.x * scale : 0,
              y: isOpen ? pos.y * scale : 0,
              rotate: isOpen ? pos.rotate : 0,
              scale: isOpen ? 1 : closedCardScale,
              opacity: isOpen ? 1 : 0,
            }}
            transition={shouldReduceMotion ? { duration: 0 } : {
              type: "spring",
              stiffness: 220,
              damping: 27,
              mass: 0.8,
              restDelta: 0.1,
              restSpeed: 0.5,
              delay: isOpen ? Math.min(index * stagger, 0.08) : 0,
              opacity: {
                duration: isOpen ? 0.12 : 0.16,
                delay: isOpen ? 0 : 0.24,
                ease: "easeOut",
              },
            }}
          >
            <CardItem key={item.src} src={item.src} alt={item.alt || ""} />
          </motion.div>
        );
      })}

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
          onPointerMove={(e) => {
            if (
              e.pointerType !== "mouse" ||
              shouldReduceMotion ||
              isTouchDeviceRef.current
            )
              return;
            const rect = e.currentTarget.getBoundingClientRect();
            const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
            mouseX.set(Math.max(-1, Math.min(1, nx)));
            mouseY.set(Math.max(-1, Math.min(1, ny)));
          }}
        >
          <motion.div
            className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-3xl border border-white/25 bg-[#160f10] p-0 shadow-[0_22px_60px_rgba(0,0,0,0.7),0_0_45px_rgba(239,70,62,0.22)] ring-1 ring-white/20 transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none hover:border-[#ff6558]/70 hover:ring-[#ef463e]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9b78] focus-visible:ring-offset-4 focus-visible:ring-offset-[#090708]"
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
              } else if (e.key === "Escape") {
                setIsOpen(false);
                resetTilt();
              }
            }}
          >
            <CardItem key={hero.src} src={hero.src} alt={hero.alt || ""} isHero={true} />

            {/* A quiet corner cue keeps the portrait itself unobstructed. */}
            <span
              className={`pointer-events-none absolute bottom-4 right-4 z-10 flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white/70 shadow-[0_3px_14px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-all duration-300 motion-reduce:transition-none ${
                isOpen
                  ? "scale-90 opacity-0"
                  : "scale-100 opacity-55 group-hover:opacity-75 group-hover:border-white/40"
              }`}
            >
              <ArrowUpRight size={17} className="text-[#ffd1a0]" aria-hidden="true" />
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
