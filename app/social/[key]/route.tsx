import { ImageResponse } from "next/og";
import { published, repos } from "@/lib/db";
import { publicPages, SITE_NAME, type PublicPage } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const page = Object.hasOwn(publicPages, key)
    ? publicPages[key as PublicPage]
    : undefined;
  const project = key.startsWith("project-")
    ? (await published(repos.projects)).find(
        (item) => item.slug === key.slice("project-".length),
      )
    : undefined;
  if (!page && !project) return new Response("Not found", { status: 404 });
  const title = project?.title || (key === "home" ? SITE_NAME : page!.label);
  const subtitle =
    project?.category ||
    (key === "home"
      ? "Full-stack developer · Community builder"
      : page!.description);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "64px 76px",
        background: "#090708",
        color: "#fffaf7",
        fontFamily: "sans-serif",
        borderTop: "12px solid #e6463e",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 24,
          letterSpacing: 3,
        }}
      >
        <span style={{ color: "#edbd83" }}>TANMAY TIWARI</span>
        <span>PORTFOLIO</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 34 ? 58 : 82,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            lineHeight: 1.4,
            color: "#e4d2cc",
            maxWidth: 1000,
          }}
        >
          {subtitle}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 23,
          color: "#edbd83",
        }}
      >
        <span>takneekitanmay.tech</span>
        <span>
          {project
            ? project.tags.slice(0, 3).join(" / ")
            : "Build with curiosity."}
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        // Unpublishing a project takes effect immediately; there is no CDN
        // invalidation hook for these dynamically authored cards.
        "Cache-Control": project
          ? "no-store"
          : "public, max-age=0, s-maxage=86400",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
