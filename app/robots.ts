import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Preserve the existing public crawl policy, including search/retrieval
    // crawlers. AI agents receive no exemptions for private routes.
    // Training policy is unchanged, not a promise of indexing or citations.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/secret-admin", "/api/", "/admin", "/admin-dashboard"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
