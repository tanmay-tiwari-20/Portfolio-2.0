import type { SocialLink } from "@/lib/validators/schemas";

export type ContactPlatform =
  | "github"
  | "linkedin"
  | "instagram"
  | "x"
  | "youtube"
  | "facebook"
  | "threads"
  | "discord"
  | "telegram"
  | "tiktok"
  | "dribbble"
  | "behance"
  | "medium"
  | "stackoverflow"
  | "website";
export type ContactLink = {
  platform: ContactPlatform;
  label: string;
  href: string;
  detail: string;
};
type Brand = Omit<ContactLink, "href">;

// Owner profiles already used by contribution-city and hackathons-experience.
const verifiedProfiles: Partial<Record<ContactPlatform, string>> = {
  github: "https://github.com/tanmay-tiwari-20",
  linkedin: "https://www.linkedin.com/in/tanmay-tiwari20/",
};
const platforms: Record<string, Brand> = {
  "github.com": {
    platform: "github",
    label: "GitHub",
    detail: "The code behind the ideas",
  },
  "linkedin.com": {
    platform: "linkedin",
    label: "LinkedIn",
    detail: "Work, people & possibilities",
  },
  "in.linkedin.com": {
    platform: "linkedin",
    label: "LinkedIn",
    detail: "Work, people & possibilities",
  },
  "instagram.com": {
    platform: "instagram",
    label: "Instagram",
    detail: "A little beyond the work",
  },
  "x.com": { platform: "x", label: "X", detail: "Thoughts along the way" },
  "twitter.com": {
    platform: "x",
    label: "X",
    detail: "Thoughts along the way",
  },
  "youtube.com": {
    platform: "youtube",
    label: "YouTube",
    detail: "Ideas in motion",
  },
  "youtu.be": {
    platform: "youtube",
    label: "YouTube",
    detail: "Ideas in motion",
  },
  "facebook.com": {
    platform: "facebook",
    label: "Facebook",
    detail: "Stay connected",
  },
  "threads.net": {
    platform: "threads",
    label: "Threads",
    detail: "Join the conversation",
  },
  "threads.com": {
    platform: "threads",
    label: "Threads",
    detail: "Join the conversation",
  },
  "discord.com": {
    platform: "discord",
    label: "Discord",
    detail: "Connect with the community",
  },
  "discord.gg": {
    platform: "discord",
    label: "Discord",
    detail: "Connect with the community",
  },
  "t.me": { platform: "telegram", label: "Telegram", detail: "Say hello" },
  "telegram.me": {
    platform: "telegram",
    label: "Telegram",
    detail: "Say hello",
  },
  "tiktok.com": {
    platform: "tiktok",
    label: "TikTok",
    detail: "Beyond the work",
  },
  "dribbble.com": {
    platform: "dribbble",
    label: "Dribbble",
    detail: "Design explorations",
  },
  "behance.net": {
    platform: "behance",
    label: "Behance",
    detail: "Selected creative work",
  },
  "medium.com": {
    platform: "medium",
    label: "Medium",
    detail: "Stories and ideas",
  },
  "stackoverflow.com": {
    platform: "stackoverflow",
    label: "Stack Overflow",
    detail: "Code and conversations",
  },
};

function isLookalike(hostname: string) {
  return Object.keys(platforms).some(
    (host) =>
      hostname.startsWith(`${host}.`) ||
      hostname.endsWith(`.${host}`) ||
      (host.split(".")[0].length > 2 && hostname.endsWith(host)),
  );
}

export function resolveContactLinks(socials: SocialLink[]): ContactLink[] {
  const candidates: Array<{ link: ContactLink; fallback: boolean }> = [];
  for (const social of socials) {
    if (social.isPublished === false) continue;
    try {
      const url = new URL(social.href);
      const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.port ||
        !hostname.includes(".")
      )
        continue;
      const brand = Object.hasOwn(platforms, hostname)
        ? platforms[hostname]
        : undefined;
      if (!brand && isLookalike(hostname)) continue;
      const fallback = Boolean(brand && !url.pathname.replace(/\//g, ""));
      const href = fallback ? verifiedProfiles[brand!.platform] : social.href;
      if (!href) continue;
      candidates.push({
        fallback,
        link: {
          ...(brand || {
            platform: "website" as const,
            label: social.label.trim() || hostname,
            detail: social.handle.trim() || "Open profile",
          }),
          href,
        },
      });
    } catch {
      continue;
    }
  }
  const actualPlatforms = new Set(
    candidates
      .filter(({ fallback }) => !fallback)
      .map(({ link }) => link.platform),
  );
  const seen = new Set<string>();
  return candidates.flatMap(({ link, fallback }) => {
    if (fallback && actualPlatforms.has(link.platform)) return [];
    const identity = new URL(link.href).href;
    if (seen.has(identity)) return [];
    seen.add(identity);
    return [link];
  });
}
