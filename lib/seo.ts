import type { Metadata } from "next";
import type { Profile, Project, SocialLink } from "@/lib/validators/schemas";
import { resolveContactLinks } from "@/lib/contact-links";
import {
  publicPages,
  SITE_NAME,
  SITE_URL,
  siteUrl,
  type PublicPage,
} from "@/lib/site";

const personId = `${SITE_URL}/#person`;
const websiteId = `${SITE_URL}/#website`;
const organizationId = "https://www.hackshastra.in/#organization";

export function summarize(text: string, limit = 165) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const excerpt = clean.slice(0, limit - 1);
  return `${excerpt.slice(0, excerpt.lastIndexOf(" "))}…`;
}

function socialImage(key: string) {
  return {
    url: `${SITE_URL}/social/${encodeURIComponent(key)}`,
    width: 1200,
    height: 630,
    alt: `${SITE_NAME} — ${key === "home" ? "Full-stack developer and community builder" : key.replace(/-/g, " ")}`,
  };
}

function metadata(
  title: string,
  description: string,
  path: string,
  imageKey: string,
): Metadata {
  const image = socialImage(imageKey);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: siteUrl(path) },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: siteUrl(path),
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function pageMetadata(key: PublicPage): Metadata {
  const page = publicPages[key];
  return metadata(page.title, page.description, page.path, key);
}

export function projectMetadata(project: Project): Metadata {
  return metadata(
    `${project.title} | ${SITE_NAME}`,
    summarize(project.description),
    `/projects/${project.slug}`,
    `project-${project.slug}`,
  );
}

type JsonNode = Record<string, unknown>;
const graph = (nodes: JsonNode[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});

export function globalGraph(
  profile: Profile | undefined,
  socials: SocialLink[],
) {
  return graph([
    {
      "@type": "Person",
      "@id": personId,
      name: profile?.name || SITE_NAME,
      url: siteUrl(),
      ...(profile
        ? {
            description: profile.bio,
            jobTitle: profile.role,
            ...(profile.avatar ? { image: profile.avatar.url } : {}),
          }
        : {}),
      sameAs: resolveContactLinks(socials)
        .filter((link) => link.platform !== "website")
        .map((link) => link.href),
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: SITE_NAME,
      url: siteUrl(),
      inLanguage: "en",
      description: publicPages.home.description,
      publisher: { "@id": personId },
    },
  ]);
}

function breadcrumbs(
  items: { name: string; path: string }[],
  url: string,
): JsonNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumbs`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function pageGraph(key: PublicPage) {
  const page = publicPages[key];
  const url = siteUrl(page.path);
  const nodes: JsonNode[] = [
    {
      "@type":
        key === "about"
          ? "ProfilePage"
          : key === "contact"
            ? "ContactPage"
            : key === "projects" || key === "hackathons"
              ? "CollectionPage"
              : "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: "en",
      isPartOf: { "@id": websiteId },
      about: { "@id": key === "hackshastra" ? organizationId : personId },
      ...(key === "about" ? { mainEntity: { "@id": personId } } : {}),
      ...(key !== "home"
        ? { breadcrumb: { "@id": `${url}#breadcrumbs` } }
        : {}),
    },
  ];
  if (key !== "home")
    nodes.push(
      breadcrumbs(
        [
          { name: "Home", path: "/" },
          { name: page.label, path: page.path },
        ],
        url,
      ),
    );
  if (key === "hackshastra")
    nodes.push({
      "@type": "Organization",
      "@id": organizationId,
      name: "HackShastra",
      url: "https://www.hackshastra.in/",
      description:
        "A student builder community bringing people together through hackathons, campus chapters and community events.",
      founder: { "@id": personId },
    });
  return graph(nodes);
}

export function projectGraph(project: Project) {
  const url = siteUrl(`/projects/${project.slug}`);
  const creativeWork: JsonNode = {
    "@type": project.githubUrl ? "SoftwareSourceCode" : "CreativeWork",
    "@id": `${url}#project`,
    name: project.title,
    description: project.description,
    url,
    image: project.cover.url,
    genre: project.category,
    keywords: project.tags.join(", "),
    creator: { "@id": personId },
    mainEntityOfPage: { "@id": `${url}#webpage` },
    ...(project.githubUrl ? { codeRepository: project.githubUrl } : {}),
    ...(project.liveUrl ? { sameAs: project.liveUrl } : {}),
  };
  // Repository updatedAt also changes on administrative edits; omit dates rather
  // than imply a verified release/publication or substantive content update.
  return graph([
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: `${project.title} | ${SITE_NAME}`,
      description: summarize(project.description),
      inLanguage: "en",
      isPartOf: { "@id": websiteId },
      mainEntity: { "@id": `${url}#project` },
      breadcrumb: { "@id": `${url}#breadcrumbs` },
    },
    creativeWork,
    breadcrumbs(
      [
        { name: "Home", path: "/" },
        { name: "Projects", path: "/projects" },
        { name: project.title, path: `/projects/${project.slug}` },
      ],
      url,
    ),
  ]);
}
