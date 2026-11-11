import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import nextConfig from "../next.config";
import sourceProjects from "../data/projects.json";
import { projectSchema, type Project } from "../lib/validators/schemas";
import { getOptimizedUrl } from "../lib/cloudinary/urls";
import {
  getProjectArtDirection,
  getProjectLinks,
  getProjectNeighbors,
} from "../lib/work-content";

// CSS modules are bundled by Next; the static renderer only checks markup.
const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => {
  module.exports = {
    __esModule: true,
    default: new Proxy({}, { get: (_, name) => String(name) }),
  };
};
const ProjectCaseStudy =
  require("../components/work/project-case-study").default;

const projects = sourceProjects.map((project) => projectSchema.parse(project));
const first = projects[0];
const last = projects[projects.length - 1];

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
      })[character]!,
  );
}

function decodeAttribute(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'");
}

function imageSources(html: string): string[] {
  return [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(
    (match) => {
      const value = decodeAttribute(match[1]);
      const url = new URL(value, "http://portfolio.test");
      return url.pathname === "/_next/image"
        ? url.searchParams.get("url")!
        : value;
    },
  );
}

function renderCase(project: Project, collection = projects): string {
  // Next normally provides this context. Use the real repository image config
  // when rendering outside its server; no browser or network is involved.
  return renderToStaticMarkup(
    createElement(
      ImageConfigContext.Provider,
      { value: { ...imageConfigDefault, ...nextConfig.images } },
      createElement(ProjectCaseStudy, { project, projects: collection }),
    ),
  );
}

test("every existing project retains its current tags and has a distinct supported presentation", () => {
  assert.equal(projects.length, 7);
  const before = JSON.stringify(projects);
  for (const project of projects) {
    const art = getProjectArtDirection(project);
    assert.ok(
      art.statement && art.summary && art.features.length,
      project.slug,
    );
    assert.deepEqual(
      art.stack.flatMap((group) => group.items).sort(),
      [...project.tags].sort(),
      project.slug,
    );
  }
  assert.equal(
    JSON.stringify(projects),
    before,
    "presentation must not mutate repository records",
  );
  assert.equal(
    new Set(projects.map((project) => getProjectArtDirection(project).layout))
      .size,
    3,
  );
  const hackshastra = getProjectArtDirection(
    projects.find((project) => project.slug === "hackshastra-website")!,
  );
  assert.equal(hackshastra.layout, "studio");
  assert.ok(
    hackshastra.stack
      .find((group) => group.label === "Interface & interaction")
      ?.items.includes("Lenis"),
  );
  assert.equal(
    getProjectArtDirection(
      projects.find((project) => project.slug === "resumify")!,
    ).layout,
    "editorial",
  );
});

test("admin changes never retain stale claims, shortened titles or removed tags", () => {
  for (const project of projects) {
    for (const patch of [
      { title: "A renamed project" },
      { description: "A newly published description." },
    ]) {
      const edited = {
        ...project,
        ...patch,
        tags: ["A new tool", "React", "A new topic"],
      };
      const art = getProjectArtDirection(edited);
      assert.equal(art.shortTitle, edited.title);
      assert.equal(art.statement, edited.title);
      assert.equal(art.summary, edited.description);
      assert.deepEqual(art.features, []);
      assert.deepEqual(
        art.stack.flatMap((group) => group.items).sort(),
        [...edited.tags].sort(),
      );
    }
  }
  const unknown = {
    ...first,
    slug: "new-project",
    title: "Fresh work",
    description: "Only the current copy.",
    tags: [],
  };
  assert.deepEqual(getProjectArtDirection(unknown).features, []);
  assert.equal(getProjectArtDirection(unknown).summary, unknown.description);
  assert.deepEqual(getProjectArtDirection(unknown).stack, []);
});

test("editorial results are independent between calls", () => {
  const art = getProjectArtDirection(first);
  art.features[0].body = "A local edit";
  art.stack[0].items.push("A local tool");
  assert.notEqual(
    getProjectArtDirection(first).features[0].body,
    "A local edit",
  );
  assert.ok(
    !getProjectArtDirection(first)
      .stack.flatMap((group) => group.items)
      .includes("A local tool"),
  );
});

test("external links retain working HTTP(S) values and omit empty, placeholder and unsafe values", () => {
  for (const project of projects) {
    const links = getProjectLinks(project);
    assert.equal(links.live, project.liveUrl || undefined);
    assert.equal(links.github, project.githubUrl || undefined);
  }
  for (const value of [
    undefined,
    "",
    "  ",
    "#",
    "/projects",
    "//example.com",
    "not a URL",
    "javascript:alert(1)",
    "data:text/html,test",
    "mailto:hello@example.com",
    "ftp://example.com",
  ]) {
    assert.deepEqual(
      getProjectLinks({ ...first, liveUrl: value, githubUrl: value }),
      { live: undefined, github: undefined },
      String(value),
    );
  }
  assert.deepEqual(
    getProjectLinks({
      ...first,
      liveUrl: "  https://example.com/demo?mode=1#start  ",
      githubUrl: "http://example.com/source",
    }),
    {
      live: "https://example.com/demo?mode=1#start",
      github: "http://example.com/source",
    },
  );
});

test("project navigation wraps both ends and follows the supplied published order", () => {
  assert.equal(getProjectNeighbors(projects, first.slug).previous, last);
  assert.equal(getProjectNeighbors(projects, last.slug).next, first);
  for (let index = 0; index < projects.length; index++) {
    const neighbors = getProjectNeighbors(projects, projects[index].slug);
    assert.equal(
      neighbors.previous,
      projects[(index + projects.length - 1) % projects.length],
    );
    assert.equal(neighbors.next, projects[(index + 1) % projects.length]);
  }
  // The route supplies published(), so a removed draft must disappear from the
  // supplied sequence rather than being silently filtered or re-sorted here.
  const published = projects
    .filter((project) => project.slug !== projects[1].slug)
    .reverse();
  assert.equal(getProjectNeighbors(published, first.slug).next, published[0]);
  assert.deepEqual(getProjectNeighbors(published, projects[1].slug), {});
  assert.deepEqual(getProjectNeighbors([], first.slug), {});
  assert.deepEqual(getProjectNeighbors([first], first.slug), {});
  assert.deepEqual(getProjectNeighbors(projects, "missing-project"), {});
  const pair = [first, last];
  assert.deepEqual(getProjectNeighbors(pair, first.slug), {
    previous: last,
    next: last,
  });
});

for (const project of projects) {
  test(`case study renders complete truthful content and links: ${project.slug}`, () => {
    const html = renderCase(project);
    const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(headings.length, 1);
    assert.ok(headings[0][1].includes(escapeHtml(project.title)));
    assert.ok(
      html.includes(escapeHtml(project.description)),
      "original description remains visible",
    );
    assert.ok(html.includes(escapeHtml(project.category)));
    assert.ok(html.includes(project.year));
    for (const tag of project.tags)
      assert.ok(
        html.includes(`>${escapeHtml(tag)}</span>`),
        `${project.slug}: missing ${tag}`,
      );
    for (const url of Object.values(getProjectLinks(project)).filter(Boolean))
      assert.ok(html.includes(`href="${escapeHtml(url!)}"`));
    if (!project.githubUrl)
      assert.ok(
        !html.includes("Source code"),
        "missing source URL must not produce a placeholder action",
      );
    assert.ok(html.includes('href="/projects"'));
    const neighbors = getProjectNeighbors(projects, project.slug);
    assert.ok(html.includes(`href="/projects/${neighbors.previous!.slug}"`));
    assert.ok(html.includes(`href="/projects/${neighbors.next!.slug}"`));
    const sources = imageSources(html);
    assert.equal(
      sources.length,
      3,
      "one project cover plus previous/next previews",
    );
    assert.equal(
      sources.filter((src) => src === getOptimizedUrl(project.cover.url, 2000))
        .length,
      1,
    );
    assert.ok(
      sources.every(
        (src) => src.includes("c_limit") && !src.includes("c_fill"),
      ),
      "screenshots must not be cropped upstream",
    );
    assert.ok(
      !html.includes('id="project-gallery-title"'),
      "empty galleries must not fabricate visual sections",
    );
  });
}

test("single and newly edited projects render without invented sections or self-navigation", () => {
  const edited = {
    ...first,
    title: "Fresh project",
    description: "Only this current description is available.",
    tags: [],
    liveUrl: "#",
    githubUrl: "",
  };
  const html = renderCase(edited, [edited]);
  assert.ok(html.includes(edited.description));
  assert.ok(!html.includes('id="project-features"'));
  assert.ok(!html.includes('id="project-stack"'));
  assert.ok(!html.includes("Next project"));
  assert.ok(!html.includes("Previous project"));
  assert.ok(!html.includes("Visit live site"));
  assert.ok(!html.includes("Source code"));
  assert.equal(imageSources(html).length, 1);
});

test("a supplied gallery preserves the image and caption without repeating duplicate assets", () => {
  const asset = { ...projects[1].cover, alt: "A supplied detail screenshot" };
  const project = { ...first, gallery: [first.cover, asset, asset] };
  const html = renderCase(project, [project]);
  const sources = imageSources(html);
  assert.equal(sources.length, 2, "cover and one unique gallery image");
  assert.equal(
    sources.filter((src) => src === getOptimizedUrl(asset.url, 1600)).length,
    1,
  );
  assert.ok(html.includes('id="project-gallery-title"'));
  assert.ok(html.includes(escapeHtml(asset.alt)));
  assert.ok(!html.includes("Open full image"));
  const imageButtons = [
    ...html.matchAll(/<button\b[^>]*aria-haspopup="dialog"[\s\S]*?<\/button>/g),
  ].filter(([markup]) => markup.includes("<img"));
  assert.equal(
    imageButtons.length,
    2,
    "cover and gallery images open a dialog",
  );
  assert.ok(
    !html.includes(`href="${escapeHtml(getOptimizedUrl(asset.url, 2400))}"`),
  );
});
