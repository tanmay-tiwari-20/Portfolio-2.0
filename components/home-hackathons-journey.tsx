"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import { hackathonMoments } from "@/data/hackathon-moments";
import type { Hackathon } from "@/lib/validators/schemas";
import type {
  PaperCrumpleProps,
  PaperCrumpleThrow,
} from "@/components/PaperCrumple";

type StoryEvent = Pick<Hackathon, "id" | "name" | "role" | "link">;
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function HomeHackathonsJourney({
  events,
  email,
}: {
  events: StoryEvent[];
  email: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const photoStageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const throwTimerRef = useRef<number | null>(null);
  const preloadedImagesRef = useRef(new Map<number, HTMLImageElement>());
  const [PaperCrumple, setPaperCrumple] =
    useState<ComponentType<PaperCrumpleProps> | null>(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isThrowing, setIsThrowing] = useState(false);
  const [throwVector, setThrowVector] = useState({ x: 1, y: 0 });
  const [throwOffset, setThrowOffset] = useState({ x: 0, y: 0 });
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const copyTooltipMeasureRef = useRef<HTMLSpanElement>(null);
  const copyStatusTimerRef = useRef<number | null>(null);
  const [copyTooltipWidth, setCopyTooltipWidth] = useState<number | null>(null);
  const [copyTooltipHeight, setCopyTooltipHeight] = useState<number | null>(
    null,
  );
  const previousSceneIndexRef = useRef(activeSceneIndex);
  const activeMoment = hackathonMoments[activeSceneIndex];

  useIsomorphicLayoutEffect(() => {
    const message = copyTooltipMeasureRef.current;
    if (!message) return;
    const { width, height } = message.getBoundingClientRect();
    setCopyTooltipWidth(Math.ceil(width + 24));
    setCopyTooltipHeight(Math.ceil(height));
  }, [copyStatus, email]);

  useEffect(
    () => () => {
      if (copyStatusTimerRef.current !== null) {
        window.clearTimeout(copyStatusTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!PaperCrumple) return;

    const nextIndex = (activeSceneIndex + 1) % hackathonMoments.length;
    for (const [index, image] of preloadedImagesRef.current) {
      if (index === activeSceneIndex || index === nextIndex) continue;
      preloadedImagesRef.current.delete(index);
      image.removeAttribute("src");
    }
    if (preloadedImagesRef.current.has(nextIndex)) return;

    const nextImage = new window.Image();
    nextImage.crossOrigin = "anonymous";
    nextImage.decoding = "async";
    nextImage.fetchPriority = "low";
    nextImage.src = getOptimizedUrl(hackathonMoments[nextIndex].src, 1920);
    preloadedImagesRef.current.set(nextIndex, nextImage);
    void nextImage.decode?.().catch(() => undefined);
  }, [PaperCrumple, activeSceneIndex]);

  useEffect(() => {
    const intro = sectionRef.current?.querySelector<HTMLElement>(
      "[data-hackathons-intro]",
    );
    if (
      !intro ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const targets = Array.from(
      intro.querySelectorAll<HTMLElement>("[data-hackathons-intro-item]"),
    );
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        targets.forEach((target, index) => {
          animations.push(
            target.animate(
              [
                { opacity: 0, transform: "translate3d(0, 26px, 0)" },
                { opacity: 1, transform: "translate3d(0, 0, 0)" },
              ],
              {
                duration: 760,
                delay: index * 90,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
              },
            ),
          );
        });
      },
      // The header can be taller than the viewport, so use an enter threshold
      // instead of waiting for a fraction of the whole header to be visible.
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(intro);

    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (previousSceneIndexRef.current === activeSceneIndex) return;
    previousSceneIndexRef.current = activeSceneIndex;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const entrance = [
      photoRef.current?.animate(
        [
          {
            opacity: 0,
            transform: "translate3d(0, 16px, 0) scale(0.985)",
          },
          { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
        ],
        {
          duration: 720,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      ),
      captionRef.current?.animate(
        [
          { opacity: 0, transform: "translate3d(0, 16px, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        {
          duration: 680,
          delay: 70,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      ),
    ].filter((animation): animation is Animation => Boolean(animation));

    return () => entrance.forEach((animation) => animation.cancel());
  }, [activeSceneIndex]);

  function handlePhotoPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      event.pointerType === "touch" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const stage = photoStageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty(
      "--photo-spot-x",
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
    stage.style.setProperty(
      "--photo-spot-y",
      `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
    );
  }

  function resetPhotoPointer() {
    const stage = photoStageRef.current;
    if (!stage) return;
    stage.style.setProperty("--photo-spot-x", "50%");
    stage.style.setProperty("--photo-spot-y", "50%");
  }

  async function copyInviteEmail() {
    if (copyStatusTimerRef.current !== null) {
      window.clearTimeout(copyStatusTimerRef.current);
    }

    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch {
          // Fall back to a temporary field if clipboard permissions are denied.
        }
      }
      if (!copied) {
        const field = document.createElement("textarea");
        field.value = email;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        copied = document.execCommand("copy");
        field.remove();
      }
      if (!copied) throw new Error("Clipboard copy was not available.");
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
    copyStatusTimerRef.current = window.setTimeout(() => {
      setCopyStatus("idle");
      copyStatusTimerRef.current = null;
    }, 2200);
  }

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: no-preference)",
    );
    let observer: IntersectionObserver | undefined;
    let disposed = false;
    let loading = false;

    const observeSection = () => {
      observer?.disconnect();
      observer = undefined;

      if (!motionPreference.matches) {
        loading = false;
        setPaperCrumple(null);
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          if (
            loading ||
            disposed ||
            !motionPreference.matches ||
            !entries.some((entry) => entry.isIntersecting)
          ) {
            return;
          }

          loading = true;
          observer?.disconnect();
          void import("@/components/PaperCrumple")
            .then(({ default: Component }) => {
              if (!disposed && motionPreference.matches) {
                setPaperCrumple(() => Component);
              }
            })
            .catch(() => {
              loading = false;
            });
        },
        { rootMargin: "240px 0px" },
      );
      observer.observe(section);
    };

    observeSection();
    motionPreference.addEventListener("change", observeSection);

    return () => {
      disposed = true;
      observer?.disconnect();
      motionPreference.removeEventListener("change", observeSection);
      if (throwTimerRef.current !== null) {
        window.clearTimeout(throwTimerRef.current);
      }
    };
  }, []);

  function goToScene(direction: number) {
    if (throwTimerRef.current !== null) {
      window.clearTimeout(throwTimerRef.current);
      throwTimerRef.current = null;
    }
    setIsThrowing(false);
    setActiveSceneIndex(
      (current) =>
        (current + direction + hackathonMoments.length) %
        hackathonMoments.length,
    );
  }

  function handlePaperThrow(velocity: PaperCrumpleThrow) {
    if (isThrowing) return;

    const magnitude = Math.max(
      1,
      Math.hypot(velocity.velocityX, velocity.velocityY),
    );
    const direction = {
      x: velocity.velocityX / magnitude,
      y: velocity.velocityY / magnitude,
    };
    setThrowVector(direction);
    const stageBounds = photoStageRef.current?.getBoundingClientRect();
    const stageWidth = stageBounds?.width ?? 800;
    const stageHeight = stageBounds?.height ?? 560;
    const distanceToHorizontalExit =
      Math.abs(direction.x) > 0.001
        ? stageWidth / Math.abs(direction.x)
        : Infinity;
    const distanceToVerticalExit =
      Math.abs(direction.y) > 0.001
        ? stageHeight / Math.abs(direction.y)
        : Infinity;
    const exitDistance =
      Math.min(distanceToHorizontalExit, distanceToVerticalExit) +
      Math.max(40, Math.min(stageWidth, stageHeight) * 0.12);
    setThrowOffset({
      x: direction.x * exitDistance,
      y: direction.y * exitDistance,
    });
    setIsThrowing(true);
    throwTimerRef.current = window.setTimeout(() => {
      setActiveSceneIndex((current) => (current + 1) % hackathonMoments.length);
      setIsThrowing(false);
      throwTimerRef.current = null;
    }, 520);
  }

  const src = getOptimizedUrl(activeMoment.src, 1920);
  const paperWidth = 1920;
  const photoHeight = (paperWidth * activeMoment.height) / activeMoment.width;
  const paperHeight = Math.max(1, Math.round(photoHeight));
  const throwRotation = (throwVector.x - throwVector.y * 0.45) * 18;
  const throwTransform = isThrowing
    ? "translate3d(" +
      throwOffset.x +
      "px, " +
      throwOffset.y +
      "px, 0) rotate(" +
      throwRotation +
      "deg) scale(0.76)"
    : "translate3d(0, 0, 0) rotate(0deg)";
  return (
    <section
      ref={sectionRef}
      id="hackathon-journey"
      aria-labelledby="hackathon-journey-title"
      className="relative isolate overflow-clip bg-[#0d0a0b] text-[#fffaf7]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-130 w-[min(90vw,1100px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(239,70,62,0.11),transparent_68%)] blur-3xl"
      />
      <header
        data-hackathons-intro
        className="relative mx-auto grid max-w-[1680px] gap-12 px-6 pb-14 pt-20 sm:px-10 sm:pb-18 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)] lg:items-center lg:gap-16 lg:px-16 lg:pb-20 lg:pt-28 2xl:px-24"
      >
        <div>
          <p
            data-hackathons-intro-item
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#ef756d] sm:text-xs"
          >
            <span className="h-px w-8 bg-[#ef463e]" />
            Why I return to hackathons
          </p>
          <h2
            id="hackathon-journey-title"
            data-hackathons-intro-item
            className="mt-6 max-w-4xl text-[clamp(3.2rem,8vw,7.5rem)] font-black uppercase leading-[0.8] tracking-[-0.075em]"
          >
            Different minds.
            <br />
            <span className="text-[#ef463e]">New directions.</span>
          </h2>
          <p
            data-hackathons-intro-item
            className="mt-7 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8"
          >
            I keep coming back to hackathons for the people in the room. I meet
            developers with different instincts, discover ideas I would not have
            reached alone, and get to see those ideas become real projects.
          </p>
        </div>

        <div
          data-hackathons-intro-item
          className="border-l border-white/15 pl-5 sm:pl-7"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:text-xs">
            Rooms I’ve been part of
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-x-7 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {events.map((event) => {
              const content = (
                <>
                  <span className="min-w-0 text-sm font-semibold leading-5 text-white/85 transition-colors group-hover:text-white sm:text-[15px]">
                    {event.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/40">
                    {event.role}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-[#ef756d] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </>
              );

              return (
                <li
                  key={event.id}
                  data-hackathons-event
                  className="border-b border-white/8"
                >
                  {event.link ? (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex min-h-11 items-center justify-between gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ef463e]"
                      aria-label={`${event.name}, ${event.role}; opens event post in a new tab`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="flex min-h-11 items-center justify-between gap-3 py-3">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs leading-5 text-white/40">
            The photographs below are from that wider journey; I haven’t tied
            any one image to a specific event.
          </p>

          <div className="relative z-10 mt-6 overflow-visible rounded-2xl border border-[#ef756d]/20  p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)] sm:p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
            >
              <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-[#ef463e]/10 blur-3xl" />
            </div>
            <p className="relative text-[9px] font-bold uppercase tracking-[0.22em] text-[#ef756d] sm:text-[10px]">
              Hackathon invitations
            </p>
            <h3 className="relative mt-2 text-xl font-semibold tracking-[-0.035em] text-white sm:text-2xl">
              Need a judge or mentor?
            </h3>
            <p className="relative mt-2 max-w-md text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
              I’d love to join exciting hackathons, meet new builders and
              developers, and hear the ideas they’re bringing to life.
            </p>
            <div className="relative mt-4 flex flex-wrap gap-2.5">
              <div className="group/email relative">
                <button
                  type="button"
                  onClick={copyInviteEmail}
                  aria-describedby="hackathon-invite-email-tooltip"
                  aria-label={
                    copyStatus === "copied"
                      ? "Email copied"
                      : copyStatus === "error"
                        ? "Copy failed. Try again"
                        : "Copy email address"
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ef756d]/35 bg-[#ef463e]/15 text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#ef756d]/65 hover:bg-[#ef463e]/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ef756d]"
                >
                  <Mail aria-hidden="true" className="h-4 w-4" />
                </button>
                <span
                  id="hackathon-invite-email-tooltip"
                  role="tooltip"
                  style={
                    copyTooltipWidth === null
                      ? undefined
                      : { width: `${copyTooltipWidth}px` }
                  }
                  className="pointer-events-none absolute bottom-[calc(100%+0.7rem)] left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 translate-y-1 rounded-lg border border-white/15 bg-[#171012] px-3 py-2 text-center text-[11px] font-medium text-white opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-[width,opacity,transform] duration-300 ease-out group-hover/email:translate-y-0 group-hover/email:opacity-100 sm:text-xs"
                >
                  <span
                    className="relative block transition-[height] duration-300 ease-out"
                    style={
                      copyTooltipHeight === null
                        ? undefined
                        : { height: `${copyTooltipHeight}px` }
                    }
                  >
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-200 ease-out ${
                        copyStatus === "idle"
                          ? "translate-y-0 opacity-100"
                          : "-translate-y-1 opacity-0"
                      }`}
                    >
                      {email}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`absolute inset-0 flex items-center justify-center whitespace-nowrap transition-[opacity,transform] duration-200 ease-out ${
                        copyStatus === "copied"
                          ? "translate-y-0 scale-100 opacity-100"
                          : "translate-y-1 scale-95 opacity-0"
                      }`}
                    >
                      Copied!
                    </span>
                    <span
                      aria-hidden="true"
                      className={`absolute inset-0 flex items-center justify-center whitespace-nowrap transition-[opacity,transform] duration-200 ease-out ${
                        copyStatus === "error"
                          ? "translate-y-0 scale-100 opacity-100"
                          : "translate-y-1 scale-95 opacity-0"
                      }`}
                    >
                      Could not copy
                    </span>
                  </span>
                  <span
                    ref={copyTooltipMeasureRef}
                    aria-hidden="true"
                    className="pointer-events-none invisible absolute left-0 top-0 block w-max max-w-[calc(100vw-3.5rem)] whitespace-normal"
                  >
                    {copyStatus === "idle"
                      ? email
                      : copyStatus === "copied"
                        ? "Copied!"
                        : "Could not copy"}
                  </span>
                </span>
              </div>
              <Link
                href="/contact"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition-[background-color,border-color,transform,color] duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/6 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ef756d]"
              >
                Contact page
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
            <span className="sr-only" aria-live="polite">
              {copyStatus === "copied"
                ? "Email address copied to clipboard."
                : copyStatus === "error"
                  ? "Could not copy the email address."
                  : ""}
            </span>
          </div>
        </div>
      </header>
      <div className="relative mx-auto max-w-[1680px] px-6 pb-24 pt-10 sm:px-10 lg:px-16 2xl:px-24">
        <div className="grid items-center gap-10 lg:min-h-[min(72svh,760px)] lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.78fr)] lg:gap-16">
          <div className="min-w-0">
            <div
              ref={photoStageRef}
              onPointerMove={handlePhotoPointerMove}
              onPointerLeave={resetPhotoPointer}
              className="group/photo hackathon-photo-stage relative isolate mx-auto flex w-full items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-[#0b090a] shadow-[0_24px_70px_rgba(0,0,0,0.52)] transition-[border-color,box-shadow] duration-500 hover:border-[#ef756d]/40 hover:shadow-[0_30px_90px_rgba(239,70,62,0.16)] sm:rounded-[26px]"
              style={{
                aspectRatio: "3 / 2",
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 opacity-90 transition-opacity duration-500 group-hover/photo:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle at var(--photo-spot-x, 50%) var(--photo-spot-y, 50%), rgba(239,70,62,0.25), transparent 44%), radial-gradient(ellipse at 50% 120%, rgba(239,70,62,0.16), transparent 58%), linear-gradient(135deg, #1a1113 0%, #0b090a 68%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 opacity-40 transition-opacity duration-500 group-hover/photo:opacity-65"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,245,240,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,245,240,0.06) 1px, transparent 1px)",
                  backgroundSize: "42px 42px",
                  maskImage: "linear-gradient(135deg, black, transparent 68%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 z-0 h-56 w-56 rounded-full border border-white/6 transition-[transform,border-color] duration-700 ease-out group-hover/photo:scale-110 group-hover/photo:border-[#ef756d]/25"
              />
              <div
                ref={photoRef}
                className="relative z-10 flex h-full w-full items-center justify-center"
              >
                {PaperCrumple ? (
                  <PaperCrumple
                    src={src}
                    alt={activeMoment.alt}
                    width={paperWidth}
                    height={paperHeight}
                    resetKey={activeSceneIndex}
                    sceneHeight={560}
                    imageFit="contain"
                    releaseBehavior="restore"
                    crumpleDuration={0.7}
                    releaseDuration={0.52}
                    detail={48}
                    foldCount={5}
                    dragRadius={88}
                    onThrow={handlePaperThrow}
                    className={`w-full max-w-full ${
                      isThrowing
                        ? "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        : "transition-none"
                    }`}
                    style={{
                      height: "100%",
                      transform: throwTransform,
                      opacity: isThrowing ? 0 : 1,
                    }}
                  />
                ) : (
                  <Image
                    src={src}
                    alt={activeMoment.alt}
                    width={paperWidth}
                    height={paperHeight}
                    sizes="(max-width: 1023px) 100vw, 68vw"
                    unoptimized
                    className="h-auto max-h-full w-auto max-w-full object-contain"
                  />
                )}
              </div>
            </div>
            <p className="mt-4 text-center text-[9px] font-semibold uppercase tracking-[0.17em] text-white/80 sm:text-[10px]">
              Hold to crumple · Release to smooth · Flick to throw
            </p>
          </div>

          <div
            ref={captionRef}
            className="min-w-0 border-l border-white/10 pl-6 sm:pl-9 lg:pl-12"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#ef756d] sm:text-xs">
              Field note {String(activeSceneIndex + 1).padStart(2, "0")}
              <span className="text-white/35">
                {" "}
                / {String(hackathonMoments.length).padStart(2, "0")}
              </span>
            </p>

            <div aria-live="polite" aria-atomic="true" className="mt-7">
              <h3 className="max-w-lg text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-5xl 2xl:text-6xl">
                {activeMoment.title}
              </h3>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
                {activeMoment.caption}
              </p>
            </div>

            <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              A quick throw moves to the next moment
            </p>

            <div className="mt-5 flex items-center gap-4 border-t border-white/10 pt-5">
              <div
                role="progressbar"
                aria-label="Hackathon photo story progress"
                aria-valuemin={1}
                aria-valuemax={hackathonMoments.length}
                aria-valuenow={activeSceneIndex + 1}
                className="relative h-px flex-1 bg-white/15"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-[#ef463e] transition-[width] duration-500"
                  style={{
                    width:
                      ((activeSceneIndex + 1) / hackathonMoments.length) * 100 +
                      "%",
                  }}
                />
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                {String(activeSceneIndex + 1).padStart(2, "0")} /{" "}
                {String(hackathonMoments.length).padStart(2, "0")}
              </span>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={() => goToScene(-1)}
                disabled={isThrowing}
                aria-label="Show previous hackathon photo"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/75 transition hover:border-[#ef756d] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ef463e] disabled:opacity-40"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goToScene(1)}
                disabled={isThrowing}
                aria-label="Show next hackathon photo"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-3 rounded-full bg-[#ef463e] px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#ff5b50] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ef756d] disabled:opacity-40"
              >
                Next moment
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>{" "}
    </section>
  );
}
