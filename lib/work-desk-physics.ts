export type DeskPoint = { x: number; y: number };
export type DeskSize = { width: number; height: number };
export type DeskStage = DeskSize & { inset?: number };
export type DeskBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};
export type DeskSample = DeskPoint & { time: number };
export type DeskMotion = DeskPoint & {
  /** Pixels per second; rotation and angular velocity use degrees. */
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  restRotation: number;
};

const friction = 5.5;
const rebound = 0.22;
const rotationDamping = 10;
const maximumThrowSpeed = 1400;
const finite = (value: number, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, finite(value)));

/** Center bounds include the rotated print's complete axis-aligned footprint. */
export function getDeskBounds(
  stage: DeskStage,
  print: DeskSize,
  rotation = 0,
): DeskBounds {
  const width = Math.max(0, finite(stage.width));
  const height = Math.max(0, finite(stage.height));
  const inset = Math.max(0, finite(stage.inset ?? 8));
  const radians = (finite(rotation) * Math.PI) / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  const halfWidth = Math.max(0, finite(print.width)) / 2;
  const halfHeight = Math.max(0, finite(print.height)) / 2;
  const extentX = halfWidth * cosine + halfHeight * sine + inset;
  const extentY = halfWidth * sine + halfHeight * cosine + inset;
  // An oversized print has no containing solution; keep it centered rather
  // than returning inverted bounds. The responsive UI supplies fitting sizes.
  return {
    minX: Math.min(width / 2, extentX),
    maxX: Math.max(width / 2, width - extentX),
    minY: Math.min(height / 2, extentY),
    maxY: Math.max(height / 2, height - extentY),
  };
}

export function clampDeskPosition(
  point: DeskPoint,
  bounds: DeskBounds,
): DeskPoint {
  return {
    x: clamp(point.x, bounds.minX, bounds.maxX),
    y: clamp(point.y, bounds.minY, bounds.maxY),
  };
}

export function isDeskDrag(
  origin: DeskPoint,
  current: DeskPoint,
  threshold = 6,
): boolean {
  return Math.hypot(current.x - origin.x, current.y - origin.y) > threshold;
}

/** Pointer timestamps are milliseconds, such as performance.now(). */
export function getDeskReleaseVelocity(
  samples: readonly DeskSample[],
  releasedAt?: number,
): { vx: number; vy: number } {
  const valid = samples
    .filter((sample) =>
      [sample.x, sample.y, sample.time].every(Number.isFinite),
    )
    .slice()
    .sort((a, b) => a.time - b.time);
  const last = valid[valid.length - 1];
  if (!last || (releasedAt ?? last.time) - last.time > 80)
    return { vx: 0, vy: 0 };
  const first = valid.find((sample) => last.time - sample.time <= 100)!;
  const seconds = (last.time - first.time) / 1000;
  if (seconds <= 0) return { vx: 0, vy: 0 };
  const vx = (last.x - first.x) / seconds;
  const vy = (last.y - first.y) / seconds;
  const scale = Math.min(1, maximumThrowSpeed / Math.hypot(vx, vy));
  return { vx: vx * scale, vy: vy * scale };
}

/** Integrate friction and one small bounce without a frame-rate-dependent lerp. */
function advanceAxis(
  position: number,
  velocity: number,
  min: number,
  max: number,
  dt: number,
): { position: number; velocity: number } {
  position = clamp(position, min, max);
  velocity = finite(velocity);
  if (min === max) return { position, velocity: 0 };
  const damping = Math.exp(-friction * dt);
  const next = position + (velocity * (1 - damping)) / friction;
  if (next >= min && next <= max)
    return { position: next, velocity: velocity * damping };

  const wall = next < min ? min : max;
  const distance = wall - position;
  const hitTime =
    velocity === 0
      ? 0
      : -Math.log(Math.max(1e-8, 1 - (distance * friction) / velocity)) /
        friction;
  const remainder = Math.max(0, dt - hitTime);
  const reflected = -velocity * Math.exp(-friction * hitTime) * rebound;
  const afterBounce =
    wall + (reflected * (1 - Math.exp(-friction * remainder))) / friction;
  return {
    position: clamp(afterBounce, min, max),
    velocity: reflected * Math.exp(-friction * remainder),
  };
}

/**
 * One imperative animation-frame step. A resumed/backgrounded tab advances at
 * most 50ms. The caller can stop requesting frames once `settled` becomes true.
 */
export function stepDeskMotion(
  previous: DeskMotion,
  dtSeconds: number,
  stage: DeskStage,
  print: DeskSize,
): { state: DeskMotion; settled: boolean } {
  const dt = clamp(dtSeconds, 0, 0.05);
  const restRotation = finite(previous.restRotation);
  const offset = finite(previous.rotation) - restRotation;
  const angularVelocity = finite(previous.angularVelocity);
  const spring = angularVelocity + rotationDamping * offset;
  const angularDamping = Math.exp(-rotationDamping * dt);
  const rotation = restRotation + (offset + spring * dt) * angularDamping;
  const nextAngularVelocity =
    (angularVelocity - rotationDamping * spring * dt) * angularDamping;
  const bounds = getDeskBounds(stage, print, rotation);
  const horizontal = advanceAxis(
    previous.x,
    previous.vx,
    bounds.minX,
    bounds.maxX,
    dt,
  );
  const vertical = advanceAxis(
    previous.y,
    previous.vy,
    bounds.minY,
    bounds.maxY,
    dt,
  );
  const state: DeskMotion = {
    x: horizontal.position,
    y: vertical.position,
    vx: horizontal.velocity,
    vy: vertical.velocity,
    rotation,
    angularVelocity: nextAngularVelocity,
    restRotation,
  };
  const settled =
    Math.hypot(state.vx, state.vy) < 4 &&
    Math.abs(state.angularVelocity) < 0.5 &&
    Math.abs(state.rotation - restRotation) < 0.08;
  if (settled) {
    state.rotation = restRotation;
    state.vx = 0;
    state.vy = 0;
    state.angularVelocity = 0;
    Object.assign(
      state,
      clampDeskPosition(state, getDeskBounds(stage, print, restRotation)),
    );
  }
  return { state, settled };
}
