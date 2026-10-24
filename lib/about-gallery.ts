import { hackathonMoments } from "@/data/hackathon-moments";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import type { ImageAsset, AboutPopOutConfig, AboutPopOutImage } from "@/lib/validators/schemas";
import { aboutPopOutSchema } from "@/lib/validators/schemas";

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
