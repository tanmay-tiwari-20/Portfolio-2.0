import { z } from "zod";
export const imageSchema = z.object({ url: z.string().url(), publicId: z.string().optional(), width: z.number().optional(), height: z.number().optional(), alt: z.string().default(""), fit: z.enum(["contain", "cover"]).optional(), position: z.string().optional() });
export const baseRecord = z.object({ id: z.string(), createdAt: z.string(), updatedAt: z.string(), sortOrder: z.number().default(0), isPublished: z.boolean().default(true) });
export const profileSchema = baseRecord.extend({ name: z.string(), role: z.string(), tagline: z.string(), bio: z.string(), location: z.string(), email: z.string().email(), resumeUrl: z.string().optional(), avatar: imageSchema.optional(), heroTitle: z.string(), stats: z.array(z.object({ label: z.string(), value: z.number() })) });
export const experienceSchema = baseRecord.extend({ role: z.string(), company: z.string(), period: z.string(), location: z.string(), description: z.string(), achievements: z.array(z.string()), tech: z.array(z.string()) });
export const projectSchema = baseRecord.extend({ title: z.string(), slug: z.string(), category: z.string(), description: z.string(), year: z.string(), cover: imageSchema, gallery: z.array(imageSchema), tags: z.array(z.string()), featured: z.boolean().default(false), liveUrl: z.string().optional(), githubUrl: z.string().optional() });
export const eventSchema = baseRecord.extend({ title: z.string(), date: z.string(), venue: z.string(), status: z.enum(["upcoming", "past"]), description: z.string(), attendees: z.number(), link: z.string().optional(), image: imageSchema.optional() });
export const hackathonSchema = baseRecord.extend({ name: z.string(), role: z.enum(["Judge", "Mentor", "Organizer"]), date: z.string(), organizer: z.string(), description: z.string(), teams: z.number(), link: z.string().optional() });
export const socialSchema = baseRecord.extend({ label: z.string(), href: z.string().url(), handle: z.string(), icon: z.string() });
export const aboutPopOutImageSchema = z.object({
  id: z.string().min(1).max(160),
  url: z.string().url(),
  publicId: z.string().min(1).max(300).optional(),
  alt: z.string().max(300).default(""),
});
export const aboutPopOutSchema = z.object({
  centerId: z.string().min(1).max(160),
  images: z.array(aboutPopOutImageSchema).min(1),
}).superRefine((gallery, context) => {
  const ids = new Set<string>();
  for (const [index, image] of gallery.images.entries()) {
    if (ids.has(image.id)) {
      context.addIssue({ code: "custom", path: ["images", index, "id"], message: "Image IDs must be unique." });
    }
    ids.add(image.id);
  }
  if (!ids.has(gallery.centerId)) {
    context.addIssue({ code: "custom", path: ["centerId"], message: "Choose a center image from the gallery." });
  }
});
export const aboutMomentSchema = z.object({
  id: z.string().min(1).max(160),
  url: z.string().url(),
  alt: z.string().max(300).default(""),
  title: z.string().min(1).max(140),
  caption: z.string().max(600),
});
export const aboutMomentsSchema = z.array(aboutMomentSchema).length(3);
export const settingsSchema = baseRecord.extend({
  title: z.string(),
  description: z.string(),
  ogImage: imageSchema.optional(),
  accent: z.string().default("#e62429"),
  aboutPopOut: aboutPopOutSchema.optional(),
  aboutMoments: aboutMomentsSchema.optional(),
});
export type ImageAsset = z.infer<typeof imageSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type CommunityEvent = z.infer<typeof eventSchema>;
export type Hackathon = z.infer<typeof hackathonSchema>;
export type SocialLink = z.infer<typeof socialSchema>;
export type SiteSettings = z.infer<typeof settingsSchema>;
export type AboutPopOutImage = z.infer<typeof aboutPopOutImageSchema>;
export type AboutPopOutConfig = z.infer<typeof aboutPopOutSchema>;
export type AboutMoment = z.infer<typeof aboutMomentSchema>;
