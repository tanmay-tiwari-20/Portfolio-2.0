"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";
import { cloudinaryLoader } from "@/lib/cloudinary/urls";

// Dynamically import DitherVeil with ssr: false to prevent WebGL/canvas hydration issues
const DitherVeil = dynamic(() => import("./animations/dither-veil"), {
  ssr: false,
  loading: () => null,
});

interface HeroPortraitProps {
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
}

export default function HeroPortrait({
  imageSrc = "https://res.cloudinary.com/dunacoujw/image/upload/b_rgb:07090e,f_auto,q_auto,w_1200/v1792423733/hero_ppp8ke.png",
  imageAlt = "Portrait of Tanmay Tiwari",
  className = "",
}: HeroPortraitProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [loadedImage, setLoadedImage] = useState<{ source: string; url: string }>();
  const [textureSrc, setTextureSrc] = useState<string>();
  const reducedMotion = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      reducedMotion.current = media.matches;
      if (media.matches && cardRef.current) {
        cardRef.current.classList.remove("is-tilting");
        cardRef.current.style.transform = "";
      }
    };

    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => {
      media.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (!loadedImage || loadedImage.source !== imageSrc) return;
    let frame = 0;
    let disposed = false;
    const covered = () => {
      const root = document.documentElement;
      return (
        document.hidden ||
        root.classList.contains("portfolio-loading") ||
        root.classList.contains("portfolio-transitioning") ||
        Boolean(root.dataset.spiderTransition)
      );
    };
    const enhance = () => {
      cancelAnimationFrame(frame);
      if (disposed || covered()) return;
      // Keep the decoded portrait available throughout the shared Spider
      // flight, then initialize its separate renderer after two clear paints.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (!disposed && !covered()) setTextureSrc(loadedImage.url);
        });
      });
    };
    window.addEventListener("portfolio:preloader-complete", enhance);
    window.addEventListener("portfolio:transition-end", enhance);
    window.addEventListener("pageshow", enhance);
    document.addEventListener("visibilitychange", enhance);
    enhance();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("portfolio:preloader-complete", enhance);
      window.removeEventListener("portfolio:transition-end", enhance);
      window.removeEventListener("pageshow", enhance);
      document.removeEventListener("visibilitychange", enhance);
    };
  }, [loadedImage, imageSrc]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || reducedMotion.current) return;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Update only the card's compositor transform; avoid rerendering the WebGL child
    // for every pointer event.
    const rx = ((y - cy) / cy) * -4.5;
    const ry = ((x - cx) / cx) * 4.5;

    card.classList.add("is-tilting");
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.015, 1.015, 1.015)`;
  }, []);

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (cardRef.current) {
      cardRef.current.classList.remove("is-tilting");
      cardRef.current.style.transform = "";
    }
  };

  return (
    <div className={`hero-portrait-container ${className}`}>
      {/* Pure, Architectural Frame */}
      <div
        ref={cardRef}
        className="hero-portrait-frame"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* A responsive, server-rendered portrait paints before WebGL loads. */}
        <Image
          loader={cloudinaryLoader}
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 767px) 360px, 410px"
          preload
          crossOrigin="anonymous"
          className="object-cover"
          onLoad={(event) => {
            setLoadedImage({
              source: imageSrc,
              url: event.currentTarget.currentSrc || event.currentTarget.src,
            });
          }}
        />
        {textureSrc &&
          loadedImage?.source === imageSrc &&
          textureSrc === loadedImage.url && (
            <DitherVeil
              src={textureSrc}
              fit="cover"
              pattern="floyd"
              pixelSize={2.4}
              levels={2}
              palette="duotone"
              inkColor="#07090e"
              paperColor="#ebebef"
              contrast={1.22}
              brightness={0.03}
              revealRadius={190}
              softness={0.65}
              linger={1.1}
              rimColor="#ff003c"
              rim={0.12}
              clickBurst={true}
              wander={false}
              className="w-full h-full"
            />
          )}

        {/* Minimalist interactive corner cue - fades away seamlessly on hover */}
        <div
          className={`hero-minimal-hint ${
            isHovered ? "opacity-0" : "opacity-40"
          }`}
          aria-hidden="true"
        >
          <span>INTERACTIVE</span>
        </div>
      </div>
    </div>
  );
}
