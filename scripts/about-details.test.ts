import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import nextConfig from "../next.config";
import settingsRows from "../data/site-settings.json";
import experienceRows from "../data/experiences.json";
import { createDefaultAboutMoments } from "../lib/about-gallery";
import {
  createDefaultAboutPageContent,
  resolveAboutPageContent,
} from "../lib/about-page-content";
import { experienceSchema, settingsSchema } from "../lib/validators/schemas";

const load = createRequire(__filename);
const previousCssLoader = load.extensions[".css"];
let AboutDetails: typeof import("../components/about/about-details").default;
try {
  load.extensions[".css"] = (module) => {
    module.exports = new Proxy(
      {},
      {
        get: (_, key) =>
          key === "__esModule" ? false : `about_${String(key)}`,
      },
    );
  };
  AboutDetails = load("../components/about/about-details").default;
} finally {
  if (previousCssLoader) load.extensions[".css"] = previousCssLoader;
  else delete load.extensions[".css"];
}

function renderSavedContent(aboutPage: unknown) {
  // Exercise the same persisted-settings schema and resolver used by /about.
  const settings = settingsSchema.parse(
    JSON.parse(
      JSON.stringify({
        ...settingsRows[0],
        aboutPage,
      }),
    ),
  );
  return renderToStaticMarkup(
    createElement(
      ImageConfigContext.Provider,
      {
        value: { ...imageConfigDefault, ...nextConfig.images },
      },
      createElement(AboutDetails, {
        content: resolveAboutPageContent(settings.aboutPage),
        builders: 3000,
        location: "New Delhi, India",
        moments: createDefaultAboutMoments(),
        experiences: experienceRows.map((row) => experienceSchema.parse(row)),
        hackathons: [],
      }),
    ),
  );
}

test("saved About copy is rendered across every redesigned section", () => {
  const content = createDefaultAboutPageContent();
  const sections = [content.community, content.experience, content.contact];
  sections.forEach((section, index) => {
    section.title = `Edited section ${index + 1}`;
    section.accent = `Custom accent ${index + 1}`;
    section.body = `Saved body for section ${index + 1}.`;
  });
  content.community.lead = "A new community introduction.";
  content.community.noteTitle = "A different mentoring note";
  content.community.noteAccent = "with a personal ending.";
  content.community.noteBody = "New details from mentoring.";
  content.community.impactText = "The updated impact description.";
  content.practice.title = "My revised approach";
  content.practice.subtitle = "How I approach";
  content.practice.accent = "the next problem.";
  content.practice.note = "A revised practice introduction.";
  content.practice.chapters.forEach((chapter, index) => {
    chapter.title = `Chapter title ${index + 1}`;
    chapter.body = `A distinct chapter ${index + 1} description.`;
    chapter.caption = `Saved caption ${index + 1}`;
  });
  const html = renderSavedContent(content);
  for (const section of sections) {
    assert.ok(html.includes(section.title));
    assert.ok(html.includes(section.accent));
    assert.ok(html.includes(section.body));
  }
  for (const field of [
    "lead",
    "noteTitle",
    "noteAccent",
    "noteBody",
    "impactText",
  ] as const) {
    assert.ok(html.includes(content.community[field]), field);
  }
  for (const field of ["title", "subtitle", "accent", "note"] as const) {
    assert.ok(html.includes(content.practice[field]), field);
  }
  for (const chapter of content.practice.chapters) {
    assert.ok(html.includes(chapter.title));
    assert.ok(html.includes(chapter.body));
    assert.ok(html.includes(chapter.caption));
  }
  // The existing Experience collection remains the source of real roles.
  for (const experience of experienceRows)
    assert.ok(html.includes(experience.company));
});

test("saved chapter images replace fallbacks and edited text remains escaped", () => {
  const content = createDefaultAboutPageContent();
  const image = {
    url: "https://res.cloudinary.com/example/image/upload/v1/portfolio/about/custom.jpg",
    alt: "My custom workshop image",
    fit: "cover" as const,
  };
  content.practice.chapters[0].image = image;
  content.contact.title = "Build <together>";
  const html = renderSavedContent(content);
  assert.ok(html.includes('alt="My custom workshop image"'));
  assert.ok(html.includes("portfolio/about/custom.jpg"));
  assert.ok(html.includes("Build &lt;together&gt;"));
  assert.ok(!html.includes("Build <together>"));
  assert.ok(!html.includes('class="hero about-hero"'));
});
