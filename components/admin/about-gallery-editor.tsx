"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowDown, ArrowUp, RefreshCw, Star } from "lucide-react";
import styles from "./about-gallery-editor.module.css";
import CloudinaryUpload from "@/components/admin/cloudinary-upload";
import RadialPopOut from "@/components/about/radial-pop-out";
import { resolveAboutPopOut } from "@/lib/about-gallery";
import type { AboutPopOutConfig, ImageAsset } from "@/lib/validators/schemas";

type MediaAsset = ImageAsset & { format?: string };
type Props = {
  value?: AboutPopOutConfig;
  profileImage?: ImageAsset;
  onSave: (value: AboutPopOutConfig) => Promise<boolean>;
};

function imageKey(image: Pick<ImageAsset, "url" | "publicId">) {
  return image.publicId || image.url;
}

function newImageId() {
  return `about-${crypto.randomUUID()}`;
}

export default function AboutGalleryEditor({ value, profileImage, onSave }: Props) {
  const [gallery, setGallery] = useState<AboutPopOutConfig>(() =>
    resolveAboutPopOut(value, profileImage),
  );
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const galleryRef = useRef(gallery);
  const uploadKeys = useRef(new Set<string>());
  const removedKeys = useRef(new Set<string>());

  const updateGallery = useCallback((update: (current: AboutPopOutConfig) => AboutPopOutConfig) => {
    setGallery((current) => {
      const next = update(current);
      galleryRef.current = next;
      return next;
    });
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

  function handleUploadChange(assets: ImageAsset[]) {
    updateGallery((current) => {
      const incomingKeys = new Set(assets.map(imageKey));
      const nextImages = current.images.filter((image) =>
        !uploadKeys.current.has(imageKey(image)) || incomingKeys.has(imageKey(image)),
      );
      const existingKeys = new Set(nextImages.map(imageKey));

      for (const asset of assets) {
        const key = imageKey(asset);
        uploadKeys.current.add(key);
        if (removedKeys.current.has(key) || existingKeys.has(key)) continue;
        nextImages.push({ ...asset, id: newImageId(), alt: asset.alt || "" });
        existingKeys.add(key);
      }

      const centerId = nextImages.some((image) => image.id === current.centerId)
        ? current.centerId
        : nextImages[0]?.id || "";
      return { centerId, images: nextImages };
    });
    setStatus("");
  }

  function addLibraryAsset(asset: MediaAsset) {
    const key = imageKey(asset);
    removedKeys.current.delete(key);
    updateGallery((current) => current.images.some((image) => imageKey(image) === key)
      ? current
      : { ...current, images: [...current.images, { ...asset, id: newImageId(), alt: asset.alt || asset.publicId?.split("/").pop() || "Portfolio photo" }] });
    setStatus("");
  }

  function removeImage(id: string) {
    const image = galleryRef.current.images.find((candidate) => candidate.id === id);
    if (image) removedKeys.current.add(imageKey(image));
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
      const saved = await onSave(gallery);
      setStatus(saved ? "About gallery saved." : "The gallery could not be saved. Review the admin message and try again.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The gallery could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-card" style={{ maxWidth: "none", margin: "32px 0 0" }} aria-labelledby="about-gallery-title">
      <div style={{ marginBottom: 22 }}>
        <p className="eyebrow" style={{ margin: "0 0 8px" }}>ABOUT PAGE · HERO VISUAL</p>
        <h3 id="about-gallery-title" className="display" style={{ margin: 0, fontSize: 22 }}>Radial photo collection</h3>
        <p className="form-note" style={{ maxWidth: 720, marginTop: 7 }}>
          Choose images for the About hero, set the center image, and reorder the surrounding photos. The homepage profile portrait and existing hackathon photos are used until you save a custom collection.
        </p>
      </div>

      <div className={styles.layout}>
        <div style={{ minWidth: 0 }}>
          <h4 className="form-label" style={{ fontSize: 12, marginBottom: 10 }}>Live preview</h4>
          <div style={{ maxWidth: 390, margin: "0 auto", padding: 12, overflow: "hidden", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "var(--spidey-dark-900)" }}>
            <RadialPopOut gallery={gallery} />
          </div>
          <p className="form-note" style={{ marginTop: 8, textAlign: "center" }}>Hover or focus the center image to preview the pop-out.</p>
        </div>

        <div style={{ minWidth: 0, display: "grid", gap: 24 }}>
          <div>
            <h4 className="form-label" style={{ fontSize: 12, marginBottom: 10 }}>Upload images</h4>
            <CloudinaryUpload
              section="about"
              multiple
              onUploadingChange={setUploading}
              onChange={handleUploadChange}
            />
          </div>

          <details className="about-media-library" onToggle={(event) => {
            if (event.currentTarget.open && library.length === 0 && !libraryLoading) void loadLibrary();
          }}>
            <summary className="form-label" style={{ cursor: "pointer", marginBottom: 12 }}>Choose from the media library</summary>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <span className="form-note">Cloudinary assets already uploaded to this portfolio.</span>
              <button className="filter-chip" type="button" onClick={() => void loadLibrary()} disabled={libraryLoading} aria-label="Refresh media library">
                <RefreshCw size={14} className={libraryLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {libraryError && <p className="form-note" role="alert">{libraryError}</p>}
            {!libraryError && library.length === 0 && !libraryLoading && <p className="form-note">No existing media assets found.</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))", gap: 10, maxHeight: 310, overflowY: "auto", padding: 2 }}>
              {library.map((asset) => {
                const exists = gallery.images.some((image) => imageKey(image) === imageKey(asset));
                return (
                  <button
                    type="button"
                    key={asset.publicId || asset.url}
                    onClick={() => addLibraryAsset(asset)}
                    disabled={exists}
                    aria-label={`${exists ? "Already in collection" : "Add to collection"}: ${asset.alt || asset.publicId || "Portfolio image"}`}
                    style={{ display: "grid", gap: 6, padding: 7, border: "1px solid var(--line)", borderRadius: 10, background: "var(--spidey-dark-850)", color: "var(--spidey-paper)", textAlign: "left", cursor: exists ? "default" : "pointer", opacity: exists ? 0.55 : 1 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.url} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 10 }}>{exists ? "Added" : asset.publicId?.split("/").pop() || "Add image"}</span>
                  </button>
                );
              })}
            </div>
          </details>

          <div>
            <h4 className="form-label" style={{ fontSize: 12, marginBottom: 10 }}>Composition · {gallery.images.length} images</h4>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {gallery.images.map((image, index) => {
                const isCenter = image.id === gallery.centerId;
                return (
                  <li key={image.id} style={{ display: "grid", gridTemplateColumns: "52px minmax(0, 1fr) auto", gap: 10, alignItems: "center", padding: 8, border: `1px solid ${isCenter ? "var(--line-active)" : "var(--line)"}`, borderRadius: 10, background: isCenter ? "var(--spidey-red-surface)" : "var(--spidey-dark-850)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt="" loading="lazy" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 7, background: "var(--spidey-dark-700)" }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--spidey-paper)", fontSize: 11 }}>{image.publicId?.split("/").pop() || `Photo ${index + 1}`}</span>
                      <label className="form-note" style={{ display: "block", marginTop: 4 }}>
                        Alt text
                        <input
                          className="form-input"
                          value={image.alt}
                          maxLength={300}
                          onChange={(event) => updateGallery((current) => ({
                            ...current,
                            images: current.images.map((candidate) => candidate.id === image.id ? { ...candidate, alt: event.target.value } : candidate),
                          }))}
                          style={{ minHeight: 32, marginTop: 3, padding: "4px 8px", fontSize: 10 }}
                        />
                      </label>
                      <button type="button" className="filter-chip" onClick={() => updateGallery((current) => ({ ...current, centerId: image.id }))} aria-pressed={isCenter} style={{ marginTop: 5, padding: "4px 8px", minHeight: 26 }}>
                        <Star size={12} fill={isCenter ? "currentColor" : "none"} /> {isCenter ? "Center image" : "Set as center"}
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="filter-chip" type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} up`} style={{ padding: "6px 7px", minHeight: 30 }}><ArrowUp size={13} /></button>
                      <button className="filter-chip" type="button" onClick={() => moveImage(index, 1)} disabled={index === gallery.images.length - 1} aria-label={`Move image ${index + 1} down`} style={{ padding: "6px 7px", minHeight: 30 }}><ArrowDown size={13} /></button>
                      <button className="filter-chip" type="button" onClick={() => removeImage(image.id)} disabled={gallery.images.length === 1} aria-label={`Remove image ${index + 1}`} style={{ padding: "6px 8px", minHeight: 30 }}>Remove</button>
                    </div>
                  </li>
                );
              })}
            </ol>
            {gallery.images.length === 1 && <p className="form-note">Add another image to show the surrounding radial cards.</p>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button type="button" className="button button-primary" onClick={() => void save()} disabled={saving || uploading || gallery.images.length === 0}>
              {saving ? "Saving…" : "Save About gallery"}
            </button>
            {status && <span className="form-note" role="status">{status}</span>}
            {uploading && <span className="form-note" role="status">Uploading images…</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
