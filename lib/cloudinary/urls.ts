import { isCloudinaryImageUrl } from "./image-url";

/** Keep existing crops/backgrounds, then size the delivered result last. */
function transformCloudinary(source: string, transformation: string) {
  const url = new URL(source);
  const marker = "/image/upload/";
  const start = url.pathname.indexOf(marker) + marker.length;
  const parts = url.pathname.slice(start).split("/");
  const version = parts.findIndex((part) => /^v\d+$/.test(part));
  // Versioned delivery URLs are unambiguous. For unversioned URLs, only skip
  // recognizable transformation components; do not mistake folders for options.
  let insertion = version;
  if (insertion < 0) {
    insertion = 0;
    while (
      insertion < parts.length - 1 &&
      /^(?:(?:a|ar|b|bo|c|co|cs|d|dl|dn|dpr|du|e|eo|f|fl|fn|fps|g|h|if|l|o|p|pg|q|r|so|t|u|vc|vs|w|x|y|z)_|\$)/.test(parts[insertion])
    )
      insertion++;
  }
  parts.splice(insertion, 0, transformation);
  url.pathname = url.pathname.slice(0, start) + parts.join("/");
  return url.toString();
}

export function getOptimizedUrl(url: string, width = 1200, height?: number) {
  if (isCloudinaryImageUrl(url)) {
    const crop = height
      ? `c_fill,g_auto,w_${width},h_${height}`
      : `c_limit,w_${width}`;
    return transformCloudinary(url, `f_auto,q_auto,${crop}`);
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" && parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "80");
      parsed.searchParams.set("auto", "format");
      if (height) {
        parsed.searchParams.set("h", String(height));
        parsed.searchParams.set("fit", "crop");
      }
      return parsed.toString();
    }
  } catch {}
  return url;
}

export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (isCloudinaryImageUrl(src))
    return transformCloudinary(src, `f_auto,q_${quality || "auto"},c_limit,w_${width}`);
  try {
    const parsed = new URL(src);
    if (parsed.protocol === "https:" && parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", String(quality || 80));
      parsed.searchParams.set("auto", "format");
      return parsed.toString();
    }
  } catch {}
  return src;
}

export function cloudinaryBlurDataURL(url: string) {
  return getOptimizedUrl(url, 24, 16);
}
