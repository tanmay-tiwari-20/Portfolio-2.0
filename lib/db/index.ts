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
