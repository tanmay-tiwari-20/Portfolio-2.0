"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useCallback, useEffect } from "react";

// Dynamically import DitherVeil with ssr: false to prevent WebGL/canvas hydration issues
const DitherVeil = dynamic(() => import("./animations/dither-veil"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#07090e] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/15 border-t-[#ff003c] rounded-full animate-spin" />
    </div>
  ),
});

interface HeroPortraitProps {
  imageSrc?: string;
  className?: string;
}

export default function HeroPortrait({
  imageSrc = "https://res.cloudinary.com/dunacoujw/image/upload/b_rgb:07090e,f_auto,q_auto,w_1200/v1792423733/hero_ppp8ke.png",
  className = "",
}: HeroPortraitProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
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
    return () => media.removeEventListener("change", updatePreference);
  }, []);

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
        <DitherVeil
          src={imageSrc}
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
