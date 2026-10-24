import type { MetadataRoute } from "next";
import { repos } from "@/lib/db";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const projects = await repos.projects.getAll();
  return [
    "",
    "/about",
    "/projects",
    "/hackshastra",
    "/hackathons",
    "/contact",
  ]
    .map((path) => ({ url: `${base}${path}`, lastModified: new Date() }))
    .concat(
      projects
        .filter((p) => p.isPublished)
        .map((p) => ({
          url: `${base}/projects/${p.slug}`,
          lastModified: new Date(p.updatedAt),
        })),
    );
}
