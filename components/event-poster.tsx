"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import { getOptimizedUrl } from "@/lib/cloudinary/urls";

export default function EventPoster({ url, alt }: { url?: string; alt: string }) {
  const validUrl = url && isCloudinaryImageUrl(url) ? getOptimizedUrl(url, 640) : null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!validUrl || failedUrl === validUrl) {
    return (
      <div className="community-event-poster community-event-poster-fallback" role="img" aria-label={alt}>
        <ImageOff size={22} aria-hidden="true" />
        <span>{url ? "Poster unavailable" : "No poster"}</span>
      </div>
    );
  }

  return (
    <Image
      className="community-event-poster"
      src={validUrl}
      alt={alt}
      width={210}
      height={280}
      loading="lazy"
      unoptimized
      onError={() => setFailedUrl(validUrl)}
    />
  );
}
