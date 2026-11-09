import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import test, { type TestContext } from "node:test";
import {
  waitForPreloaderReady,
  waitForPreloaderRelease,
  waitForPreloaderReveal,
} from "../lib/preloader-ready";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

class TestElement extends EventTarget {
  isConnected = true;
  textContent = "Tanmay Tiwari";
  computed = {
    fontStyle: "normal",
    fontWeight: "400",
    fontFamily: '"Inter", sans-serif',
    visibility: "visible",
  };
  ownerDocument!: TestDocument;
  images: TestImage[] = [];
  querySelector() {
    return this.ownerDocument.heading;
  }
  querySelectorAll() {
    return this.images;
  }
}

class TestImage extends TestElement {
  loading = "eager";
  src = "/portrait.webp";
  currentSrc = this.src;
  complete = false;
  naturalWidth = 400;
  decodeResult = Promise.resolve();
  bounds = {
    width: 400,
    height: 500,
    top: 100,
    bottom: 600,
    left: 0,
    right: 400,
  };
  getBoundingClientRect() {
    return this.bounds;
  }
  decode() {
    return this.decodeResult;
  }
}

class TestWindow extends EventTarget {
  innerWidth = 1200;
  innerHeight = 800;
  now = 0;
  private nextId = 1;
  timers = new Map<number, { callback: () => void; at: number }>();
  frames = new Map<number, FrameRequestCallback>();
  setTimeout(callback: () => void, delay: number) {
    const id = this.nextId++;
    this.timers.set(id, { callback, at: this.now + delay });
    return id;
  }
  clearTimeout(id: number) {
    this.timers.delete(id);
  }
  requestAnimationFrame(callback: FrameRequestCallback) {
    const id = this.nextId++;
    this.frames.set(id, callback);
    return id;
  }
  cancelAnimationFrame(id: number) {
    this.frames.delete(id);
  }
  getComputedStyle(element: TestElement) {
    return element.computed;
  }
  advance(milliseconds: number) {
    this.now += milliseconds;
    for (const [id, timer] of [...this.timers]) {
      if (timer.at > this.now) continue;
      this.timers.delete(id);
      timer.callback();
    }
  }
  paint() {
    const callbacks = [...this.frames.values()];
    this.frames.clear();
    callbacks.forEach((callback) => callback(this.now));
  }
}

class TestDocument extends EventTarget {
  readyState = "complete";
  defaultView = new TestWindow();
  body = new TestElement();
  heading = new TestElement();
  tagline = new TestElement();
  preloader = new TestElement();
  classNames = new Set(["portfolio-loading"]);
  documentElement = {
    classList: { contains: (name: string) => this.classNames.has(name) },
    dataset: {} as Record<string, string>,
  };
  fontRequests: string[] = [];
  fontResult: Promise<unknown> = Promise.resolve([]);
  fonts = {
    load: (font: string) => {
      this.fontRequests.push(font);
      return this.fontResult;
    },
    get ready(): Promise<void> {
      throw new Error("The preloader must not wait for unrelated fonts");
    },
  };
  constructor() {
    super();
    this.heading.computed.fontFamily = '"Poppins", sans-serif';
    this.heading.computed.fontWeight = "800";
    this.tagline.computed.fontFamily = '"Poppins", sans-serif';
    this.tagline.computed.fontWeight = "600";
  }
  querySelector(selector: string) {
    if (selector === ".site-preloader") return this.preloader;
    return selector.includes("data-preloader-tagline") ? this.tagline : null;
  }
}

function environment(t: TestContext) {
  const document = new TestDocument();
  const root = new TestElement();
  root.ownerDocument = document;
  const controller = new AbortController();
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  Object.defineProperty(globalThis, "window", {
    value: document.defaultView,
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: document,
    configurable: true,
  });
  t.after(() => {
    controller.abort();
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  });
  return {
    root,
    document,
    view: document.defaultView,
    controller,
    options: {
      root: root as unknown as HTMLElement,
      signal: controller.signal,
    },
  };
}

async function microtasks() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

function assertImageReleased(image: TestImage) {
  assert.equal(getEventListeners(image, "load").length, 0);
  assert.equal(getEventListeners(image, "error").length, 0);
}

test("waits for covered first-viewport image decode and two paints, ignoring lazy/offscreen media", async (t) => {
  const env = environment(t);
  const image = new TestImage();
  env.root.computed.visibility = "hidden";
  image.computed.visibility = "hidden";
  const decode = deferred();
  image.decodeResult = decode.promise;
  const lazy = new TestImage();
  lazy.loading = "lazy";
  const offscreen = new TestImage();
  offscreen.bounds.top = 1200;
  offscreen.bounds.bottom = 1700;
  env.root.images = [image, lazy, offscreen];
  const progress: number[] = [];
  let ready = false;
  const pending = waitForPreloaderReady({
    ...env.options,
    onProgress: (value) => progress.push(value),
  }).then(() => {
    ready = true;
  });
  await microtasks();
  assert.equal(env.document.fontRequests.length, 3);
  assert.match(env.document.fontRequests[1], /800.*Poppins/);
  assert.equal(ready, false);
  assertImageReleased(lazy);
  assertImageReleased(offscreen);
  image.dispatchEvent(new Event("load"));
  await microtasks();
  assert.equal(ready, false, "load alone must not bypass decode");
  decode.resolve();
  await microtasks();
  assertImageReleased(image);
  env.view.paint();
  await microtasks();
  assert.equal(ready, false, "one paint must not complete the handoff");
  env.view.paint();
  await pending;
  assert.equal(progress.at(-1), 1);
  assert.ok(
    progress.every((value, index) => !index || value >= progress[index - 1]),
  );
  assert.equal(env.view.timers.size, 0);
  assert.equal(env.view.frames.size, 0);
  assert.equal(getEventListeners(env.controller.signal, "abort").length, 0);
});

test("image errors and rejected fonts settle without blocking the page", async (t) => {
  const env = environment(t);
  const image = new TestImage();
  env.root.images = [image];
  env.document.fontResult = Promise.reject(new Error("font unavailable"));
  const pending = waitForPreloaderReady(env.options);
  await microtasks();
  image.dispatchEvent(new Event("error"));
  await microtasks();
  env.view.paint();
  env.view.paint();
  await pending;
  assertImageReleased(image);
  assert.equal(env.view.timers.size, 0);
});

test("eager introduction logos join readiness while compact hidden-card images do not", async (t) => {
  const env = environment(t);
  const logo = new TestImage();
  logo.src = logo.currentSrc = "/brand.svg";
  const compactHidden = new TestImage();
  compactHidden.bounds.width = 0;
  compactHidden.bounds.height = 0;
  env.document.preloader.images = [logo, compactHidden];
  let ready = false;
  const pending = waitForPreloaderReady(env.options).then(() => {
    ready = true;
  });
  await microtasks();
  assert.equal(ready, false);
  assert.equal(getEventListeners(logo, "load").length, 1);
  assertImageReleased(compactHidden);
  logo.dispatchEvent(new Event("load"));
  await microtasks();
  env.view.paint();
  env.view.paint();
  await pending;
  assertImageReleased(logo);
  assert.equal(env.view.timers.size, 0);
});

test("resource deadline and suspended animation frames fail open without inventing progress", async (t) => {
  const env = environment(t);
  const image = new TestImage();
  const font = deferred();
  env.root.images = [image];
  env.document.fontResult = font.promise;
  const progress: number[] = [];
  let ready = false;
  const pending = waitForPreloaderReady({
    ...env.options,
    onProgress: (value) => progress.push(value),
  }).then(() => {
    ready = true;
  });
  await microtasks();
  env.view.advance(2400);
  await microtasks();
  assert.equal(ready, false);
  assertImageReleased(image);
  env.view.advance(160);
  await pending;
  assert.ok(
    progress.at(-1)! < 1,
    "unresolved resources must not count as complete",
  );
  const callbackCount = progress.length;
  font.resolve();
  image.dispatchEvent(new Event("load"));
  await microtasks();
  assert.equal(progress.length, callbackCount);
  assert.equal(env.view.timers.size, 0);
  assert.equal(env.view.frames.size, 0);
  assert.equal(getEventListeners(env.controller.signal, "abort").length, 0);
});

test("unmount cancellation releases image, document and abort listeners without scheduling paint", async (t) => {
  const env = environment(t);
  const image = new TestImage();
  env.root.images = [image];
  const pending = waitForPreloaderReady(env.options);
  await microtasks();
  env.controller.abort();
  await pending;
  assertImageReleased(image);
  assert.equal(getEventListeners(env.document, "DOMContentLoaded").length, 0);
  assert.equal(getEventListeners(env.controller.signal, "abort").length, 0);
  assert.equal(env.view.timers.size, 0);
  assert.equal(env.view.frames.size, 0);
});

test("a stalled document is bounded and does not start asset work", async (t) => {
  const env = environment(t);
  env.document.readyState = "loading";
  const pending = waitForPreloaderReady(env.options);
  env.view.advance(2400);
  await pending;
  assert.equal(env.document.fontRequests.length, 0);
  assert.equal(getEventListeners(env.document, "DOMContentLoaded").length, 0);
  assert.equal(env.view.timers.size, 0);
});

test("home reveal and full release are separate signals and clean up independently", async (t) => {
  const env = environment(t);
  let released = false;
  const reveal = waitForPreloaderReveal(env.controller.signal);
  const complete = waitForPreloaderRelease(env.controller.signal).then(() => {
    released = true;
  });
  env.view.dispatchEvent(new Event("portfolio:preloader-reveal"));
  await reveal;
  assert.equal(released, false);
  env.document.classNames.delete("portfolio-loading");
  env.view.dispatchEvent(new Event("portfolio:preloader-complete"));
  await complete;
  assert.equal(
    getEventListeners(env.view, "portfolio:preloader-reveal").length,
    0,
  );
  assert.equal(
    getEventListeners(env.view, "portfolio:preloader-complete").length,
    0,
  );
  assert.equal(getEventListeners(env.controller.signal, "abort").length, 0);
});

test("late motion imports observe an already-started reveal and cancellation removes pending waits", async (t) => {
  const env = environment(t);
  env.document.documentElement.dataset.preloaderState = "revealing";
  await waitForPreloaderReveal(env.controller.signal);
  const release = waitForPreloaderRelease(env.controller.signal);
  env.controller.abort();
  await release;
  assert.equal(
    getEventListeners(env.view, "portfolio:preloader-reveal").length,
    0,
  );
  assert.equal(
    getEventListeners(env.view, "portfolio:preloader-complete").length,
    0,
  );
  assert.equal(getEventListeners(env.controller.signal, "abort").length, 0);
});
