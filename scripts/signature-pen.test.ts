import assert from "node:assert/strict";
import test from "node:test";
import {
  SIGNATURE_PROGRESS,
  signaturePenAngle,
  signaturePenFrame,
  signatureProgress,
} from "../lib/signature-pen";
import {
  SIGNATURE_HEIGHT,
  SIGNATURE_STROKES,
  SIGNATURE_WIDTH,
} from "../lib/tanmay-signature";

const closeTo = (actual: number, expected: number) => {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
};

test("the nib follows the ink keyframes, including interpolation between them", () => {
  assert.deepEqual(SIGNATURE_PROGRESS, [
    { offset: 0, progress: 0 },
    { offset: 0.16, progress: 0.11 },
    { offset: 0.43, progress: 0.45 },
    { offset: 0.79, progress: 0.82 },
    { offset: 1, progress: 1 },
  ]);
  closeTo(signatureProgress(-1), 0);
  closeTo(signatureProgress(2), 1);
  for (let index = 0; index < SIGNATURE_PROGRESS.length; index++) {
    const keyframe = SIGNATURE_PROGRESS[index];
    closeTo(signatureProgress(keyframe.offset), keyframe.progress);
    if (index === 0) continue;
    const previous = SIGNATURE_PROGRESS[index - 1];
    closeTo(
      signatureProgress((previous.offset + keyframe.offset) / 2),
      (previous.progress + keyframe.progress) / 2,
    );
  }
  let previous = 0;
  for (let tick = 0; tick <= 1000; tick++) {
    const progress = signatureProgress(tick / 1000);
    assert.ok(progress >= previous && progress <= 1);
    previous = progress;
  }
});

test("the first T finishes, lifts for 35ms, and begins its downstroke", () => {
  assert.deepEqual(signaturePenFrame(0), { index: 0, progress: 0, lift: null });
  const drawing = signaturePenFrame(330 * 0.43);
  assert.equal(drawing?.index, 0);
  assert.equal(drawing?.lift, null);
  closeTo(drawing!.progress, 0.45);
  assert.deepEqual(signaturePenFrame(330), { index: 1, progress: 0, lift: 0 });
  assert.deepEqual(signaturePenFrame(347.5), { index: 1, progress: 0, lift: 0.5 });
  assert.deepEqual(signaturePenFrame(365), { index: 1, progress: 0, lift: null });
  const downstroke = signaturePenFrame(365 + 270 * 0.79);
  assert.equal(downstroke?.index, 1);
  closeTo(downstroke!.progress, 0.82);
});

test("every pen-up interval keeps the next stroke unwritten and completion removes the nib", () => {
  let elapsed = 0;
  for (const [index, stroke] of SIGNATURE_STROKES.entries()) {
    if (stroke.delay > 0) {
      assert.deepEqual(signaturePenFrame(elapsed + stroke.delay / 2), {
        index,
        progress: 0,
        lift: 0.5,
      });
    }
    elapsed += stroke.delay;
    assert.deepEqual(signaturePenFrame(elapsed), { index, progress: 0, lift: null });
    const finalInk = signaturePenFrame(elapsed + stroke.duration - 0.01);
    assert.equal(finalInk?.index, index);
    assert.equal(finalInk?.lift, null);
    assert.ok(finalInk!.progress > 0.99 && finalInk!.progress < 1);
    elapsed += stroke.duration;
  }
  assert.equal(elapsed, 3930, "the pen must preserve the existing reveal duration");
  assert.equal(signaturePenFrame(elapsed), null);
  assert.equal(signaturePenFrame(elapsed + 1000), null);
});

type Point = [number, number];

function sampleStroke(path: string): Point[] {
  const segments = [...path.matchAll(/([MC])([^MC]+)/g)];
  const points: Point[] = [];
  let previous: Point = [0, 0];
  for (const segment of segments) {
    const values = segment[2].trim().split(/\s+/).map(Number);
    if (segment[1] === "M") {
      previous = [values[0], values[1]];
      points.push(previous);
      continue;
    }
    for (let step = 1; step <= 20; step++) {
      const t = step / 20;
      const u = 1 - t;
      points.push([
        u ** 3 * previous[0] + 3 * u ** 2 * t * values[0] + 3 * u * t ** 2 * values[2] + t ** 3 * values[4],
        u ** 3 * previous[1] + 3 * u ** 2 * t * values[1] + 3 * u * t ** 2 * values[3] + t ** 3 * values[5],
      ]);
    }
    previous = [values[4], values[5]];
  }
  return points;
}

test("the complete pen silhouette stays inside reserved space during writing and lifts", () => {
  const strokePoints = SIGNATURE_STROKES.map((stroke) => sampleStroke(stroke.path));
  const locations = strokePoints.flat();
  for (let index = 1; index < strokePoints.length; index++) {
    const previous = strokePoints[index - 1].at(-1)!;
    const next = strokePoints[index][0];
    for (let step = 0; step <= 20; step++) {
      const lift = step / 20;
      const travel = lift * lift * (3 - 2 * lift);
      locations.push([
        previous[0] + (next[0] - previous[0]) * travel,
        previous[1] + (next[1] - previous[1]) * travel - Math.sin(Math.PI * lift) * 8,
      ]);
    }
  }
  assert.ok(locations.length > 1000);
  // Bounding rectangle includes the barrel, clip, nib, and stroke thickness.
  const corners: Point[] = [[-6.2, -60.5], [6.2, -60.5], [-6.2, 0.5], [6.2, 0.5]];
  for (const [x, y] of locations) {
    const angle = signaturePenAngle(x, y);
    assert.ok(Number.isFinite(angle) && angle >= 0 && angle <= 90);
    const radians = angle * Math.PI / 180;
    for (const [localX, localY] of corners) {
      const transformedX = x + localX * Math.cos(radians) - localY * Math.sin(radians);
      const transformedY = y + localX * Math.sin(radians) + localY * Math.cos(radians);
      assert.ok(transformedX >= 0 && transformedX <= SIGNATURE_WIDTH, `pen crosses horizontal boundary at ${x}, ${y}`);
      assert.ok(transformedY >= 0 && transformedY <= SIGNATURE_HEIGHT, `pen crosses vertical boundary at ${x}, ${y}`);
    }
  }
});
