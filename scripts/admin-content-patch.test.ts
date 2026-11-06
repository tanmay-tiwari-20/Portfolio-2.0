import assert from "node:assert/strict";
import test from "node:test";
import {
  pickSubmittedPatchFields,
  projectSchema,
} from "../lib/validators/schemas";
import projects from "../data/projects.json";

test("admin project publication toggles preserve featured state and ordering", () => {
  const existing = projectSchema.parse({
    ...projects[0],
    featured: true,
    isPublished: true,
    sortOrder: 12,
  });
  const submitted = { isPublished: false };
  const patch = pickSubmittedPatchFields(
    projectSchema.partial().parse(submitted),
    submitted,
  );
  assert.deepEqual(patch, { isPublished: false });
  const updated = projectSchema.parse({ ...existing, ...patch });
  assert.equal(updated.featured, true);
  assert.equal(updated.sortOrder, 12);
  assert.deepEqual(updated.cover, existing.cover);
  assert.deepEqual(updated.gallery, existing.gallery);
  assert.equal(updated.isPublished, false);
});

test("admin project featured toggles and title edits do not publish a draft", () => {
  const existing = projectSchema.parse({
    ...projects[0],
    featured: false,
    isPublished: false,
    sortOrder: 9,
  });
  for (const submitted of [{ featured: true }, { title: "Updated title" }]) {
    const patch = pickSubmittedPatchFields(
      projectSchema.partial().parse(submitted),
      submitted,
    );
    assert.deepEqual(patch, submitted);
    const updated = projectSchema.parse({ ...existing, ...patch });
    assert.equal(updated.isPublished, false);
    assert.equal(updated.sortOrder, 9);
    assert.deepEqual(updated.cover, existing.cover);
  }
});
