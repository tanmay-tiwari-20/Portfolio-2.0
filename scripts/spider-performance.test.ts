import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdaptiveResolution,
  getTransitionResolution,
} from "../components/animations/spider-transition/performance";

test("capture and renderer backing stores respect viewport and pixel budgets", () => {
  for (const [width, height, dpr, cores] of [
    [390, 844, 3, 8],
    [768, 1024, 2, 8],
    [1440, 900, 3, 8],
    [3440, 1440, 2, 8],
    [3840, 2160, 3, 8],
    [1920, 1080, 2, 4],
  ]) {
    const quality = getTransitionResolution(width, height, dpr, cores);
    assert.equal(quality.low, width < 700 || cores <= 4);
    for (const [ratio, cap, budget] of [
      [quality.captureRatio, quality.low ? 1.5 : 2, quality.low ? 2e6 : 5e6],
      [
        quality.renderRatio,
        quality.low ? 1.25 : 1.75,
        quality.low ? 1.5e6 : 4e6,
      ],
    ]) {
      assert.ok(ratio > 0 && ratio <= Math.min(dpr, cap));
      assert.ok(width * height * ratio ** 2 <= budget + 0.0001);
    }
  }
  assert.deepEqual(getTransitionResolution(390, 844, 3), {
    low: true,
    captureRatio: 1.5,
    renderRatio: 1.25,
  });
  assert.equal(getTransitionResolution(1440, 900, 1).renderRatio, 1);
  assert.ok(getTransitionResolution(3840, 2160, 3).renderRatio < 1);
});

test("invalid and extreme sizing inputs cannot produce invalid ratios", () => {
  for (const [width, height, dpr, cores] of [
    [0, -1, NaN, Infinity],
    [NaN, Infinity, 0, 0],
    [Number.MAX_VALUE, Number.MAX_VALUE, 2, 8],
    [Number.MIN_VALUE, Number.MIN_VALUE, Infinity, -1],
  ]) {
    const result = getTransitionResolution(width, height, dpr, cores);
    for (const ratio of [result.captureRatio, result.renderRatio])
      assert.ok(Number.isFinite(ratio) && ratio > 0);
  }
});

test("stable 60 FPS and isolated stalls keep their original resolution", () => {
  const adaptive = createAdaptiveResolution(1.75);
  for (let frame = 0; frame < 300; frame++) {
    const elapsed = frame === 40 || frame === 180 ? 0.25 : 1 / 60;
    assert.equal(adaptive.sample(elapsed), undefined);
  }
  // Short bursts still do not represent sustained pressure.
  for (let frame = 0; frame < 240; frame++)
    assert.equal(adaptive.sample(frame % 30 < 6 ? 0.04 : 1 / 60), undefined);
});

test("sustained slow frames lower resolution monotonically with a cooldown and floor", () => {
  for (const initial of [0.6, 1, 1.25, 1.75]) {
    const adaptive = createAdaptiveResolution(initial);
    const minimum = Math.min(1, initial * 0.6);
    let ratio = initial;
    let elapsed = 0;
    let changedAt = 0;
    let changes = 0;
    for (let frame = 0; frame < 240; frame++) {
      elapsed += 1 / 30;
      const next = adaptive.sample(1 / 30);
      if (next === undefined) continue;
      assert.ok(next < ratio && next >= minimum);
      assert.ok(elapsed - changedAt >= 0.7 - 0.000001);
      assert.equal(next, Math.max(minimum, ratio * 0.8));
      ratio = next;
      changedAt = elapsed;
      changes++;
    }
    assert.ok(changes >= 2);
    assert.equal(ratio, minimum);
    for (let frame = 0; frame < 120; frame++)
      assert.equal(
        adaptive.sample(1 / 60),
        undefined,
        "quality never rises mid-flight",
      );
  }
});

test("late slowdowns are detected after healthy opening frames", () => {
  const adaptive = createAdaptiveResolution(1.75);
  for (let frame = 0; frame < 180; frame++)
    assert.equal(adaptive.sample(1 / 60), undefined);
  let reduced: number | undefined;
  for (let frame = 0; frame < 24; frame++)
    reduced = adaptive.sample(0.05) ?? reduced;
  assert.ok(reduced !== undefined && reduced < 1.75);
});

test("invalid timing samples do not fill the observation window", () => {
  const adaptive = createAdaptiveResolution(NaN);
  for (let frame = 0; frame < 100; frame++) {
    for (const elapsed of [NaN, Infinity, 0, -1])
      assert.equal(adaptive.sample(elapsed), undefined);
  }
  for (let frame = 0; frame < 23; frame++)
    assert.equal(adaptive.sample(1 / 30), undefined);
  assert.equal(adaptive.sample(1 / 30), 0.8);
});
