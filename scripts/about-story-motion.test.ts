import assert from "node:assert/strict";
import test from "node:test";
import {
  ABOUT_STORY_STOPS,
  aboutStoryActiveChapter,
  aboutStoryFrame,
  canPinAboutStory,
  fitsAboutStoryStage,
} from "../lib/about-story-motion";

test("pinning includes common laptop, tablet, and phone windows", () => {
  for (const [width, height] of [
    [1366, 650],
    [1280, 720],
    [768, 1024],
    [768, 600],
    [390, 700],
    [390, 540],
    [320, 568],
  ]) {
    assert.equal(
      canPinAboutStory(width, height, false),
      true,
      `${width}×${height}`,
    );
    assert.equal(
      canPinAboutStory(width, height, true),
      false,
      "reduced motion stays static",
    );
  }
  assert.equal(
    canPinAboutStory(844, 390, false),
    false,
    "short landscape screens stay readable",
  );
  assert.equal(
    canPinAboutStory(280, 650, false),
    false,
    "very narrow screens retain normal flow",
  );
});

test("the measured-stage guard accepts fitted content and rejects clipped text or unreadable visuals", () => {
  const fitted = {
    stageHeight: 400,
    copyTop: 10,
    copyHeight: 190,
    figureTop: 212,
    figureHeight: 178,
    visualHeight: 150,
  };
  assert.equal(fitsAboutStoryStage(fitted), true);
  assert.equal(fitsAboutStoryStage({ ...fitted, copyHeight: 420 }), false);
  assert.equal(fitsAboutStoryStage({ ...fitted, copyTop: -20 }), false);
  assert.equal(fitsAboutStoryStage({ ...fitted, figureHeight: 220 }), false);
  assert.equal(fitsAboutStoryStage({ ...fitted, visualHeight: 72 }), false);
});

test("chapter text never overlaps during a full forward or backward scrub", () => {
  for (let tick = 0; tick <= 1000; tick++) {
    const progress = tick / 1000;
    const frames = [0, 1, 2].map((index) => aboutStoryFrame(index, progress));
    assert.ok(frames.filter((frame) => frame.opacity > 0).length <= 1);
    for (const frame of frames) {
      assert.ok(frame.opacity >= 0 && frame.opacity <= 1);
      assert.ok(Number.isFinite(frame.y));
      assert.ok(frame.imageScale >= 1 && frame.imageScale <= 1.035);
    }
  }
});

test("each chapter link lands in a generous readable hold with its image fully revealed", () => {
  for (const [index, stop] of ABOUT_STORY_STOPS.entries()) {
    for (const progress of [stop - 0.04, stop, stop + 0.04]) {
      const frame = aboutStoryFrame(index, progress);
      assert.equal(aboutStoryActiveChapter(progress), index);
      assert.equal(frame.opacity, 1);
      assert.equal(frame.y, 0);
      assert.equal(frame.revealInset, 0);
    }
  }
});

test("enter and exit motion is continuous and restores the correct first or final chapter", () => {
  for (const index of [0, 1, 2]) {
    let previous = aboutStoryFrame(index, 0);
    for (let tick = 1; tick <= 1000; tick++) {
      const next = aboutStoryFrame(index, tick / 1000);
      assert.ok(Math.abs(next.opacity - previous.opacity) < 0.02);
      assert.ok(Math.abs(next.y - previous.y) < 1);
      previous = next;
    }
  }
  assert.equal(aboutStoryFrame(0, -0.5).opacity, 1);
  assert.equal(aboutStoryFrame(2, 1.5).opacity, 1);
  assert.equal(aboutStoryFrame(0, 1).opacity, 0);
  assert.equal(aboutStoryFrame(1, 1).opacity, 0);
});
