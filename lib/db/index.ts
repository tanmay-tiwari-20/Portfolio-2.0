import { UnifiedRepository } from "@/lib/db/repository";
import {
  experienceSchema,
  eventSchema,
  hackathonSchema,
  projectSchema,
  profileSchema,
  socialSchema,
  settingsSchema,
} from "@/lib/validators/schemas";
import profile from "@/data/profile.json";
import experiences from "@/data/experiences.json";
import projects from "@/data/projects.json";
import events from "@/data/community-events.json";
import hackathons from "@/data/hackathons.json";
import socials from "@/data/social-links.json";
import settings from "@/data/site-settings.json";
import { resolveContactLinks } from "@/lib/contact-links";
import type { SocialLink } from "@/lib/validators/schemas";

export const repos = {
  profile: new UnifiedRepository("profile", "profile.json", profileSchema, profile as never),
  experiences: new UnifiedRepository("experiences", "experiences.json", experienceSchema, experiences as never),
  projects: new UnifiedRepository("projects", "projects.json", projectSchema, projects as never),
  events: new UnifiedRepository("community_events", "community-events.json", eventSchema, events as never),
  hackathons: new UnifiedRepository("hackathons", "hackathons.json", hackathonSchema, hackathons as never),
  socials: new UnifiedRepository("social_links", "social-links.json", socialSchema, socials as never),
  settings: new UnifiedRepository("site_settings", "site-settings.json", settingsSchema, settings as never),
};

export async function published<T extends { isPublished?: boolean; sortOrder?: number }>(
  repo: { getAll(): Promise<T[]> }
) {
  const all = await repo.getAll();
  return all
    .filter((x) => x.isPublished !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

// Keep public navigation, content and structured data on the same verified
// profiles. Raw records remain editable in the authenticated admin workspace.
export async function publicSocials(): Promise<SocialLink[]> {
  const rows = await published(repos.socials);
  return resolveContactLinks(rows).map((link, index) => ({
    id: `public-${link.platform}-${index}`,
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
    sortOrder: index,
    isPublished: true,
    label: link.label,
    href: link.href,
    handle: link.label,
    icon: link.platform,
  }));
}
