"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, X, ZoomIn, ZoomOut } from "lucide-react";
import type { ImageAsset } from "@/lib/validators/schemas";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";
import styles from "./project-screenshot-viewer.module.css";

const ScreenshotContext = createContext<{
  open: (url: string, trigger: HTMLButtonElement) => void;
} | null>(null);

export function ProjectScreenshotTrigger({
  imageUrl,
  className,
  children,
  ariaLabel = "View project screenshot",
}: {
  imageUrl: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const viewer = useContext(ScreenshotContext);
  return (
    <button
      type="button"
      className={`${styles.trigger} ${className || ""}`}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      onClick={(event) => viewer?.open(imageUrl, event.currentTarget)}
    >
      {children}
    </button>
  );
}

/** One viewer lets cover and gallery images share navigation without leaving the page. */
export function ProjectScreenshotProvider({
  images,
  title,
  children,
}: {
  images: ImageAsset[];
  title: string;
  children: ReactNode;
}) {
  const id = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const thumbnails = useRef<Array<HTMLButtonElement | null>>([]);
  const isOpen = selected !== null;
  const image = images[selected ?? 0];

  useEffect(() => {
    const viewer = dialog.current;
    if (!isOpen || !viewer) return;

    const scrollStyles = [document.documentElement, document.body].flatMap(
      (node) =>
        ["overflow-x", "overflow-y"].map((property) => ({
          node,
          property,
          value: node.style.getPropertyValue(property),
          priority: node.style.getPropertyPriority(property),
        })),
    );
    viewer.showModal();
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
      if (trigger.current?.isConnected)
        trigger.current.focus({ preventScroll: true });
    };
  }, [isOpen]);

  function changeImage(index: number) {
    setSelected(index);
    setZoomed(false);
    setFailedUrl(null);
    stage.current?.scrollTo({ top: 0, left: 0 });
    thumbnails.current[index]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }

  function handleKeys(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Tab") {
      const controls = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      selected === null ||
      (zoomed && event.target === stage.current)
    )
      return;
    let next: number;
    if (event.key === "ArrowLeft")
      next = (selected + images.length - 1) % images.length;
    else if (event.key === "ArrowRight") next = (selected + 1) % images.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = images.length - 1;
    else return;
    event.preventDefault();
    event.stopPropagation();
    changeImage(next);
    if (
      event.target instanceof Element &&
      event.target.closest(`[data-project-thumbnails]`)
    )
      thumbnails.current[next]?.focus({ preventScroll: true });
  }

  function toggleZoom() {
    setZoomed(!zoomed);
    requestAnimationFrame(() => {
      const viewport = stage.current;
      if (!viewport) return;
      viewport.scrollTo({
        left: zoomed ? 0 : viewport.clientWidth / 2,
        top: zoomed ? 0 : viewport.clientHeight / 2,
      });
      if (!zoomed) viewport.focus({ preventScroll: true });
    });
  }

  return (
    <ScreenshotContext.Provider
      value={{
        open: (url, opener) => {
          const index = images.findIndex((asset) => asset.url === url);
          if (index < 0) return;
          trigger.current = opener;
          changeImage(index);
        },
      }}
    >
      {children}
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-caption`}
        data-lenis-prevent
        onClose={() => setSelected(null)}
        onCancel={(event) => {
          event.preventDefault();
          setSelected(null);
        }}
        onKeyDown={handleKeys}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            setSelected(null);
        }}
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <p>Project screenshots</p>
            <h2 id={`${id}-title`}>{title}</h2>
          </div>
          <div className={styles.tools}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={
                zoomed ? "Fit screenshot to viewer" : "Zoom into screenshot"
              }
              aria-pressed={zoomed}
              disabled={failedUrl === image?.url}
              onClick={toggleZoom}
            >
              {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
            </button>
            <button
              ref={closeButton}
              type="button"
              className={styles.iconButton}
              aria-label="Close screenshot viewer"
              onClick={() => setSelected(null)}
            >
              <X size={22} />
            </button>
          </div>
        </header>
        <div
          ref={stage}
          className={`${styles.stage} ${zoomed ? styles.zoomed : ""}`}
          role="region"
          aria-label={
            zoomed
              ? "Zoomed screenshot; scroll to explore"
              : "Project screenshot"
          }
          tabIndex={zoomed ? 0 : -1}
          data-lenis-prevent
        >
          {isOpen &&
            image &&
            (failedUrl === image.url ? (
              <div className={styles.error} role="status">
                <p>This screenshot couldn’t load.</p>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => {
                    setFailedUrl(null);
                    setRetry(retry + 1);
                  }}
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className={styles.canvas}>
                <Image
                  key={`${image.url}-${retry}`}
                  src={getOptimizedUrl(image.url, 2800)}
                  alt={image.alt || `Screenshot of ${title}`}
                  fill
                  sizes={zoomed ? "200vw" : "95vw"}
                  className={styles.image}
                  onError={() => setFailedUrl(image.url)}
                />
              </div>
            ))}
        </div>
        <footer className={styles.footer}>
          <div
            className={styles.description}
            aria-live="polite"
            aria-atomic="true"
          >
            <p id={`${id}-caption`}>{image?.alt || `${title} screenshot`}</p>
            <span>
              {zoomed
                ? "Scroll to explore · zoom out to fit"
                : "Click a thumbnail or use the arrow keys to explore"}
            </span>
          </div>
          <div className={styles.navigation}>
            <span
              className={styles.counter}
              aria-label={`Screenshot ${(selected ?? 0) + 1} of ${images.length}`}
            >
              {String((selected ?? 0) + 1).padStart(2, "0")} <span>/</span>{" "}
              {String(images.length).padStart(2, "0")}
            </span>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="Previous screenshot"
                  onClick={() =>
                    changeImage(
                      ((selected ?? 0) + images.length - 1) % images.length,
                    )
                  }
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="Next screenshot"
                  onClick={() =>
                    changeImage(((selected ?? 0) + 1) % images.length)
                  }
                >
                  <ArrowRight size={20} />
                </button>
              </>
            )}
          </div>
        </footer>
        {images.length > 1 && (
          <nav
            className={styles.thumbnails}
            aria-label="Choose a project screenshot"
            data-project-thumbnails
            data-lenis-prevent
          >
            {images.map((asset, index) => (
              <button
                key={asset.url}
                ref={(element) => {
                  thumbnails.current[index] = element;
                }}
                type="button"
                className={styles.thumbnail}
                aria-label={`View screenshot ${index + 1}: ${asset.alt || title}`}
                aria-current={selected === index ? "true" : undefined}
                onClick={() => changeImage(index)}
              >
                {isOpen && (
                  <Image
                    src={getOptimizedUrl(asset.url, 240)}
                    alt=""
                    fill
                    sizes="96px"
                    className={styles.image}
                  />
                )}
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </nav>
        )}
      </dialog>
    </ScreenshotContext.Provider>
  );
}
