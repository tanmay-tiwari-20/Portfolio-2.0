import type { MetadataRoute } from "next";
import { published, repos } from "@/lib/db";
import { publicPages, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await published(repos.projects);
  // No manufactured lastmod values: records also change on administrative edits.
  const paths = new Set([
    ...Object.values(publicPages).map((page) => page.path),
    ...projects.map((project) => `/projects/${project.slug}`),
  ]);
  return [...paths].map((path) => ({ url: siteUrl(path) }));
}
