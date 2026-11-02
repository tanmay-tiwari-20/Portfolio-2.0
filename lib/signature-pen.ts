import { SIGNATURE_STROKES, SIGNATURE_WIDTH } from "./tanmay-signature";

// Both the ink mask and pen position use this same speed curve.
export const SIGNATURE_PROGRESS = [
  { offset: 0, progress: 0 },
  { offset: 0.16, progress: 0.11 },
  { offset: 0.43, progress: 0.45 },
  { offset: 0.79, progress: 0.82 },
  { offset: 1, progress: 1 },
] as const;

export function signatureProgress(time: number): number {
  const clamped = Math.max(0, Math.min(1, time));
  for (let index = 1; index < SIGNATURE_PROGRESS.length; index++) {
    const from = SIGNATURE_PROGRESS[index - 1];
    const to = SIGNATURE_PROGRESS[index];
    if (clamped <= to.offset) {
      const fraction = (clamped - from.offset) / (to.offset - from.offset);
      return from.progress + (to.progress - from.progress) * fraction;
    }
  }
  return 1;
}

/** Locate the nib on the existing animation clock, including pen-up travel. */
export function signaturePenFrame(elapsed: number) {
  let cursor = 0;
  for (let index = 0; index < SIGNATURE_STROKES.length; index++) {
    const stroke = SIGNATURE_STROKES[index];
    const start = cursor + stroke.delay;
    if (elapsed < start) {
      return {
        index,
        progress: 0,
        lift: Math.max(0, (elapsed - cursor) / stroke.delay),
      };
    }
    if (elapsed < start + stroke.duration) {
      return {
        index,
        progress: signatureProgress((elapsed - start) / stroke.duration),
        lift: null,
      };
    }
    cursor = start + stroke.duration;
  }
  return null;
}

/** Keep the 62-unit pen inside the signature's existing reserved space. */
export function signaturePenAngle(x: number, y: number): number {
  const topRoom = Math.max(0, Math.min(1, (y - 8) / 62));
  const rightRoom = Math.max(0, Math.min(1, (SIGNATURE_WIDTH - x - 8) / 62));
  const clearTop = (Math.acos(topRoom) * 180) / Math.PI;
  const clearRight = (Math.asin(rightRoom) * 180) / Math.PI;
  return Math.min(clearRight, Math.max(35, clearTop));
}
