import { hackathonMoments } from "@/data/hackathon-moments";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import type { AboutMoment, ImageAsset, AboutPopOutConfig, AboutPopOutImage } from "@/lib/validators/schemas";
import { aboutMomentsSchema, aboutPopOutSchema } from "@/lib/validators/schemas";

export function createDefaultAboutMoments(): AboutMoment[] {
  return hackathonMoments.slice(0, 3).map((moment, index) => ({
    id: `about-story-${index + 1}`,
    url: moment.src,
    alt: moment.alt,
    title: moment.title,
    caption: moment.caption,
  }));
}

export function resolveAboutMoments(value: unknown): AboutMoment[] {
  const parsed = aboutMomentsSchema.safeParse(value);
  if (!parsed.success || !parsed.data.every((moment) => isCloudinaryImageUrl(moment.url))) {
    return createDefaultAboutMoments();
  }
  return parsed.data;
}

export function createDefaultAboutPopOut(avatar?: ImageAsset | null): AboutPopOutConfig {
  const portrait = avatar?.url && isCloudinaryImageUrl(avatar.url)
    ? {
        id: "profile-avatar",
        url: avatar.url,
        publicId: avatar.publicId,
        alt: avatar.alt || "Tanmay Tiwari",
      }
    : null;
  const moments: AboutPopOutImage[] = hackathonMoments.map((moment, index) => ({
    id: `hackathon-moment-${index + 1}`,
    url: moment.src,
    alt: moment.alt,
  }));
  const images = portrait ? [portrait, ...moments] : moments;
  return { centerId: portrait?.id || moments[0]?.id || "", images };
}

export function resolveAboutPopOut(
  value: unknown,
  avatar?: ImageAsset | null,
): AboutPopOutConfig {
  const parsed = aboutPopOutSchema.safeParse(value);
  if (!parsed.success) return createDefaultAboutPopOut(avatar);

  const images = parsed.data.images.filter((image) => isCloudinaryImageUrl(image.url));
  const safe = aboutPopOutSchema.safeParse({ ...parsed.data, images });
  return safe.success ? safe.data : createDefaultAboutPopOut(avatar);
}
