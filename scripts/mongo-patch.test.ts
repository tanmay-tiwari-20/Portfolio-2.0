import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { prepareMongoPatch } from "../lib/db/mongo-patch";
import { eventSchema } from "../lib/validators/schemas";
import events from "../data/community-events.json";

const current = eventSchema.parse({
  ...events[0],
  sortOrder: 2,
  archiveOrder: 2,
});
const timestamp = "2026-11-05T12:00:00.000Z";

test("Mongo visibility and title updates exclude stale order, artwork and unrelated fields", () => {
  for (const patch of [{ isPublished: false }, { title: "Revised title" }]) {
    const { operation } = prepareMongoPatch(
      eventSchema,
      current,
      patch,
      timestamp,
    );
    assert.deepEqual(operation, { $set: { updatedAt: timestamp, ...patch } });
    // A reorder and image edit land between validation and updateOne.
    const latest = {
      ...current,
      sortOrder: 9,
      archiveOrder: 9,
      image: {
        url: "https://res.cloudinary.com/example/image/upload/new.png",
        alt: "New artwork",
      },
    };
    const persisted = { ...latest, ...operation.$set };
    assert.equal(persisted.archiveOrder, 9);
    assert.equal(persisted.sortOrder, 9);
    assert.deepEqual(persisted.image, latest.image);
  }
});

test("Mongo removals use $unset and cannot conflict with schema defaults in $set", () => {
  const { operation, updated } = prepareMongoPatch(
    eventSchema,
    current,
    {
      image: null,
      role: null,
      category: "",
      attendees: null,
    },
    timestamp,
  );
  assert.deepEqual(operation, {
    $set: { updatedAt: timestamp, category: "" },
    $unset: { image: "", role: "", attendees: "" },
  });
  assert.equal(updated.image, undefined);
  assert.equal(
    updated.attendees,
    0,
    "The complete schema still validates its default",
  );
  assert.equal(updated.category, "");
});

test("Mongo patches keep nested replacement validation and strip unknown keys", () => {
  const schema = z.object({
    id: z.string(),
    updatedAt: z.string(),
    unrelated: z.string(),
    settings: z.object({
      label: z.string().trim().min(1),
      enabled: z.boolean().default(true),
    }),
  });
  const before = {
    id: "record",
    updatedAt: "old",
    unrelated: "Keep this",
    settings: { label: "Before", enabled: false },
  };
  const { operation, updated } = prepareMongoPatch(
    schema,
    before,
    {
      id: "different",
      updatedAt: "client-time",
      unknown: "discard",
      settings: { label: " After " },
    },
    timestamp,
  );
  assert.deepEqual(operation.$set, {
    updatedAt: timestamp,
    settings: { label: "After", enabled: true },
  });
  assert.equal(updated.id, "record");
  assert.equal(updated.unrelated, "Keep this");
  assert.throws(() =>
    prepareMongoPatch(schema, before, { settings: {} }, timestamp),
  );
  assert.throws(() =>
    prepareMongoPatch(schema, before, { unrelated: null }, timestamp),
  );
});
