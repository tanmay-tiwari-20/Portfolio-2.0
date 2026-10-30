"use client";

import { useCallback, useState } from "react";
import { ArrowDown, ArrowUp, RefreshCw, Star } from "lucide-react";
import styles from "./about-gallery-editor.module.css";
import RadialPopOut from "@/components/about/radial-pop-out";
import { resolveAboutMoments, resolveAboutPopOut } from "@/lib/about-gallery";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import type { AboutMoment, AboutPopOutConfig, ImageAsset } from "@/lib/validators/schemas";

type MediaAsset = ImageAsset & { format?: string };
type Props = {
  value?: AboutPopOutConfig;
  moments?: AboutMoment[];
  profileImage?: ImageAsset;
  practiceImage?: ImageAsset | null;
  practiceImage2?: ImageAsset | null;
  onSave: (
    value: AboutPopOutConfig,
    moments: AboutMoment[],
    practiceImage: ImageAsset | null,
    practiceImage2: ImageAsset | null,
  ) => Promise<boolean>;
};

function imageKey(image: Pick<ImageAsset, "url" | "publicId">) {
  return image.publicId || image.url;
}

function newImageId() {
  return `about-${crypto.randomUUID()}`;
}

export default function AboutGalleryEditor({ value, moments: initialMoments, profileImage, practiceImage: initialPracticeImage, practiceImage2: initialPracticeImage2, onSave }: Props) {
  const [gallery, setGallery] = useState<AboutPopOutConfig>(() =>
    resolveAboutPopOut(value, profileImage),
  );
  const [moments, setMoments] = useState<AboutMoment[]>(() => resolveAboutMoments(initialMoments));
  const [practiceImage, setPracticeImage] = useState<ImageAsset | null>(() => initialPracticeImage ?? null);
  const [practiceImage2, setPracticeImage2] = useState<ImageAsset | null>(() => initialPracticeImage2 ?? null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const updateGallery = useCallback((update: (current: AboutPopOutConfig) => AboutPopOutConfig) => {
    setGallery((current) => update(current));
    setStatus("");
  }, []);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    setLibraryError("");
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load the media library.");
      setLibrary(Array.isArray(result.assets) ? result.assets : []);
      if (result.configured === false) setLibraryError("Cloudinary media library is not configured.");
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : "Could not load the media library.");
    } finally {
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
    updateGallery((current) => current.images.some((image) => imageKey(image) === key)
      ? current
      : { ...current, images: [...current.images, { ...asset, id: newImageId(), alt: asset.alt || asset.publicId?.split("/").pop() || "Portfolio photo" }] });
    setStatus("");
  }

  function removeImage(id: string) {
    updateGallery((current) => {
      const images = current.images.filter((candidate) => candidate.id !== id);
      return {
        images,
        centerId: current.centerId === id ? images[0]?.id || "" : current.centerId,
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
    setSaving(true);
    setStatus("");
    try {
      if (!gallery.images.some((image) => image.id === gallery.centerId)) {
        throw new Error("Choose one of the gallery images as the center image.");
      }
      if (gallery.images.some((image) => !isCloudinaryImageUrl(image.url))) {
        throw new Error("Every radial image must use a valid HTTPS Cloudinary URL.");
      }
      if (moments.length !== 3 || moments.some((moment) => !isCloudinaryImageUrl(moment.url))) {
        throw new Error("Enter a valid HTTPS Cloudinary URL for each of the three building-together photos.");
      }
      const nextPracticeImage = practiceImage?.url.trim()
        ? { ...practiceImage, url: practiceImage.url.trim() }
        : null;
      if (nextPracticeImage && !isCloudinaryImageUrl(nextPracticeImage.url)) {
        throw new Error("Practice story index 1 (chapter 02) must use a valid HTTPS Cloudinary URL.");
      }
      const nextPracticeImage2 = practiceImage2?.url.trim()
        ? { ...practiceImage2, url: practiceImage2.url.trim() }
        : null;
      if (nextPracticeImage2 && !isCloudinaryImageUrl(nextPracticeImage2.url)) {
        throw new Error("Practice story index 2 must use a valid HTTPS Cloudinary URL.");
      }
      const saved = await onSave(gallery, moments, nextPracticeImage, nextPracticeImage2);
      setStatus(saved ? "About page images saved." : "The images could not be saved. Review the admin message and try again.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The gallery could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`admin-card ${styles.editor}`} aria-labelledby="about-gallery-title">
      <div className={styles.layout}>
        <aside className={styles.previewColumn}>
          <div className={styles.previewCard}>
            <div className={styles.previewHeading}>
              <div>
                <span className={styles.sectionEyebrow}>HERO GALLERY</span>
                <h3>Live preview</h3>
              </div>
              <span className={styles.imageCount}>{gallery.images.length} photos</span>
            </div>
            <div style={{ maxWidth: 390, margin: "0 auto", padding: 12, overflow: "hidden", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "var(--spidey-dark-900)" }}>
              <RadialPopOut gallery={gallery} />
            </div>
            <p className={styles.previewNote}>Hover the center photo to preview the radial pop-out.</p>
          </div>
        </aside>

        <div className={styles.controls}>
          <section className={styles.controlSection} aria-labelledby="radial-images-title">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>01</span>
              <div>
                <h3 id="radial-images-title">Hero radial gallery</h3>
                <p>Add photos, choose the center image, and arrange the pop-out order.</p>
              </div>
            </div>

            <div className={styles.addImageRow}>
              <label className="form-note">
                Cloudinary image URL
                <input
                  className="form-input"
                  type="url"
                  value={cloudinaryUrl}
                  onChange={(event) => { setCloudinaryUrl(event.target.value); setUrlError(""); }}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCloudinaryImage(); } }}
                  placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                  style={{ marginTop: 6 }}
                />
              </label>
              <button type="button" className="button button-secondary" onClick={addCloudinaryImage}>
                Add image
              </button>
            </div>
            {urlError && <p className="form-note" role="alert" style={{ color: "#ffaaa2" }}>{urlError}</p>}

          <details className={`about-media-library ${styles.mediaLibrary}`} onToggle={(event) => {
            if (event.currentTarget.open && library.length === 0 && !libraryLoading) void loadLibrary();
          }}>
            <summary>Choose an existing Cloudinary image</summary>
            <div className={styles.libraryHeader}>
              <span className="form-note">Use an image already in the portfolio library.</span>
              <button className="filter-chip" type="button" onClick={() => void loadLibrary()} disabled={libraryLoading} aria-label="Refresh media library">
                <RefreshCw size={14} className={libraryLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {libraryError && <p className="form-note" role="alert">{libraryError}</p>}
            {!libraryError && library.length === 0 && !libraryLoading && <p className="form-note">No existing media assets found.</p>}
            <div className={styles.libraryGrid}>
              {library.map((asset) => {
                const exists = gallery.images.some((image) => imageKey(image) === imageKey(asset));
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
                    <span>{exists ? "Added" : asset.publicId?.split("/").pop() || "Add image"}</span>
                  </button>
                );
              })}
            </div>
          </details>

            <div className={styles.collectionHeader}>
              <h4>Gallery order</h4>
              <span>{gallery.images.length} {gallery.images.length === 1 ? "photo" : "photos"}</span>
            </div>
            <ol className={styles.galleryList}>
              {gallery.images.map((image, index) => {
                const isCenter = image.id === gallery.centerId;
                return (
                  <li key={image.id} className={`${styles.galleryItem}${isCenter ? ` ${styles.galleryItemCenter}` : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.galleryThumbnail} src={image.url} alt="" loading="lazy" />
                    <div className={styles.galleryFields}>
                      <div className={styles.galleryTitleRow}>
                        <strong>{image.publicId?.split("/").pop() || `Photo ${index + 1}`}</strong>
                        {isCenter && <span className={styles.centerBadge}><Star size={11} fill="currentColor" /> Center</span>}
                      </div>
                      <label className={styles.field}>
                        Cloudinary URL
                        <input
                          className="form-input"
                          type="url"
                          value={image.url}
                          onChange={(event) => updateGallery((current) => ({
                            ...current,
                            images: current.images.map((candidate) => candidate.id === image.id ? { ...candidate, url: event.target.value } : candidate),
                          }))}
                        />
                      </label>
                      <label className={styles.field}>
                        Alt text
                        <input
                          className="form-input"
                          value={image.alt}
                          maxLength={300}
                          onChange={(event) => updateGallery((current) => ({
                            ...current,
                            images: current.images.map((candidate) => candidate.id === image.id ? { ...candidate, alt: event.target.value } : candidate),
                          }))}
                        />
                      </label>
                    </div>
                    <div className={styles.galleryActions}>
                      {!isCenter && (
                        <button type="button" className="filter-chip" onClick={() => updateGallery((current) => ({ ...current, centerId: image.id }))} aria-label={`Set photo ${index + 1} as the center image`}>
                          <Star size={12} /> Set center
                        </button>
                      )}
                      <button className="filter-chip" type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label={`Move photo ${index + 1} up`}><ArrowUp size={13} /></button>
                      <button className="filter-chip" type="button" onClick={() => moveImage(index, 1)} disabled={index === gallery.images.length - 1} aria-label={`Move photo ${index + 1} down`}><ArrowDown size={13} /></button>
                      <button className="filter-chip" type="button" onClick={() => removeImage(image.id)} disabled={gallery.images.length === 1} aria-label={`Remove photo ${index + 1}`}><span className={styles.removeLabel}>Remove</span><span className={styles.removeIcon}>×</span></button>
                    </div>
                  </li>
                );
              })}
            </ol>
            {gallery.images.length === 1 && <p className={styles.helperNote}>Add another image to create the surrounding radial cards.</p>}
          </section>

          <section className={styles.controlSection} aria-labelledby="practice-image-title">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>02</span>
              <div>
                <h3 id="practice-image-title">Practice story images</h3>
                <p>Manage index 1 (chapter 02) and index 2 (chapter 03) independently.</p>
              </div>
              <span className={styles.optionalBadge}>Optional</span>
            </div>
            <div className={styles.practiceAssetHeader}>
              <strong>Index 1 · chapter 02 · Craft &amp; interaction</strong>
              <span>Optional</span>
            </div>
            <div className={styles.practiceSetting}>
              {practiceImage?.url && isCloudinaryImageUrl(practiceImage.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.practiceThumbnail} src={practiceImage.url} alt="" loading="lazy" />
              ) : (
                <div className={styles.practicePlaceholder} aria-hidden="true">02</div>
              )}
              <div className={styles.practiceFields}>
                <label className={styles.field}>
                  Cloudinary URL
                  <input
                    className="form-input"
                    type="url"
                    value={practiceImage?.url || ""}
                    onChange={(event) => {
                      setStatus("");
                      setPracticeImage((current) => ({ url: event.target.value, alt: current?.alt || "Craft and interaction practice" }));
                    }}
                    placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                  />
                </label>
                <label className={styles.field}>
                  Alt text
                  <input
                    className="form-input"
                    value={practiceImage?.alt || ""}
                    maxLength={300}
                    onChange={(event) => {
                      setStatus("");
                      setPracticeImage((current) => ({ url: current?.url || "", alt: event.target.value }));
                    }}
                  />
                </label>
              </div>
            </div>
            <div className={styles.practiceAssetHeader}>
              <strong>Index 2 · chapter 03 · Community</strong>
              <span>Optional</span>
            </div>
            <div className={styles.practiceSetting}>
              {practiceImage2?.url && isCloudinaryImageUrl(practiceImage2.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.practiceThumbnail} src={practiceImage2.url} alt="" loading="lazy" />
              ) : (
                <div className={styles.practicePlaceholder} aria-hidden="true">03</div>
              )}
              <div className={styles.practiceFields}>
                <label className={styles.field}>
                  Cloudinary URL
                  <input
                    className="form-input"
                    type="url"
                    value={practiceImage2?.url || ""}
                    onChange={(event) => {
                      setStatus("");
                      setPracticeImage2((current) => ({ url: event.target.value, alt: current?.alt || "Community practice story" }));
                    }}
                    placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                  />
                </label>
                <label className={styles.field}>
                  Alt text
                  <input
                    className="form-input"
                    value={practiceImage2?.alt || ""}
                    maxLength={300}
                    onChange={(event) => {
                      setStatus("");
                      setPracticeImage2((current) => ({ url: current?.url || "", alt: event.target.value }));
                    }}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className={styles.controlSection} aria-labelledby="community-photos-title">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNumber}>03</span>
              <div>
                <h3 id="community-photos-title">Building together</h3>
                <p>These photos appear in the About community section and final practice chapter.</p>
              </div>
              <span className={styles.imageCount}>3 photos</span>
            </div>
            <div className={styles.momentGrid}>
              {moments.map((moment, index) => (
                <article key={moment.id} className={styles.momentCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className={styles.momentImageWrap}>
                    <img src={moment.url} alt="" loading="lazy" />
                    <span>PHOTO {index + 1}</span>
                  </div>
                  <div className={styles.momentFields}>
                    <label className={styles.field}>
                      Cloudinary URL
                      <input
                        className="form-input"
                        type="url"
                        value={moment.url}
                        onChange={(event) => {
                          setStatus("");
                          setMoments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item));
                        }}
                      />
                    </label>
                    <label className={styles.field}>
                      Alt text
                      <input
                        className="form-input"
                        value={moment.alt}
                        maxLength={300}
                        onChange={(event) => {
                          setStatus("");
                          setMoments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item));
                        }}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className={styles.saveBar}>
            <div>
              <strong>Ready to publish?</strong>
              <span>Save updates to the About page immediately.</span>
            </div>
            <button type="button" className="button button-primary" onClick={() => void save()} disabled={saving || gallery.images.length === 0}>
              {saving ? "Saving…" : "Save all About images"}
            </button>
            {status && <span className="form-note" role="status">{status}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
