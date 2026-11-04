import assert from "node:assert/strict";
import test from "node:test";
import { createTransitionAudio } from "../components/animations/spider-transition/audio";
import {
  CONTACT_TIME,
  DURATION,
  WEB_ATTACH_TIME,
  WEB_RELEASE_TIME,
} from "../components/animations/spider-transition/motion";

class Param {
  value = 0;
  targets: number[] = [];
  setValueAtTime(value: number) {
    this.value = value;
    this.targets.push(value);
    return this;
  }
  setTargetAtTime(value: number) {
    return this.setValueAtTime(value);
  }
  linearRampToValueAtTime(value: number) {
    return this.setValueAtTime(value);
  }
  exponentialRampToValueAtTime(value: number) {
    return this.setValueAtTime(value);
  }
  cancelScheduledValues() {
    return this;
  }
  cancelAndHoldAtTime() {
    return this;
  }
}

class Node {
  connections: Node[] = [];
  connect(node: Node) {
    this.connections.push(node);
    return node;
  }
  disconnect() {
    this.connections = [];
  }
}
class Gain extends Node {
  gain = new Param();
}
class Panner extends Node {
  pan = new Param();
}
class Filter extends Node {
  type = "lowpass";
  frequency = new Param();
  Q = new Param();
}
class Buffer {
  channels: Float32Array[];
  duration: number;
  constructor(
    readonly numberOfChannels: number,
    readonly length: number,
    readonly sampleRate: number,
  ) {
    this.channels = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length),
    );
    this.duration = length / sampleRate;
  }
  getChannelData(channel: number) {
    return this.channels[channel];
  }
  copyToChannel(values: Float32Array, channel: number) {
    this.channels[channel].set(values);
  }
}
class Source extends Node {
  buffer: Buffer | null = null;
  playbackRate = new Param();
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  onended: (() => void) | null = null;
  started: number | undefined;
  stops: number[] = [];
  ended = false;
  constructor(private context: Context) {
    super();
    this.playbackRate.value = 1;
  }
  start(time = this.context.currentTime) {
    this.started = time;
  }
  stop(time = this.context.currentTime) {
    this.stops.push(time);
  }
  flush() {
    if (this.started === undefined || this.ended) return;
    const finish = this.stops.length
      ? Math.min(...this.stops)
      : this.loop
        ? Infinity
        : this.started + (this.buffer?.duration ?? 0) / this.playbackRate.value;
    if (finish <= this.context.currentTime) {
      this.ended = true;
      this.onended?.();
    }
  }
}
class Context {
  state = "suspended";
  currentTime = 0;
  sampleRate = 12000;
  destination = new Node();
  sources: Source[] = [];
  buffers: Buffer[] = [];
  closeCount = 0;
  resume = async () => {
    this.state = "running";
  };
  createBuffer(channels: number, length: number, sampleRate: number) {
    const buffer = new Buffer(channels, length, sampleRate);
    this.buffers.push(buffer);
    return buffer;
  }
  createBufferSource() {
    const source = new Source(this);
    this.sources.push(source);
    return source;
  }
  createGain() {
    return new Gain();
  }
  createStereoPanner() {
    return new Panner();
  }
  createBiquadFilter() {
    return new Filter();
  }
  async close() {
    this.closeCount++;
    this.state = "closed";
  }
  advance(seconds: number) {
    this.currentTime += seconds;
    this.sources.forEach((source) => source.flush());
  }
  get cues() {
    return this.sources.filter(
      (source) => !source.loop && source.started !== undefined,
    );
  }
  get wind() {
    return this.sources.findLast(
      (source) => source.loop && source.started !== undefined && !source.ended,
    );
  }
}

function setup(context = new Context()) {
  let creations = 0;
  const sound = createTransitionAudio(() => {
    creations++;
    return context as unknown as AudioContext;
  });
  return { sound, context, creations: () => creations };
}

function nodeInGraph<T extends Node>(root: Node, constructor: new () => T): T {
  const pending = [...root.connections];
  while (pending.length) {
    const node = pending.shift()!;
    if (node instanceof constructor) return node;
    pending.push(...node.connections);
  }
  throw new Error(`Missing ${constructor.name} in audio graph`);
}

test("silent warmup prepares PCM without acquiring an audio device", () => {
  const { sound, context, creations } = setup();
  sound.warm();
  sound.warm();
  sound.prepare();
  assert.equal(creations(), 0);
  assert.equal(context.buffers.length, 0);
  assert.equal(context.sources.length, 0);
  sound.unlock();
  sound.prepare();
  assert.equal(context.buffers.length, 4);
  assert.equal(context.sources.length, 0, "preparation must stay inaudible");
  assert.ok(
    context.buffers.every((buffer) => buffer.sampleRate === 48000),
    "fixed-rate PCM must retain its native rate for Web Audio resampling",
  );
  sound.prepare();
  assert.equal(context.buffers.length, 4, "repeated preparation is bounded");
  sound.dispose();
  sound.warm();
  sound.prepare();
  assert.equal(creations(), 1);
  assert.equal(context.buffers.length, 4);
});

test("prepared cue crossings perform no further PCM buffer allocation", () => {
  const { sound, context } = setup();
  sound.warm();
  sound.unlock();
  sound.prepare();
  assert.equal(context.buffers.length, 4);
  context.createBuffer = () => {
    throw new Error("PCM allocation during a rendered frame");
  };
  sound.begin(1440, 900);
  sound.update(WEB_ATTACH_TIME + 0.01);
  sound.update(CONTACT_TIME + 0.1);
  sound.update(WEB_RELEASE_TIME + 0.01);
  assert.equal(context.cues.length, 3);
  assert.ok(context.wind);
  sound.stop();
  context.advance(5);
  sound.begin(390, 844);
  sound.update(WEB_ATTACH_TIME + 0.01);
  sound.update(WEB_RELEASE_TIME + 0.01);
  assert.equal(context.cues.length, 6);
  sound.dispose();
});

test("preparation can finish while browser gesture permission is pending", async () => {
  const context = new Context();
  let resolve!: () => void;
  context.resume = () => new Promise<void>((done) => (resolve = done));
  const { sound } = setup(context);
  sound.unlock();
  sound.prepare();
  assert.equal(context.state, "suspended");
  assert.equal(context.buffers.length, 4);
  assert.equal(context.sources.length, 0);
  context.state = "running";
  resolve();
  await Promise.resolve();
  sound.begin(1440, 900);
  assert.equal(context.buffers.length, 4);
  assert.equal(context.cues.length, 1);
  sound.dispose();
});

test("audio waits for user activation and for the visual flight to begin", () => {
  const { sound, context, creations } = setup();
  sound.begin(1440, 900);
  sound.update(0.5);
  assert.equal(creations(), 0, "rendering alone must not create AudioContext");
  sound.stop();
  sound.unlock();
  assert.equal(creations(), 1);
  assert.equal(context.sources.length, 0, "unlock must remain silent");
  sound.begin(1440, 900);
  assert.equal(context.cues.length, 1, "the visible web shot gets one cue");
  assert.ok(context.wind);
  sound.dispose();
});

test("attachment and release follow the animation clock and never repeat during holds", () => {
  const { sound, context } = setup();
  sound.unlock();
  sound.begin(1440, 900);
  sound.update(WEB_ATTACH_TIME - 0.01);
  assert.equal(context.cues.length, 1);
  sound.update(WEB_ATTACH_TIME + 0.001);
  assert.equal(context.cues.length, 2);
  for (let i = 0; i < 12; i++) sound.update(CONTACT_TIME);
  assert.equal(context.cues.length, 2, "a route hold cannot replay cues");
  sound.update(WEB_RELEASE_TIME + 0.001);
  assert.equal(context.cues.length, 3);
  for (let i = 0; i < 12; i++) sound.update(WEB_RELEASE_TIME + 0.001);
  assert.equal(context.cues.length, 3);
  sound.dispose();
});

test("wind pans with the character, fades during a hold, and finishes silent", () => {
  const { sound, context } = setup();
  sound.unlock();
  sound.begin(1440, 900);
  const wind = context.wind!;
  const gain = nodeInGraph(wind, Gain).gain;
  const pan = nodeInGraph(wind, Panner).pan;
  sound.update(0.8);
  assert.ok(gain.value > 0);
  const incomingPan = pan.value;
  sound.update(CONTACT_TIME);
  sound.update(CONTACT_TIME);
  assert.equal(
    gain.value,
    0,
    "holding a frame must not sound like forward motion",
  );
  sound.update(CONTACT_TIME + 0.1);
  assert.ok(gain.value > 0, "wind should resume when the character moves");
  sound.update(1.8);
  assert.ok(pan.value > incomingPan, "sound should travel from left to right");
  assert.ok(pan.value >= -1 && pan.value <= 1);
  sound.update(DURATION);
  assert.equal(gain.value, 0);
  sound.dispose();
});

test("a refused unlock stays optional and never replays missed shots on resume", async () => {
  const context = new Context();
  context.resume = () => Promise.reject(new Error("Autoplay denied"));
  const { sound } = setup(context);
  assert.doesNotThrow(() => sound.unlock());
  await Promise.resolve();
  sound.begin(1440, 900);
  sound.update(0.7);
  assert.equal(context.sources.length, 0);
  context.state = "running";
  sound.update(0.8);
  assert.equal(
    context.cues.length,
    0,
    "elapsed shot/attachment cues stay skipped",
  );
  sound.update(WEB_RELEASE_TIME + 0.001);
  assert.equal(context.cues.length, 1, "future cues can still play in sync");
  sound.dispose();
});

test("pending resume cannot restart a cancelled flight", async () => {
  const context = new Context();
  let resolve!: () => void;
  context.resume = () => new Promise<void>((done) => (resolve = done));
  const { sound } = setup(context);
  sound.unlock();
  sound.begin(1440, 900);
  sound.stop();
  context.state = "running";
  resolve();
  await Promise.resolve();
  sound.update(0.8);
  assert.equal(context.sources.length, 0);
  sound.dispose();
});

test("suspending an active flight disconnects stale audio before a later resume", () => {
  const { sound, context } = setup();
  sound.unlock();
  sound.begin(1440, 900);
  const shot = context.cues[0];
  context.advance(0.5);
  assert.equal(shot.connections.length, 0, "finished cues release their nodes");
  assert.ok(context.wind, "the reusable wind voice remains active");
  sound.update(WEB_ATTACH_TIME + 0.01);
  context.state = "suspended";
  sound.update(0.7);
  assert.ok(context.sources.every((source) => source.connections.length === 0));
  const priorCues = context.cues.length;
  const priorWind = context.wind;
  context.state = "running";
  sound.update(0.8);
  assert.equal(context.cues.length, priorCues);
  assert.notEqual(context.wind, priorWind, "resume uses a fresh wind voice");
  sound.update(WEB_RELEASE_TIME + 0.01);
  assert.equal(context.cues.length, priorCues + 1);
  sound.dispose();
});

test("interruptions stop every voice and disposal prevents later playback", () => {
  const { sound, context, creations } = setup();
  sound.unlock();
  sound.begin(1440, 900);
  sound.update(WEB_ATTACH_TIME + 0.01);
  sound.stop();
  assert.ok(context.sources.every((source) => source.stops.length > 0));
  context.advance(1);
  assert.ok(context.sources.every((source) => source.connections.length === 0));
  sound.begin(1440, 900);
  sound.stop(true);
  assert.ok(
    context.sources.every((source) => source.connections.length === 0),
    "hiding the document must disconnect without waiting for its audio clock",
  );
  sound.begin(1440, 900);
  sound.dispose();
  const sourceCount = context.sources.length;
  assert.equal(context.closeCount, 1);
  sound.unlock();
  sound.begin(1440, 900);
  sound.update(1.8);
  sound.dispose();
  assert.equal(context.sources.length, sourceCount);
  assert.equal(creations(), 1);
  assert.equal(context.closeCount, 1);
});

test("repeated navigations reuse the context and synthesized buffers", () => {
  const { sound, context, creations } = setup();
  sound.unlock();
  const run = () => {
    sound.begin(1440, 900);
    sound.update(WEB_ATTACH_TIME + 0.01);
    sound.update(WEB_RELEASE_TIME + 0.01);
    sound.stop();
    context.advance(5);
  };
  run();
  const buffers = context.buffers.length;
  assert.ok(buffers >= 4);
  sound.unlock();
  run();
  assert.equal(context.buffers.length, buffers);
  assert.equal(creations(), 1);
  assert.equal(context.cues.length, 6);
  sound.dispose();
});

test("unavailable audio never prevents navigation lifecycle calls", () => {
  for (const factory of [
    () => undefined,
    () => {
      throw new Error("Audio device unavailable");
    },
  ]) {
    const sound = createTransitionAudio(factory);
    assert.doesNotThrow(() => {
      sound.unlock();
      sound.begin(1440, 900);
      sound.update(1.8);
      sound.stop();
      sound.dispose();
    });
  }
});
