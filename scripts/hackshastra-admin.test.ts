import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { JsonFileRepository } from "../lib/db/repository";
import { nextEventArchiveOrder, prepareEventPatch } from "../lib/event-admin";
import {
  orderHackShastraEvents,
  resolveHackShastraEvents,
} from "../lib/hackshastra-content";
import {
  eventSchema,
  pickSubmittedPatchFields,
  type CommunityEvent,
} from "../lib/validators/schemas";
import records from "../data/community-events.json";

const seed = records.map((record) => eventSchema.parse(record));
const original = seed.find((record) => record.title === "Grand Hack IPEC")!;

function validatedPatch(submitted: Record<string, unknown>) {
  const patch = prepareEventPatch(submitted);
  const removals = Object.keys(patch).filter((key) => patch[key] === null);
  const fields = { ...patch };
  for (const key of removals) delete fields[key];
  return {
    ...pickSubmittedPatchFields(eventSchema.partial().parse(fields), fields),
    ...Object.fromEntries(removals.map((key) => [key, null])),
  };
}

test("visibility-only edits never remove artwork or reset order and metadata", () => {
  const patch = validatedPatch({ isPublished: false });
  assert.deepEqual(patch, { isPublished: false });
  const current = {
    ...original,
    sortOrder: 8,
    archiveOrder: 3,
    category: "National hackathon",
    role: "Organizer",
  };
  const updated = eventSchema.parse({ ...current, ...patch });
  assert.deepEqual(updated.image, current.image);
  assert.equal(updated.sortOrder, 8);
  assert.equal(updated.archiveOrder, 3);
  assert.equal(updated.category, current.category);
  assert.equal(updated.role, current.role);
  assert.equal(updated.status, current.status);
  assert.equal(updated.isPublished, false);
});

test("stale form order metadata cannot overwrite a later reorder", () => {
  assert.deepEqual(
    prepareEventPatch({
      id: "old-id",
      title: "Edited title",
      sortOrder: 99,
      archiveOrder: 99,
      createdAt: "old",
      updatedAt: "old",
    }),
    { title: "Edited title" },
  );
  assert.deepEqual(
    prepareEventPatch({ archiveOrder: null, sortOrder: null }),
    {},
  );
});

test("optional field removals are explicit and blank metadata remains a hide override", () => {
  assert.deepEqual(prepareEventPatch({ title: "New title" }), {
    title: "New title",
  });
  assert.deepEqual(
    prepareEventPatch({
      image: undefined,
      category: "",
      role: "",
      displayDate: "",
    }),
    { image: null, category: "", role: "", displayDate: "" },
  );
  assert.deepEqual(
    prepareEventPatch({
      category: undefined,
      role: undefined,
      displayDate: undefined,
    }),
    { category: null, role: null, displayDate: null },
  );
  const [hidden] = resolveHackShastraEvents([
    { ...original, category: "", role: "", displayDate: "" },
  ]);
  assert.equal(hidden.category, "");
  assert.equal(hidden.role, "");
  assert.equal(hidden.date, "");
});

test("admin metadata overrides research while omitted fields keep existing verified defaults", () => {
  const [before] = resolveHackShastraEvents([original]);
  assert.equal(before.category, "National hackathon");
  const edited = eventSchema.parse({
    ...original,
    category: "Builder meetup",
    role: "Community partner",
    displayDate: "Autumn 2026",
  });
  const [after] = resolveHackShastraEvents([edited]);
  assert.equal(after.category, "Builder meetup");
  assert.equal(after.role, "Community partner");
  assert.equal(after.date, "Autumn 2026");
  assert.equal(after.image, before.image);
});

test("manual archive order is opt-in and newly added events append to it", () => {
  assert.equal(nextEventArchiveOrder(seed), undefined);
  const ordered = seed.map((event, index) => ({
    ...event,
    archiveOrder: seed.length - index - 1,
  }));
  const added = {
    ...original,
    id: "new-entry",
    date: "01-01-2020",
    archiveOrder: nextEventArchiveOrder(ordered),
  };
  const sorted = orderHackShastraEvents([...ordered, added]);
  assert.deepEqual(
    sorted.map((event) => event.id),
    [...seed]
      .reverse()
      .map((event) => event.id)
      .concat("new-entry"),
  );
  assert.equal(added.archiveOrder, seed.length);
  const published = resolveHackShastraEvents(
    sorted.map((event, index) => ({ ...event, isPublished: index !== 1 })),
  );
  assert.deepEqual(
    published.map((event) => event.id),
    sorted.filter((_, index) => index !== 1).map((event) => event.id),
  );
});

test("event validation accepts blank optional metadata and rejects invalid edits", () => {
  assert.equal(
    eventSchema.parse({
      ...original,
      category: " ",
      role: " ",
      displayDate: " ",
    }).category,
    "",
  );
  for (const patch of [
    { title: " " },
    { attendees: -1 },
    { attendees: 1.5 },
    { archiveOrder: -1 },
    { link: "javascript:alert(1)" },
    { link: "http://example.com/event" },
  ]) {
    assert.equal(
      eventSchema.safeParse({ ...original, ...patch }).success,
      false,
    );
  }
});

test("create, edit, reorder, hide, restore and delete persist through the event repository", async () => {
  const prefix = path.join(tmpdir(), "hackshastra-admin-");
  const directory = await mkdtemp(prefix);
  const previousDataDir = process.env.DATA_DIR;
  process.env.DATA_DIR = directory;
  try {
    const first = seed.find((record) => record.title === "HackShastra 1.0")!;
    const second = seed.find(
      (record) => record.title === "HackShastra Pre-Meetup",
    )!;
    const repo = new JsonFileRepository<CommunityEvent>(
      "test-events.json",
      eventSchema,
      [first, second],
    );
    assert.deepEqual(
      resolveHackShastraEvents(await repo.getAll()).map((event) => event.id),
      [second.id, first.id],
    );
    const manual = await repo.reorder([first.id, second.id], "archiveOrder");
    assert.deepEqual(
      manual.map((event) => event.archiveOrder),
      [0, 1],
    );
    assert.deepEqual(
      resolveHackShastraEvents(await repo.getAll()).map((event) => event.id),
      [first.id, second.id],
    );
    const created = await repo.create(
      eventSchema.parse({
        ...original,
        id: "created-by-test",
        date: "01-01-2020",
        category: "Workshop",
        role: "Organizer",
        displayDate: "January 2020",
        archiveOrder: nextEventArchiveOrder(manual),
      }),
    );
    assert.equal(
      resolveHackShastraEvents(await repo.getAll()).at(-1)?.id,
      created.id,
    );
    const patch = validatedPatch({ isPublished: false });
    await repo.update(first.id, patch);
    assert.deepEqual((await repo.getById(first.id))?.image, first.image);
    assert.equal(
      resolveHackShastraEvents(await repo.getAll()).some(
        (event) => event.id === first.id,
      ),
      false,
    );
    await repo.update(first.id, validatedPatch({ isPublished: true }));
    assert.equal(resolveHackShastraEvents(await repo.getAll())[0].id, first.id);
    await repo.update(
      created.id,
      validatedPatch({
        title: "Edited workshop",
        category: "",
        role: "",
        image: undefined,
      }) as Partial<CommunityEvent>,
    );
    const edited = resolveHackShastraEvents(await repo.getAll()).find(
      (event) => event.id === created.id,
    )!;
    assert.equal(edited.title, "Edited workshop");
    assert.equal(edited.category, "");
    assert.equal(edited.role, "");
    assert.equal(edited.image, "");
    assert.equal(await repo.delete(created.id), true);
    assert.equal(
      resolveHackShastraEvents(await repo.getAll()).some(
        (event) => event.id === created.id,
      ),
      false,
    );
  } finally {
    if (previousDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = previousDataDir;
    assert.ok(
      directory.startsWith(prefix),
      "Only remove the test's own temporary directory",
    );
    await rm(directory, { recursive: true, force: true });
  }
});
