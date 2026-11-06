import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createDefaultAboutPageContent } from "../lib/about-page-content";

const load = createRequire(__filename);
const previousCssLoader = load.extensions[".css"];
let Story: typeof import("../components/about/about-practice-story").default;
try {
  // Node has no CSS-module loader. Only the class-name lookup is stubbed;
  // React, Framer Motion, Next Image, and the story render normally on the server.
  load.extensions[".css"] = (loadedModule) => {
    loadedModule.exports = new Proxy(
      {},
      {
        get: (_, key) =>
          key === "__esModule" ? false : `story_${String(key)}`,
      },
    );
  };
  Story = load("../components/about/about-practice-story").default;
} finally {
  if (previousCssLoader) load.extensions[".css"] = previousCssLoader;
  else delete load.extensions[".css"];
}

const communityImage = {
  src: "https://res.cloudinary.com/dunacoujw/image/upload/v1790609326/P1010480_sox5pn.jpg",
  alt: "Hackathon participants reviewing notes and planning together.",
  width: 1200,
  height: 900,
};
const workImage = {
  src: "https://res.cloudinary.com/dunacoujw/image/upload/v1792667510/Screenshot_2026-10-22_164101_a10cyf.png",
  alt: "Unoverse",
  title: "Unoverse",
};
const craftImage = {
  src: "https://res.cloudinary.com/dunacoujw/image/upload/v1792668779/Screenshot_2026-10-22_170240_abl8ly.png",
  alt: "HackShastra Website",
  title: "HackShastra Website",
};
const practiceImage = {
  src: "https://res.cloudinary.com/dunacoujw/image/upload/v1772402433/reach_xhdfbp.webp",
  alt: "HackShastra Hackathon Group Photo",
};

function render(props: Partial<Parameters<typeof Story>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(Story, { builders: 3000, communityImage, ...props }),
  );
}

function articles(html: string) {
  return [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(
    (match) => match[0],
  );
}

function hasImage(html: string, source: string) {
  const original = new URL(source);
  const asset = original.pathname.split("/image/upload/")[1];
  return [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].some(([, src]) => {
    const rendered = new URL(src.replaceAll("&amp;", "&"));
    return (
      rendered.origin === original.origin &&
      rendered.pathname.endsWith(`/${asset}`)
    );
  });
}

test("server output keeps all three chapters readable before JavaScript enhances the story", () => {
  const html = render();
  const chapters = articles(html);
  assert.equal(chapters.length, 3);
  assert.doesNotMatch(html, /data-enhanced=/);
  const titles = [
    ["Build the", "whole thing."],
    ["Sweat the", "small things."],
    ["Share what", "you learn."],
  ];
  for (const [index, chapter] of chapters.entries()) {
    const openingTag = chapter.slice(0, chapter.indexOf(">") + 1);
    assert.doesNotMatch(openingTag, /\s(?:aria-hidden|inert)(?:=|\s|>)/);
    assert.match(openingTag, /opacity:1(?:;|")/);
    for (const title of titles[index]) assert.ok(chapter.includes(title));
    assert.ok(
      chapter.replace(/<[^>]+>/g, "").includes(titles[index].join(" ")),
    );
    assert.match(chapter, /<p\b[^>]*>[\s\S]*?<\/p>/);
  }
  assert.match(chapters[0], /real-time 3D multiplayer game/);
  assert.match(chapters[1], /performance, and accessibility/);
  assert.match(chapters[2], /I co-founded HackShastra/);
  assert.match(chapters[2], /3,000/);
});

test("server chapter links target real articles and their headings without requiring JavaScript", () => {
  const html = render();
  const controls = [
    ...html.matchAll(/<a\b([^>]*aria-controls="([^"]+)"[^>]*)>/g),
  ];
  assert.equal(controls.length, 3);
  for (const [, attributes, target] of controls) {
    assert.ok(attributes.includes(`href="#${target}"`));
    assert.equal(
      [...html.matchAll(new RegExp(`id="${target}"`, "g"))].length,
      1,
    );
    const chapter = articles(html).find((article) =>
      article.includes(`id="${target}"`),
    );
    assert.ok(chapter);
    const heading = chapter.match(/aria-labelledby="([^"]+)"/)?.[1];
    assert.ok(heading && chapter.includes(`id="${heading}"`));
  }
  assert.doesNotMatch(html, /id="practice-scroll-stop-/);
});

test("project covers render as real images in their own chapters with their supplied captions", () => {
  const chapters = articles(render({ workImage, craftImage, practiceImage }));
  for (const [index, image] of [
    workImage,
    craftImage,
    practiceImage,
  ].entries()) {
    assert.ok(hasImage(chapters[index], image.src));
    assert.ok(chapters[index].includes(`alt="${image.alt}"`));
    assert.match(chapters[index], /<img\b[^>]*\bsrcSet="[^"]+\b640w[^\"]*"/);
    assert.match(chapters[index], /<img\b[^>]*\bloading="lazy"/);
  }
  assert.ok(chapters[0].includes("story_productWindow"));
  assert.ok(chapters[1].includes("story_productWindow"));
  assert.ok(!chapters[2].includes("story_productWindow"));
  assert.match(chapters[0], /<figcaption\b[^>]*>[\s\S]*?Unoverse/);
  assert.match(chapters[1], /<figcaption\b[^>]*>[\s\S]*?HackShastra Website/);
});

test("manual photographs override the craft cover and missing optional assets retain the community fallback", () => {
  const manual = articles(
    render({ workImage, craftImage, practiceImage2: practiceImage }),
  );
  assert.ok(hasImage(manual[1], practiceImage.src));
  assert.ok(!hasImage(manual[1], craftImage.src));
  assert.ok(!manual[1].includes("story_productWindow"));
  assert.ok(hasImage(manual[2], communityImage.src));
  const fallback = articles(render());
  for (const chapter of fallback) {
    assert.ok(hasImage(chapter, communityImage.src));
    assert.ok(chapter.includes(`alt="${communityImage.alt}"`));
    assert.ok(!chapter.includes("story_productWindow"));
  }
});

test("configured fit is respected on legacy project covers and manual images", () => {
  const covered = articles(
    render({
      workImage: { ...workImage, fit: "cover" },
      craftImage: { ...craftImage, fit: "cover" },
    }),
  );
  assert.ok(!covered[0].includes("story_productWindow"));
  assert.ok(!covered[1].includes("story_productWindow"));
  const contained = articles(
    render({
      craftImage: { ...craftImage, fit: "cover" },
      practiceImage2: { ...practiceImage, fit: "contain" },
      practiceImage: { ...practiceImage, fit: "contain" },
    }),
  );
  assert.ok(contained[1].includes("story_productWindow"));
  assert.ok(contained[2].includes("story_productWindow"));
});

test("saved admin content and image fit override defaults, captions, and legacy assets", () => {
  const content = createDefaultAboutPageContent().practice;
  content.title = "How I build.";
  content.subtitle = "From the first idea";
  content.accent = "to launch.";
  content.note = "A saved introduction from the page editor.";
  content.chapters[0].title = "Build with";
  content.chapters[0].accent = "clear intent.";
  content.chapters[0].body = "This is the edited engineering chapter.";
  content.chapters[0].caption = "An edited image caption.";
  content.chapters[0].image = {
    url: practiceImage.src,
    alt: "Saved engineering visual",
    fit: "contain",
  };
  content.chapters[1].image = {
    url: workImage.src,
    alt: "Saved interaction visual",
    fit: "cover",
  };
  const html = render({
    content,
    workImage,
    craftImage,
    practiceImage2: practiceImage,
  });
  const chapters = articles(html);
  assert.match(html, /How I build\./);
  assert.match(html, /A saved introduction from the page editor\./);
  assert.match(chapters[0], /This is the edited engineering chapter\./);
  assert.match(chapters[0], /An edited image caption\./);
  assert.ok(hasImage(chapters[0], practiceImage.src));
  assert.ok(chapters[0].includes("story_productWindow"));
  assert.ok(hasImage(chapters[1], workImage.src));
  assert.ok(!chapters[1].includes("story_productWindow"));
  assert.ok(hasImage(chapters[2], communityImage.src));
});
