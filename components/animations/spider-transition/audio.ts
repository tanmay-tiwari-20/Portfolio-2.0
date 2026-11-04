import {
  CONTACT_TIME,
  PLAYBACK_RATE,
  PULL_DURATION,
  WEB_ATTACH_TIME,
  WEB_RELEASE_TIME,
  sampleSwing,
} from "./motion";
import {
  createCueSamples,
  createWindSamples,
  type TransitionCue,
} from "./audio-synthesis";

type Voice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  clean: () => void;
};

const SAMPLE_RATE = 48000;
const SOUND_KINDS = ["shot", "attach", "release", "wind"] as const;
type SoundKind = (typeof SOUND_KINDS)[number];

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
const smooth = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

function browserContext() {
  if (typeof window === "undefined") return;
  const Constructor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return Constructor
    ? new Constructor({ latencyHint: "interactive" })
    : undefined;
}

/** Gesture-unlocked, local sound design driven by the rendered animation clock. */
export function createTransitionAudio(
  contextFactory: () => AudioContext | undefined = browserContext,
) {
  let context: AudioContext | undefined;
  let output: GainNode | undefined;
  const samples = new Map<SoundKind, Float32Array>();
  const buffers = new Map<SoundKind, AudioBuffer>();
  const voices = new Set<Voice>();
  let wind:
    | { voice: Voice; filter: BiquadFilterNode; pan: StereoPannerNode }
    | undefined;
  let active = false;
  let disposed = false;
  let previous = -1;
  let width = 1;
  let height = 1;

  function stopVoices(fade: boolean) {
    wind = undefined;
    for (const voice of [...voices]) {
      try {
        const now = context?.currentTime ?? 0;
        voice.gain.gain.cancelScheduledValues(now);
        if (fade && context?.state === "running") {
          voice.gain.gain.setTargetAtTime(0, now, 0.008);
          voice.source.stop(now + 0.04);
        } else {
          voice.source.stop(now);
          voice.clean();
        }
      } catch {
        voice.clean();
      }
    }
  }

  function warm() {
    if (disposed || samples.size === SOUND_KINDS.length) return;
    try {
      // Fixed-rate PCM can be prepared before a gesture without touching the
      // audio device. Web Audio resamples these buffers to the device rate.
      for (const kind of SOUND_KINDS) {
        if (samples.has(kind)) continue;
        samples.set(
          kind,
          kind === "wind"
            ? createWindSamples(SAMPLE_RATE)
            : createCueSamples(kind, SAMPLE_RATE),
        );
      }
    } catch {
      samples.clear();
    }
  }

  function prepare() {
    if (disposed) return;
    warm();
    if (!context || context.state === "closed") return;
    try {
      // Copy every sound during capture preparation, including when resume is
      // pending. No synthesis or PCM allocation is left for animation frames.
      for (const kind of SOUND_KINDS) {
        if (buffers.has(kind)) continue;
        const pcm = samples.get(kind);
        if (!pcm) return;
        const cached = context.createBuffer(1, pcm.length, SAMPLE_RATE);
        cached.getChannelData(0).set(pcm);
        buffers.set(kind, cached);
      }
    } catch {
      buffers.clear();
    }
  }

  function buffer(kind: SoundKind) {
    const cached = buffers.get(kind);
    if (!cached) throw new Error("Transition audio is not prepared");
    return cached;
  }

  function track(
    source: AudioBufferSourceNode,
    gain: GainNode,
    nodes: AudioNode[],
  ) {
    const voice: Voice = {
      source,
      gain,
      clean: () => {
        source.onended = null;
        for (const node of nodes) {
          try {
            node.disconnect();
          } catch {}
        }
        voices.delete(voice);
      },
    };
    voices.add(voice);
    source.onended = voice.clean;
    return voice;
  }

  function ensureOutput() {
    if (output) return;
    output = context!.createGain();
    // Leave headroom for a transient over the wind; no music or constant bed.
    output.gain.value = 0.58;
    output.connect(context!.destination);
  }

  function playCue(kind: TransitionCue) {
    const ctx = context!;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    track(source, gain, [source, gain, pan]);
    source.buffer = buffer(kind);
    source.playbackRate.value = PLAYBACK_RATE;
    gain.gain.value = kind === "shot" ? 0.8 : kind === "attach" ? 0.9 : 0.5;
    const now = ctx.currentTime;
    // The anchor is at world x = 0.08 * width, just right of screen center.
    pan.pan.setValueAtTime(
      kind === "shot" ? -0.85 : kind === "attach" ? 0.16 : 0.85,
      now,
    );
    if (kind === "shot")
      pan.pan.linearRampToValueAtTime(
        0.16,
        now + source.buffer.duration / PLAYBACK_RATE,
      );
    source.connect(gain).connect(pan).connect(output!);
    source.start(now);
  }

  function ensureWind() {
    if (wind) return wind;
    const ctx = context!;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const pan = ctx.createStereoPanner();
    const voice = track(source, gain, [source, filter, gain, pan]);
    source.buffer = buffer("wind");
    source.loop = true;
    filter.type = "bandpass";
    filter.Q.value = 0.65;
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(pan).connect(output!);
    source.start(ctx.currentTime);
    wind = { voice, filter, pan };
    return wind;
  }

  function update(time: number) {
    if (!active || disposed || !Number.isFinite(time) || time < previous)
      return;
    const before = previous;
    previous = time;
    // Always consume the visual time, even if audio was denied or suspended.
    // Resuming later must not replay the shot or attachment out of sync.
    if (!context || context.state !== "running") {
      stopVoices(false);
      return;
    }
    try {
      ensureOutput();
      if (before < 0 && time === 0) playCue("shot");
      if (before < WEB_ATTACH_TIME && time >= WEB_ATTACH_TIME)
        playCue("attach");
      if (before < WEB_RELEASE_TIME && time >= WEB_RELEASE_TIME)
        playCue("release");
      const air = ensureWind();
      const now = context.currentTime;
      const peak = CONTACT_TIME + (WEB_RELEASE_TIME - CONTACT_TIME) * 0.68;
      const rush = Math.exp(-Math.pow((time - peak) / 0.48, 2));
      const envelope =
        smooth(WEB_ATTACH_TIME + 0.08, CONTACT_TIME, time) *
        (1 -
          smooth(WEB_RELEASE_TIME + 0.1, CONTACT_TIME + PULL_DURATION, time));
      const moving = time > before;
      air.voice.gain.gain.setTargetAtTime(
        moving ? envelope * (0.12 + rush * 0.3) : 0,
        now,
        0.035,
      );
      air.filter.frequency.setTargetAtTime(650 + rush * 2200, now, 0.05);
      const scale = Math.min(height * 0.22, width * 0.22, 195);
      const motion = sampleSwing(time, width, height, scale);
      air.pan.pan.setTargetAtTime(
        clamp(motion.grip[0] / (width / 2), -1, 1) * 0.85,
        now,
        0.025,
      );
    } catch {
      // Audio is optional: a browser/audio-device error cannot cancel navigation.
      active = false;
      stopVoices(false);
    }
  }

  return {
    warm,
    prepare,
    unlock() {
      if (disposed) return;
      try {
        if (!context || context.state === "closed") {
          stopVoices(false);
          output?.disconnect();
          output = undefined;
          buffers.clear();
          context = contextFactory();
        }
        // Call in the original click handler, before any capture/import awaits.
        // No promise continuation starts sounds or revives a finished flight.
        if (context && context.state !== "running")
          void context.resume().catch(() => {});
      } catch {
        // Unavailable Web Audio / autoplay refusal leaves the visual intact.
      }
    },
    begin(w: number, h: number) {
      if (disposed) return;
      stopVoices(false);
      // The orchestrator prepares before its first visual frame; retain a
      // fallback for callers that start a flight directly after unlocking.
      if (context && buffers.size !== SOUND_KINDS.length) prepare();
      width = Math.max(1, w);
      height = Math.max(1, h);
      previous = -1;
      active = true;
      update(0);
    },
    update,
    stop(immediate = false) {
      active = false;
      stopVoices(!immediate);
    },
    dispose() {
      disposed = true;
      active = false;
      stopVoices(false);
      samples.clear();
      buffers.clear();
      try {
        output?.disconnect();
        if (context && context.state !== "closed")
          void context.close().catch(() => {});
      } catch {}
    },
  };
}
