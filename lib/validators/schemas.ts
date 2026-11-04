import { z } from "zod";
import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
const safeUrl = z.string().refine((value) => { if (!value) return true; try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; } }, "Enter a valid HTTP or HTTPS URL.");
const imageUrl = z.string().url().refine((value) => { try { const host = new URL(value).hostname; return host === "res.cloudinary.com" || host === "images.unsplash.com" || host.endsWith(".cloudinary.com"); } catch { return false; } }, "Use a supported image host.");
export const imageSchema = z.object({ url: imageUrl, publicId: z.string().optional(), width: z.number().optional(), height: z.number().optional(), alt: z.string().default(""), fit: z.enum(["contain", "cover"]).optional(), position: z.string().optional() });
export const baseRecord = z.object({ id: z.string(), createdAt: z.string(), updatedAt: z.string(), sortOrder: z.number().default(0), isPublished: z.boolean().default(true) });
export const profileSchema = baseRecord.extend({ name: z.string(), role: z.string(), tagline: z.string(), bio: z.string(), location: z.string(), email: z.string().email(), resumeUrl: z.string().optional(), avatar: imageSchema.optional(), heroTitle: z.string(), stats: z.array(z.object({ label: z.string(), value: z.number() })) });
export const experienceSchema = baseRecord.extend({ role: z.string(), company: z.string(), period: z.string(), location: z.string(), description: z.string(), achievements: z.array(z.string()), tech: z.array(z.string()) });
export const projectSchema = baseRecord.extend({ title: z.string(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."), category: z.string(), description: z.string(), year: z.string().regex(/^(?:19|20)\d{2}$/), cover: imageSchema, gallery: z.array(imageSchema), tags: z.array(z.string()), featured: z.boolean().default(false), liveUrl: safeUrl.optional(), githubUrl: safeUrl.optional() });
export const eventSchema = baseRecord.extend({
  title: z.string().trim().min(1).max(180),
  date: z.string().trim().min(1).max(120),
  displayDate: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  role: z.string().trim().max(180).optional(),
  // Set only by an explicit event reorder. Legacy records keep chronology.
  archiveOrder: z.number().int().nonnegative().optional(),
  venue: z.string().trim().max(240),
  status: z.enum(["upcoming", "past"]),
  description: z.string().max(2000),
  attendees: z.number().int().nonnegative().default(0),
  link: z.string().trim().refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch { return false; }
  }, "Enter a valid HTTPS event URL.").optional(),
  image: imageSchema.optional(),
});
export const hackathonSchema = baseRecord.extend({ name: z.string(), role: z.enum(["Judge", "Mentor", "Organizer"]), date: z.string(), organizer: z.string(), description: z.string(), teams: z.number(), link: z.string().optional() });
export const socialSchema = baseRecord.extend({ label: z.string(), href: z.string().url().refine((value) => value.startsWith("https://")), handle: z.string(), icon: z.string() });
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
const aboutCopy = (max: number) => z.string().trim().min(1).max(max);
const aboutPageImageSchema = imageSchema.refine(
  (image) => isCloudinaryImageUrl(image.url),
  "Use a valid HTTPS Cloudinary image URL.",
);
export const aboutPracticeChapterSchema = z.object({
  label: aboutCopy(40),
  title: aboutCopy(40),
  accent: aboutCopy(40),
  body: aboutCopy(400),
  details: z.tuple([aboutCopy(80), aboutCopy(80)]),
  caption: aboutCopy(160),
  image: aboutPageImageSchema.nullable().optional(),
});
export const aboutPageSchema = z.object({
  practice: z.object({
    title: aboutCopy(80),
    subtitle: aboutCopy(80),
    accent: aboutCopy(80),
    note: aboutCopy(300),
    chapters: z.tuple([
      aboutPracticeChapterSchema,
      aboutPracticeChapterSchema,
      aboutPracticeChapterSchema,
    ]),
  }),
  community: z.object({
    title: aboutCopy(80),
    accent: aboutCopy(80),
    lead: aboutCopy(300),
    body: aboutCopy(800),
    noteTitle: aboutCopy(120),
    noteAccent: aboutCopy(80),
    noteBody: aboutCopy(600),
    impactText: aboutCopy(500),
    archiveTitle: aboutCopy(180),
  }),
  experience: z.object({
    title: aboutCopy(80),
    accent: aboutCopy(80),
    body: aboutCopy(600),
  }),
  contact: z.object({
    title: aboutCopy(80),
    accent: aboutCopy(80),
    body: aboutCopy(600),
  }),
});
export const settingsSchema = baseRecord.extend({
  title: z.string(),
  description: z.string(),
  ogImage: imageSchema.optional(),
  accent: z.string().default("#e62429"),
  aboutPopOut: aboutPopOutSchema.optional(),
  aboutMoments: aboutMomentsSchema.optional(),
  aboutPracticeImage: imageSchema.nullable().optional(),
  aboutPracticeImage2: imageSchema.nullable().optional(),
  aboutPage: aboutPageSchema.optional(),
});
// Partial Zod schemas can still materialize defaults. A settings patch should
// update only supplied fields while keeping unknown fields stripped by parsing.
export function pickSubmittedPatchFields<T extends Record<string, unknown>>(
  parsed: T,
  submitted: Record<string, unknown>,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => Object.hasOwn(submitted, key)),
  ) as Partial<T>;
}
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
export type AboutPageContent = z.infer<typeof aboutPageSchema>;
export type AboutPracticeChapter = z.infer<typeof aboutPracticeChapterSchema>;
