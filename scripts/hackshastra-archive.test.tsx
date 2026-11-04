import assert from "node:assert/strict";
import test from "node:test";
import { Fragment, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import EventArchive from "../components/hackshastra/event-archive";
import { resolveHackShastraEvents } from "../lib/hackshastra-content";
import { eventSchema } from "../lib/validators/schemas";
import records from "../data/community-events.json";

const events = resolveHackShastraEvents(
  records.map((event) => eventSchema.parse(event)),
);
const render = (items = events) =>
  renderToStaticMarkup(createElement(EventArchive, { events: items }));

test("initial HTML contains every event and one expanded touch panel before hydration", () => {
  const html = render();
  assert.equal((html.match(/<button\b/g) ?? []).length, events.length);
  assert.equal((html.match(/aria-expanded="true"/g) ?? []).length, 1);
  assert.equal(
    (html.match(/aria-expanded="false"/g) ?? []).length,
    events.length - 1,
  );
  assert.equal((html.match(/ inert=""/g) ?? []).length, events.length - 1);
  for (const event of events)
    assert.ok(
      html.includes(event.title.replaceAll("'", "&#x27;")),
      event.title,
    );
  assert.ok(html.includes("Meetup"));
  assert.ok(html.includes("Campus orientation"));
});

test("every selection control points to an existing labeled region", () => {
  const html = render();
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, target] of html.matchAll(/aria-controls="([^"]+)"/g)) {
    assert.ok(ids.includes(target), `Missing selection target: ${target}`);
  }
  for (const [, label] of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
    assert.ok(ids.includes(label), `Missing region label: ${label}`);
  }
});

test("multiple archives do not duplicate control or panel IDs", () => {
  const html = renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement(EventArchive, { events }),
      createElement(EventArchive, { events }),
    ),
  );
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test("default artwork is preloaded once and other originals are deferred", () => {
  const html = render();
  assert.equal((html.match(/<link[^>]*rel="preload"/g) ?? []).length, 1);
  assert.equal(
    (html.match(/<img\b/g) ?? []).length,
    2,
    "Desktop and touch share the same responsive request",
  );
  assert.ok(html.includes(events[0].imageAlt!));
  for (const event of events.slice(1)) {
    assert.ok(
      !html.includes(event.image),
      "Other images wait until the archive nears the viewport or is selected",
    );
  }
});

test("missing artwork and optional metadata have an honest usable fallback", () => {
  const html = render([
    {
      ...events[0],
      image: "",
      date: "",
      category: undefined,
      location: "",
      role: "",
      description: "",
      href: "",
    },
  ]);
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes(`Artwork unavailable for ${events[0].title}`));
  assert.ok(!html.includes("HackShastra / Involvement"));
  assert.ok(!html.includes("View event"));
  assert.ok(!html.includes("undefined"));
});

test("empty archives offer the official destination without broken controls", () => {
  const html = render([]);
  assert.ok(html.includes('href="https://www.hackshastra.in/events"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(!html.includes("<button"));
});
