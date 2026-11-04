import assert from "node:assert/strict";
import test from "node:test";
import {
  clampDeskPosition,
  getDeskBounds,
  getDeskReleaseVelocity,
  isDeskDrag,
  stepDeskMotion,
  type DeskMotion,
} from "../lib/work-desk-physics";

const stage = { width: 1200, height: 360, inset: 8 };
const print = { width: 240, height: 170 };
const motion = (overrides: Partial<DeskMotion> = {}): DeskMotion => ({
  x: 500,
  y: 180,
  vx: 0,
  vy: 0,
  rotation: -8,
  restRotation: -8,
  angularVelocity: 0,
  ...overrides,
});

function corners(state: DeskMotion) {
  const radians = (state.rotation * Math.PI) / 180;
  return [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ].map(([x, y]) => ({
    x:
      state.x +
      ((x * print.width) / 2) * Math.cos(radians) -
      ((y * print.height) / 2) * Math.sin(radians),
    y:
      state.y +
      ((x * print.width) / 2) * Math.sin(radians) +
      ((y * print.height) / 2) * Math.cos(radians),
  }));
}

test("rotated prints remain completely within the desk after drag clamping", () => {
  for (const rotation of [-45, -18, -8, 0, 16, 45, 90]) {
    for (const target of [
      { x: -300, y: -100 },
      { x: 2000, y: 2000 },
    ]) {
      const center = clampDeskPosition(
        target,
        getDeskBounds(stage, print, rotation),
      );
      for (const corner of corners(motion({ ...center, rotation }))) {
        assert.ok(corner.x >= stage.inset - 1e-8);
        assert.ok(corner.x <= stage.width - stage.inset + 1e-8);
        assert.ok(corner.y >= stage.inset - 1e-8);
        assert.ok(corner.y <= stage.height - stage.inset + 1e-8);
      }
    }
  }
});

test("an oversized print centers safely and a hidden desk never produces NaN", () => {
  assert.deepEqual(getDeskBounds({ width: 60, height: 30 }, print), {
    minX: 30,
    maxX: 30,
    minY: 15,
    maxY: 15,
  });
  const result = stepDeskMotion(
    motion({ vx: 1000, vy: 1000 }),
    0.016,
    { width: 0, height: 0 },
    print,
  );
  assert.ok(Object.values(result.state).every(Number.isFinite));
  assert.equal(result.state.x, 0);
  assert.equal(result.state.y, 0);
});

test("click-sized movements are distinct from dragging", () => {
  assert.equal(isDeskDrag({ x: 0, y: 0 }, { x: 3, y: 4 }), false);
  assert.equal(isDeskDrag({ x: 0, y: 0 }, { x: 6, y: 0 }), false);
  assert.equal(isDeskDrag({ x: 0, y: 0 }, { x: 7, y: 0 }), true);
});

test("release velocity uses recent movement, caps throws and suppresses held-still releases", () => {
  const samples = [
    { x: 0, y: 0, time: 0 },
    { x: 80, y: 60, time: 100 },
  ];
  assert.deepEqual(getDeskReleaseVelocity(samples, 110), { vx: 800, vy: 600 });
  assert.deepEqual(getDeskReleaseVelocity(samples, 181), { vx: 0, vy: 0 });
  assert.deepEqual(getDeskReleaseVelocity([]), { vx: 0, vy: 0 });
  assert.deepEqual(
    getDeskReleaseVelocity([
      { x: 0, y: 0, time: 1 },
      { x: 50, y: 50, time: 1 },
    ]),
    { vx: 0, vy: 0 },
  );
  const capped = getDeskReleaseVelocity([
    { x: 0, y: 0, time: 0 },
    { x: 900, y: 1200, time: 10 },
  ]);
  assert.ok(Math.abs(Math.hypot(capped.vx, capped.vy) - 1400) < 1e-8);
  assert.ok(Math.abs(capped.vx / capped.vy - 0.75) < 1e-12);
});

test("free movement and rotation settle consistently at 60Hz and 120Hz", () => {
  const run = (rate: number) => {
    let state = motion({ vx: 650, vy: -60, rotation: 12, angularVelocity: 40 });
    for (let frame = 0; frame < rate; frame++)
      state = stepDeskMotion(state, 1 / rate, stage, print).state;
    return state;
  };
  const a = run(60),
    b = run(120);
  for (const key of ["x", "y", "rotation"] as const)
    assert.ok(Math.abs(a[key] - b[key]) < 0.2, key);
  assert.ok(a.x > 600 && a.x < 630);
  assert.ok(Math.abs(a.rotation + 8) < 0.05);
});

test("throws rebound gently, stay contained through rotation and stop", () => {
  let state = motion({
    x: 1030,
    y: 145,
    vx: 1400,
    vy: -900,
    rotation: 22,
    restRotation: -7,
    angularVelocity: -70,
  });
  let sawRebound = false;
  let settled = false;
  for (let frame = 0; frame < 600; frame++) {
    const step = stepDeskMotion(state, 1 / 120, stage, print);
    state = step.state;
    sawRebound ||= state.vx < 0;
    for (const corner of corners(state)) {
      assert.ok(
        corner.x >= stage.inset - 1e-7 &&
          corner.x <= stage.width - stage.inset + 1e-7,
      );
      assert.ok(
        corner.y >= stage.inset - 1e-7 &&
          corner.y <= stage.height - stage.inset + 1e-7,
      );
    }
    if (step.settled) {
      settled = true;
      break;
    }
  }
  assert.equal(sawRebound, true);
  assert.equal(settled, true);
  assert.equal(state.rotation, state.restRotation);
  assert.equal(state.vx, 0);
  assert.equal(state.vy, 0);
});

test("a paused tab cannot produce a large jump and stepping never mutates input", () => {
  const initial = motion({ vx: 500 });
  const snapshot = { ...initial };
  const paused = stepDeskMotion(initial, 20, stage, print);
  const capped = stepDeskMotion(initial, 0.05, stage, print);
  assert.deepEqual(paused, capped);
  assert.deepEqual(initial, snapshot);
  assert.ok(paused.state.x - initial.x < 25);
});
