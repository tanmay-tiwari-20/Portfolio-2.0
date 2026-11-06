"use client";

import { useEffect, useId, useRef } from "react";
import { waitForAboutSignatureReady } from "@/lib/about-signature-ready";
import {
  SIGNATURE_PROGRESS,
  signaturePenAngle,
  signaturePenFrame,
} from "@/lib/signature-pen";
import {
  SIGNATURE_STROKES,
  SIGNATURE_VIEWBOX,
  SIGNATURE_WIDTH,
  SIGNATURE_HEIGHT,
} from "@/lib/tanmay-signature";

type SignatureRevealProps = {
  /** The first six orbit photos are warmed by the existing portrait component. */
  imageSources?: string[];
  className?: string;
};

/** Original ink artwork and pen choreography, independent of the hero timeline. */
export default function SignatureReveal({
  imageSources,
  className = "",
}: SignatureRevealProps) {
  const id = useId().replaceAll(":", "");
  const rootRef = useRef<HTMLDivElement>(null);
  const penRef = useRef<SVGGElement>(null);
  // The route's initial assets are the only ones relevant to this one-time reveal.
  const initialImages = useRef(imageSources);

  useEffect(() => {
    const root = rootRef.current;
    const page = root?.closest<HTMLElement>(".about-page");
    if (!root || !page) return;

    const controller = new AbortController();
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const paths = Array.from(
      root.querySelectorAll<SVGPathElement>("[data-signature-pen]"),
    );
    const animations: Animation[] = [];
    const pen = penRef.current;
    let penFrame = 0;
    let finished = false;

    const finish = () => {
      if (controller.signal.aborted || finished) return;
      finished = true;
      window.cancelAnimationFrame(penFrame);
      if (pen) pen.style.opacity = "0";
      // Set the underlying value before canceling fill-forwards animations.
      paths.forEach((path) => {
        path.style.strokeDashoffset = "0";
        path.style.opacity = "1";
      });
      animations.forEach((animation) => animation.cancel());
      root.dataset.signatureState = "complete";
    };

    const onMotionChange = () => {
      if (motionPreference.matches) finish();
    };
    motionPreference.addEventListener("change", onMotionChange);

    if (motionPreference.matches || !Element.prototype.animate) {
      finish();
    } else {
      root.dataset.signatureState = "waiting";
      paths.forEach((path) => {
        path.style.strokeDashoffset = "1";
        path.style.opacity = "0";
      });

      void waitForAboutSignatureReady({
        root: page,
        signal: controller.signal,
        imageSources: initialImages.current,
      })
        .then((mode) => {
          if (controller.signal.aborted || finished) return;
          if (mode === "static" || motionPreference.matches) {
            finish();
            return;
          }

          root.dataset.signatureState = "drawing";
          const pathLengths = paths.map((path) => path.getTotalLength());
          const timelineStart = document.timeline.currentTime;
          let start = 0;
          paths.forEach((path, index) => {
            const stroke = SIGNATURE_STROKES[index];
            start += stroke.delay ?? 0;
            // Vary pen speed within a stroke; the filled silhouette supplies
            // pressure variation without outlining the letters or typing glyphs.
            const animation = path.animate(
              SIGNATURE_PROGRESS.map(({ offset, progress }) => ({
                strokeDashoffset: String(1 - progress),
                opacity: 1,
                offset,
              })),
              {
                duration: stroke.duration,
                delay: start,
                easing: "linear",
                fill: "forwards",
              },
            );
            // Share one WAAPI start time so the nib never leads or trails ink.
            if (typeof timelineStart === "number")
              animation.startTime = timelineStart;
            animations.push(animation);
            start += stroke.duration;
          });

          const followPen = () => {
            if (controller.signal.aborted || finished || !pen) return;
            // The last animation includes all preceding delays. Earlier
            // animations clamp their currentTime as soon as their stroke ends.
            const clock = animations[animations.length - 1]?.currentTime;
            const frame = signaturePenFrame(
              typeof clock === "number" ? clock : 0,
            );
            if (!frame) {
              pen.style.opacity = "0";
              return;
            }
            const point = paths[frame.index].getPointAtLength(
              pathLengths[frame.index] * frame.progress,
            );
            let x = point.x;
            let y = point.y;
            if (frame.lift !== null && frame.index > 0) {
              const previous = paths[frame.index - 1].getPointAtLength(
                pathLengths[frame.index - 1],
              );
              const travel = frame.lift * frame.lift * (3 - 2 * frame.lift);
              x = previous.x + (x - previous.x) * travel;
              y =
                previous.y +
                (y - previous.y) * travel -
                Math.sin(Math.PI * frame.lift) * 8;
            }
            pen.setAttribute(
              "transform",
              `translate(${x} ${y}) rotate(${signaturePenAngle(x, y)})`,
            );
            pen.style.opacity = "1";
            penFrame = window.requestAnimationFrame(followPen);
          };
          penFrame = window.requestAnimationFrame(followPen);
          void Promise.all(animations.map((animation) => animation.finished))
            .then(finish)
            .catch(() => {
              if (!controller.signal.aborted) finish();
            });
        })
        .catch(() => {
          if (!controller.signal.aborted) finish();
        });
    }

    return () => {
      controller.abort();
      window.cancelAnimationFrame(penFrame);
      if (pen) pen.style.opacity = "0";
      motionPreference.removeEventListener("change", onMotionChange);
      animations.forEach((animation) => animation.cancel());
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`group/signature relative isolate w-full max-w-[20rem] text-(--theme-paper) md:max-w-md ${className}`}
      data-signature-state="waiting"
      role="img"
      aria-label="Tanmay Tiwari, handwritten signature"
      style={{ aspectRatio: `${SIGNATURE_WIDTH} / ${SIGNATURE_HEIGHT}` }}
    >
      <svg
        viewBox={SIGNATURE_VIEWBOX}
        width={SIGNATURE_WIDTH}
        height={SIGNATURE_HEIGHT}
        className="block h-full w-full overflow-visible opacity-0 group-data-[signature-state=drawing]/signature:opacity-100 group-data-[signature-state=complete]/signature:opacity-100 motion-reduce:opacity-100"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={`${id}-pen-barrel`}
            x1="-6"
            x2="6"
            y1="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#17141b" />
            <stop offset="0.42" stopColor="#55505a" />
            <stop offset="0.7" stopColor="#28232d" />
            <stop offset="1" stopColor="#100d13" />
          </linearGradient>
          {SIGNATURE_STROKES.map((stroke) => (
            <mask
              key={stroke.id}
              id={`${id}-${stroke.id}`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={SIGNATURE_WIDTH}
              height={SIGNATURE_HEIGHT}
              style={{ maskType: "luminance" }}
            >
              <path
                d={stroke.path}
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                strokeDasharray="1 1"
                strokeDashoffset="1"
                opacity="0"
                data-signature-pen
                className="motion-reduce:[stroke-dashoffset:0] motion-reduce:opacity-100"
              />
            </mask>
          ))}
        </defs>
        {SIGNATURE_STROKES.map((stroke) => (
          <path
            key={stroke.id}
            d={stroke.ink}
            fill="currentColor"
            mask={`url(#${id}-${stroke.id})`}
          />
        ))}
        <g
          ref={penRef}
          data-writing-pen
          opacity="0"
          aria-hidden="true"
          className="pointer-events-none motion-reduce:hidden"
        >
          {/* The nib tip is (0, 0), exactly where new ink is revealed. */}
          <path
            d="M0 0 -4.5 -10 -3 -18 H3 L4.5 -10 Z"
            fill="#f1cf98"
            stroke="#fff0d2"
            strokeWidth="0.75"
          />
          <path d="M0 -1 V-11" stroke="#805b3b" strokeWidth="0.9" />
          <circle cy="-12" r="1.2" fill="#805b3b" />
          <path
            d="M-3.5 -17 -5 -25 H5 L3.5 -17 Z"
            fill="#211a22"
            stroke="#d5b280"
            strokeWidth="0.7"
          />
          <rect
            x="-5.5"
            y="-60"
            width="11"
            height="36"
            rx="4"
            fill={`url(#${id}-pen-barrel)`}
            stroke="#e0c59f"
            strokeWidth="0.8"
          />
          <path d="M-5 -28 H5 M-5 -55 H5" stroke="#f1cf98" strokeWidth="1.7" />
          <path
            d="M2.5 -56 V-40 Q2.5 -38 4 -38"
            fill="none"
            stroke="#f5deb7"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <noscript>
        <span className="absolute inset-0 flex items-center font-[Georgia,serif] text-3xl italic">
          Tanmay Tiwari
        </span>
      </noscript>
    </div>
  );
}
