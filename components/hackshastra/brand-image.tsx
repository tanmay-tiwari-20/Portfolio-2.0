"use client";

import Image from "next/image";
import { useState } from "react";
import { cloudinaryLoader } from "@/lib/cloudinary/urls";

/** Keep official artwork intact; Cloudinary only resizes and compresses it. */
export default function BrandImage({
  src,
  alt,
  sizes,
  className = "object-cover",
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (failedSource === src) {
    return (
      <div className="hs-image-fallback absolute inset-0 flex items-center justify-center p-8 text-center">
        <span className="max-w-64 text-sm leading-relaxed">{alt}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      loader={cloudinaryLoader}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={className}
      onError={() => setFailedSource(src)}
    />
  );
}
