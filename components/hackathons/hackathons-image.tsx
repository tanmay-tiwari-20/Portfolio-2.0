"use client";
import Image from "next/image";
import { cloudinaryLoader } from "@/lib/cloudinary/urls";

export default function HackathonsImage({
  src,
  alt,
  className = "",
  sizes = "(max-width: 767px) 100vw, 50vw",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image
      loader={cloudinaryLoader}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`hk-image ${className}`}
    />
  );
}
