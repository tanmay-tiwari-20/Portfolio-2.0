export const ABOUT_STORY_MIN_HEIGHT = 540;
export const ABOUT_STORY_MEDIA =
  "(min-width: 320px) and (min-height: 540px) and (prefers-reduced-motion: no-preference)";
export const ABOUT_STORY_STOPS = [0.12, 0.51, 0.9] as const;

export function canPinAboutStory(
  width: number,
  height: number,
  reducedMotion: boolean,
) {
  return width >= 320 && height >= ABOUT_STORY_MIN_HEIGHT && !reducedMotion;
}

const phases = [
  { enterStart: 0, enterEnd: 0, exitStart: 0.24, exitEnd: 0.34 },
  { enterStart: 0.34, enterEnd: 0.44, exitStart: 0.58, exitEnd: 0.68 },
  { enterStart: 0.68, enterEnd: 0.78, exitStart: 1, exitEnd: 1 },
] as const;

const clamp = (value: number) =>
  Math.max(0, Math.min(1, Number.isNaN(value) ? 0 : value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export function aboutStoryActiveChapter(progress: number) {
  const p = clamp(progress);
  return p < phases[1].enterStart ? 0 : p < phases[2].enterStart ? 1 : 2;
}

/** One chapter exits fully before the next enters; anchor stops fall in holds. */
export function aboutStoryFrame(index: number, progress: number) {
  const phase = phases[index];
  if (!phase) throw new RangeError("The About story contains three chapters.");
  const p = clamp(progress);
  const enter =
    index === 0
      ? 1
      : ease((p - phase.enterStart) / (phase.enterEnd - phase.enterStart));
  const exit =
    index === phases.length - 1
      ? 0
      : ease((p - phase.exitStart) / (phase.exitEnd - phase.exitStart));
  const localProgress = clamp(
    (p - phase.enterStart) / (phase.exitEnd - phase.enterStart),
  );
  return {
    opacity: Math.min(enter, 1 - exit),
    y: 56 * (1 - enter - exit),
    revealInset: 12 * (1 - enter),
    imageScale: 1 + 0.035 * (1 - localProgress),
  };
}

export function fitsAboutStoryStage({
  stageHeight,
  copyTop,
  copyHeight,
  figureTop,
  figureHeight,
  visualHeight,
}: {
  stageHeight: number;
  copyTop: number;
  copyHeight: number;
  figureTop: number;
  figureHeight: number;
  visualHeight: number;
}) {
  return (
    stageHeight > 0 &&
    visualHeight >= 96 &&
    copyTop >= -1 &&
    figureTop >= -1 &&
    copyTop + copyHeight <= stageHeight + 1 &&
    figureTop + figureHeight <= stageHeight + 1
  );
}
