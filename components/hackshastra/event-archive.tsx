"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { cloudinaryLoader } from "@/lib/cloudinary/urls";
import BrandLink from "./brand-link";

export type HackShastraEvent = {
  id: string;
  title: string;
  category?: string;
  date: string;
  location: string;
  role: string;
  description: string;
  image: string;
  imageAlt?: string;
  href: string;
};

const imageSizes =
  "(min-width: 1536px) 520px, (min-width: 1024px) 40vw, (min-width: 640px) 45vw, 92vw";

const desktopQuery = "(min-width: 1024px)";
const isDesktop = () => window.matchMedia(desktopQuery).matches;
const serverDesktop = () => false;
function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

type RevealFrame = {
  opacity: number;
  clipPath: string;
  y: number;
  scale: number;
  visibility: "visible";
  zIndex: number;
};

/** Artwork is never cropped; both responsive views share the same image request. */
function EventArtwork({
  event,
  index,
  load,
  priority = false,
}: {
  event: HackShastraEvent;
  index: number;
  load: boolean;
  priority?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const unavailable = !event.image || failedSource === event.image;

  return (
    <div className="hs-event-artwork relative h-full w-full">
      <div
        className="hs-event-placeholder absolute inset-0 flex flex-col justify-between p-6 sm:p-8"
        role={unavailable ? "img" : undefined}
        aria-label={
          unavailable ? `Artwork unavailable for ${event.title}` : undefined
        }
        aria-hidden={unavailable ? undefined : true}
      >
        <span className="hs-mono">
          From the archive / {String(index + 1).padStart(2, "0")}
        </span>
        <span className="max-w-72 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-[-0.05em]">
          {event.title}
        </span>
        <span className="hs-mono">
          {unavailable ? "Artwork unavailable" : "Event artwork"}
        </span>
      </div>
      {load && !unavailable && (
        <Image
          src={event.image}
          alt={event.imageAlt || `${event.title} — event artwork`}
          loader={cloudinaryLoader}
          fill
          sizes={imageSizes}
          preload={priority}
          loading={priority ? undefined : "eager"}
          className="hs-event-art object-contain"
          data-loaded={loadedSource === event.image}
          onLoad={() => setLoadedSource(event.image)}
          onError={() => setFailedSource(event.image)}
        />
      )}
    </div>
  );
}

function EventDetails({ event }: { event: HackShastraEvent }) {
  return (
    <>
      {(event.role || event.location) && (
        <dl className="hs-event-facts grid gap-x-6 gap-y-3 text-xs leading-relaxed sm:grid-cols-2">
          {event.location && (
            <div>
              <dt className="hs-mono mb-1 text-[var(--hs-dim)]">Where</dt>
              <dd>{event.location}</dd>
            </div>
          )}
          {event.role && (
            <div>
              <dt className="hs-mono mb-1 text-[var(--hs-dim)]">
                HackShastra / Involvement
              </dt>
              <dd>{event.role}</dd>
            </div>
          )}
        </dl>
      )}
      {event.description && (
        <p className="mt-4 max-w-xl text-sm leading-[1.8] text-[var(--hs-dim)]">
          {event.description}
        </p>
      )}
      {event.href && (
        <BrandLink href={event.href} className="mt-2 text-xs">
          View event <span className="sr-only">— {event.title}</span>
        </BrandLink>
      )}
    </>
  );
}

export default function EventArchive({
  events,
}: {
  events: HackShastraEvent[];
}) {
  const archiveId = useId();
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    isDesktop,
    serverDesktop,
  );
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const anchor = useRef<{ index: number; top: number } | null>(null);
  const previous = useRef(0);
  const interruptedFrame = useRef(new Map<number, RevealFrame>());
  const gsapRef = useRef<typeof import("gsap").gsap | null>(null);
  const [activeId, setActiveId] = useState(events[0]?.id);
  const [warmImages, setWarmImages] = useState(false);
  const active = Math.max(
    0,
    events.findIndex((event) => event.id === activeId),
  );
  const selected = events[active];

  useEffect(() => {
    let disposed = false;
    void import("gsap")
      .then(({ gsap }) => {
        if (!disposed) gsapRef.current = gsap;
      })
      .catch(() => {
        /* Selection remains functional without the animation chunk. */
      });

    // Warm the small archive only as it approaches the viewport. The first
    // artwork is preloaded by Next; save-data visitors load others on demand.
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const observer =
      typeof IntersectionObserver !== "undefined" && !connection?.saveData
        ? new IntersectionObserver(
            ([entry]) => {
              if (entry?.isIntersecting) {
                setWarmImages(true);
                observer?.disconnect();
              }
            },
            { rootMargin: "400px" },
          )
        : null;
    if (root.current) observer?.observe(root.current);
    return () => {
      disposed = true;
      observer?.disconnect();
      gsapRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    // Closing an earlier mobile panel must not move the tapped row offscreen.
    if (anchor.current) {
      const { index, top } = anchor.current;
      const button = buttons.current[index];
      if (button)
        window.scrollBy({
          top: button.getBoundingClientRect().top - top,
          behavior: "instant",
        });
      anchor.current = null;
    }

    const from = previous.current;
    previous.current = active;
    const gsap = gsapRef.current;
    const scope = root.current;
    const frames = interruptedFrame.current;
    if (!gsap || !scope || from === active) return;

    const media = gsap.matchMedia();
    let firstPass = true;
    media.add(
      {
        desktop: "(min-width: 1024px)",
        compact: "(max-width: 1023px)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        // A media change settles at the selected CSS state rather than replaying
        // the last interaction; only a fresh selection starts a reveal.
        if (!firstPass) return;
        firstPass = false;
        if (context.conditions?.reduced) return;
        const direction = active > from ? 1 : -1;
        if (context.conditions?.desktop) {
          const layers =
            scope.querySelectorAll<HTMLElement>("[data-event-layer]");
          const next = layers[active];
          const copy =
            scope.querySelectorAll<HTMLElement>("[data-event-copy]")[active];
          if (!next) return;
          const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
          if (!frames.size && layers[from]) {
            frames.set(from, {
              opacity: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              scale: 1,
              visibility: "visible",
              zIndex: 1,
            });
          }
          let topLayer = 1;
          frames.forEach((frame, index) => {
            if (!layers[index]) return;
            topLayer = Math.max(topLayer, frame.zIndex);
            gsap.set(layers[index], frame);
            if (index !== active)
              timeline.to(
                layers[index],
                { opacity: 0, duration: 0.42, ease: "power2.inOut" },
                0,
              );
          });
          if (!frames.has(active)) {
            gsap.set(next, {
              visibility: "visible",
              opacity: 0.5,
              clipPath:
                direction > 0 ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)",
              y: direction * 12,
              scale: 1.025,
            });
          }
          gsap.set(next, { zIndex: topLayer + 1 });
          frames.clear();
          timeline.to(
            next,
            {
              opacity: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              scale: 1,
              duration: 0.62,
            },
            0,
          );
          if (copy)
            timeline.fromTo(
              copy,
              { opacity: 0, y: 7 },
              { opacity: 1, y: 0, duration: 0.35 },
              0.12,
            );
        } else {
          const panel = scope.querySelectorAll<HTMLElement>(
            "[data-event-inline]",
          )[active];
          if (panel)
            gsap.fromTo(
              panel,
              { opacity: 0, y: 8 },
              { opacity: 1, y: 0, duration: 0.35 },
            );
        }
      },
      scope,
    );

    return () => {
      // Snapshot the current composite before reverting. A rapid A→B→C switch
      // resumes B's partial mask/opacity instead of briefly exposing all of B.
      frames.clear();
      if (
        isDesktop() &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        scope
          .querySelectorAll<HTMLElement>("[data-event-layer]")
          .forEach((layer, index) => {
            if (index !== active && layer.style.visibility !== "visible")
              return;
            const opacity = Number(gsap.getProperty(layer, "opacity"));
            if (opacity < 0.001) return;
            frames.set(index, {
              opacity,
              clipPath: String(gsap.getProperty(layer, "clipPath")),
              y: Number(gsap.getProperty(layer, "y")),
              scale: Number(gsap.getProperty(layer, "scaleX")),
              visibility: "visible",
              zIndex: Number(gsap.getProperty(layer, "zIndex")) || 1,
            });
          });
      }
      media.revert();
    };
  }, [active, selected?.id]);

  function select(index: number) {
    if (index === active) return;
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const button = buttons.current[index];
      if (button)
        anchor.current = { index, top: button.getBoundingClientRect().top };
    }
    setActiveId(events[index].id);
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowDown"
        ? (index + 1) % events.length
        : event.key === "ArrowUp"
          ? (index - 1 + events.length) % events.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? events.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    buttons.current[next]?.focus();
    select(next);
  }

  if (!selected)
    return (
      <BrandLink href="https://www.hackshastra.in/events">
        Explore the official event archive
      </BrandLink>
    );

  return (
    <div ref={root} className="hs-event-archive" data-event-archive>
      <div className="hs-event-toolbar hs-mono flex flex-wrap items-center justify-between gap-3 border-y border-[var(--hs-line)] py-4 text-[var(--hs-dim)]">
        <span>
          Event index{" "}
          <span className="ml-2 text-[var(--hs-paper)]">
            ({String(events.length).padStart(2, "0")})
          </span>
        </span>
        <span
          className="hs-event-hint flex items-center gap-2"
          aria-hidden="true"
        >
          <span className="hs-event-hover-hint">
            Hover or select to explore
          </span>
          <span className="hs-event-tap-hint">Tap to explore</span>
          <ArrowDownRight size={14} />
        </span>
      </div>

      <div className="hs-event-composition grid items-start gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-[clamp(32px,5vw,80px)]">
        <ol
          className="hs-event-list min-w-0"
          role={desktop ? "tablist" : undefined}
          aria-orientation={desktop ? "vertical" : undefined}
          aria-label="HackShastra events"
          aria-describedby={desktop ? `${archiveId}-help` : undefined}
        >
          {events.map((event, index) => (
            <li
              key={event.id}
              className="hs-event-entry border-b border-[var(--hs-line)]"
              data-active={active === index}
              role={desktop ? "presentation" : undefined}
            >
              <h3 role={desktop ? "presentation" : undefined}>
                <button
                  ref={(element) => {
                    buttons.current[index] = element;
                  }}
                  type="button"
                  role={desktop ? "tab" : undefined}
                  tabIndex={desktop && active !== index ? -1 : 0}
                  aria-selected={desktop ? active === index : undefined}
                  aria-expanded={desktop ? undefined : active === index}
                  aria-controls={`${archiveId}-${desktop ? "detail" : "inline"}-${index}`}
                  id={`${archiveId}-trigger-${index}`}
                  onPointerEnter={(pointer) => {
                    if (
                      pointer.pointerType === "mouse" &&
                      window.matchMedia(
                        "(min-width: 1024px) and (hover: hover) and (pointer: fine)",
                      ).matches
                    ) {
                      // Crossing the list must not hide a focused event link.
                      if (
                        root.current?.querySelector("[data-event-copy] a:focus")
                      )
                        return;
                      select(index);
                    }
                  }}
                  onFocus={(focus) => {
                    if (focus.currentTarget.matches(":focus-visible"))
                      select(index);
                  }}
                  onClick={() => select(index)}
                  onKeyDown={(key) => navigate(key, index)}
                  className="hs-event-trigger relative grid w-full grid-cols-[22px_minmax(0,1fr)_20px] items-start gap-3 text-left sm:grid-cols-[28px_minmax(0,1fr)_24px] sm:gap-4"
                >
                  <span
                    className="hs-event-number hs-mono pt-1"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="hs-event-row-meta hs-mono mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {event.category && <span>{event.category}</span>}
                      {event.category && event.date && (
                        <span
                          className="hs-event-meta-rule"
                          aria-hidden="true"
                        />
                      )}
                      {event.date && <span>{event.date}</span>}
                    </span>
                    <span className="hs-event-name block font-medium tracking-[-0.055em]">
                      {event.title}
                    </span>
                  </span>
                  <ArrowRight
                    className="hs-event-arrow mt-1"
                    size={20}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              <div
                id={`${archiveId}-inline-${index}`}
                role="region"
                aria-labelledby={`${archiveId}-trigger-${index}`}
                hidden={active !== index}
                className="hs-event-inline pb-7 lg:hidden"
                data-event-inline
              >
                <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
                  <div className="hs-event-mobile-mat relative overflow-hidden">
                    <EventArtwork
                      event={event}
                      index={index}
                      load={index === 0 || active === index || warmImages}
                      priority={index === 0}
                    />
                  </div>
                  <div>
                    <EventDetails event={event} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="hs-event-stage hidden min-w-0 lg:sticky lg:flex lg:max-h-[calc(100svh-48px)] lg:flex-col lg:self-start">
          <div
            className="hs-mono mb-4 flex shrink-0 items-center justify-between gap-4 text-[var(--hs-dim)]"
            aria-hidden="true"
          >
            <span className="flex items-center gap-2">
              <span className="hs-event-status-dot" /> In the archive
            </span>
            <span>
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(events.length).padStart(2, "0")}
            </span>
          </div>
          <div className="hs-event-mat relative isolate overflow-hidden">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="hs-event-layer absolute inset-0"
                data-event-layer
                data-active={active === index}
                aria-hidden={active !== index}
              >
                <EventArtwork
                  event={event}
                  index={index}
                  load={index === 0 || active === index || warmImages}
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
          <div className="hs-event-copy-stack mt-5 grid shrink-0">
            {events.map((event, index) => (
              <div
                key={event.id}
                id={`${archiveId}-detail-${index}`}
                role="tabpanel"
                tabIndex={event.href ? undefined : 0}
                aria-labelledby={`${archiveId}-trigger-${index}`}
                aria-hidden={active !== index}
                inert={active !== index}
                className="hs-event-copy min-w-0"
                data-event-copy
                data-active={active === index}
              >
                <EventDetails event={event} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
        <p id={`${archiveId}-help`} className="sr-only">
          Use Up and Down arrow keys to select an event, Home or End to jump,
          and Tab to reach the selected event link.
        </p>
        <p className="hs-mono text-[var(--hs-dim)]">
          People. Places. A reason to build.
        </p>
        <BrandLink href="https://www.hackshastra.in/events" className="text-xs">
          The complete event archive
        </BrandLink>
      </div>
    </div>
  );
}
