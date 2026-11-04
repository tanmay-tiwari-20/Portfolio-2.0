import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  hasContributionChanges,
  parseContributionData,
  prepareContributionData,
  type ContributionData,
  type ContributionDay,
} from "../lib/github-contributions";

test("the checked-in snapshot is a valid, complete public calendar for the intended account", () => {
  const source: unknown = JSON.parse(
    readFileSync(
      new URL("../data/github-contributions.json", import.meta.url),
      "utf8",
    ),
  );
  const snapshot = parseContributionData(source);
  assert.equal(snapshot.username, "tanmay-tiwari-20");
  assert.deepEqual(
    Object.keys(source as object).sort(),
    Object.keys(snapshot).sort(),
  );
  assert.ok(
    snapshot.days.length >= 365,
    "The generated snapshot must include GitHub's complete trailing year.",
  );
});

const day = (date: string, count = 0): ContributionDay => ({
  date,
  contributionCount: count,
  contributionLevel: count ? "FIRST_QUARTILE" : "NONE",
});

function fixture(): ContributionData {
  const days = [
    day("2026-10-30", 2),
    day("2026-10-31", 5),
    day("2026-11-01", 5),
  ];
  return {
    username: "tanmay-tiwari-20",
    totalContributions: 19,
    startDate: days[0].date,
    endDate: days[2].date,
    generatedAt: "2026-11-01T12:00:00.000Z",
    days,
    maxDay: days[1],
  };
}

test("automatic reruns ignore fetch timestamps but retain every meaningful calendar change", () => {
  const source = fixture();
  assert.equal(
    hasContributionChanges(source, {
      ...source,
      generatedAt: "2026-11-01T18:00:00.000Z",
    }),
    false,
  );
  assert.equal(
    hasContributionChanges(source, { ...source, totalContributions: 20 }),
    true,
  );
  assert.equal(
    hasContributionChanges(source, {
      ...source,
      days: source.days.map((day, index) =>
        index ? day : { ...day, contributionCount: 3 },
      ),
    }),
    true,
  );
  assert.equal(
    hasContributionChanges(source, {
      ...source,
      days: source.days.map((day, index) =>
        index ? day : { ...day, contributionLevel: "SECOND_QUARTILE" },
      ),
    }),
    true,
  );
  assert.equal(
    hasContributionChanges(source, {
      ...source,
      endDate: "2026-11-02",
      days: [...source.days, day("2026-11-02")],
    }),
    true,
  );
});

test("flattens partial weeks chronologically and keeps GitHub's total when it differs from daily sum", () => {
  const source = fixture();
  const result = prepareContributionData(
    source.username,
    {
      totalContributions: source.totalContributions,
      weeks: [
        { contributionDays: source.days.slice(2) },
        { contributionDays: source.days.slice(0, 2) },
      ],
    },
    source.generatedAt,
  );
  assert.deepEqual(result, source);
  assert.equal(result.totalContributions, 19);
  assert.equal(
    result.days.reduce((sum, current) => sum + current.contributionCount, 0),
    12,
  );
  assert.equal(result.maxDay?.date, "2026-10-31");
});

test("rejects an incorrect peak or the later date in a maximum tie", () => {
  const source = fixture();
  assert.throws(
    () => parseContributionData({ ...source, maxDay: source.days[2] }),
    /earliest/,
  );
  assert.throws(
    () => parseContributionData({ ...source, maxDay: source.days[0] }),
    /earliest/,
  );
  assert.throws(
    () => parseContributionData({ ...source, maxDay: null }),
    /earliest/,
  );
});

test("keeps a truthful zero-activity calendar without inventing a highlighted day", () => {
  const source = fixture();
  const days = source.days.map((current) => day(current.date));
  const result = parseContributionData({
    ...source,
    totalContributions: 0,
    days,
    maxDay: null,
  });
  assert.equal(result.maxDay, null);
  assert.equal(result.days.length, 3);
});

test("rejects duplicate, missing, reversed, and impossible dates", () => {
  const source = fixture();
  for (const days of [
    [source.days[0], source.days[0], source.days[2]],
    [source.days[0], source.days[2]],
    [...source.days].reverse(),
    [day("2026-02-30")],
  ]) {
    assert.throws(
      () => parseContributionData({ ...source, days }),
      /date|chronological/,
    );
  }
  assert.throws(
    () => parseContributionData({ ...source, endDate: "2026-11-02" }),
    /period/,
  );
});

test("rejects untrusted counts, levels, totals, usernames, and timestamps", () => {
  const source = fixture();
  for (const contributionCount of [-1, 0.5, "2", NaN, Infinity]) {
    assert.throws(
      () =>
        parseContributionData({
          ...source,
          days: [
            { ...source.days[0], contributionCount },
            ...source.days.slice(1),
          ],
        }),
      /count/,
    );
  }
  for (const contributionLevel of ["NEON", "NONE", 2]) {
    assert.throws(
      () =>
        parseContributionData({
          ...source,
          days: [
            { ...source.days[0], contributionLevel },
            ...source.days.slice(1),
          ],
        }),
      /level/,
    );
  }
  assert.throws(
    () => parseContributionData({ ...source, totalContributions: -2 }),
    /total/,
  );
  assert.throws(
    () => parseContributionData({ ...source, username: "../secret" }),
    /username/,
  );
  assert.throws(
    () =>
      parseContributionData({ ...source, generatedAt: "2026-02-30T12:00:00Z" }),
    /generation date/,
  );
  assert.throws(
    () => parseContributionData({ ...source, generatedAt: "yesterday" }),
    /timestamp/,
  );
});

test("only emits the public schema and rejects missing or malformed API data", () => {
  const source = fixture();
  assert.deepEqual(
    parseContributionData({ ...source, secret: "discard me" }),
    source,
  );
  for (const calendar of [
    null,
    {},
    { weeks: [] },
    { weeks: [{ contributionDays: null }] },
  ]) {
    assert.throws(
      () =>
        prepareContributionData(source.username, calendar, source.generatedAt),
      /contribution data/,
    );
  }
});
