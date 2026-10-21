"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";

type Props = {
  founderName?: string;
};

const communityPhotos = [
  {
    src: "https://res.cloudinary.com/dunacoujw/image/upload/f_auto,q_auto,w_1200/v1772402430/12_ubduyk.webp",
    alt: "HackShastra builders gathered together at a community event",
    label: "BUILT TOGETHER",
  },
  {
    src: "https://res.cloudinary.com/dunacoujw/image/upload/f_auto,q_auto,w_1200/v1772402433/reach_xhdfbp.webp",
    alt: "HackShastra builders celebrating a milestone together on stage",
    label: "MILESTONES, TOGETHER",
  },
];

export default function HomeHackShastraStory({
  founderName = "Tanmay Tiwari",
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const revealRef = useRef<HTMLSpanElement>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [galleryHovered, setGalleryHovered] = useState(false);
  const [galleryFocused, setGalleryFocused] = useState(false);
  const galleryPaused = galleryHovered || galleryFocused;
  const displayFounderName = founderName.trim() || "Tanmay Tiwari";

  const getCompletedRevealScale = () => {
    const section = sectionRef.current;
    const width = section?.clientWidth ?? window.innerWidth;
    const height = section?.clientHeight ?? window.innerHeight;
    const diameter =
      revealRef.current?.offsetWidth ||
      Math.min(window.innerWidth, window.innerHeight);
    const farthestCorner = Math.hypot(width / 2, height / 2);

    return diameter > 0 ? (farthestCorner * 2 * 1.08) / diameter : 4.25;
  };

  useEffect(() => {
    if (
      galleryPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setActivePhoto((current) => (current + 1) % communityPhotos.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, [galleryPaused]);

  useEffect(() => {
    const section = sectionRef.current;
    const reveal = revealRef.current;
    const title = titleRef.current;
    if (!section || !reveal || !title) return;

    const revealItems = Array.from(
      section.querySelectorAll<HTMLElement>("[data-hs-reveal]"),
    );
    const counterItems = Array.from(
      section.querySelectorAll<HTMLElement>("[data-hs-count]"),
    );
    const observers: Array<{ revert: () => unknown }> = [];
    const animations: Array<{ revert: () => unknown }> = [];
    let disposed = false;
    let animeReverted = false;
    let context: { revert: () => void } | undefined;
    let layoutObserver: ResizeObserver | undefined;
    let resizeHandler: (() => void) | undefined;
    const hashNavigationFrame =
      window.location.hash === `#${section.id}`
        ? window.requestAnimationFrame(() => {
            if (!disposed)
              section.scrollIntoView({ behavior: "auto", block: "start" });
          })
        : 0;

    const revertAnime = () => {
      if (animeReverted) return;
      animeReverted = true;
      animations.forEach((animation) => animation.revert());
      observers.forEach((observer) => observer.revert());
    };

    const positionRevealAtSectionCenter = () => {
      const diameter = reveal.offsetWidth;
      reveal.style.top = `${(section.clientHeight - diameter) / 2}px`;
      reveal.style.left = `${(section.clientWidth - diameter) / 2}px`;
      reveal.style.setProperty(
        "--hs-completed-scale",
        String(getCompletedRevealScale()),
      );
    };
    positionRevealAtSectionCenter();

    void Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("animejs"),
    ])
      .then(([{ gsap }, { ScrollTrigger }, { animate, onScroll }]) => {
        if (disposed) return;

        gsap.registerPlugin(ScrollTrigger);
        const refreshLayout = () => {
          if (disposed) return;
          positionRevealAtSectionCenter();
          ScrollTrigger.refresh();
        };

        layoutObserver = new ResizeObserver(refreshLayout);
        layoutObserver.observe(document.body);
        layoutObserver.observe(section);
        const experienceSection = document.querySelector("#journey");
        if (experienceSection) layoutObserver.observe(experienceSection);
        resizeHandler = refreshLayout;
        window.addEventListener("resize", resizeHandler);
        positionRevealAtSectionCenter();

        context = gsap.context(() => {
          const motion = gsap.matchMedia();

          motion.add("(prefers-reduced-motion: no-preference)", () => {
            gsap.fromTo(
              reveal,
              { scale: 0.015 },
              {
                scale: getCompletedRevealScale,
                ease: "none",
                scrollTrigger: {
                  trigger: title,
                  start: "top 50%",
                  end: "bottom 32%",
                  scrub: 0.45,
                  invalidateOnRefresh: true,
                  onRefresh: positionRevealAtSectionCenter,
                },
              },
            );
          });

          motion.add("(prefers-reduced-motion: reduce)", () => {
            gsap.set(reveal, { scale: getCompletedRevealScale() });
          });

          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            revealItems.forEach((item) => {
              const bounds = item.getBoundingClientRect();
              const alreadyVisible =
                bounds.top < window.innerHeight && bounds.bottom > 0;
              if (alreadyVisible) return;

              const observer = onScroll({
                target: item,
                axis: "y",
                enter: { target: "start", container: "92%" },
                leave: { target: "start", container: "72%" },
                sync: true,
                repeat: false,
              });
              observers.push(observer);
              animations.push(
                animate(item, {
                  translateY: [28, 0],
                  opacity: [0, 1],
                  ease: "out(3)",
                  duration: 560,
                  autoplay: observer,
                }),
              );
            });

            counterItems.forEach((item) => {
              const target = Number(item.dataset.hsCount);
              if (!Number.isFinite(target)) return;

              const suffix = item.dataset.hsSuffix ?? "+";
              const counter = { value: 0 };
              const animation = animate(counter, {
                value: target,
                modifier: Math.round,
                duration: 1350,
                ease: "out(3)",
                autoplay: false,
                onUpdate: () => {
                  item.textContent = `${counter.value.toLocaleString("en-US")}${suffix}`;
                },
              });
              animations.push(animation);

              const bounds = item.getBoundingClientRect();
              const alreadyVisible =
                bounds.top < window.innerHeight && bounds.bottom > 0;
              if (alreadyVisible) {
                animation.play();
                return;
              }

              item.textContent = `0${suffix}`;
              observers.push(
                onScroll({
                  target: item,
                  axis: "y",
                  enter: { target: "start", container: "88%" },
                  leave: { target: "start", container: "62%" },
                  repeat: false,
                  onEnter: () => animation.play(),
                }),
              );
            });
          }

          return () => {
            motion.revert();
            revertAnime();
          };
        }, section);

        ScrollTrigger.refresh();
        void document.fonts?.ready.then(() => {
          if (!disposed) ScrollTrigger.refresh();
        });
      })
      .catch(() => {
        context?.revert();
        layoutObserver?.disconnect();
        if (resizeHandler) {
          window.removeEventListener("resize", resizeHandler);
        }
        revertAnime();
        if (disposed) return;
        reveal.style.transform = `scale(${getCompletedRevealScale()})`;
        revealItems.forEach((item) => {
          item.style.opacity = "1";
          item.style.transform = "none";
        });
        counterItems.forEach((item) => {
          const target = Number(item.dataset.hsCount);
          if (Number.isFinite(target)) {
            item.textContent = `${target.toLocaleString("en-US")}${item.dataset.hsSuffix ?? "+"}`;
          }
        });
      });

    return () => {
      disposed = true;
      layoutObserver?.disconnect();
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
      }
      if (hashNavigationFrame) {
        window.cancelAnimationFrame(hashNavigationFrame);
      }
      revertAnime();
      context?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hackshastra-story"
      className="hackshastra-story"
      aria-labelledby="hackshastra-story-title"
    >
      <div className="hackshastra-story-backdrop" aria-hidden="true">
        <span ref={revealRef} className="hackshastra-story-reveal" />
      </div>

      <div className="hackshastra-story-inner">
        <div className="hackshastra-story-topline" data-hs-reveal>
          <span className="hackshastra-story-brand">
            <Image
              className="hackshastra-story-logo"
              src="https://res.cloudinary.com/dunacoujw/image/upload/v1792601186/logo1_y3d5u2.svg"
              alt=""
              width={60}
              height={60}
              unoptimized
              onError={(event) => {
                event.currentTarget.src =
                  "https://www.hackshastra.in/logo1.svg";
              }}
            />
            <span className="hackshastra-story-brand-copy">
              <strong>HACKSHASTRA</strong>
              <span>STUDENT-BUILDER COMMUNITY</span>
            </span>
          </span>
          <span>
            EST. 2024 · CO-FOUNDED BY {displayFounderName.toUpperCase()}
          </span>
        </div>

        <div className="hackshastra-story-intro">
          <div className="hackshastra-story-thesis">
            <h2 ref={titleRef} id="hackshastra-story-title">
              <span data-hs-reveal>Why aren’t we</span>
              <span
                className="hackshastra-story-headline-accent"
                data-hs-reveal
              >
                building more?
              </span>
            </h2>
            <p data-hs-reveal>
              HackShastra brings curious students together to turn first ideas
              into real projects—with peers, mentors, and the confidence to keep
              building.
            </p>
            <div
              className="hackshastra-story-gallery"
              data-hs-reveal
              role="region"
              aria-roledescription="carousel"
              aria-label="HackShastra community photos"
              data-paused={galleryPaused}
              onPointerEnter={() => setGalleryHovered(true)}
              onPointerLeave={() => setGalleryHovered(false)}
              onFocusCapture={() => setGalleryFocused(true)}
              onBlurCapture={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  setGalleryFocused(false);
                }
              }}
            >
              <div className="hackshastra-story-gallery-frame">
                <span
                  key={activePhoto}
                  className="hackshastra-story-gallery-progress"
                  aria-hidden="true"
                />
                {communityPhotos.map((photo, index) => (
                  <figure
                    key={photo.src}
                    className="hackshastra-story-gallery-slide"
                    data-active={activePhoto === index}
                    aria-hidden={activePhoto !== index}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      width={1200}
                      height={675}
                      unoptimized
                    />
                  </figure>
                ))}
              </div>
              <div className="hackshastra-story-gallery-controls">
                <span aria-live="off">
                  0{activePhoto + 1} <span>/ 0{communityPhotos.length}</span>
                  <i aria-hidden="true"> · </i>
                  {communityPhotos[activePhoto].label}
                </span>
                <div className="hackshastra-story-gallery-buttons">
                  <button
                    type="button"
                    aria-label="Show previous community photo"
                    onClick={() =>
                      setActivePhoto(
                        (current) =>
                          (current - 1 + communityPhotos.length) %
                          communityPhotos.length,
                      )
                    }
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                  </button>
                  {communityPhotos.map((photo, index) => (
                    <button
                      key={photo.src}
                      type="button"
                      className="hackshastra-story-gallery-dot"
                      aria-label={`Show photo ${index + 1}: ${photo.label}`}
                      aria-pressed={activePhoto === index}
                      onClick={() => setActivePhoto(index)}
                    />
                  ))}
                  <button
                    type="button"
                    aria-label="Show next community photo"
                    onClick={() =>
                      setActivePhoto(
                        (current) => (current + 1) % communityPhotos.length,
                      )
                    }
                  >
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="hackshastra-story-premise" data-hs-reveal>
            <span className="hackshastra-story-overline">
              THE QUESTION THAT STARTED IT
            </span>
            <p>
              It began in a college dorm with one thought: students learn faster
              when they build together.
            </p>
          </div>
        </div>

        <div className="hackshastra-story-details">
          <ol
            className="hackshastra-story-practices"
            aria-label="How the community builds"
          >
            <li data-hs-reveal>
              <span>01 • MAKE</span>
              <strong>Learn by doing</strong>
            </li>
            <li data-hs-reveal>
              <span>02 • GATHER</span>
              <strong>Hackathons &amp; tech meetups</strong>
            </li>
            <li data-hs-reveal>
              <span>03 • GROW</span>
              <strong>Campus chapters</strong>
            </li>
          </ol>

          <div className="hackshastra-story-impact">
            <div className="hackshastra-story-impact-heading" data-hs-reveal>
              <span className="hackshastra-story-overline">
                COMMUNITY IMPACT
              </span>
              <span className="hackshastra-story-impact-source">
                ARCHIVE + TEAM-REPORTED FIGURES
              </span>
            </div>
            <div className="hackshastra-story-impact-feature" data-hs-reveal>
              <strong
                data-hs-count="7"
                data-hs-suffix=""
                aria-label="7 events listed in HackShastra’s official event archive"
              >
                7
              </strong>
              <span>events listed in the official archive</span>
            </div>
            <div className="hackshastra-story-impact-grid">
              <div className="hackshastra-story-impact-stat" data-hs-reveal>
                <strong
                  data-hs-count="800"
                  data-hs-suffix="K+"
                  aria-label="Over 800 thousand social impressions and reach"
                >
                  800K+
                </strong>
                <span>social reach &amp; impressions</span>
              </div>
              <div className="hackshastra-story-impact-stat" data-hs-reveal>
                <strong
                  data-hs-count="80"
                  data-hs-suffix="+"
                  aria-label="Over 80 partner communities"
                >
                  80+
                </strong>
                <span>partner communities</span>
              </div>
              <div className="hackshastra-story-impact-stat" data-hs-reveal>
                <strong
                  data-hs-count="50"
                  data-hs-suffix="+"
                  aria-label="Over 50 industry collaborations"
                >
                  50+
                </strong>
                <span>industry collaborations</span>
              </div>
              <div className="hackshastra-story-impact-stat" data-hs-reveal>
                <strong
                  data-hs-count="10"
                  data-hs-suffix="K+"
                  aria-label="Over 10 thousand active builders"
                >
                  10K+
                </strong>
                <span>active builders</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hackshastra-story-footer">
          <span data-hs-reveal>
            BUILDERS, PARTNERS &amp; INDUSTRY MOVING FORWARD TOGETHER
          </span>
          <div className="hackshastra-story-actions" data-hs-reveal>
            <a
              className="hackshastra-story-link hackshastra-story-link-secondary"
              href="https://www.hackshastra.in/events"
              target="_blank"
              rel="noreferrer"
            >
              Explore events
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a
              className="hackshastra-story-link"
              href="https://www.hackshastra.in/"
              target="_blank"
              rel="noreferrer"
            >
              Visit HackShastra
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
