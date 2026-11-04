/** Original, locally synthesized silk and air sounds; no recordings or downloads. */
export type TransitionCue = "shot" | "attach" | "release";

const TAU = Math.PI * 2;
const CUES = {
  shot: { duration: 0.24, peak: 0.72, seed: 0x51a71 },
  attach: { duration: 0.18, peak: 0.58, seed: 0xa77ac },
  release: { duration: 0.2, peak: 0.46, seed: 0xf1be2 },
} as const;

function checkSampleRate(sampleRate: number) {
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000)
    throw new RangeError("Sound synthesis requires a sample rate of 8–192 kHz");
}

function noise(seed: number) {
  let state = seed;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 4294967296) * 2 - 1;
  };
}

function coefficient(frequency: number, sampleRate: number) {
  return (
    1 - Math.exp((-TAU * Math.min(frequency, sampleRate * 0.4)) / sampleRate)
  );
}

function smooth(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function normalize(samples: Float32Array, peak: number) {
  let maximum = 0;
  for (const value of samples) maximum = Math.max(maximum, Math.abs(value));
  if (maximum > 0) {
    const scale = peak / maximum;
    for (let i = 0; i < samples.length; i++) samples[i] *= scale;
  }
  return samples;
}

/** Short air transients with soft, falling elastic tones and fibrous noise tails. */
export function createCueSamples(
  cue: TransitionCue,
  sampleRate: number,
): Float32Array {
  checkSampleRate(sampleRate);
  const { duration, peak, seed } = CUES[cue];
  const samples = new Float32Array(Math.round(duration * sampleRate));
  const envelope = new Float32Array(samples.length);
  const random = noise(seed);
  const airCoefficient = coefficient(6200, sampleRate);
  const midCoefficient = coefficient(1150, sampleRate);
  const bassCoefficient = coefficient(150, sampleRate);
  let air = 0,
    mid = 0,
    bass = 0,
    phase = 0,
    sum = 0,
    weight = 0;

  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    const remaining = (samples.length - 1 - i) / sampleRate;
    const gate = smooth(t / 0.0035) * smooth(remaining / 0.035);
    const white = random();
    air += airCoefficient * (white - air);
    mid += midCoefficient * (white - mid);
    bass += bassCoefficient * (white - bass);
    const hiss = air - mid;
    const fiber = mid - bass;
    let value: number;

    if (cue === "shot") {
      // A pressure snap, a little breath, then a quickly falling elastic chirp.
      phase += (TAU * (290 + 1900 * Math.exp(-t / 0.027))) / sampleRate;
      const snap = Math.exp(-t / 0.055);
      const breath = Math.exp(-Math.pow((t - 0.055) / 0.035, 2));
      const elastic = Math.sin(phase) + 0.22 * Math.sin(phase * 1.87);
      value =
        hiss * (0.64 * snap + 0.22 * breath) +
        fiber * 0.42 * Math.exp(-t / 0.08) +
        elastic * 0.2 * Math.exp(-t / 0.035);
    } else if (cue === "attach") {
      // Lower and shorter than the shot: a soft tack followed by silk settling.
      phase += (TAU * (165 + 620 * Math.exp(-t / 0.014))) / sampleRate;
      const texture = 0.7 + 0.3 * Math.pow(Math.sin(TAU * 93 * t), 2);
      value =
        fiber * 0.74 * Math.exp(-t / 0.024) +
        hiss * 0.25 * texture * Math.exp(-t / 0.048) +
        Math.sin(phase) * 0.23 * Math.exp(-t / 0.026);
    } else {
      // A lighter, airier flick as tension leaves the web.
      phase += (TAU * (380 + 1350 * Math.exp(-t / 0.025))) / sampleRate;
      value =
        hiss * 0.63 * Math.exp(-t / 0.047) +
        fiber * 0.28 * Math.exp(-t / 0.026) +
        Math.sin(phase) * 0.12 * Math.exp(-t / 0.037);
    }
    envelope[i] = gate;
    samples[i] = value * gate;
    sum += samples[i];
    weight += gate;
  }

  // Remove DC through the same envelope so the first/last samples remain zero.
  const dc = sum / weight;
  for (let i = 0; i < samples.length; i++) samples[i] -= dc * envelope[i];
  return normalize(samples, peak);
}

/**
 * Two seconds of broad, non-tonal air for live gain/filter/pan automation.
 * An equal-power overlap joins back into consecutive samples of the same noise
 * run, avoiding a discontinuity or a fade-to-silence notch at the loop boundary.
 */
export function createWindSamples(sampleRate: number): Float32Array {
  checkSampleRate(sampleRate);
  const length = Math.round(sampleRate * 2);
  const overlap = Math.round(sampleRate * 0.12);
  const raw = new Float32Array(length + overlap);
  const samples = new Float32Array(length);
  const random = noise(0xb2ee2e);
  const highCoefficient = coefficient(4800, sampleRate);
  const bodyCoefficient = coefficient(450, sampleRate);
  const bassCoefficient = coefficient(85, sampleRate);
  let high = 0,
    body = 0,
    bass = 0;
  // Settle the filters before recording the loop's material.
  const warmup = Math.round(sampleRate * 0.1);
  for (let i = -warmup; i < raw.length; i++) {
    const white = random();
    high += highCoefficient * (white - high);
    body += bodyCoefficient * (white - body);
    bass += bassCoefficient * (white - bass);
    if (i >= 0) raw[i] = 0.65 * (high - body) + 0.55 * (body - bass);
  }
  let sum = 0;
  for (let i = 0; i < length; i++) {
    const tail = i - (length - overlap);
    if (tail < 0) samples[i] = raw[i + overlap];
    else {
      const angle = (tail / (overlap - 1)) * Math.PI * 0.5;
      samples[i] =
        raw[i + overlap] * Math.cos(angle) + raw[tail] * Math.sin(angle);
    }
    sum += samples[i];
  }
  const dc = sum / length;
  for (let i = 0; i < length; i++) samples[i] -= dc;
  return normalize(samples, 0.62);
}
