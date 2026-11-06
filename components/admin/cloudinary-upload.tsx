"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import type { ImageAsset } from "@/lib/validators/schemas";

type UploadItem = ImageAsset & {
  progress: number;
  localId: string;
  saved: boolean;
};

export default function CloudinaryUpload({
  section = "projects",
  multiple = false,
  initialAssets = [],
  onUploadingChange,
  onChange,
}: {
  section?: string;
  multiple?: boolean;
  initialAssets?: ImageAsset[];
  onUploadingChange?: (uploading: boolean) => void;
  onChange: (assets: ImageAsset[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const busy = useRef(false);
  const mounted = useRef(true);
  const activeRequest = useRef<XMLHttpRequest | null>(null);
  const signingRequest = useRef<AbortController | null>(null);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<UploadItem[]>(() =>
    initialAssets.map((asset, index) => ({
      ...asset,
      progress: 100,
      localId: `saved-${index}`,
      saved: true,
    })),
  );
  const current = useRef<UploadItem[]>(items);
  const [error, setError] = useState("");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      signingRequest.current?.abort();
      activeRequest.current?.abort();
      for (const item of current.current) {
        if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
      }
    };
  }, []);

  function update(next: UploadItem[], notify = true) {
    if (!mounted.current) return;
    current.current = next;
    setItems(next);
    if (notify)
      onChange(
        next
          .filter(
            (item) => item.progress === 100 && !item.url.startsWith("blob:"),
          )
          .map(({ url, publicId, width, height, alt, fit, position }) => ({
            url,
            publicId,
            width,
            height,
            alt,
            fit,
            position,
          })),
      );
  }

  async function upload(files: FileList | null) {
    if (!files?.length || busy.current) return;
    busy.current = true;
    setUploading(true);
    setError("");
    onUploadingChange?.(true);
    try {
      for (const file of multiple
        ? Array.from(files)
        : Array.from(files).slice(0, 1)) {
        if (!mounted.current) break;
        if (
          ![
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif",
          ].includes(file.type)
        ) {
          setError("Choose a JPEG, PNG, WebP, GIF, or AVIF image.");
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} is larger than 5 MB.`);
          continue;
        }

        const localId = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        update([
          ...current.current,
          {
            url: previewUrl,
            publicId: "",
            width: 0,
            height: 0,
            alt: file.name,
            progress: 0,
            localId,
            saved: false,
          },
        ]);

        try {
          signingRequest.current = new AbortController();
          const signature = await fetch("/api/admin/cloudinary-sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section }),
            signal: signingRequest.current.signal,
          });
          const credentials = await signature.json();
          if (!signature.ok)
            throw new Error(credentials.error || "Could not prepare upload.");

          const form = new FormData();
          form.append("file", file);
          form.append("api_key", credentials.apiKey);
          form.append("timestamp", String(credentials.timestamp));
          form.append("folder", credentials.folder);
          form.append("allowed_formats", credentials.allowedFormats);
          form.append("signature", credentials.signature);

          const asset = await new Promise<ImageAsset>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            activeRequest.current = xhr;
            xhr.open(
              "POST",
              `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`,
            );
            xhr.timeout = 120_000;
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                update(
                  current.current.map((item) =>
                    item.localId === localId
                      ? {
                          ...item,
                          progress: Math.min(
                            99,
                            Math.round((event.loaded / event.total) * 100),
                          ),
                        }
                      : item,
                  ),
                  false,
                );
              }
            };
            xhr.onload = () => {
              let result;
              try {
                result = JSON.parse(xhr.responseText);
              } catch {
                reject(
                  new Error(
                    "The image service returned an invalid response. Try again.",
                  ),
                );
                return;
              }
              if (xhr.status >= 200 && xhr.status < 300) {
                if (
                  typeof result.secure_url !== "string" ||
                  !result.secure_url.startsWith(
                    "https://res.cloudinary.com/",
                  ) ||
                  typeof result.public_id !== "string"
                ) {
                  reject(
                    new Error(
                      "The image service did not return a valid image.",
                    ),
                  );
                  return;
                }
                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                  width: result.width,
                  height: result.height,
                  alt: file.name,
                });
              } else {
                reject(new Error(result.error?.message || "Upload failed."));
              }
            };
            xhr.onerror = () => reject(new Error("Upload failed."));
            xhr.ontimeout = () =>
              reject(
                new Error(
                  "The upload timed out. Your saved image has not changed.",
                ),
              );
            xhr.onabort = () => reject(new Error("Upload cancelled."));
            xhr.send(form);
          });

          URL.revokeObjectURL(previewUrl);
          const uploaded = { ...asset, progress: 100, localId, saved: false };
          if (multiple) {
            update(
              current.current.map((item) =>
                item.localId === localId ? uploaded : item,
              ),
            );
          } else {
            const replaced = current.current.filter(
              (item) => item.localId !== localId,
            );
            for (const item of replaced) {
              if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
              if (!item.saved && item.publicId) {
                const cleanup = await fetch("/api/admin/media", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ publicId: item.publicId }),
                }).catch(() => null);
                if (!cleanup?.ok && mounted.current)
                  setError(
                    "The replacement is ready, but the previous unused upload could not be removed from the media library.",
                  );
              }
            }
            update([uploaded]);
          }
        } catch (cause) {
          URL.revokeObjectURL(previewUrl);
          update(current.current.filter((item) => item.localId !== localId));
          if (mounted.current)
            setError(cause instanceof Error ? cause.message : "Upload failed.");
        }
      }
      if (input.current) input.current.value = "";
    } finally {
      busy.current = false;
      activeRequest.current = null;
      signingRequest.current = null;
      if (mounted.current) {
        setUploading(false);
        onUploadingChange?.(false);
      }
    }
  }

  async function remove(item: UploadItem) {
    if (busy.current) return;
    if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
    update(current.current.filter((value) => value.localId !== item.localId));
    // Saved files are deleted after a successful content update identifies them
    // as orphaned. Unsaved uploads can be removed immediately.
    if (!item.saved && item.publicId) {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: item.publicId }),
      }).catch(() => null);
      if (!response?.ok && mounted.current)
        setError(
          "Removed from this draft, but Cloudinary could not delete the asset.",
        );
    }
  }

  return (
    <div className="upload-box" aria-busy={uploading}>
      <input
        ref={input}
        id={inputId}
        aria-label={`Choose ${section} image${multiple ? "s" : ""}`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple={multiple}
        hidden
        disabled={uploading}
        onChange={(event) => void upload(event.target.files)}
      />
      <button
        type="button"
        className="filter-chip inline-flex items-center gap-2"
        disabled={uploading}
        onClick={() => input.current?.click()}
      >
        {uploading ? (
          <LoaderCircle
            size={16}
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <ImagePlus size={16} aria-hidden="true" />
        )}
        {uploading
          ? "Uploading image…"
          : `${!multiple && items.length ? "Replace" : "Choose"} image${multiple ? "s" : ""}`}
      </button>
      <p className="form-help-text">
        JPEG, PNG, WebP, GIF or AVIF · up to 5 MB each.
      </p>
      {error && (
        <p className="form-note" role="alert">
          {error}
        </p>
      )}
      <div className="upload-previews">
        {items.map((item) => (
          <div key={item.localId} className="min-w-0">
            {/* Local blob previews cannot use Next's image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.alt || "Image preview"}
              loading="lazy"
              decoding="async"
            />
            {Boolean(item.width && item.height) && (
              <p className="form-help-text">
                {item.width} × {item.height} px
              </p>
            )}
            <label className="form-note">
              Alt text
              <input
                value={item.alt}
                className="form-input"
                maxLength={300}
                disabled={uploading}
                onChange={(event) =>
                  update(
                    current.current.map((value) =>
                      value.localId === item.localId
                        ? { ...value, alt: event.target.value }
                        : value,
                    ),
                  )
                }
              />
            </label>
            {item.progress < 100 && (
              <div className="grid gap-1">
                <progress
                  aria-label={`Uploading ${item.alt || "image"}`}
                  max="100"
                  value={item.progress}
                />
                <span className="form-help-text">
                  {item.progress < 99
                    ? `${item.progress}% uploaded`
                    : "Finishing upload…"}
                </span>
              </div>
            )}
            <button
              type="button"
              className="filter-chip inline-flex items-center gap-2"
              disabled={uploading}
              aria-label={`Remove ${item.alt || "image"} from draft`}
              onClick={() => void remove(item)}
            >
              <Trash2 size={14} aria-hidden="true" /> Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
