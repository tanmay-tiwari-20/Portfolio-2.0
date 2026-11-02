import assert from "node:assert/strict";
import test from "node:test";
import { createRadialPopLayout } from "../lib/radial-pop-layout";

type Point = { x: number; y: number };
type Card = Point & { rotate: number };

const ABOUT = {
  cardSize: 245,
  heroSize: 350,
  radius: 250,
  jitter: 3.5,
  heroPadding: 8.75,
};
const COUNTS = [0, 1, 2, 5, 6, 8];
const EPSILON = 1e-7;

function square(size: number, { x, y, rotate }: Card): Point[] {
  const radians = (rotate * Math.PI) / 180;
  return [
    [-size / 2, -size / 2],
    [size / 2, -size / 2],
    [size / 2, size / 2],
    [-size / 2, size / 2],
  ].map(([localX, localY]) => ({
    x: x + localX * Math.cos(radians) - localY * Math.sin(radians),
    y: y + localX * Math.sin(radians) + localY * Math.cos(radians),
  }));
}

function polygonArea(points: Point[]): number {
  return (
    Math.abs(
      points.reduce((sum, point, index) => {
        const next = points[(index + 1) % points.length];
        return sum + point.x * next.y - next.x * point.y;
      }, 0),
    ) / 2
  );
}

// Measure visible geometry independently of the layout's bounding-box solver.
function intersectionArea(subject: Point[], clip: Point[]): number {
  let result = subject;
  for (let edge = 0; edge < clip.length && result.length; edge++) {
    const a = clip[edge];
    const b = clip[(edge + 1) % clip.length];
    const distance = (point: Point) =>
      (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    const input = result;
    result = [];
    let previous = input[input.length - 1];
    let previousDistance = distance(previous);

    for (const current of input) {
      const currentDistance = distance(current);
      if (previousDistance >= 0 !== currentDistance >= 0) {
        const fraction =
          previousDistance / (previousDistance - currentDistance);
        result.push({
          x: previous.x + (current.x - previous.x) * fraction,
          y: previous.y + (current.y - previous.y) * fraction,
        });
      }
      if (currentDistance >= 0) result.push(current);
      previous = current;
      previousDistance = currentDistance;
    }
  }
  return polygonArea(result);
}

test("empty, sparse, and full galleries have finite layouts that contain every card", () => {
  for (const count of COUNTS) {
    const layout = createRadialPopLayout({ ...ABOUT, count });
    assert.equal(layout.positions.length, count);
    assert.ok(Number.isFinite(layout.dimension));
    assert.ok(layout.dimension >= ABOUT.heroSize);
    for (const card of layout.positions) {
      assert.ok([card.x, card.y, card.rotate].every(Number.isFinite));
      assert.ok(Math.abs(card.rotate) <= ABOUT.jitter);
      for (const corner of square(ABOUT.cardSize, card)) {
        assert.ok(Math.abs(corner.x) < layout.dimension / 2);
        assert.ok(Math.abs(corner.y) < layout.dimension / 2);
      }
    }
    if (!count) {
      assert.ok(
        layout.dimension < ABOUT.heroSize + ABOUT.cardSize / 4,
        "an empty fan should not shrink the portrait to fit nonexistent photos",
      );
    }
  }
});

test("photos stay at least 88% clear of the portrait even at extreme cursor travel", () => {
  for (const count of COUNTS) {
    const layout = createRadialPopLayout({ ...ABOUT, count });
    for (const x of [-ABOUT.heroPadding, 0, ABOUT.heroPadding]) {
      for (const y of [-ABOUT.heroPadding, 0, ABOUT.heroPadding]) {
        const portrait = square(ABOUT.heroSize, { x, y, rotate: 0 });
        for (const [index, card] of layout.positions.entries()) {
          const covered = intersectionArea(
            square(ABOUT.cardSize, card),
            portrait,
          );
          assert.ok(
            covered / ABOUT.cardSize ** 2 <= 0.12 + EPSILON,
            `${count} photos, card ${index}, portrait offset ${x}/${y}`,
          );
        }
      }
    }
  }
});

test("high rotation and small radius overrides cannot bury photos behind the center", () => {
  for (const count of [1, 2, 5, 6, 8]) {
    for (const jitter of [0, 35, 89, 140]) {
      for (const radius of [0, 80, 250, 600]) {
        const layout = createRadialPopLayout({
          ...ABOUT,
          count,
          jitter,
          radius,
        });
        const portrait = square(ABOUT.heroSize, { x: 0, y: 0, rotate: 0 });
        for (const card of layout.positions) {
          assert.ok(Math.hypot(card.x, card.y) >= radius - EPSILON);
          assert.ok(
            intersectionArea(square(ABOUT.cardSize, card), portrait) /
              ABOUT.cardSize ** 2 <=
              0.12 + EPSILON,
            `count=${count}, jitter=${jitter}, radius=${radius}`,
          );
          for (const corner of square(ABOUT.cardSize, card)) {
            assert.ok(Math.abs(corner.x) < layout.dimension / 2);
            assert.ok(Math.abs(corner.y) < layout.dimension / 2);
          }
        }
      }
    }
  }
});

test("five and six photo fans retain the center footprint and expose the surrounding photos", () => {
  // The previous About fan occupied 814 logical pixels before responsive scaling.
  const previousDimension = 814;
  for (const count of [5, 6]) {
    const layout = createRadialPopLayout({ ...ABOUT, count });
    assert.ok(layout.dimension < previousDimension * 1.05);
    assert.ok(previousDimension / layout.dimension >= 0.95);
    assert.ok(previousDimension / layout.dimension <= 1.05);
    const cards = layout.positions.map((card) => square(ABOUT.cardSize, card));
    for (const [index, card] of cards.entries()) {
      let peerCover = 0;
      for (const [peerIndex, peer] of cards.entries()) {
        if (index === peerIndex) continue;
        const overlap = intersectionArea(card, peer) / ABOUT.cardSize ** 2;
        assert.ok(
          overlap < 0.1,
          `cards ${index}/${peerIndex} overlap too much`,
        );
        peerCover += overlap;
      }
      for (const x of [-ABOUT.heroPadding, ABOUT.heroPadding]) {
        for (const y of [-ABOUT.heroPadding, ABOUT.heroPadding]) {
          const centerCover =
            intersectionArea(
              card,
              square(ABOUT.heroSize, { x, y, rotate: 0 }),
            ) /
            ABOUT.cardSize ** 2;
          // Adding overlaps is conservative when multiple covers share pixels.
          assert.ok(1 - centerCover - peerCover >= 0.8);
        }
      }
    }
  }
});

test("responsive scaling keeps actual rotated corners inside narrow and landscape stages", () => {
  const widths = [
    320, 360, 375, 390, 430, 640, 768, 820, 1024, 1280, 1440, 1920,
  ];
  for (const count of COUNTS) {
    const layout = createRadialPopLayout({ ...ABOUT, count });
    const corners = [
      ...square(ABOUT.heroSize, { x: 0, y: 0, rotate: 0 }),
      ...layout.positions.flatMap((card) => square(ABOUT.cardSize, card)),
    ];
    for (const width of widths) {
      for (const height of [225, 420, 720, 1080]) {
        const scale = Math.min(
          1,
          width / layout.dimension,
          height / layout.dimension,
        );
        for (const corner of corners) {
          const x = width / 2 + corner.x * scale;
          const y = height / 2 + corner.y * scale;
          assert.ok(
            x >= 0 && x <= width,
            `horizontal clip at ${width}×${height}`,
          );
          assert.ok(
            y >= 0 && y <= height,
            `vertical clip at ${width}×${height}`,
          );
        }
      }
    }
  }
});
