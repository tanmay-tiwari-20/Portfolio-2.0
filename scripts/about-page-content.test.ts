import assert from "node:assert/strict";
import test from "node:test";
import settingsRows from "../data/site-settings.json";
import {
  createDefaultAboutPageContent,
  hasSafeAboutPageImageUrls,
  resolveAboutPageContent,
} from "../lib/about-page-content";
import {
  aboutPageSchema,
  pickSubmittedPatchFields,
  settingsSchema,
} from "../lib/validators/schemas";

const safeImage = {
  url: "https://res.cloudinary.com/example/image/upload/v1/portfolio/practice.jpg",
  publicId: "portfolio/practice",
  alt: "Working together at a hackathon",
  fit: "contain" as const,
  width: 1200,
  height: 800,
};

test("legacy settings remain valid without inserting About content or replacing images", () => {
  const source = settingsRows[0];
  const before = JSON.stringify(source);
  const parsed = settingsSchema.parse(source);
  assert.equal(parsed.aboutPage, undefined);
  assert.deepEqual(parsed.aboutPopOut, source.aboutPopOut);
  assert.deepEqual(parsed.aboutMoments, source.aboutMoments);
  assert.deepEqual(parsed.aboutPracticeImage, source.aboutPracticeImage);
  assert.equal(JSON.stringify(source), before);
});

test("defaults retain the three visible chapters and each caller gets independent data", () => {
  const first = createDefaultAboutPageContent();
  assert.deepEqual(
    first.practice.chapters.map((chapter) => [chapter.title, chapter.accent]),
    [
      ["Build the", "whole thing."],
      ["Sweat the", "small things."],
      ["Share what", "you learn."],
    ],
  );
  assert.equal(first.practice.title, "The work.");
  assert.equal(first.community.title, "Better,");
  assert.equal(first.experience.accent, "by building.");
  assert.equal(first.contact.accent, "in mind?");
  first.practice.chapters[0].details[0] = "A local edit";
  assert.equal(
    createDefaultAboutPageContent().practice.chapters[0].details[0],
    "Next.js & TypeScript",
  );
  for (const value of [
    undefined,
    null,
    {},
    { practice: { title: "Incomplete" } },
  ]) {
    assert.deepEqual(
      resolveAboutPageContent(value),
      createDefaultAboutPageContent(),
    );
  }
});

test("custom copy and image overrides survive a settings patch alongside legacy fields", () => {
  const content = createDefaultAboutPageContent();
  content.community.title = "Building in good company";
  content.practice.chapters[0].image = safeImage;
  content.practice.chapters[1].image = null;
  const legacy = settingsSchema.parse({
    ...settingsRows[0],
    accent: "#1188aa",
    sortOrder: 7,
    isPublished: false,
  });
  const submitted = { aboutPage: content, unknownField: "Discard me" };
  const patch = pickSubmittedPatchFields(
    settingsSchema.partial().parse(submitted),
    submitted,
  );
  assert.deepEqual(Object.keys(patch), ["aboutPage"]);
  const merged = settingsSchema.parse({ ...legacy, ...patch });
  assert.deepEqual(merged.aboutPage, content);
  assert.equal(merged.accent, legacy.accent);
  assert.equal(merged.sortOrder, legacy.sortOrder);
  assert.equal(merged.isPublished, legacy.isPublished);
  assert.deepEqual(merged.aboutPracticeImage, legacy.aboutPracticeImage);
  assert.deepEqual(merged.aboutPopOut, legacy.aboutPopOut);
  assert.deepEqual(merged.aboutMoments, legacy.aboutMoments);
  assert.equal(hasSafeAboutPageImageUrls(content), true);
  assert.deepEqual(resolveAboutPageContent(content), content);
});

test("explicit settings values remain editable while schema errors are preserved", () => {
  const submitted = { accent: "#114477", sortOrder: 9, isPublished: false };
  assert.deepEqual(
    pickSubmittedPatchFields(
      settingsSchema.partial().parse(submitted),
      submitted,
    ),
    submitted,
  );
  assert.equal(
    settingsSchema.partial().safeParse({ sortOrder: "not a number" }).success,
    false,
  );
});

test("nested image overrides reject unsafe delivery URLs in both schema and API guard", () => {
  for (const url of [
    "http://res.cloudinary.com/example/image/upload/photo.jpg",
    "https://res.cloudinary.com.example.org/example/image/upload/photo.jpg",
    "https://user:password@res.cloudinary.com/example/image/upload/photo.jpg",
    "https://res.cloudinary.com/example/video/upload/movie.mp4",
    "https://images.unsplash.com/photo-example",
    "javascript:alert(1)",
    "/local/photo.jpg",
  ]) {
    const content = createDefaultAboutPageContent();
    content.practice.chapters[2].image = { ...safeImage, url };
    assert.equal(aboutPageSchema.safeParse(content).success, false, url);
    assert.equal(hasSafeAboutPageImageUrls(content), false, url);
    assert.deepEqual(
      resolveAboutPageContent(content),
      createDefaultAboutPageContent(),
    );
  }
});

test("chapter and detail counts stay fixed and blank or oversized copy is rejected", () => {
  const content = createDefaultAboutPageContent();
  for (const chapters of [
    content.practice.chapters.slice(0, 2),
    [...content.practice.chapters, content.practice.chapters[0]],
  ]) {
    assert.equal(
      aboutPageSchema.safeParse({
        ...content,
        practice: { ...content.practice, chapters },
      }).success,
      false,
    );
  }
  for (const details of [["One"], ["One", "Two", "Three"]]) {
    assert.equal(
      aboutPageSchema.safeParse({
        ...content,
        practice: {
          ...content.practice,
          chapters: [
            { ...content.practice.chapters[0], details },
            ...content.practice.chapters.slice(1),
          ],
        },
      }).success,
      false,
    );
  }
  content.practice.chapters[0].title = " ";
  assert.equal(aboutPageSchema.safeParse(content).success, false);
  content.practice.chapters[0].title = "A".repeat(41);
  assert.equal(aboutPageSchema.safeParse(content).success, false);
  content.practice.chapters[0].title = "Build the";
  content.practice.chapters[0].body = "A".repeat(401);
  assert.equal(aboutPageSchema.safeParse(content).success, false);
});

test("malformed image shapes fail early and the configuration cannot add hero fields", () => {
  const content = createDefaultAboutPageContent();
  for (const image of ["photo.jpg", [], 42, { url: 42 }]) {
    assert.equal(
      hasSafeAboutPageImageUrls({
        ...content,
        practice: {
          ...content.practice,
          chapters: [
            { ...content.practice.chapters[0], image },
            ...content.practice.chapters.slice(1),
          ],
        },
      }),
      false,
    );
  }
  const parsed = aboutPageSchema.parse({
    ...content,
    hero: { title: "Unrelated change" },
  });
  assert.equal("hero" in parsed, false);
});
