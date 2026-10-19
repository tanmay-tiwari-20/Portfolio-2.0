"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useCallback } from "react";

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
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Subtle, expensive Awwwards-grade magnetic tilt (max ~4.5 degrees)
    const rx = ((y - cy) / cy) * -4.5;
    const ry = ((x - cx) / cx) * 4.5;

    setTilt({ rx, ry });
  }, []);

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
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
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.015, 1.015, 1.015)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        }}
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
