"use client";
import { useRef, useState } from "react";
import type { ImageAsset } from "@/lib/validators/schemas";
type UploadItem = ImageAsset & { progress: number; localId: string };
export default function CloudinaryUpload({ section = "projects", multiple = false, onChange }: { section?: string; multiple?: boolean; onChange: (assets: ImageAsset[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const current = useRef<UploadItem[]>([]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [error, setError] = useState("");
  function update(next: UploadItem[]) {
    current.current = next; setItems(next);
    onChange(next.map(({ url, publicId, width, height, alt }) => ({ url, publicId, width, height, alt })));
  }
  async function upload(files: FileList | null) {
    if (!files) return;
    setError("");
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { setError("Choose image files only."); continue; }
      if (file.size > 5 * 1024 * 1024) { setError(`${file.name} is larger than 5 MB.`); continue; }
      const localId = crypto.randomUUID();
      if (!multiple) update([]);
      update([...current.current, { url: URL.createObjectURL(file), publicId: "", width: 0, height: 0, alt: file.name, progress: 0, localId }]);
      try {
        const signature = await fetch("/api/admin/cloudinary-sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section }) });
        const credentials = await signature.json();
        if (!signature.ok) throw new Error(credentials.error || "Could not prepare upload.");
        const form = new FormData();
        form.append("file", file); form.append("api_key", credentials.apiKey); form.append("timestamp", String(credentials.timestamp)); form.append("folder", credentials.folder); form.append("signature", credentials.signature);
        const asset = await new Promise<ImageAsset>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`);
          xhr.upload.onprogress = event => { if (event.lengthComputable) update(current.current.map(item => item.localId === localId ? { ...item, progress: Math.round(event.loaded / event.total * 100) } : item)); };
          xhr.onload = () => { const result = JSON.parse(xhr.responseText); if (xhr.status >= 200 && xhr.status < 300) resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, alt: file.name }); else reject(new Error(result.error?.message || "Upload failed.")); };
          xhr.onerror = () => reject(new Error("Upload failed.")); xhr.send(form);
        });
        update(current.current.map(item => item.localId === localId ? { ...asset, progress: 100, localId } : item));
      } catch (cause) {
        update(current.current.filter(item => item.localId !== localId));
        setError(cause instanceof Error ? cause.message : "Upload failed.");
      }
    }
    if (input.current) input.current.value = "";
  }
  async function remove(item: UploadItem) { URL.revokeObjectURL(item.url); update(current.current.filter(value => value.localId !== item.localId)); if (item.publicId) { const response = await fetch("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: item.publicId }) }); if (!response.ok) setError("Removed from this draft, but Cloudinary could not delete the asset."); } }
  return <div className="upload-box"><input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={event => void upload(event.target.files)}/><button type="button" className="filter-chip" onClick={() => input.current?.click()}>Choose image{multiple ? "s" : ""} · max 5 MB</button>{error && <p className="form-note" role="alert">{error}</p>}<div className="upload-previews">{items.map(item => <div key={item.localId}><img src={item.url} alt={item.alt}/><label className="form-note">Alt text<input value={item.alt} onChange={event => update(current.current.map(value => value.localId === item.localId ? { ...value, alt: event.target.value } : value))}/></label>{item.progress < 100 && <progress max="100" value={item.progress}/>}<button type="button" className="filter-chip" onClick={() => remove(item)}>Remove</button></div>)}</div></div>;
}

