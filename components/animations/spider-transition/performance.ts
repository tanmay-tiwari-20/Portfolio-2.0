const positive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

/** Bound backing-store pixels without changing the viewport's CSS geometry. */
export function getTransitionResolution(
  width: number,
  height: number,
  dpr: number,
  cores = 8,
) {
  const w = positive(width, 1);
  const h = positive(height, 1);
  const density = positive(dpr, 1);
  const low = w < 700 || positive(cores, 8) <= 4;
  // Divide by square roots separately to avoid overflowing w * h.
  const ratio = (cap: number, pixels: number) =>
    Math.min(density, cap, Math.sqrt(pixels) / Math.sqrt(w) / Math.sqrt(h));
  return {
    low,
    captureRatio: ratio(low ? 1.5 : 2, low ? 2_000_000 : 5_000_000),
    renderRatio: ratio(low ? 1.25 : 1.75, low ? 1_500_000 : 4_000_000),
  };
}

/**
 * Lower resolution only after 18 of the latest 24 frames exceed 25 ms.
 * Raw wall time controls a 700 ms cooldown; quality never rises mid-flight.
 */
export function createAdaptiveResolution(initialRatio: number) {
  let ratio = positive(initialRatio, 1);
  const minimum = Math.min(1, ratio * 0.6);
  const frames = new Uint8Array(24);
  let index = 0;
  let count = 0;
  let slow = 0;
  let sinceChange = 0;

  return {
    sample(frameSeconds: number): number | undefined {
      if (
        !Number.isFinite(frameSeconds) ||
        frameSeconds <= 0 ||
        ratio <= minimum
      )
        return;
      sinceChange = Math.min(0.7, sinceChange + frameSeconds);
      slow -= frames[index];
      frames[index] = frameSeconds > 0.025 ? 1 : 0;
      slow += frames[index];
      index = (index + 1) % frames.length;
      count = Math.min(count + 1, frames.length);
      if (count < frames.length || slow < 18 || sinceChange < 0.7) return;
      ratio = Math.max(minimum, ratio * 0.8);
      sinceChange = 0;
      return ratio;
    },
  };
}
