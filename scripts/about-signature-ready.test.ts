import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import test, { type TestContext } from "node:test";
import { waitForAboutSignatureReady } from "../lib/about-signature-ready";

class TrackedTarget extends EventTarget {
  private listeners = new Map<
    string,
    Set<EventListenerOrEventListenerObject>
  >();
  private onceListeners = new Map<
    string,
    Set<EventListenerOrEventListenerObject>
  >();

  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    super.addEventListener(type, listener, options);
    if (!listener) return;
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    if (typeof options === "object" && options.once) {
      const onceListeners = this.onceListeners.get(type) ?? new Set();
      onceListeners.add(listener);
      this.onceListeners.set(type, onceListeners);
    }
  }

  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ) {
    super.removeEventListener(type, listener, options);
    if (listener) {
      this.listeners.get(type)?.delete(listener);
      this.onceListeners.get(type)?.delete(listener);
    }
  }

  override dispatchEvent(event: Event) {
    const result = super.dispatchEvent(event);
    this.onceListeners.get(event.type)?.forEach((listener) => {
      this.listeners.get(event.type)?.delete(listener);
    });
    this.onceListeners.delete(event.type);
    return result;
  }

  get listenerCount() {
    return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0);
  }
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

class TestElement extends TrackedTarget {
  dataset: Record<string, string> = {};
  style = { opacity: "1", transform: "none", visibility: "visible" };
  parentElement: TestElement | null = null;
  ownerDocument!: TestDocument;
  isConnected = true;
  images: TestImage[] = [];
  classNames = new Set<string>();
  classList = { contains: (name: string) => this.classNames.has(name) };

  querySelectorAll(selector: string) {
    return selector.includes("img") ? this.images : [];
  }

  querySelector(selector: string): TestElement | null {
    if (selector.includes("img")) return this.images[0] ?? null;
    if (selector.includes("about-hero")) return this;
    if (selector.includes("data-about-visual")) return this;
    return null;
  }

  getAttribute(name: string) {
    if (name === "style") return "";
    return null;
  }

  getAnimations() {
    return [];
  }
}

class TestImage extends TestElement {
  src = "/portrait.webp";
  get currentSrc() {
    return this.src;
  }
  complete = true;
  naturalWidth = 640;
  loading = "lazy";
  decoding = "async";
  fetchPriority = "auto";
  decodeReady = Promise.resolve();

  decode() {
    return this.decodeReady;
  }

  loaded() {
    this.complete = true;
    this.naturalWidth = 640;
    this.dispatchEvent(new Event("load"));
  }

  failed() {
    this.complete = true;
    this.naturalWidth = 0;
    this.dispatchEvent(new Event("error"));
  }
}

class TestDocument extends TrackedTarget {
  readyState = "complete";
  documentElement = new TestElement();
  body = new TestElement();
  fonts = { ready: Promise.resolve(), status: "loaded" };
  preloader: TestElement | null = null;

  querySelector(selector: string) {
    return selector === ".site-preloader" ? this.preloader : null;
  }
}

class TestClock {
  now = 0;
  private nextId = 1;
  private tasks = new Map<number, { at: number; callback: () => void }>();

  setTimeout = (callback: () => void, delay = 0) => {
    const id = this.nextId++;
    this.tasks.set(id, { at: this.now + delay, callback });
    return id;
  };

  clearTimeout = (id: number) => {
    this.tasks.delete(id);
  };

  requestAnimationFrame = (callback: FrameRequestCallback) =>
    this.setTimeout(() => callback(this.now), 16);

  cancelAnimationFrame = this.clearTimeout;

  advance(milliseconds: number) {
    const end = this.now + milliseconds;
    for (;;) {
      const next = [...this.tasks.entries()]
        .filter(([, task]) => task.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [id, task] = next;
      this.now = task.at;
      this.tasks.delete(id);
      task.callback();
    }
    this.now = end;
  }

  get pending() {
    return this.tasks.size;
  }
}

async function flushPromises() {
  for (let index = 0; index < 12; index++) await Promise.resolve();
}

function setup(context: TestContext) {
  const clock = new TestClock();
  const document = new TestDocument();
  document.documentElement.dataset.preloaderComplete = "true";
  const root = new TestElement();
  root.dataset.aboutEntranceComplete = "true";
  const transition = new TestElement();
  const portrait = new TestImage();
  root.images = [portrait];
  root.parentElement = transition;
  transition.parentElement = document.body;
  for (const element of [
    root,
    transition,
    portrait,
    document.documentElement,
    document.body,
  ]) {
    element.ownerDocument = document;
  }
  const extraImages: TestImage[] = [];
  const window = Object.assign(new TrackedTarget(), {
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    requestAnimationFrame: clock.requestAnimationFrame,
    cancelAnimationFrame: clock.cancelAnimationFrame,
    getComputedStyle: (element: TestElement) => element.style,
    Image: class extends TestImage {
      constructor() {
        super();
        this.complete = false;
        this.ownerDocument = document;
        extraImages.push(this);
      }
    },
  });
  const replacements = {
    window,
    document,
    getComputedStyle: window.getComputedStyle,
    HTMLImageElement: TestImage,
    HTMLElement: TestElement,
    requestAnimationFrame: clock.requestAnimationFrame,
    cancelAnimationFrame: clock.cancelAnimationFrame,
  };
  const original = new Map<string, PropertyDescriptor | undefined>();
  const controller = new AbortController();
  for (const [key, value] of Object.entries(replacements)) {
    original.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value,
      writable: true,
    });
  }
  context.after(() => {
    controller.abort();
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  const start = (imageSources?: string[]) =>
    waitForAboutSignatureReady({
      root: root as unknown as HTMLElement,
      signal: controller.signal,
      imageSources,
    });
  const frames = async (count = 5) => {
    await flushPromises();
    for (let index = 0; index < count; index++) {
      clock.advance(16);
      await flushPromises();
    }
  };
  return {
    clock,
    document,
    window,
    root,
    transition,
    portrait,
    extraImages,
    controller,
    start,
    frames,
  };
}

test("client navigation can reveal when document load and preloader already finished", async (context) => {
  const environment = setup(context);
  const result = environment.start();
  await environment.frames();
  assert.equal(await result, "animate");
  assert.equal(environment.clock.pending, 0);
  assert.equal(
    getEventListeners(environment.controller.signal, "abort").length,
    0,
  );
});

test("each loading stage and portrait decoding must finish before the reveal", async (context) => {
  const environment = setup(context);
  const { document, window, root, portrait } = environment;
  const fonts = deferred();
  const decoding = deferred();
  document.readyState = "loading";
  document.documentElement.dataset.preloaderComplete = "false";
  document.preloader = new TestElement();
  document.documentElement.classNames.add("portfolio-loading");
  document.fonts.ready = fonts.promise;
  root.dataset.aboutEntranceComplete = "false";
  portrait.complete = false;
  portrait.decodeReady = decoding.promise;
  let settled = false;
  const result = environment.start().then((value) => {
    settled = true;
    return value;
  });
  await environment.frames();
  assert.equal(settled, false);
  document.readyState = "complete";
  window.dispatchEvent(new Event("load"));
  await environment.frames();
  assert.equal(settled, false);
  document.documentElement.dataset.preloaderComplete = "true";
  document.documentElement.classNames.delete("portfolio-loading");
  document.preloader = null;
  window.dispatchEvent(new Event("portfolio:preloader-complete"));
  await environment.frames();
  assert.equal(settled, false);
  fonts.resolve();
  await environment.frames();
  assert.equal(settled, false);
  root.dataset.aboutEntranceComplete = "true";
  root.dispatchEvent(new Event("portfolio:about-entrance-complete"));
  await environment.frames();
  assert.equal(settled, false);
  portrait.loaded();
  await environment.frames();
  assert.equal(
    settled,
    false,
    "an image load event does not imply decoding finished",
  );
  decoding.resolve();
  await environment.frames();
  assert.equal(await result, "animate");
});

test("a portrait error settles the image gate without blocking the usable page", async (context) => {
  const environment = setup(context);
  environment.portrait.complete = false;
  const result = environment.start();
  await environment.frames();
  environment.portrait.failed();
  await environment.frames();
  assert.equal(await result, "animate");
});

test("required detached orbit images are included in readiness", async (context) => {
  const environment = setup(context);
  let settled = false;
  const result = environment
    .start(["/orbit-one.webp", "/orbit-two.webp"])
    .then((value) => {
      settled = true;
      return value;
    });
  await environment.frames();
  assert.equal(settled, false);
  assert.equal(environment.extraImages.length, 2);
  environment.extraImages[0].loaded();
  await environment.frames();
  assert.equal(settled, false);
  environment.extraImages[1].failed();
  await environment.frames();
  assert.equal(await result, "animate");
});

test("a still-moving client navigation transition delays automatic animation", async (context) => {
  const environment = setup(context);
  environment.transition.style.opacity = "0.5";
  environment.transition.style.transform = "matrix(1, 0, 0, 1, 0, 4)";
  let settled = false;
  const result = environment.start().then((value) => {
    settled = true;
    return value;
  });
  await environment.frames();
  assert.equal(settled, false);
  environment.transition.style.opacity = "1";
  environment.transition.style.transform = "none";
  await environment.frames();
  assert.equal(await result, "animate");
});

test("aborting a navigation returns static and removes pending resources", async (context) => {
  const environment = setup(context);
  environment.document.readyState = "loading";
  environment.document.documentElement.dataset.preloaderComplete = "false";
  environment.document.preloader = new TestElement();
  environment.root.dataset.aboutEntranceComplete = "false";
  environment.portrait.complete = false;
  const result = environment.start();
  await environment.frames();
  environment.controller.abort();
  assert.equal(await result, "static");
  assert.equal(environment.clock.pending, 0);
  assert.equal(environment.window.listenerCount, 0);
  assert.equal(environment.root.listenerCount, 0);
  assert.equal(environment.portrait.listenerCount, 0);
  assert.equal(
    getEventListeners(environment.controller.signal, "abort").length,
    0,
  );
});

test("the cloth transition finishes before the destination signature starts", async (context) => {
  const environment = setup(context);
  environment.document.documentElement.classNames.add(
    "portfolio-transitioning",
  );
  let settled = false;
  const result = environment.start().then((value) => {
    settled = true;
    return value;
  });
  await environment.frames();
  assert.equal(settled, false);
  environment.document.documentElement.classNames.delete(
    "portfolio-transitioning",
  );
  environment.window.dispatchEvent(new Event("portfolio:transition-end"));
  await environment.frames();
  assert.equal(await result, "animate");
});

test("covered signature waits for lifecycle events without polling frames or layout", async (context) => {
  const environment = setup(context);
  environment.document.documentElement.dataset.spiderTransition = "capturing";
  let reads = 0;
  environment.window.getComputedStyle = (element: TestElement) => {
    reads += 1;
    return element.style;
  };
  const result = environment.start();
  await environment.frames(60);
  assert.equal(reads, 0);
  assert.equal(
    environment.clock.pending,
    1,
    "only the readiness timeout remains",
  );

  // An end event followed immediately by another flight must not begin drawing.
  environment.window.dispatchEvent(new Event("portfolio:transition-end"));
  environment.document.documentElement.dataset.spiderTransition = "swinging";
  environment.window.dispatchEvent(new Event("portfolio:capture-frame"));
  await environment.frames(10);
  assert.equal(reads, 0);
  delete environment.document.documentElement.dataset.spiderTransition;
  environment.window.dispatchEvent(new Event("portfolio:transition-end"));
  await environment.frames();
  assert.equal(await result, "animate");
  assert.equal(environment.clock.pending, 0);
  assert.equal(environment.window.listenerCount, 0);
});

test("aborting a covered signature removes its transition listeners", async (context) => {
  const environment = setup(context);
  environment.document.documentElement.dataset.spiderTransition = "holding";
  const result = environment.start();
  await environment.frames();
  environment.controller.abort();
  assert.equal(await result, "static");
  assert.equal(environment.clock.pending, 0);
  assert.equal(environment.window.listenerCount, 0);
});

test("the loading timeout provides static output without granting animation readiness", async (context) => {
  const environment = setup(context);
  environment.document.readyState = "loading";
  let settled = false;
  const result = environment.start().then((value) => {
    settled = true;
    return value;
  });
  await flushPromises();
  environment.clock.advance(14_999);
  await flushPromises();
  assert.equal(settled, false);
  environment.clock.advance(1);
  await flushPromises();
  assert.equal(await result, "static");
  assert.equal(environment.clock.pending, 0);
  assert.equal(environment.window.listenerCount, 0);
});
