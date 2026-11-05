import assert from "node:assert/strict";
import { test } from "node:test";
import socials from "../data/social-links.json";
import { resolveContactLinks } from "../lib/contact-links";
import type { SocialLink } from "../lib/validators/schemas";

function social(href: string, overrides: Partial<SocialLink> = {}): SocialLink {
  return {
    id: "test-profile",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    sortOrder: 0,
    isPublished: true,
    label: "GitHub",
    handle: "Saved handle",
    icon: "",
    href,
    ...overrides,
  };
}

test("current local data resolves only owner profiles with existing provenance", () => {
  assert.deepEqual(
    resolveContactLinks(socials).map(({ platform, href }) => ({
      platform,
      href,
    })),
    [
      {
        platform: "linkedin",
        href: "https://www.linkedin.com/in/tanmay-tiwari20/",
      },
      { platform: "github", href: "https://github.com/tanmay-tiwari-20" },
      { platform: "x", href: "https://x.com/TakneekiTanmay" },
    ],
  );
});

test("saved profile URLs are preserved exactly and identified by host, not misleading labels", () => {
  const profiles = [
    "https://www.linkedin.com/in/a-saved-profile/?view=profile#contact",
    "https://github.com/a-saved-profile?tab=repositories",
    "https://www.instagram.com/a-saved-profile/",
    "https://twitter.com/a_saved_profile",
    "https://www.youtube.com/@a-saved-profile",
  ];
  const resolved = resolveContactLinks(profiles.map((href) => social(href)));
  assert.deepEqual(
    resolved.map(({ href }) => href),
    profiles,
  );
  assert.deepEqual(
    resolved.map(({ label }) => label),
    ["LinkedIn", "GitHub", "Instagram", "X", "YouTube"],
  );
});

test("unpublished records and homepages without an owner source are omitted", () => {
  assert.deepEqual(
    resolveContactLinks([
      social("https://github.com/tanmay-tiwari-20", { isPublished: false }),
      social("https://linkedin.com/", { isPublished: false }),
      social("https://instagram.com/?ref=portfolio"),
      social("https://x.com/#profile"),
      social("https://youtube.com/"),
    ]),
    [],
  );
});

test("saved profiles replace homepage fallbacks while distinct profiles on one platform remain visible", () => {
  const savedGithub = "https://github.com/current-profile";
  const resolved = resolveContactLinks([
    social("https://github.com/"),
    social("https://x.com/current-profile"),
    social(savedGithub),
    social("https://github.com/another-profile"),
    social("https://twitter.com/another-profile"),
    social("https://www.github.com/"),
    social(savedGithub),
  ]);
  assert.deepEqual(
    resolved.map(({ platform, href }) => ({ platform, href })),
    [
      { platform: "x", href: "https://x.com/current-profile" },
      { platform: "github", href: savedGithub },
      { platform: "github", href: "https://github.com/another-profile" },
      { platform: "x", href: "https://twitter.com/another-profile" },
    ],
  );
});

test("all valid saved platforms and custom destinations remain visible", () => {
  const links = resolveContactLinks([
    social("https://discord.gg/community"),
    social("https://t.me/community"),
    social("https://www.threads.net/@owner"),
    social("https://www.behance.net/owner"),
    social("https://example.com/my-profile", {
      label: "My community",
      handle: "Meet the builders",
    }),
    social("https://personal.example", { label: "Website", handle: "" }),
  ]);
  assert.deepEqual(
    links.map(({ platform }) => platform),
    ["discord", "telegram", "threads", "behance", "website", "website"],
  );
  assert.equal(links[4].label, "My community");
  assert.equal(links[4].detail, "Meet the builders");
  assert.equal(links[5].href, "https://personal.example");
});

test("unsafe protocols, lookalike hosts, credentials and unexpected ports never become social links", () => {
  const invalid = [
    "javascript:alert(1)",
    "data:text/html,github.com",
    "http://github.com/profile",
    "//github.com/profile",
    "https://github.com.evil.example/profile",
    "https://evilgithub.com/profile",
    "https://not.www.github.com/profile",
    "https://github.com@evil.example/profile",
    "https://evil.example@github.com/profile",
    "https://name:password@github.com/profile",
    "https://github.com:444/profile",
    "https://constructor/profile",
    "https://toString/profile",
    "not a url",
  ];
  for (const href of invalid)
    assert.deepEqual(resolveContactLinks([social(href)]), [], href);
});
