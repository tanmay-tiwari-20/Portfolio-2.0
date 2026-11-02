import { isCloudinaryImageUrl } from "@/lib/cloudinary/image-url";
import {
  aboutPageSchema,
  type AboutPageContent,
} from "@/lib/validators/schemas";

// These are the existing below-hero page contents. Missing settings keep the
// published experience intact; reading defaults never writes a database record.
const defaultAboutPageContent: AboutPageContent = {
  practice: {
    title: "The work.",
    subtitle: "And what goes",
    accent: "into it.",
    note: "The product, the details, and the people building alongside me.",
    chapters: [
      {
        label: "Engineering",
        title: "Build the",
        accent: "whole thing.",
        body: "I built Unoverse, a real-time 3D multiplayer game, and the platforms behind HackShastra. My work with Next.js and TypeScript connects responsive interfaces, APIs, registration flows, and dashboards—all the way through deployment.",
        details: ["Next.js & TypeScript", "Interfaces → APIs → deployment"],
        caption: "Ideas become working products.",
      },
      {
        label: "Interaction",
        title: "Sweat the",
        accent: "small things.",
        body: "On HackShastra’s website, the interaction is as much a part of the work as the underlying code. I work on responsive layouts, motion, performance, and accessibility so the interface feels considered at every size.",
        details: ["Interaction & motion", "Performance & accessibility"],
        caption: "The details are part of the experience.",
      },
      {
        label: "Community",
        title: "Share what",
        accent: "you learn.",
        body: "I co-founded HackShastra to bring student builders together. Alongside building its platforms and organizing events, I mentor teams as they turn early ideas into working projects.",
        details: ["HackShastra co-founder", "Hackathons, meetups & mentoring"],
        caption: "More people. More ways to build.",
      },
    ],
  },
  community: {
    title: "Better,",
    accent: "together.",
    lead: "Some of my most useful work happens on the other side of a laptop.",
    body: "I co-founded HackShastra to help students build together. That means creating the platforms behind our events, organising hackathons, and sitting with teams as they turn a rough idea into a working demo.",
    noteTitle: "Helping someone find their",
    noteAccent: "next step.",
    noteBody:
      "Sometimes it’s an API that won’t behave. Sometimes it’s deciding what to build first. I like being there for both.",
    impactText:
      "Through hackathons, project reviews, and the conversations in between. Teaching keeps me learning, too.",
    archiveTitle: "A few rooms\nI’ve been part of.",
  },
  experience: {
    title: "Learning",
    accent: "by building.",
    body: "From client projects to a community of my own. Each role has taught me to think past the feature and take responsibility for how it works.",
  },
  contact: {
    title: "Have something",
    accent: "in mind?",
    body: "A product to build, an event to shape,\nor an idea worth talking through.",
  },
};

export function createDefaultAboutPageContent(): AboutPageContent {
  // Zod produces an independent nested object, safe for an editor to update.
  return aboutPageSchema.parse(defaultAboutPageContent);
}

export function resolveAboutPageContent(value: unknown): AboutPageContent {
  const parsed = aboutPageSchema.safeParse(value);
  return parsed.success ? parsed.data : createDefaultAboutPageContent();
}

/** Early image validation for the existing admin POST/PATCH settings route. */
export function hasSafeAboutPageImageUrls(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const practice = (value as Record<string, unknown>).practice;
  // The full content schema reports missing copy/structure separately.
  if (practice === undefined) return true;
  if (!practice || typeof practice !== "object" || Array.isArray(practice))
    return false;
  const chapters = (practice as Record<string, unknown>).chapters;
  if (chapters === undefined) return true;
  if (!Array.isArray(chapters)) return false;
  return chapters.every((chapter) => {
    if (!chapter || typeof chapter !== "object" || Array.isArray(chapter))
      return false;
    const image = (chapter as Record<string, unknown>).image;
    if (image === undefined || image === null) return true;
    if (typeof image !== "object" || Array.isArray(image)) return false;
    const url = (image as Record<string, unknown>).url;
    return typeof url === "string" && isCloudinaryImageUrl(url);
  });
}
