import assert from "node:assert/strict";
import test from "node:test";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HackathonsArchive from "../components/hackathons/hackathons-archive";
import sourceEvents from "../data/hackathons.json";
import {
  getHackathonContext,
  getHackathonSource,
  hackathonDisplayDate,
  safeHackathonLink,
} from "../lib/hackathons-content";
import { hackathonSchema, type Hackathon } from "../lib/validators/schemas";

const events = sourceEvents.map((event) => hackathonSchema.parse(event));
const nexhack = events.find((event) => event.id === "xgMMRuZ_ZHn-VH5kj-xbk")!;
const matrix = events.find((event) => event.name === "Matrix 3.0")!;
const render = (items: Hackathon[]) =>
  renderToStaticMarkup(createElement(HackathonsArchive, { events: items }));

test("event links accept ordinary HTTPS and reject executable, insecure or credential-bearing URLs", () => {
  assert.equal(
    safeHackathonLink("https://example.org/event?edition=2#about"),
    "https://example.org/event?edition=2#about",
  );
  assert.equal(
    safeHackathonLink(" https://example.org/event "),
    "https://example.org/event",
  );
  for (const value of [
    undefined,
    "",
    " ",
    "javascript:alert(1)",
    "data:text/html,test",
    "http://example.org",
    "//example.org",
    "/event",
    "https://person:secret@example.org",
    "https://person@example.org",
    "https://",
  ]) {
    assert.equal(safeHackathonLink(value), undefined, String(value));
  }
});

test("the disputed NexHack month becomes year precision while confirmed Matrix April remains visible", () => {
  const before = JSON.stringify(events);
  assert.equal(hackathonDisplayDate(nexhack), "2026");
  assert.equal(hackathonDisplayDate(matrix), "April 2026");
  assert.equal(hackathonDisplayDate({ ...matrix, date: "  " }), undefined);
  assert.equal(
    hackathonDisplayDate({ ...nexhack, date: "September 2026" }),
    "September 2026",
  );
  assert.equal(JSON.stringify(events), before);
});

test("research guards do not transfer a known date correction or location to another event identity", () => {
  for (const edit of [
    { id: "new-record" },
    { name: "Nexhack 3.0" },
    { organizer: "Another university" },
    { role: "Judge" as const },
  ]) {
    const changed = { ...nexhack, ...edit };
    assert.equal(hackathonDisplayDate(changed), "Aug 2026");
    assert.equal(getHackathonContext(changed), undefined);
  }
  assert.equal(
    getHackathonContext({ ...matrix, date: "April 2027" }),
    undefined,
  );
  assert.equal(
    getHackathonContext(events.find((event) => event.name === "Code 1")!),
    undefined,
  );
});

test("official context enriches matching records without upgrading their roles or supplying exact dates", () => {
  const before = JSON.stringify(events);
  assert.deepEqual(getHackathonContext(matrix), {
    location: "IITM Janakpuri, New Delhi",
    officialUrl: "https://matrix-3.devfolio.co/",
  });
  for (const event of events) {
    const context = getHackathonContext(event);
    if (context)
      assert.equal(safeHackathonLink(context.officialUrl), context.officialUrl);
  }
  assert.equal(JSON.stringify(events), before);
});

test("only the disputed original NexHack post is replaced; saved source edits and removals remain authoritative", () => {
  assert.deepEqual(getHackathonSource(nexhack), {
    href: "https://nexhack-2.devfolio.co/",
    label: "Official event",
  });
  assert.equal(getHackathonSource(matrix)?.href, matrix.link);
  assert.equal(
    getHackathonSource({ ...nexhack, link: "https://example.org/new-recap" })
      ?.href,
    "https://example.org/new-recap",
  );
  assert.equal(
    getHackathonSource({ ...nexhack, name: "Renamed event" })?.href,
    nexhack.link,
  );
  assert.equal(getHackathonSource({ ...nexhack, link: "" }), undefined);
  assert.equal(
    getHackathonSource({ ...matrix, link: "javascript:alert(1)" }),
    undefined,
  );
});

test("initial archive stays compact with correctly labelled, independently reusable accordion panels", () => {
  const html = render(events);
  assert.equal((html.match(/aria-expanded="true"/g) ?? []).length, 0);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 4);
  assert.ok(html.includes("Page 1 of 3"));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, target] of html.matchAll(/aria-controls="([^"]+)"/g))
    assert.ok(ids.includes(target));
  for (const [, label] of html.matchAll(/aria-labelledby="([^"]+)"/g))
    assert.ok(ids.includes(label));
  assert.equal((html.match(/role="region"[^>]*hidden=""/g) ?? []).length, 4);

  const twice = renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement(HackathonsArchive, { events }),
      createElement(HackathonsArchive, { events }),
    ),
  );
  const combinedIds = [...twice.matchAll(/\bid="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.equal(new Set(combinedIds).size, combinedIds.length);
});

test("archive keeps personal roles distinct, excludes team counts, and sanitizes editable source links", () => {
  const html = render([
    {
      ...events[0],
      role: "Organizer",
      teams: 987654,
      link: "javascript:alert(1)",
    },
  ]);
  assert.ok(html.includes(">Organising</button>"));
  assert.ok(html.includes(">Organizer</span>"));
  assert.ok(!html.includes("987654"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(!html.includes("View event post"));
  assert.equal((html.match(/<img\b/g) ?? []).length, 7);
  assert.ok(html.includes('loading="lazy"'));
  assert.equal((html.match(/alt=""/g) ?? []).length, 6);
  assert.ok(html.includes('aria-haspopup="dialog"'));
});

test("empty archive renders a useful message with no dangling accordion IDs or enabled pagination", () => {
  const html = render([]);
  assert.ok(html.includes("No published events"));
  assert.ok(
    html.includes("More experiences will appear here as the journal grows."),
  );
  assert.ok(!html.includes("aria-controls="));
  assert.ok(!html.includes("Page 1 of 0"));
  assert.equal(
    (
      html.match(
        /<button[^>]*disabled=""[^>]*aria-label="(?:Previous|Next) events"/g,
      ) ?? []
    ).length,
    2,
  );
});
