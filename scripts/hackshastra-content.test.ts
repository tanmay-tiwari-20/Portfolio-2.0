import assert from "node:assert/strict";
import test from "node:test";
import sourceEvents from "../data/community-events.json";
import { hackshastraEvents } from "../data/hackshastra";
import { resolveHackShastraEvents } from "../lib/hackshastra-content";
import { eventSchema, type CommunityEvent } from "../lib/validators/schemas";

const seed = sourceEvents.map((event) => eventSchema.parse(event));
const firstHackathon = seed.find((event) => event.id === "event-01")!;
const grandHack = seed.find((event) => event.title === "Grand Hack IPEC")!;

function newEvent(overrides: Partial<CommunityEvent> = {}): CommunityEvent {
  return {
    id: "new-event",
    title: "Student workshop",
    date: "01-01-2027",
    venue: "IPEC, Ghaziabad",
    description: "A description written by the organiser.",
    attendees: 0,
    status: "upcoming",
    isPublished: true,
    sortOrder: 0,
    createdAt: "2026-11-05",
    updatedAt: "2026-11-05",
    ...overrides,
  };
}

test("archive keeps every published record and orders dates independently of admin sort order", () => {
  const before = JSON.stringify(seed);
  const records = [...seed].reverse().map((record) => ({
    ...record,
    sortOrder: 0,
  }));
  const archive = resolveHackShastraEvents([
    ...records,
    newEvent({ id: "hidden", isPublished: false, date: "01-01-2024" }),
  ]);
  assert.deepEqual(
    archive.map((event) => event.title),
    [
      "HackShastra Pre-Meetup",
      "HackShastra 1.0",
      "HI-O",
      "SnowHackIPEC",
      "TEXPO'26",
      "ShubhShastra",
      "Grand Hack IPEC",
    ],
  );
  assert.equal(
    JSON.stringify(seed),
    before,
    "input data must remain unchanged",
  );
  assert.deepEqual(resolveHackShastraEvents([]), []);
});

test("original records receive researched copy and month-only evidence without losing live fields", () => {
  const [event] = resolveHackShastraEvents([firstHackathon]);
  const research = hackshastraEvents.find(
    (item) => item.href === firstHackathon.link,
  )!;
  assert.equal(event.id, firstHackathon.id);
  assert.equal(event.title, firstHackathon.title);
  assert.equal(event.location, firstHackathon.venue);
  assert.equal(event.image, firstHackathon.image?.url);
  assert.equal(event.href, firstHackathon.link);
  assert.equal(event.description, research.description);
  assert.equal(event.date, "September 2025");
  assert.equal(event.role, research.role);
});

test("saved title, venue, date, description and artwork edits override original defaults", () => {
  const image =
    "https://res.cloudinary.com/example/image/upload/v1/new-poster.webp";
  const edited = {
    ...grandHack,
    title: "Grand Hack — updated title",
    venue: "A revised venue",
    date: "31-12-2026",
    description: "Updated details from the organiser.",
    image: { url: image, alt: "Updated poster" },
  };
  const [event] = resolveHackShastraEvents([edited]);
  assert.equal(event.title, edited.title);
  assert.equal(event.location, edited.venue);
  assert.equal(event.date, "31 December 2026");
  assert.equal(event.description, edited.description);
  assert.equal(event.image, image);
  assert.equal(event.href, edited.link);
  assert.equal(event.role, "Organised with IPEC");
});

test("description and date enhancements are guarded independently", () => {
  const research = hackshastraEvents.find(
    (item) => item.href === grandHack.link,
  )!;
  const [editedCopy, editedDate] = [
    resolveHackShastraEvents([{ ...grandHack, description: "New copy" }])[0],
    resolveHackShastraEvents([{ ...grandHack, date: "01-10-2026" }])[0],
  ];
  assert.equal(editedCopy.description, "New copy");
  assert.equal(editedCopy.date, research.date);
  assert.equal(editedDate.description, research.description);
  assert.equal(editedDate.date, "1 October 2026");
});

test("a changed or removed event URL cannot retain research claims from the old event", () => {
  for (const link of ["https://example.com/replacement", undefined, ""]) {
    const [event] = resolveHackShastraEvents([{ ...grandHack, link }]);
    assert.equal(event.role, "Community event");
    assert.equal(event.description, grandHack.description);
    assert.equal(event.date, "26 September 2026");
    assert.equal(event.href, link ?? "");
  }
});

test("new records cannot inherit a partnership from a venue or a reused research link", () => {
  const records = [
    newEvent({ id: "custom-venue", venue: "Subharti University, Meerut" }),
    newEvent({ id: "copied-link", link: grandHack.link }),
  ];
  const archive = resolveHackShastraEvents(records);
  archive.forEach((event, index) => {
    assert.equal(event.role, "Community event");
    assert.equal(event.description, records[index].description);
    assert.equal(event.date, "1 January 2027");
  });
  assert.equal(archive[0].image, "");
  assert.equal(archive[0].href, "");
});

test("unsafe image and navigation URLs are omitted rather than rendered", () => {
  const unsafeImages = [
    "javascript:alert(1)",
    "http://res.cloudinary.com/example/image/upload/poster.png",
    "https://res.cloudinary.com.evil.test/example/image/upload/poster.png",
    "https://person:secret@res.cloudinary.com/example/image/upload/poster.png",
    "https://res.cloudinary.com/example/raw/upload/document.html",
    "https://example.com/poster.png",
  ];
  for (const url of unsafeImages) {
    const [event] = resolveHackShastraEvents([
      newEvent({ image: { url, alt: "Submitted poster" } }),
    ]);
    assert.equal(event.image, "", url);
  }
  for (const link of [
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "http://example.com/event",
    "//example.com/event",
    "https://person:secret@example.com/event",
  ]) {
    const [event] = resolveHackShastraEvents([newEvent({ link })]);
    assert.equal(event.href, "", link);
  }
});

test("strict UTC calendar parsing preserves leap days and rejects calendar rollover", () => {
  const dates = [
    "31-02-2026",
    "01-01-2027",
    "31-12-2026",
    "29-02-2024",
    "29-02-2025",
    "Spring 2027",
  ];
  const archive = resolveHackShastraEvents(
    dates.map((date, index) => newEvent({ id: `date-${index}`, date })),
  );
  assert.deepEqual(
    archive.map((event) => event.date),
    [
      "29 February 2024",
      "31 December 2026",
      "1 January 2027",
      "31-02-2026",
      "29-02-2025",
      "Spring 2027",
    ],
  );
});

test("equal dates retain order and duplicate imports cannot collide with accordion IDs", () => {
  const records = [
    newEvent({ id: "duplicate", title: "First" }),
    newEvent({ id: "duplicate", title: "Second" }),
    newEvent({ id: "duplicate--2", title: "Third" }),
  ];
  const archive = resolveHackShastraEvents(records);
  assert.deepEqual(
    archive.map((event) => event.title),
    ["First", "Second", "Third"],
  );
  assert.equal(new Set(archive.map((event) => event.id)).size, 3);
  assert.equal(archive[0].id, "duplicate");
  assert.equal(archive[2].id, "duplicate--2");
});
