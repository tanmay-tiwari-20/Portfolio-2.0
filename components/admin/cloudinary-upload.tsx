"use client";

import { useRef, useState } from "react";
import type { ImageAsset } from "@/lib/validators/schemas";

type UploadItem = ImageAsset & { progress: number; localId: string; saved: boolean };

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

  function update(next: UploadItem[]) {
    current.current = next;
    setItems(next);
    onChange(next
      .filter((item) => item.progress === 100 && !item.url.startsWith("blob:"))
      .map(({ url, publicId, width, height, alt }) => ({ url, publicId, width, height, alt })));
  }

  async function upload(files: FileList | null) {
    if (!files) return;
    setError("");
    onUploadingChange?.(true);
    try {
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type)) {
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
        { url: previewUrl, publicId: "", width: 0, height: 0, alt: file.name, progress: 0, localId, saved: false },
      ]);

      try {
        const signature = await fetch("/api/admin/cloudinary-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section }),
        });
        const credentials = await signature.json();
        if (!signature.ok) throw new Error(credentials.error || "Could not prepare upload.");

        const form = new FormData();
        form.append("file", file);
        form.append("api_key", credentials.apiKey);
        form.append("timestamp", String(credentials.timestamp));
        form.append("folder", credentials.folder);
        form.append("allowed_formats", credentials.allowedFormats);
        form.append("signature", credentials.signature);

        const asset = await new Promise<ImageAsset>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              update(current.current.map((item) =>
                item.localId === localId
                  ? { ...item, progress: Math.round((event.loaded / event.total) * 100) }
                  : item,
              ));
            }
          };
          xhr.onload = () => {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
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
          xhr.send(form);
        });

        URL.revokeObjectURL(previewUrl);
        const uploaded = { ...asset, progress: 100, localId, saved: false };
        if (multiple) {
          update(current.current.map((item) => item.localId === localId ? uploaded : item));
        } else {
          const replaced = current.current.filter((item) => item.localId !== localId);
          for (const item of replaced) {
            if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
            if (!item.saved && item.publicId) {
              await fetch("/api/admin/media", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicId: item.publicId }),
              });
            }
          }
          update([uploaded]);
        }
      } catch (cause) {
        URL.revokeObjectURL(previewUrl);
        update(current.current.filter((item) => item.localId !== localId));
        setError(cause instanceof Error ? cause.message : "Upload failed.");
      }
    }
    if (input.current) input.current.value = "";
    } finally {
      onUploadingChange?.(false);
    }
  }

  async function remove(item: UploadItem) {
    if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
    update(current.current.filter((value) => value.localId !== item.localId));
    // Saved files are deleted after a successful content update identifies them
    // as orphaned. Unsaved uploads can be removed immediately.
    if (!item.saved && item.publicId) {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: item.publicId }),
      });
      if (!response.ok) setError("Removed from this draft, but Cloudinary could not delete the asset.");
    }
  }

  return (
    <div className="upload-box">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple={multiple}
        hidden
        onChange={(event) => void upload(event.target.files)}
      />
      <button type="button" className="filter-chip" onClick={() => input.current?.click()}>
        Choose image{multiple ? "s" : ""} · max 5 MB
      </button>
      {error && <p className="form-note" role="alert">{error}</p>}
      <div className="upload-previews">
        {items.map((item) => (
          <div key={item.localId}>
            {/* Local blob previews cannot use Next's image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt} />
            <label className="form-note">
              Alt text
              <input
                value={item.alt}
                onChange={(event) => update(current.current.map((value) =>
                  value.localId === item.localId ? { ...value, alt: event.target.value } : value,
                ))}
              />
            </label>
            {item.progress < 100 && <progress max="100" value={item.progress} />}
            <button type="button" className="filter-chip" onClick={() => void remove(item)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
