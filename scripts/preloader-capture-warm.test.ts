import assert from "node:assert/strict";
import test from "node:test";
import { warmCaptureAssets } from "../components/animations/spider-transition/capture";

test("intro warms pending visible logos without changing route warmup or fetching hidden/lazy images", async (t) => {
  let now = 0;
  const requested: string[] = [];
  class Reader {
    result = "data:image/svg+xml;base64,PHN2Zy8+";
    onload: (() => void) | null = null;
    readAsDataURL() {
      queueMicrotask(() => this.onload?.());
    }
  }
  const globals = {
    document: { styleSheets: [] },
    location: new URL("https://portfolio.test/"),
    performance: { now: () => now },
    innerHeight: 800,
    innerWidth: 1200,
    FileReader: Reader,
    fetch: async (url: string) => {
      requested.push(url);
      return {
        ok: true,
        blob: async () => new Blob(["<svg/>"]),
      };
    },
  };
  for (const [name, value] of Object.entries(globals)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  const image = (
    source: string,
    loading = "eager",
    width = 40,
    top = 100,
  ) => ({
    complete: false,
    naturalWidth: 0,
    src: source,
    currentSrc: source,
    loading,
    getBoundingClientRect: () => ({
      width,
      height: 40,
      top,
      bottom: top + 40,
      left: 100,
      right: 100 + width,
    }),
  });
  const root = {
    querySelectorAll: () => [
      image("/person.svg"),
      image("https://media.example.test/community.svg"),
      image("/hidden.svg", "eager", 0),
      image("/lazy.svg", "lazy"),
      image("/offscreen.svg", "eager", 40, 1200),
    ],
  } as unknown as HTMLElement;

  warmCaptureAssets(root);
  assert.deepEqual(requested, [], "normal route warmup still waits for loaded images");
  now = 1600;
  warmCaptureAssets(root, { includePendingImages: true });
  assert.deepEqual(requested, [
    "https://portfolio.test/person.svg",
    "https://media.example.test/community.svg",
  ]);
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
  now = 3200;
  warmCaptureAssets(root, { includePendingImages: true });
  assert.equal(requested.length, 2, "repeated intro warmup reuses encoded assets");
});
