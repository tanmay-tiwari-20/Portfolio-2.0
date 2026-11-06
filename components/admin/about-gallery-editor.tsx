"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  RefreshCw,
  Star,
} from "lucide-react";
import styles from "./about-gallery-editor.module.css";
import RadialPopOut from "@/components/about/radial-pop-out";
import CloudinaryUpload from "./cloudinary-upload";
import {
  resolveAboutMoments,
  resolveAboutPopOut,
  resolveAboutPracticeImage,
} from "@/lib/about-gallery";
import { resolveAboutPageContent } from "@/lib/about-page-content";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import {
  aboutPageSchema,
  type AboutPageContent,
  type AboutMoment,
  type AboutPopOutConfig,
  type ImageAsset,
  type Project,
} from "@/lib/validators/schemas";

type MediaAsset = ImageAsset & { format?: string };
type Props = {
  value?: AboutPopOutConfig;
  moments?: AboutMoment[];
  profileImage?: ImageAsset;
  practiceImage?: ImageAsset | null;
  practiceImage2?: ImageAsset | null;
  aboutPage?: AboutPageContent;
  projects?: Project[];
  onDirtyChange?: (dirty: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
  onSave: (
    value: AboutPopOutConfig,
    moments: AboutMoment[],
    practiceImage: ImageAsset | null | undefined,
    practiceImage2: ImageAsset | null | undefined,
    aboutPage: AboutPageContent,
  ) => Promise<boolean>;
};

function imageKey(image: Pick<ImageAsset, "url" | "publicId">) {
  return image.publicId || image.url;
}

function newImageId() {
  return `about-${crypto.randomUUID()}`;
}

export default function AboutGalleryEditor({
  value,
  moments: initialMoments,
  profileImage,
  practiceImage: initialPracticeImage,
  practiceImage2: initialPracticeImage2,
  aboutPage: initialAboutPage,
  projects = [],
  onDirtyChange,
  onBusyChange,
  onSave,
}: Props) {
  const [gallery, setGallery] = useState<AboutPopOutConfig>(() =>
    resolveAboutPopOut(value, profileImage),
  );
  const [moments, setMoments] = useState<AboutMoment[]>(() =>
    resolveAboutMoments(initialMoments),
  );
  const [aboutPage, setAboutPage] = useState<AboutPageContent>(() =>
    resolveAboutPageContent(initialAboutPage),
  );
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [cloudinaryUrl, setCloudinaryUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [dirty, setDirty] = useState(false);
  const saveInProgress = useRef(false);
  const libraryInProgress = useRef(false);
  const savedDraft = useRef({ gallery, moments, aboutPage });
  const [draftRevision, setDraftRevision] = useState(0);
  const [statusIsError, setStatusIsError] = useState(false);
  const hasUpload = Object.values(uploading).some(Boolean);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    onBusyChange?.(saving || hasUpload);
  }, [saving, hasUpload, onBusyChange]);

  useEffect(
    () => () => {
      onDirtyChange?.(false);
      onBusyChange?.(false);
    },
    [onDirtyChange, onBusyChange],
  );

  useEffect(() => {
    if (!dirty && !saving && !hasUpload) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty, saving, hasUpload]);
  const publishedProjects = projects.filter((project) => project.isPublished);
  const workProject =
    publishedProjects.find((project) => project.slug === "unoverse") ??
    publishedProjects[0];
  const craftProject =
    publishedProjects.find(
      (project) => project.slug === "hackshastra-website",
    ) ?? publishedProjects[1];
  const interactionFallback = resolveAboutPracticeImage(initialPracticeImage2);
  const communityFallback = resolveAboutPracticeImage(initialPracticeImage);
  const workFallback = workProject
    ? {
        ...workProject.cover,
        fit: workProject.cover.fit ?? ("contain" as const),
      }
    : undefined;
  const craftFallback = craftProject
    ? {
        ...craftProject.cover,
        fit: craftProject.cover.fit ?? ("contain" as const),
      }
    : undefined;
  const chapterFallbacks = [
    {
      image: workFallback ?? moments[0],
      label: workProject
        ? `${workProject.title} project image`
        : "first photo essay image",
    },
    {
      image: interactionFallback ?? craftFallback ?? moments[0],
      label: interactionFallback
        ? "previously saved interaction photo"
        : craftProject
          ? `${craftProject.title} project image`
          : "first photo essay image",
    },
    {
      image: communityFallback ?? moments[0],
      label: communityFallback
        ? "previously saved community photo"
        : "first photo essay image",
    },
  ];

  function markChanged() {
    setDirty(true);
    setStatus("");
  }

  function updateChapter(
    index: number,
    patch: Partial<AboutPageContent["practice"]["chapters"][number]>,
  ) {
    markChanged();
    setAboutPage((current) => ({
      ...current,
      practice: {
        ...current.practice,
        chapters: current.practice.chapters.map((chapter, i) =>
          i === index ? { ...chapter, ...patch } : chapter,
        ) as AboutPageContent["practice"]["chapters"],
      },
    }));
  }

  function updateCopy<K extends "community" | "experience" | "contact">(
    section: K,
    key: keyof AboutPageContent[K],
    value: string,
  ) {
    markChanged();
    setAboutPage((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }));
  }

  function updateMoment(index: number, patch: Partial<AboutMoment>) {
    markChanged();
    setMoments((current) =>
      current.map((moment, i) =>
        i === index ? { ...moment, ...patch } : moment,
      ),
    );
  }

  const updateGallery = useCallback(
    (update: (current: AboutPopOutConfig) => AboutPopOutConfig) => {
      setGallery((current) => update(current));
      setDirty(true);
      setStatus("");
    },
    [],
  );

  const loadLibrary = useCallback(async () => {
    if (libraryInProgress.current) return;
    libraryInProgress.current = true;
    setLibraryLoading(true);
    setLibraryError("");
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not load the media library.");
      setLibrary(Array.isArray(result.assets) ? result.assets : []);
      if (result.configured === false)
        setLibraryError("Cloudinary media library is not configured.");
    } catch (error) {
      setLibraryError(
        error instanceof Error
          ? error.message
          : "Could not load the media library.",
      );
    } finally {
      libraryInProgress.current = false;
      setLibraryLoading(false);
    }
  }, []);

  function addCloudinaryImage() {
    const url = cloudinaryUrl.trim();
    if (!isCloudinaryImageUrl(url)) {
      setUrlError("Paste a valid HTTPS Cloudinary image URL.");
      return;
    }
    if (gallery.images.some((image) => image.url === url)) {
      setUrlError("That image is already in the radial collection.");
      return;
    }
    updateGallery((current) => ({
      ...current,
      images: [...current.images, { id: newImageId(), url, alt: "" }],
    }));
    setCloudinaryUrl("");
    setUrlError("");
    setStatus("");
  }

  function addLibraryAsset(asset: MediaAsset) {
    const key = imageKey(asset);
    updateGallery((current) =>
      current.images.some((image) => imageKey(image) === key)
        ? current
        : {
            ...current,
            images: [
              ...current.images,
              {
                ...asset,
                id: newImageId(),
                alt:
                  asset.alt ||
                  asset.publicId?.split("/").pop() ||
                  "Portfolio photo",
              },
            ],
          },
    );
    setStatus("");
  }

  function removeImage(id: string) {
    updateGallery((current) => {
      const images = current.images.filter((candidate) => candidate.id !== id);
      return {
        images,
        centerId:
          current.centerId === id ? images[0]?.id || "" : current.centerId,
      };
    });
    setStatus("");
  }

  function moveImage(index: number, direction: -1 | 1) {
    updateGallery((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.images.length) return current;
      const images = [...current.images];
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, images };
    });
  }

  async function save() {
    if (saveInProgress.current || hasUpload) return;
    saveInProgress.current = true;
    setSaving(true);
    setStatus("");
    setStatusIsError(false);
    try {
      if (!gallery.images.some((image) => image.id === gallery.centerId)) {
        throw new Error(
          "Choose one of the gallery images as the center image.",
        );
      }
      if (gallery.images.some((image) => !isCloudinaryImageUrl(image.url))) {
        throw new Error(
          "Every radial image must use a valid HTTPS Cloudinary URL.",
        );
      }
      if (
        moments.length !== 3 ||
        moments.some((moment) => !isCloudinaryImageUrl(moment.url))
      ) {
        throw new Error(
          "Enter a valid HTTPS Cloudinary URL for each of the three building-together photos.",
        );
      }
      const draft = {
        ...aboutPage,
        practice: {
          ...aboutPage.practice,
          chapters: aboutPage.practice.chapters.map((chapter) => ({
            ...chapter,
            image: chapter.image?.url.trim()
              ? { ...chapter.image, url: chapter.image.url.trim() }
              : null,
          })),
        },
      };
      const parsed = aboutPageSchema.safeParse(draft);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new Error(`${issue.path.join(" → ")}: ${issue.message}`);
      }
      if (moments.some((moment) => !moment.title.trim())) {
        throw new Error("Give each photo essay image a title.");
      }
      const saved = await onSave(
        gallery,
        moments,
        initialPracticeImage,
        initialPracticeImage2,
        parsed.data,
      );
      if (saved) {
        savedDraft.current = { gallery, moments, aboutPage: parsed.data };
        setDirty(false);
      }
      setStatusIsError(!saved);
      setStatus(
        saved
          ? "About page saved. The published page is ready to preview."
          : "Your draft is still here. Review the admin message and try again.",
      );
    } catch (error) {
      setStatusIsError(true);
      setStatus(
        error instanceof Error
          ? error.message
          : "The About page could not be saved. Your draft is still here.",
      );
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  }

  function discardChanges() {
    if (saveInProgress.current || hasUpload || !dirty) return;
    if (!window.confirm("Discard your unsaved About page changes?")) return;
    setGallery(savedDraft.current.gallery);
    setMoments(savedDraft.current.moments);
    setAboutPage(savedDraft.current.aboutPage);
    setCloudinaryUrl("");
    setUrlError("");
    setDirty(false);
    setStatus("");
    setDraftRevision((revision) => revision + 1);
  }

  return (
    <section
      className={`admin-card ${styles.editor}`}
      aria-labelledby="about-gallery-title"
    >
      <header className={styles.editorHeader}>
        <div>
          <span className={styles.sectionEyebrow}>ABOUT PAGE</span>
          <h2 id="about-gallery-title">Your story, in order.</h2>
          <p className="form-note">
            Edit the hero gallery, three practice chapters, photo essay,
            experience introduction, and closing invitation.
          </p>
        </div>
        <Link
          href="/about"
          target="_blank"
          rel="noreferrer"
          className="button button-secondary"
        >
          Preview About <ExternalLink size={15} aria-hidden="true" />
        </Link>
      </header>
      <div className={styles.layout}>
        <aside className={styles.previewColumn}>
          <nav className={styles.pageOrder} aria-label="About editor sections">
            <span className={styles.sectionEyebrow}>PAGE ORDER</span>
            <a href="#radial-images-title">
              <span>00</span> Hero gallery
            </a>
            <a href="#practice-image-title">
              <span>01</span> The practice · 3 chapters
            </a>
            <a href="#community-photos-title">
              <span>02</span> The people · photo essay
            </a>
            <a href="#experience-copy-title">
              <span>03</span> The experience
            </a>
            <a href="#contact-copy-title">
              <span>04</span> The next chapter
            </a>
            <p>
              Previews open the saved page. Draft changes publish when you save.
            </p>
          </nav>
          <div className={styles.previewCard}>
            <div className={styles.previewHeading}>
              <div>
                <span className={styles.sectionEyebrow}>HERO GALLERY</span>
                <h3>Live preview</h3>
              </div>
              <span className={styles.imageCount}>
                {gallery.images.length} photos
              </span>
            </div>
            <div
              style={{
                maxWidth: 390,
                margin: "0 auto",
                padding: 12,
                overflow: "hidden",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-lg)",
                background: "var(--spidey-dark-900)",
              }}
            >
              <RadialPopOut
                gallery={gallery}
                cardSize={245}
                heroSize={350}
                radius={250}
                jitter={3.5}
                stagger={0.018}
                shift={0.025}
              />
            </div>
            <p className={styles.previewNote}>
              Hover the center photo to preview the radial pop-out.
            </p>
          </div>
        </aside>

        <fieldset
          key={draftRevision}
          className={styles.controls}
          disabled={saving || hasUpload}
          onChangeCapture={markChanged}
        >
          <section
            className={styles.controlSection}
            aria-labelledby="radial-images-title"
          >
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>00</span>
              <div>
                <h3 id="radial-images-title">Hero radial gallery</h3>
                <p>
                  Add photos, choose the center image, and arrange the pop-out
                  order.
                </p>
              </div>
            </div>

            <div className={styles.addImageRow}>
              <label className="form-note">
                Cloudinary image URL
                <input
                  className="form-input"
                  aria-invalid={Boolean(urlError)}
                  aria-describedby={
                    urlError ? "about-gallery-url-error" : undefined
                  }
                  type="url"
                  value={cloudinaryUrl}
                  onChange={(event) => {
                    setCloudinaryUrl(event.target.value);
                    setUrlError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCloudinaryImage();
                    }
                  }}
                  placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                  style={{ marginTop: 6 }}
                />
              </label>
              <button
                type="button"
                className="button button-secondary"
                onClick={addCloudinaryImage}
              >
                Add image
              </button>
            </div>
            {urlError && (
              <p
                id="about-gallery-url-error"
                className="form-note"
                role="alert"
                style={{ color: "#ffaaa2" }}
              >
                {urlError}
              </p>
            )}

            <details
              className={`about-media-library ${styles.mediaLibrary}`}
              onToggle={(event) => {
                if (
                  event.currentTarget.open &&
                  library.length === 0 &&
                  !libraryLoading
                )
                  void loadLibrary();
              }}
            >
              <summary>Choose an existing Cloudinary image</summary>
              <div className={styles.libraryHeader}>
                <span className="form-note">
                  Use an image already in the portfolio library.
                </span>
                <button
                  className="filter-chip"
                  type="button"
                  onClick={() => void loadLibrary()}
                  disabled={libraryLoading}
                  aria-label="Refresh media library"
                >
                  <RefreshCw
                    size={14}
                    className={libraryLoading ? "animate-spin" : ""}
                  />{" "}
                  Refresh
                </button>
              </div>
              {libraryError && (
                <p className="form-note" role="alert">
                  {libraryError}
                </p>
              )}
              {!libraryError && library.length === 0 && !libraryLoading && (
                <p className="form-note">No existing media assets found.</p>
              )}
              <div className={styles.libraryGrid}>
                {library.map((asset) => {
                  const exists = gallery.images.some(
                    (image) => imageKey(image) === imageKey(asset),
                  );
                  return (
                    <button
                      type="button"
                      key={asset.publicId || asset.url}
                      onClick={() => addLibraryAsset(asset)}
                      disabled={exists}
                      aria-label={`${exists ? "Already in collection" : "Add to collection"}: ${asset.alt || asset.publicId || "Portfolio image"}`}
                      className={styles.libraryAsset}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.url} alt="" loading="lazy" />
                      <span>
                        {exists
                          ? "Added"
                          : asset.publicId?.split("/").pop() || "Add image"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>

            <div className={styles.collectionHeader}>
              <h4>Gallery order</h4>
              <span>
                {gallery.images.length}{" "}
                {gallery.images.length === 1 ? "photo" : "photos"}
              </span>
            </div>
            <ol className={styles.galleryList}>
              {gallery.images.map((image, index) => {
                const isCenter = image.id === gallery.centerId;
                return (
                  <li
                    key={image.id}
                    className={`${styles.galleryItem}${isCenter ? ` ${styles.galleryItemCenter}` : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className={styles.galleryThumbnail}
                      src={image.url}
                      alt=""
                      loading="lazy"
                    />
                    <div className={styles.galleryFields}>
                      <div className={styles.galleryTitleRow}>
                        <strong>
                          {image.publicId?.split("/").pop() ||
                            `Photo ${index + 1}`}
                        </strong>
                        {isCenter && (
                          <span className={styles.centerBadge}>
                            <Star size={11} fill="currentColor" /> Center
                          </span>
                        )}
                      </div>
                      <label className={styles.field}>
                        Cloudinary URL
                        <input
                          className="form-input"
                          type="url"
                          value={image.url}
                          onChange={(event) =>
                            updateGallery((current) => ({
                              ...current,
                              images: current.images.map((candidate) =>
                                candidate.id === image.id
                                  ? { ...candidate, url: event.target.value }
                                  : candidate,
                              ),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        Alt text
                        <input
                          className="form-input"
                          value={image.alt}
                          maxLength={300}
                          onChange={(event) =>
                            updateGallery((current) => ({
                              ...current,
                              images: current.images.map((candidate) =>
                                candidate.id === image.id
                                  ? { ...candidate, alt: event.target.value }
                                  : candidate,
                              ),
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className={styles.galleryActions}>
                      {!isCenter && (
                        <button
                          type="button"
                          className="filter-chip"
                          onClick={() =>
                            updateGallery((current) => ({
                              ...current,
                              centerId: image.id,
                            }))
                          }
                          aria-label={`Set photo ${index + 1} as the center image`}
                        >
                          <Star size={12} /> Set center
                        </button>
                      )}
                      <button
                        className="filter-chip"
                        type="button"
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move photo ${index + 1} up`}
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        className="filter-chip"
                        type="button"
                        onClick={() => moveImage(index, 1)}
                        disabled={index === gallery.images.length - 1}
                        aria-label={`Move photo ${index + 1} down`}
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        className="filter-chip"
                        type="button"
                        onClick={() => removeImage(image.id)}
                        disabled={gallery.images.length === 1}
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <span className={styles.removeLabel}>Remove</span>
                        <span className={styles.removeIcon}>×</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            {gallery.images.length === 1 && (
              <p className={styles.helperNote}>
                Add another image to create the surrounding radial cards.
              </p>
            )}
          </section>

          <section
            className={styles.controlSection}
            aria-labelledby="practice-image-title"
          >
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>01</span>
              <div>
                <h3 id="practice-image-title">The practice</h3>
                <p>
                  Three connected chapters. These appear as a scroll story on
                  desktop and a reading sequence on mobile.
                </p>
              </div>
            </div>
            <div className={styles.copyGrid}>
              {(
                [
                  ["title", "Section title", 80],
                  ["subtitle", "Second title line", 80],
                  ["accent", "Italic ending", 80],
                  ["note", "Introduction", 300],
                ] as const
              ).map(([key, label, maxLength]) => (
                <CopyField
                  key={key}
                  label={label}
                  value={aboutPage.practice[key]}
                  maxLength={maxLength}
                  multiline={key === "note"}
                  onChange={(text) => {
                    markChanged();
                    setAboutPage((current) => ({
                      ...current,
                      practice: { ...current.practice, [key]: text },
                    }));
                  }}
                />
              ))}
            </div>
            <div className={styles.chapterList}>
              {aboutPage.practice.chapters.map((chapter, index) => (
                <details
                  className={styles.chapterEditor}
                  key={index}
                  open={index === 0 ? true : undefined}
                >
                  <summary>
                    <span className={styles.chapterNumber}>0{index + 1}</span>
                    <span>
                      <strong>{chapter.label || `Chapter ${index + 1}`}</strong>
                      <small>
                        {chapter.title} {chapter.accent}
                      </small>
                    </span>
                    <span className={styles.chapterToggle} aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <div className={styles.chapterFields}>
                    <div className={styles.copyGrid}>
                      <CopyField
                        label="Chapter label"
                        value={chapter.label}
                        maxLength={40}
                        onChange={(label) => updateChapter(index, { label })}
                      />
                      <CopyField
                        label="Image caption"
                        value={chapter.caption}
                        maxLength={160}
                        onChange={(caption) =>
                          updateChapter(index, { caption })
                        }
                      />
                      <CopyField
                        label="Heading"
                        value={chapter.title}
                        maxLength={40}
                        onChange={(title) => updateChapter(index, { title })}
                      />
                      <CopyField
                        label="Italic heading line"
                        value={chapter.accent}
                        maxLength={40}
                        onChange={(accent) => updateChapter(index, { accent })}
                      />
                    </div>
                    <CopyField
                      label="Chapter introduction"
                      value={chapter.body}
                      maxLength={400}
                      multiline
                      onChange={(body) => updateChapter(index, { body })}
                    />
                    <div className={styles.copyGrid}>
                      {chapter.details.map((detail, detailIndex) => (
                        <CopyField
                          key={detailIndex}
                          label={`Supporting detail ${detailIndex + 1}`}
                          value={detail}
                          maxLength={80}
                          onChange={(text) =>
                            updateChapter(index, {
                              details: chapter.details.map((item, i) =>
                                i === detailIndex ? text : item,
                              ) as [string, string],
                            })
                          }
                        />
                      ))}
                    </div>
                    <ImageField
                      label={`Chapter ${index + 1} image`}
                      value={chapter.image}
                      fallback={chapterFallbacks[index].image}
                      fallbackLabel={chapterFallbacks[index].label}
                      onChange={(image) => updateChapter(index, { image })}
                      onUploadingChange={(active) =>
                        setUploading((current) => ({
                          ...current,
                          [`chapter-${index}`]: active,
                        }))
                      }
                    />
                  </div>
                </details>
              ))}
            </div>
          </section>
          <section
            className={styles.controlSection}
            aria-labelledby="community-photos-title"
          >
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>02</span>
              <div>
                <h3 id="community-photos-title">The people</h3>
                <p>
                  The community introduction, photo essay, mentoring note, and
                  selected event archive.
                </p>
              </div>
              <span className={styles.imageCount}>3 photos</span>
            </div>
            <div className={styles.copyGrid}>
              {(
                [
                  ["title", "Heading", 80],
                  ["accent", "Italic heading line", 80],
                  ["lead", "Opening statement", 300],
                  ["body", "Community introduction", 800],
                  ["noteTitle", "Mentoring note heading", 120],
                  ["noteAccent", "Mentoring note italic ending", 80],
                  ["noteBody", "Mentoring note", 600],
                  ["impactText", "Text beside the mentoring count", 500],
                  ["archiveTitle", "Selected events heading", 180],
                ] as const
              ).map(([key, label, maxLength]) => (
                <CopyField
                  key={key}
                  label={label}
                  value={aboutPage.community[key]}
                  maxLength={maxLength}
                  multiline={[
                    "lead",
                    "body",
                    "noteBody",
                    "impactText",
                    "archiveTitle",
                  ].includes(key)}
                  onChange={(text) => updateCopy("community", key, text)}
                />
              ))}
            </div>
            <p className={styles.helperNote}>
              The mentoring count uses the portfolio’s shared metric. Selected
              events and their links are managed in the Hackathons tab.
            </p>
            <h4 className={styles.subheading}>Photo essay · 3 images</h4>
            <div className={styles.momentGrid}>
              {moments.map((moment, index) => (
                <article key={moment.id} className={styles.momentCard}>
                  <div className={styles.momentImageWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={moment.url} alt="" loading="lazy" />
                    <span>PHOTO {index + 1}</span>
                  </div>
                  <div className={styles.momentFields}>
                    <CopyField
                      label="Photo title"
                      value={moment.title}
                      maxLength={140}
                      onChange={(title) => updateMoment(index, { title })}
                    />
                    <CopyField
                      label="Photo caption"
                      value={moment.caption}
                      maxLength={600}
                      multiline
                      onChange={(caption) => updateMoment(index, { caption })}
                    />
                    <ImageField
                      label={`Photo ${index + 1}`}
                      value={{ url: moment.url, alt: moment.alt }}
                      allowAutomatic={false}
                      allowFit={false}
                      showPreview={false}
                      onUploadingChange={(active) =>
                        setUploading((current) => ({
                          ...current,
                          [`moment-${index}`]: active,
                        }))
                      }
                      onChange={(image) =>
                        updateMoment(index, {
                          url: image?.url ?? "",
                          alt: image?.alt ?? moment.alt,
                        })
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            className={styles.controlSection}
            aria-labelledby="experience-copy-title"
          >
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>03</span>
              <div>
                <h3 id="experience-copy-title">The experience</h3>
                <p>
                  Edit the introduction above the role history. Roles, dates,
                  achievements, and technologies stay in the Experience tab.
                </p>
              </div>
            </div>
            <div className={styles.copyGrid}>
              <CopyField
                label="Heading"
                value={aboutPage.experience.title}
                maxLength={80}
                onChange={(text) => updateCopy("experience", "title", text)}
              />
              <CopyField
                label="Italic heading line"
                value={aboutPage.experience.accent}
                maxLength={80}
                onChange={(text) => updateCopy("experience", "accent", text)}
              />
            </div>
            <CopyField
              label="Experience introduction"
              value={aboutPage.experience.body}
              maxLength={600}
              multiline
              onChange={(text) => updateCopy("experience", "body", text)}
            />
          </section>

          <section
            className={styles.controlSection}
            aria-labelledby="contact-copy-title"
          >
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>04</span>
              <div>
                <h3 id="contact-copy-title">The next chapter</h3>
                <p>
                  The closing invitation on the About page. The contact buttons
                  lead to your existing Contact page.
                </p>
              </div>
            </div>
            <div className={styles.copyGrid}>
              <CopyField
                label="Heading"
                value={aboutPage.contact.title}
                maxLength={80}
                onChange={(text) => updateCopy("contact", "title", text)}
              />
              <CopyField
                label="Italic heading line"
                value={aboutPage.contact.accent}
                maxLength={80}
                onChange={(text) => updateCopy("contact", "accent", text)}
              />
            </div>
            <CopyField
              label="Invitation"
              value={aboutPage.contact.body}
              maxLength={600}
              multiline
              onChange={(text) => updateCopy("contact", "body", text)}
            />
          </section>

          <div className={styles.saveBar}>
            <div>
              <strong>
                {hasUpload
                  ? "Uploading an image…"
                  : dirty
                    ? "Unsaved About changes"
                    : "About page content"}
              </strong>
              <span>
                {hasUpload
                  ? "Wait for the upload to finish before saving."
                  : "Save publishes the copy and images together."}
              </span>
            </div>
            <div className={styles.saveActions}>
              {dirty && (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={discardChanges}
                  disabled={saving || hasUpload}
                >
                  Discard changes
                </button>
              )}
              <button
                type="button"
                className="button button-primary"
                onClick={() => void save()}
                disabled={saving || hasUpload || gallery.images.length === 0}
              >
                {saving ? "Saving…" : "Save About page"}
              </button>
            </div>
            {status && (
              <span
                className="form-note"
                role={statusIsError ? "alert" : "status"}
              >
                {status}
              </span>
            )}
          </div>
        </fieldset>
      </div>
    </section>
  );
}

function CopyField({
  label,
  value,
  maxLength,
  multiline = false,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        <span>
          {label} <span aria-hidden="true">*</span>
        </span>
        <small>
          {value.length}/{maxLength}
        </small>
      </span>
      {multiline ? (
        <textarea
          className="form-input"
          value={value}
          aria-required="true"
          aria-invalid={!value.trim()}
          maxLength={maxLength}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="form-input"
          value={value}
          aria-required="true"
          aria-invalid={!value.trim()}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {!value.trim() && (
        <span className="form-error-text">This field is required.</span>
      )}
    </label>
  );
}

function ImageField({
  label,
  value,
  fallback,
  fallbackLabel = "",
  allowAutomatic = true,
  allowFit = true,
  showPreview = true,
  onChange,
  onUploadingChange,
}: {
  label: string;
  value?: ImageAsset | null;
  fallback?: ImageAsset;
  fallbackLabel?: string;
  allowAutomatic?: boolean;
  allowFit?: boolean;
  showPreview?: boolean;
  onChange: (value: ImageAsset | null) => void;
  onUploadingChange: (active: boolean) => void;
}) {
  const validOverride = value && isCloudinaryImageUrl(value.url) ? value : null;
  const errorId = useId();
  const invalidUrl = Boolean(value?.url && !isCloudinaryImageUrl(value.url));
  const preview = validOverride ?? fallback;
  const [uploadSession, setUploadSession] = useState(() => ({
    version: 0,
    initialAssets: validOverride ? [validOverride] : [],
  }));
  const [freshUpload, setFreshUpload] = useState<ImageAsset | null>(null);
  const [uploadActive, setUploadActive] = useState(false);
  const uploadActiveRef = useRef(false);
  const [cleanupError, setCleanupError] = useState("");

  function selectManually(next: ImageAsset | null, discardFreshUpload = false) {
    if (uploadActiveRef.current) return;
    // A delivery URL can change without changing the underlying image.
    // Input edits never delete media; cleanup requires the explicit reset.
    const abandoned = discardFreshUpload ? freshUpload : null;
    if (discardFreshUpload) setFreshUpload(null);
    setCleanupError("");
    onChange(next);
    // A manual source selection starts a new uploader session. Upload callbacks
    // themselves never change this key, so fresh uploads retain saved:false.
    setUploadSession((current) => ({
      version: current.version + 1,
      initialAssets: next && isCloudinaryImageUrl(next.url) ? [next] : [],
    }));
    if (abandoned?.publicId) {
      // This image was uploaded by this draft, not loaded from saved content.
      // The ordinary uploader handles its own Remove action. This path is
      // reserved for the explicit reset button, never input keystrokes.
      void fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: abandoned.publicId }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Cleanup failed");
        })
        .catch(() =>
          setCleanupError(
            "The draft was updated, but the unused upload could not be removed from the media library.",
          ),
        );
    }
  }

  return (
    <div className={styles.imageEditor}>
      {showPreview && (
        <div className={styles.practiceAssetHeader}>
          <strong>{label}</strong>
          <span>{validOverride ? "Custom image" : "Automatic image"}</span>
        </div>
      )}
      <div
        className={`${styles.practiceSetting} ${!showPreview ? styles.imageFieldsOnly : ""}`}
      >
        {showPreview &&
          (preview && isCloudinaryImageUrl(preview.url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.practiceThumbnail}
              src={preview.url}
              alt=""
              loading="lazy"
              style={{ objectFit: preview.fit ?? "cover" }}
            />
          ) : (
            <div className={styles.practicePlaceholder}>Image</div>
          ))}
        <div className={styles.practiceFields}>
          <label className={styles.field}>
            {allowAutomatic
              ? "Cloudinary image override · optional"
              : "Cloudinary image URL"}
            <input
              className="form-input"
              type="url"
              value={value?.url ?? ""}
              aria-invalid={invalidUrl}
              aria-describedby={invalidUrl ? errorId : undefined}
              disabled={uploadActive}
              onChange={(event) => {
                const url = event.target.value;
                selectManually(
                  url.trim()
                    ? { url, alt: value?.alt ?? "", fit: value?.fit }
                    : null,
                );
              }}
              placeholder={
                allowAutomatic
                  ? "Leave empty to use the automatic image"
                  : "https://res.cloudinary.com/your-cloud/image/upload/..."
              }
            />
            {invalidUrl && (
              <span id={errorId} className="form-error-text" role="alert">
                Enter a valid HTTPS Cloudinary image URL.
              </span>
            )}
          </label>
          <label className={styles.field}>
            Image description / alt text
            <input
              className="form-input"
              value={value?.alt ?? ""}
              maxLength={300}
              disabled={!value?.url.trim() || uploadActive}
              onChange={(event) => {
                if (value) onChange({ ...value, alt: event.target.value });
              }}
              placeholder={fallback?.alt ?? "Describe the image"}
            />
          </label>
          {allowFit && (
            <label className={styles.field}>
              Image fit
              <select
                className="form-input"
                value={value?.fit ?? "cover"}
                disabled={!value?.url.trim() || uploadActive}
                onChange={(event) => {
                  if (value)
                    onChange({
                      ...value,
                      fit: event.target.value as "cover" | "contain",
                    });
                }}
              >
                <option value="cover">Cover · fill the frame</option>
                <option value="contain">Contain · show the whole image</option>
              </select>
            </label>
          )}
        </div>
      </div>
      {allowAutomatic && (
        <>
          <p className={styles.helperNote}>
            Automatic image: {fallbackLabel}.{" "}
            {value?.url
              ? "Remove this override to return to that image."
              : "No custom image has been selected."}
          </p>
          {(value || freshUpload) && (
            <button
              className="filter-chip"
              type="button"
              disabled={uploadActive}
              onClick={() => selectManually(null, true)}
            >
              {value ? "Use automatic image" : "Remove unused upload"}
            </button>
          )}
        </>
      )}
      <details className={styles.uploadDisclosure}>
        <summary>
          {allowAutomatic
            ? "Upload a custom image"
            : "Upload a replacement photo"}
        </summary>
        <CloudinaryUpload
          key={uploadSession.version}
          section="about"
          initialAssets={uploadSession.initialAssets}
          onUploadingChange={(active) => {
            uploadActiveRef.current = active;
            setUploadActive(active);
            onUploadingChange(active);
          }}
          onChange={(assets) => {
            const asset = assets[0];
            if (
              asset?.publicId &&
              asset.url !== uploadSession.initialAssets[0]?.url
            )
              setFreshUpload(asset);
            else if (!asset && !uploadActiveRef.current) setFreshUpload(null);
            onChange(
              asset
                ? {
                    ...asset,
                    fit: value?.fit ?? asset.fit,
                    alt:
                      uploadActiveRef.current && asset.url === value?.url
                        ? value.alt
                        : asset.alt,
                  }
                : null,
            );
          }}
        />
      </details>
      {cleanupError && (
        <p className={styles.helperNote} role="alert">
          {cleanupError}
        </p>
      )}
    </div>
  );
}
