import assert from "node:assert/strict";
import test from "node:test";
import {
  CITY_DURATION,
  createCityLayout,
  getBuildingGeometry,
  getPeakAnnotation,
  hitTestCity,
  type CityBuilding,
  type CityLayout,
} from "../lib/contribution-city";
import type {
  ContributionData,
  ContributionDay,
} from "../lib/github-contributions";

function calendar(
  counts: number[],
  startDate = "2025-01-05",
): ContributionData {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const days: ContributionDay[] = counts.map((contributionCount, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    contributionCount,
    contributionLevel: contributionCount ? "THIRD_QUARTILE" : "NONE",
  }));
  const maximum = Math.max(...counts);
  return {
    username: "test-calendar",
    totalContributions: counts.reduce((sum, count) => sum + count, 0),
    startDate,
    endDate: days[days.length - 1].date,
    generatedAt: "2026-01-05T00:00:00.000Z",
    days,
    maxDay: maximum
      ? days.find((day) => day.contributionCount === maximum)!
      : null,
  };
}

test("partial weeks preserve UTC calendar positions instead of shifting day zero to Sunday", () => {
  const data = calendar(Array(365).fill(1), "2025-01-08");
  const layout = createCityLayout(data, 1200, 390);
  const first = layout.buildings.find((building) => building.index === 0)!;
  const nextSunday = layout.buildings.find((building) => building.index === 4)!;
  assert.equal(first.weekday, 3);
  assert.equal(first.week, 0);
  assert.equal(nextSunday.weekday, 0);
  assert.equal(nextSunday.week, 1);
  assert.equal(layout.buildings.length, 365);
  assert.equal(
    new Set(layout.buildings.map((building) => building.day.date)).size,
    365,
  );
  assert.deepEqual(
    layout.buildings.map((building) => building.index).sort((a, b) => a - b),
    data.days.map((_, index) => index),
  );
});

test("height uses actual square-root counts while zero days stay flat", () => {
  const layout = createCityLayout(calendar([0, 1, 4, 16, 64, 0, 0]), 1200, 390);
  const byIndex = [...layout.buildings].sort((a, b) => a.index - b.index);
  assert.equal(byIndex[0].height, 0);
  assert.equal(byIndex[2].height / byIndex[1].height, 2);
  assert.equal(byIndex[4].height / byIndex[3].height, 2);
  assert.ok(byIndex[1].height > 0);
  assert.equal(layout.peak?.index, 4);
  assert.equal(
    createCityLayout(calendar(Array(365).fill(0)), 1200, 390).peak,
    null,
  );
});

test("the rise travels from far rows toward near rows and finishes before the leader appears", () => {
  const layout = createCityLayout(calendar(Array(365).fill(16)), 1200, 390);
  const sunday = layout.buildings.find((building) => building.index === 0)!;
  const saturday = layout.buildings.find((building) => building.index === 6)!;
  assert.ok(sunday.delay < saturday.delay);
  assert.equal(getBuildingGeometry(sunday, 0).height, 0);
  assert.equal(getBuildingGeometry(saturday, 400).height, 0);
  assert.ok(getBuildingGeometry(sunday, 400).height > 0);
  assert.equal(getPeakAnnotation(layout, 2250)?.progress, 0);
  assert.ok(
    layout.buildings.every(
      (building) =>
        getBuildingGeometry(building, 2250).height === building.height,
    ),
  );
  assert.equal(getPeakAnnotation(layout, CITY_DURATION)?.progress, 1);
  assert.deepEqual(
    getBuildingGeometry(sunday, CITY_DURATION),
    getBuildingGeometry(sunday, Infinity),
  );
  assert.equal(getPeakAnnotation(layout, Infinity)?.progress, 1);
});

test("phones split the calendar into chronological districts with larger day footprints", () => {
  const data = calendar(Array(365).fill(9), "2025-01-08");
  const phone = createCityLayout(data, 320, 560);
  const tablet = createCityLayout(data, 600, 390);
  assert.equal(phone.districts.length, 2);
  assert.equal(tablet.districts.length, 1);
  const split = phone.buildings.filter(
    (building) => building.district === 0,
  ).length;
  assert.equal(phone.districts[0].startDate, data.startDate);
  assert.equal(phone.districts[0].endDate, data.days[split - 1].date);
  assert.equal(phone.districts[1].startDate, data.days[split].date);
  assert.equal(phone.districts[1].endDate, data.endDate);
  assert.ok(phone.buildings.every((building) => building.width > 6));
});

test("all faces, ground planes and leader labels stay inside responsive viewports, including overshoot", () => {
  const data = calendar(
    Array.from({ length: 365 }, (_, index) => index % 67),
    "2025-01-08",
  );
  for (const width of [280, 320, 390, 599, 600, 768, 1024, 1440, 2200]) {
    const height = width < 600 ? 560 : 390;
    const layout = createCityLayout(data, width, height);
    for (const elapsed of [0, 400, 1400, 1800, CITY_DURATION, Infinity]) {
      const points = layout.buildings.flatMap((building) => {
        const geometry = getBuildingGeometry(building, elapsed);
        return [...geometry.front, ...geometry.top, ...geometry.side];
      });
      points.push(...layout.districts.flatMap((district) => district.ground));
      assert.ok(
        points.every(
          (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
        ),
        `finite at width ${width}`,
      );
      assert.ok(
        points.every((point) => point.x >= 0 && point.x <= width),
        `horizontal containment at width ${width}`,
      );
      assert.ok(
        points.every((point) => point.y >= 0 && point.y <= height),
        `vertical containment at width ${width}`,
      );
    }
    const annotation = getPeakAnnotation(layout, Infinity)!;
    assert.ok(annotation.end.x >= 0 && annotation.end.x + 190 <= width);
    assert.ok(annotation.end.y - 50 >= 0 && annotation.end.y < height);
  }
});

test("picking resolves the frontmost visible building and supports empty-day pads", () => {
  const data = calendar([9, 0]);
  const building = createCityLayout(data, 1200, 390).buildings[0];
  const back: CityBuilding = {
    ...building,
    index: 0,
    x: 50,
    y: 150,
    width: 20,
    depthX: 8,
    depthY: 5,
    height: 70,
    delay: 0,
  };
  const front: CityBuilding = { ...back, index: 1, x: 50, y: 158, height: 65 };
  const layout: CityLayout = {
    width: 200,
    height: 200,
    buildings: [back, front],
    districts: [],
    peak: null,
  };
  assert.equal(
    hitTestCity(layout, 60, 110, Infinity),
    1,
    "front face occludes the rear face",
  );
  assert.equal(
    hitTestCity(layout, 60, 85, Infinity),
    0,
    "rear tower remains selectable above the front roof",
  );
  assert.equal(hitTestCity(layout, 60, 60, Infinity), null);
  assert.equal(hitTestCity(layout, NaN, 100, Infinity), null);
  const empty: CityBuilding = { ...front, height: 0 };
  const emptyGeometry = getBuildingGeometry(empty, Infinity);
  assert.equal(
    hitTestCity(
      { ...layout, buildings: [empty] },
      emptyGeometry.roof.x,
      emptyGeometry.roof.y,
      Infinity,
    ),
    1,
  );
});

test("hidden and invalid canvas sizes produce an inert, finite layout", () => {
  const data = calendar([1]);
  for (const size of [0, -1, NaN, Infinity]) {
    const layout = createCityLayout(data, size, size);
    assert.deepEqual(layout.buildings, []);
    assert.ok(Number.isFinite(layout.width) && Number.isFinite(layout.height));
    assert.equal(hitTestCity(layout, 0, 0, Infinity), null);
  }
});
