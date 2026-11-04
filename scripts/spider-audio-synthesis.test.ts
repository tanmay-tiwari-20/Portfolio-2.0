import assert from "node:assert/strict";
import test from "node:test";
import {
  createCueSamples,
  createWindSamples,
  type TransitionCue,
} from "../components/animations/spider-transition/audio-synthesis";

const cues: Array<[TransitionCue, number]> = [
  ["shot", 0.24],
  ["attach", 0.18],
  ["release", 0.2],
];

function rms(samples: Float32Array, start = 0, end = samples.length) {
  let energy = 0;
  for (let i = start; i < end; i++) energy += samples[i] ** 2;
  return Math.sqrt(energy / (end - start));
}

function checkSignal(samples: Float32Array) {
  let peak = 0,
    sum = 0;
  for (const sample of samples) {
    assert.ok(Number.isFinite(sample), "every PCM sample must be finite");
    peak = Math.max(peak, Math.abs(sample));
    sum += sample;
  }
  assert.ok(peak > 0.1 && peak <= 0.8, `audible, unclipped peak: ${peak}`);
  assert.ok(rms(samples) > 0.01, "sound must have sustained signal energy");
  assert.ok(Math.abs(sum / samples.length) < 0.00001, "no DC offset");
}

test("silk cues produce bounded original PCM at supported output sample rates", () => {
  for (const sampleRate of [8000, 22050, 44100, 48000, 96000]) {
    for (const [cue, duration] of cues) {
      const samples = createCueSamples(cue, sampleRate);
      assert.equal(samples.length, Math.round(sampleRate * duration));
      checkSignal(samples);
      assert.ok(samples[0] === 0, "attack must start at silence");
      assert.ok(samples.at(-1) === 0, "tail must end at silence");
      const attack = Math.round(sampleRate * 0.001);
      const bodyEnd = Math.round(sampleRate * 0.04);
      assert.ok(rms(samples, 0, attack) < rms(samples, attack, bodyEnd));
      assert.ok(
        rms(samples, samples.length - Math.round(sampleRate * 0.015)) <
          rms(samples, attack, bodyEnd) * 0.1,
        "the tail must settle before a buffer stops",
      );
    }
  }
});

test("repeated synthesis is deterministic and each web event has distinct sound", () => {
  const sampleRate = 44100;
  const generated = cues.map(([cue]) => {
    const samples = createCueSamples(cue, sampleRate);
    assert.deepEqual(samples, createCueSamples(cue, sampleRate));
    return samples;
  });
  for (let a = 0; a < generated.length; a++) {
    for (let b = a + 1; b < generated.length; b++) {
      let product = 0,
        energyA = 0,
        energyB = 0;
      const count = Math.min(generated[a].length, generated[b].length);
      for (let i = 0; i < count; i++) {
        product += generated[a][i] * generated[b][i];
        energyA += generated[a][i] ** 2;
        energyB += generated[b][i] ** 2;
      }
      assert.ok(
        Math.abs(product / Math.sqrt(energyA * energyB)) < 0.7,
        "shot, tack and release must not reuse the same waveform",
      );
    }
  }
});

test("wind loops stay non-silent, bounded and continuous across their join", () => {
  for (const sampleRate of [8000, 22050, 44100, 48000, 96000]) {
    const samples = createWindSamples(sampleRate);
    assert.equal(samples.length, sampleRate * 2);
    checkSignal(samples);
    assert.deepEqual(samples, createWindSamples(sampleRate));
    let differenceEnergy = 0;
    for (let i = 1; i < samples.length; i++)
      differenceEnergy += (samples[i] - samples[i - 1]) ** 2;
    const adjacentRms = Math.sqrt(differenceEnergy / (samples.length - 1));
    assert.ok(
      Math.abs(samples[0] - samples.at(-1)!) < adjacentRms * 4,
      "loop boundary must behave like neighboring noise samples, not a click",
    );
    const window = Math.round(sampleRate * 0.03);
    const bodyRms = rms(samples);
    for (let i = 0; i + window <= samples.length; i += window) {
      const localRms = rms(samples, i, i + window);
      assert.ok(
        localRms > bodyRms * 0.5,
        "no silent notch in the looping wind",
      );
      assert.ok(
        localRms < bodyRms * 1.7,
        "no large envelope spike in the loop",
      );
    }
  }
});

test("invalid sample rates fail before allocating audio buffers", () => {
  for (const rate of [0, -44100, NaN, Infinity, 1000, 1000000]) {
    assert.throws(() => createWindSamples(rate), RangeError);
    assert.throws(() => createCueSamples("shot", rate), RangeError);
  }
});
