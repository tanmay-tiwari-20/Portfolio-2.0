"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, Maximize2, X } from "lucide-react";
import { hackathonMoments } from "@/data/hackathon-moments";
import HackathonsImage from "./hackathons-image";

const photoCount = hackathonMoments.length;

/** A general photo journal: no photograph is attributed to an individual event. */
export default function HackathonsJournal() {
  const id = useId();
  const [photo, setPhoto] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const thumbnails = useRef<Array<HTMLButtonElement | null>>([]);
  const opener = useRef<HTMLElement | null>(null);
  const moment = hackathonMoments[photo];

  useEffect(() => {
    const viewer = dialog.current;
    if (!isOpen || !viewer) return;

    // Restore exactly the inline declarations that were present before opening.
    // Overflow locking leaves the current document scroll position intact.
    const scrollStyles = [document.documentElement, document.body].flatMap(
      (node) =>
        ["overflow-x", "overflow-y"].map((property) => ({
          node,
          property,
          value: node.style.getPropertyValue(property),
          priority: node.style.getPropertyPriority(property),
        })),
    );
    if (!viewer.open) viewer.showModal();
    scrollStyles.forEach(({ node, property }) =>
      node.style.setProperty(property, "hidden"),
    );
    closeButton.current?.focus({ preventScroll: true });

    return () => {
      if (viewer.open) viewer.close();
      scrollStyles.forEach(({ node, property, value, priority }) => {
        if (value) node.style.setProperty(property, value, priority);
        else node.style.removeProperty(property);
      });
      if (opener.current?.isConnected)
        opener.current.focus({ preventScroll: true });
    };
  }, [isOpen]);

  function advance(direction: number) {
    setPhoto((current) => (current + direction + photoCount) % photoCount);
  }

  function handleKeys(event: KeyboardEvent<HTMLElement>) {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const target = event.target;
    // Only gallery buttons opt into photo navigation. Text selection and normal
    // document keyboard scrolling remain untouched elsewhere on the page.
    if (!(target instanceof Element) || !target.closest("button")) return;
    let next: number;
    if (event.key === "ArrowLeft") next = (photo + photoCount - 1) % photoCount;
    else if (event.key === "ArrowRight") next = (photo + 1) % photoCount;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = photoCount - 1;
    else return;
    event.preventDefault();
    event.stopPropagation();
    setPhoto(next);
    if (target.closest(".hk-journal-thumbnails")) {
      thumbnails.current[next]?.focus({ preventScroll: true });
    }
  }

  function openViewer() {
    opener.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setIsOpen(true);
  }

  return (
    <div
      className="hk-journal hk-photo-journal min-w-0"
      role="region"
      aria-label="Hackathon photo journal"
      onKeyDown={handleKeys}
    >
      <figure className="hk-journal-figure">
        <button
          type="button"
          className="hk-journal-photo hk-journal-preview"
          data-hk-image
          aria-label={`Open journal photograph: ${moment.title}`}
          aria-haspopup="dialog"
          onClick={openViewer}
        >
          <span key={moment.src} className="hk-journal-image-transition">
            <HackathonsImage
              src={moment.src}
              alt={moment.alt}
              sizes="(max-width: 767px) 90vw, (max-width: 1023px) 40vw, 38vw"
            />
          </span>
          <span className="hk-photo-stamp" aria-hidden="true">
            From the journal
          </span>
          <span className="hk-journal-open-hint" aria-hidden="true">
            <Maximize2 size={16} />
            <span>Take a closer look</span>
          </span>
        </button>
        <figcaption className="hk-journal-caption">
          <span aria-live="polite" aria-atomic="true">
            {moment.title}
          </span>
          <div className="hk-journal-controls">
            <button
              type="button"
              className="hk-icon-button"
              aria-label="Previous journal photograph"
              onClick={() => advance(-1)}
            >
              <ArrowLeft size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="hk-icon-button"
              aria-label="Next journal photograph"
              onClick={() => advance(1)}
            >
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </figcaption>
      </figure>

      <div className="hk-journal-contact-heading">
        <span className="hk-meta">The contact sheet</span>
        <span
          className="hk-meta"
          aria-label={`Photograph ${photo + 1} of ${photoCount}`}
        >
          {String(photo + 1).padStart(2, "0")} /{" "}
          {String(photoCount).padStart(2, "0")}
        </span>
      </div>
      <div
        className="hk-journal-thumbnails"
        role="group"
        aria-label="Choose a journal photograph"
      >
        {hackathonMoments.map((item, index) => (
          <button
            key={item.src}
            ref={(node) => {
              thumbnails.current[index] = node;
            }}
            type="button"
            className="hk-journal-thumbnail"
            aria-label={`Show photograph ${index + 1}: ${item.title}`}
            aria-pressed={index === photo}
            tabIndex={index === photo ? 0 : -1}
            onClick={() => setPhoto(index)}
          >
            <span className="hk-journal-thumbnail-image">
              <HackathonsImage
                src={item.src}
                alt=""
                sizes="(max-width: 359px) 44px, (max-width: 767px) 15vw, 100px"
              />
            </span>
            <span className="hk-journal-thumbnail-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>
      <p className="hk-journal-note">
        People and moments from my hackathon journey.
      </p>

      <dialog
        ref={dialog}
        className="hk-journal-viewer"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-caption`}
        data-lenis-prevent
        onClose={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
        onKeyDown={handleKeys}
      >
        <>
          <header className="hk-journal-viewer-header">
            <div>
              <p className="hk-meta">From the journal</p>
              <h3 id={`${id}-title`}>People. Perspectives. Possibility.</h3>
            </div>
            <button
              ref={closeButton}
              type="button"
              className="hk-icon-button hk-journal-close"
              aria-label="Close photograph viewer"
              onClick={() => dialog.current?.close()}
            >
              <X size={22} aria-hidden="true" />
            </button>
          </header>
          <div className="hk-journal-viewer-stage">
            {isOpen && (
              <div key={moment.src} className="hk-journal-image-transition">
                <HackathonsImage
                  src={moment.src}
                  alt={moment.alt}
                  className="hk-journal-full-image"
                  sizes="(max-width: 767px) 95vw, 92vw"
                />
              </div>
            )}
          </div>
          <div className="hk-journal-viewer-footer">
            <div
              className="hk-journal-viewer-description"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="hk-journal-viewer-photo-title">{moment.title}</p>
              <p id={`${id}-caption`}>{moment.caption}</p>
            </div>
            <div className="hk-journal-viewer-navigation">
              <span
                className="hk-meta"
                aria-label={`Photograph ${photo + 1} of ${photoCount}`}
              >
                {String(photo + 1).padStart(2, "0")} /{" "}
                {String(photoCount).padStart(2, "0")}
              </span>
              <div className="hk-journal-controls">
                <button
                  type="button"
                  className="hk-icon-button"
                  aria-label="Previous full-screen photograph"
                  onClick={() => advance(-1)}
                >
                  <ArrowLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="hk-icon-button"
                  aria-label="Next full-screen photograph"
                  onClick={() => advance(1)}
                >
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </>
      </dialog>
    </div>
  );
}
