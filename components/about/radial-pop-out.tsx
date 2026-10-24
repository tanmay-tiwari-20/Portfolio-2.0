"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Images } from "lucide-react";
import type { AboutPopOutConfig } from "@/lib/validators/schemas";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";

type Props = {
  gallery: AboutPopOutConfig;
  className?: string;
};

export default function RadialPopOut({ gallery, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(
    () => new Set(),
  );
  const lastPointerType =
    useRef<PointerEvent<HTMLButtonElement>["pointerType"]>("mouse");
  const center =
    gallery.images.find((image) => image.id === gallery.centerId) ??
    gallery.images[0];
  const orbit = gallery.images.filter((image) => image.id !== center?.id);

  function markFailed(id: string) {
    setFailedImages((current) => new Set(current).add(id));
  }

  function handlePointerEnter(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "touch") setExpanded(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse" || !rootRef.current) return;
    const bounds = rootRef.current.getBoundingClientRect();
    rootRef.current.style.setProperty(
      "--spot-x",
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
    rootRef.current.style.setProperty(
      "--spot-y",
      `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
    );
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch") setExpanded(false);
    event.currentTarget.style.setProperty("--spot-x", "50%");
    event.currentTarget.style.setProperty("--spot-y", "50%");
  }

  const rootClassName = [
    "relative isolate mx-auto aspect-square w-full max-w-[500px] min-[681px]:max-w-[720px] [--spot-x:50%] [--spot-y:50%] motion-reduce:[&_*]:transition-none",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={rootRef}
      className={rootClassName}
      data-open={expanded}
      onPointerLeave={handlePointerLeave}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setExpanded(false);
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 -z-[2] rounded-full bg-[radial-gradient(240px_circle_at_var(--spot-x)_var(--spot-y),rgba(255,250,247,0.075),transparent_70%)]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-0 -z-[2] rounded-full bg-[radial-gradient(circle_at_50%_47%,rgba(239,70,62,0.16),transparent_39%),radial-gradient(circle_at_50%_50%,rgba(255,250,247,0.045),transparent_69%)]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-[6%] -z-[1] rounded-full border border-white/[0.08]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-[13%] -z-[1] rounded-full border border-white/[0.06]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden={!expanded}
      >
        <span
          className={`pointer-events-none absolute inset-[4%] rounded-full border border-dashed border-white/[0.09] transition-[opacity,transform] duration-500 ease-out ${expanded ? "scale-[1.035] opacity-100" : "opacity-70"}`}
          aria-hidden="true"
        />
        <span
          className={`pointer-events-none absolute inset-[22%] rounded-full border border-[#ef463e]/[0.14] transition-[opacity,transform] duration-500 ease-out ${expanded ? "scale-[1.08] opacity-40" : "scale-[0.92] opacity-70"}`}
          aria-hidden="true"
        />
        {orbit.map((image, index) => {
          const angle =
            -90 +
            (360 * index) / Math.max(orbit.length, 1) +
            (index % 2 ? 5 : -4);
          const radians = (angle * Math.PI) / 180;
          const radius = 37 + (index % 3 === 1 ? -2 : index % 3 === 2 ? 1 : 0);
          const style = {
            "--orbit-x": `${Math.cos(radians) * radius}%`,
            "--orbit-y": `${Math.sin(radians) * radius}%`,
            "--stack-x": `${Math.cos(radians) * 17}%`,
            "--stack-y": `${Math.sin(radians) * 17}%`,
            "--orbit-depth": `${index}`,
            "--card-turn": `${((index % 3) - 1) * 4}deg`,
          } as CSSProperties;

          return (
            <div
              className={`absolute aspect-square w-[clamp(110px,31%,165px)] overflow-hidden rounded-[8px] border border-[#fffaf7]/[0.56] bg-[#211718] shadow-[0_12px_36px_rgba(0,0,0,0.32)] [z-index:calc(2+var(--orbit-depth))] [transform-origin:center] [transition:top_760ms_cubic-bezier(0.16,1.08,0.3,1),left_760ms_cubic-bezier(0.16,1.08,0.3,1),transform_760ms_cubic-bezier(0.16,1.08,0.3,1),opacity_420ms_ease,filter_580ms_ease,box-shadow_360ms_ease] [transition-delay:calc(var(--orbit-depth)*22ms)] min-[681px]:w-[clamp(100px,27%,170px)] min-[1001px]:w-[clamp(118px,29%,210px)] ${expanded ? "left-[calc(50%_+_var(--orbit-x))] top-[calc(50%_+_var(--orbit-y))] [transform:translate3d(-50%,-50%,0)_rotate(var(--card-turn))_scale(1)] opacity-100 saturate-100 brightness-100" : "left-[calc(50%_+_var(--stack-x))] top-[calc(50%_+_var(--stack-y))] [transform:translate3d(-50%,-50%,0)_rotate(calc(var(--card-turn)*1.7))_scale(0.74)] opacity-[0.74] saturate-[0.78] brightness-[0.78]"}`}
              key={image.id}
              style={style}
            >
              <ImageFrame
                image={image}
                failed={failedImages.has(image.id)}
                onFail={markFailed}
              />
            </div>
          );
        })}
      </div>

      {center && (
        <button
          className={`absolute left-1/2 top-1/2 z-[50] grid aspect-[0.88] w-[clamp(170px,44%,230px)] -translate-x-1/2 -translate-y-1/2 place-items-stretch overflow-hidden rounded-[11px] bg-[#211718] p-0 text-[#fffaf7] transition-[transform,box-shadow,border-color] duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:rotate-0 hover:scale-[0.96] hover:border-[#fffaf7]/[0.96] focus-visible:rotate-0 focus-visible:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fffaf7] focus-visible:ring-offset-[3px] focus-visible:ring-offset-[#ef463e] min-[681px]:w-[clamp(184px,40%,250px)] min-[681px]:rounded-xl min-[1001px]:w-[clamp(210px,40%,304px)] ${expanded ? "rotate-0 scale-[0.96] border border-[#fffaf7]/[0.96] shadow-[0_32px_90px_rgba(0,0,0,0.56),0_0_0_7px_rgba(239,70,62,0.13),0_0_84px_rgba(239,70,62,0.16)]" : "rotate-[-2.5deg] border border-[#fffaf7]/80 shadow-[0_28px_78px_rgba(0,0,0,0.5),0_0_0_7px_rgba(255,250,247,0.055),0_0_62px_rgba(239,70,62,0.12)]"}`}
          type="button"
          aria-label={`${center.alt ? `${center.alt}. ` : ""}${expanded ? "Gather the surrounding photos" : "Reveal the surrounding photos"}`}
          aria-expanded={expanded}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerDown={(event) => {
            lastPointerType.current = event.pointerType;
          }}
          onClick={(event) => {
            if (event.detail === 0 || lastPointerType.current === "touch") {
              setExpanded((current) => !current);
            }
          }}
        >
          <ImageFrame
            image={center}
            failed={failedImages.has(center.id)}
            onFail={markFailed}
          />
          <span
            className={`absolute bottom-[7px] left-[7px] right-[7px] flex min-h-[30px] items-center justify-center gap-2 rounded-full border border-[#fffaf7]/[0.24] bg-[#0f0b0c]/[0.76] text-[7px] font-bold uppercase tracking-[0.15em] text-[#fffaf7] backdrop-blur-[10px] transition-[transform,opacity] duration-[350ms] min-[681px]:bottom-[9px] min-[681px]:left-[9px] min-[681px]:right-[9px] min-[681px]:min-h-[34px] min-[681px]:text-[8px] ${expanded ? "translate-y-1 opacity-0" : "opacity-100"}`}
          >
            <Images size={14} aria-hidden="true" />
            <span>
              {expanded ? "Move away to gather" : "Hover or tap to explore"}
            </span>
          </span>
        </button>
      )}

      <span
        className="absolute bottom-[2%] right-[3%] z-[60] text-[8px] font-bold tracking-[0.18em] text-white/75 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] min-[681px]:bottom-[4%] min-[681px]:right-[4%] min-[681px]:text-[9px]"
        aria-hidden="true"
      >
        {String(orbit.length + (center ? 1 : 0)).padStart(2, "0")}{" "}
        <i className="px-1 not-italic text-[#ef463e]">/</i> MOMENTS
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {expanded
          ? `${orbit.length} surrounding images revealed`
          : "Radial photo collection"}
      </span>
    </div>
  );
}

function ImageFrame({
  image,
  failed,
  onFail,
}: {
  image: AboutPopOutConfig["images"][number];
  failed: boolean;
  onFail: (id: string) => void;
}) {
  if (failed) {
    return (
      <span className="grid h-full w-full place-items-center bg-[linear-gradient(145deg,#402326,#1f1719)] p-3 text-center text-[11px] text-white/70">
        Image unavailable
      </span>
    );
  }

  // Keep the source aspect ratio at the CDN too; a square c_fill transform crops before object-contain can help.
  return (
    <Image
      src={getOptimizedUrl(image.url, 960)}
      alt={image.alt}
      fill
      sizes="(max-width: 680px) 31vw, (max-width: 1000px) 170px, 210px"
      unoptimized
      draggable={false}
      className="select-none object-contain"
      onError={() => onFail(image.id)}
    />
  );
}
