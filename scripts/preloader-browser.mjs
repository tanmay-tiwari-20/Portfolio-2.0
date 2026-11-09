/** Initial-document preloader regression against a running local app.
 * PRELOADER_BASE_URL defaults to http://127.0.0.1:3000.
 * PRELOADER_PLAYWRIGHT_MODULE accepts an existing playwright-core/index.mjs.
 * PRELOADER_BROWSERS=chromium,firefox,webkit selects installed engines.
 * External image bytes are fixtures; application and animation code are real.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const modulePath =
  process.env.PRELOADER_PLAYWRIGHT_MODULE ||
  process.env.SPIDER_PLAYWRIGHT_MODULE;
const engines = await import(
  modulePath ? pathToFileURL(modulePath).href : "playwright-core"
);
const base = process.env.PRELOADER_BASE_URL || "http://127.0.0.1:3000";
const output = "artifacts/preloader-verification";
const selected = (
  process.env.PRELOADER_BROWSERS || "chromium,firefox,webkit"
).split(",");
const only = process.env.PRELOADER_CASE;
const chosen = new Set(only?.split(",") || []);
const wants = (...names) => !only || names.some((name) => chosen.has(name));
const report = {
  base,
  cases: [],
  errors: [],
  consoleErrors: [],
  httpErrors: [],
};
const logoSource = /logo:\s*"([^"]+)"/.exec(
  await readFile(new URL("../data/hackshastra.ts", import.meta.url), "utf8"),
)?.[1];
const fixture =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect width="1200" height="1200" fill="#2b1e1f"/><circle cx="600" cy="420" r="190" fill="#938783"/><path d="M170 1200c0-550 860-550 860 0" fill="#493738"/></svg>';

function instrument() {
  const data = (window.__preloaderTest = {
    documentToken: Math.random().toString(36),
    phases: [],
    spiderPhases: [],
    transitionResults: [],
    events: [],
    lockedAt: null,
    unlockedAt: null,
    seenLoader: false,
    progress: [],
    ditherReadyAt: null,
    bootstrapAt: null,
  });
  const observe = () => {
    const state = document.documentElement?.dataset.preloaderState || "none";
    if (data.phases.at(-1)?.state !== state)
      data.phases.push({ state, at: performance.now() });
    if (document.documentElement?.dataset.preloaderStartedAt)
      data.bootstrapAt = Number(
        document.documentElement.dataset.preloaderStartedAt,
      );
    const spider = document.documentElement?.dataset.spiderTransition || "idle";
    if (data.spiderPhases.at(-1)?.state !== spider)
      data.spiderPhases.push({ state: spider, at: performance.now() });
    const result = document.documentElement?.dataset.preloaderTransitionResult;
    if (result && data.transitionResults.at(-1)?.state !== result)
      data.transitionResults.push({ state: result, at: performance.now() });
    const progress = document.querySelector(
      "[data-preloader-progress]",
    )?.textContent;
    if (progress && data.progress.at(-1)?.value !== progress)
      data.progress.push({ value: progress, at: performance.now() });
    const page = document.querySelector("[data-preloader-page]");
    if (page?.inert && data.lockedAt === null)
      data.lockedAt = performance.now();
    if (
      page &&
      !page.inert &&
      data.lockedAt !== null &&
      data.unlockedAt === null
    )
      data.unlockedAt = performance.now();
    if (document.querySelector(".site-preloader")) data.seenLoader = true;
    if (
      data.ditherReadyAt === null &&
      document.querySelector('.hero-portrait-frame [data-dither-state="ready"]')
    )
      data.ditherReadyAt = performance.now();
  };
  new MutationObserver(observe).observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
    attributeFilter: [
      "data-preloader-state",
      "data-spider-transition",
      "data-preloader-transition-result",
      "data-dither-state",
      "inert",
    ],
  });
  ["portfolio:preloader-reveal", "portfolio:preloader-complete"].forEach(
    (name) =>
      window.addEventListener(name, () =>
        data.events.push({ name, at: performance.now() }),
      ),
  );
}

async function makePage(browser, options = {}) {
  const {
    holdHero = false,
    failHero = false,
    holdNoncritical = false,
    ...contextOptions
  } = options;
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    ...contextOptions,
  });
  page.setDefaultTimeout(25000);
  await page.addInitScript(instrument);
  const errors = [];
  const warnings = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      report.httpErrors.push({
        url: response.url(),
        status: response.status(),
      });
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      report.consoleErrors.push({ url: page.url(), message: message.text() });
      if (
        /hydrat|didn.t match|mismatch|server.rendered|Minified React error/i.test(
          message.text(),
        )
      )
        errors.push(`React console error: ${message.text()}`);
    }
    if (/\[Spider transition\]/.test(message.text())) {
      warnings.push(message.text());
      console.log(`Transition diagnostic: ${message.text()}`);
    }
  });
  let releaseHero;
  let releaseNoncritical;
  const heroGate = new Promise((resolve) => {
    releaseHero = resolve;
  });
  const noncriticalGate = new Promise((resolve) => {
    releaseNoncritical = resolve;
  });
  let heroRequests = 0;
  await page.route(
    /^https:\/\/(res\.cloudinary\.com|images\.unsplash\.com)\//,
    async (route) => {
      const hero = /hero_ppp8ke/.test(route.request().url());
      if (hero) heroRequests += 1;
      if (hero && failHero) return route.abort();
      if (hero && holdHero) await heroGate;
      if (!hero && holdNoncritical && route.request().url() !== logoSource)
        await noncriticalGate;
      try {
        await route.fulfill({
          contentType: "image/svg+xml",
          headers: { "access-control-allow-origin": "*" },
          body: fixture,
        });
      } catch {
        // Closing a test page cancels intentionally held noncritical requests.
      }
    },
  );
  return {
    page,
    errors,
    warnings,
    releaseHero,
    releaseNoncritical,
    heroRequests: () => heroRequests,
    close: async () => {
      releaseHero();
      releaseNoncritical();
      await page.close();
    },
  };
}

async function complete(page, name) {
  await page.waitForFunction(
    () => document.documentElement.dataset.preloaderComplete === "true",
  );
  await page.waitForFunction(() => !document.querySelector(".site-preloader"));
  const state = await page.evaluate(() => ({
    ...window.__preloaderTest,
    loading: document.documentElement.classList.contains("portfolio-loading"),
    inert: document.querySelector("[data-preloader-page]")?.inert,
    busy: document
      .querySelector("[data-preloader-page]")
      ?.getAttribute("aria-busy"),
    overflow: document.documentElement.scrollWidth > innerWidth,
    scrollLock: getComputedStyle(document.documentElement).overflowY,
    spiderCovered: !document.querySelector(".spider-transition")?.hidden,
    spiderInert: document.querySelector("[data-transition-page]")?.inert,
    transitionResult:
      document.documentElement.dataset.preloaderTransitionResult,
    hidden: document.hidden,
    visibilityState: document.visibilityState,
  }));
  assert.equal(state.loading, false, `${name}: loading class released`);
  assert.equal(state.inert, false, `${name}: own inert released`);
  assert.equal(state.busy, null, `${name}: busy released`);
  assert.notEqual(state.scrollLock, "hidden", `${name}: scroll lock released`);
  assert.equal(state.overflow, false, `${name}: no horizontal overflow`);
  assert.equal(state.spiderCovered, false, `${name}: Spidey cover released`);
  assert.equal(state.spiderInert, false, `${name}: route surface unlocked`);
  assert.equal(
    state.events.filter(
      (event) => event.name === "portfolio:preloader-complete",
    ).length,
    1,
    `${name}: one completion event; ${JSON.stringify({ phases: state.phases, spider: state.spiderPhases, events: state.events })}`,
  );
  return state;
}

function assertSmoothProgress(state, name) {
  const counts = state.progress
    .map(({ value }) => Number.parseInt(value, 10))
    .filter(Number.isFinite);
  assert.ok(counts.length > 1, `${name}: central percentage visibly updates`);
  assert.equal(counts.at(-1), 100, `${name}: percentage finishes at100`);
  assert.ok(
    counts.every(
      (value, index) =>
        value >= 0 &&
        value <= 100 &&
        (index === 0 ||
          (value >= counts[index - 1] && value - counts[index - 1] <= 4)),
    ),
    `${name}: percentage stays monotonic with at most four points of catch-up after delayed callbacks`,
  );
}

async function verifyDither(page, name, screenshot = false) {
  const selector = '.hero-portrait-frame [data-dither-state="ready"] canvas';
  // No pointer, synthetic lifecycle event or scroll may wake the first frame.
  await page.waitForFunction(() =>
    document.querySelector(
      '.hero-portrait-frame [data-dither-state="ready"] canvas',
    ),
  );
  const ready = await page.evaluate(() => ({
    at: window.__preloaderTest.ditherReadyAt,
    completeAt: window.__preloaderTest.events.find(
      ({ name }) => name === "portfolio:preloader-complete",
    ).at,
  }));
  assert.ok(
    ready.at >= ready.completeAt,
    `${name}: first dither frame happens after preloader completion`,
  );
  await page.waitForTimeout(1300);
  const sample = () => {
    // The existing synchronous capture hook renders without preserveDrawingBuffer.
    window.dispatchEvent(new Event("portfolio:capture-frame"));
    const canvas = document.querySelector(
      '.hero-portrait-frame [data-dither-state="ready"] canvas',
    );
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 48;
    sampleCanvas.height = 48;
    const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(canvas, 0, 0, 48, 48);
    return {
      visibility: getComputedStyle(canvas).visibility,
      width: canvas.width,
      height: canvas.height,
      pixels: [...context.getImageData(0, 0, 48, 48).data],
    };
  };
  const before = await page.evaluate(sample);
  assert.equal(
    before.visibility,
    "visible",
    `${name}: dither canvas is visible before any interaction`,
  );
  assert.ok(
    before.width > 1 && before.height > 1,
    `${name}: dither canvas has real dimensions`,
  );
  assert.ok(
    before.pixels.some((value, index) => index % 4 === 3 && value > 0),
    `${name}: first frame contains image pixels`,
  );
  const bounds = await page.locator(selector).boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width * 0.5,
    bounds.y + bounds.height * 0.4,
  );
  await page.waitForTimeout(500);
  const after = await page.evaluate(sample);
  assert.ok(
    after.pixels.some((value, index) => value !== before.pixels[index]),
    `${name}: pointer interaction changes rendered portrait pixels`,
  );
  if (screenshot)
    await page
      .locator(".hero-portrait-frame")
      .screenshot({ path: `${output}/portrait-dither-hover.png` });
  report.cases.push({
    name: `${name}-dither`,
    firstFrameAfterCompletion: true,
    responsiveToPointer: true,
    size: [before.width, before.height],
  });
}

async function screenshotCase(browser, name, viewport) {
  const test = await makePage(browser, { viewport, holdHero: true });
  try {
    await test.page.goto(base, { waitUntil: "domcontentloaded" });
    await test.page.waitForFunction(
      () => document.querySelector("[data-preloader-page]")?.inert,
    );
    // Let the designed entrance settle while a real critical request is held.
    await test.page.waitForTimeout(700);
    const geometry = await test.page.evaluate(() => {
      const layer = document.querySelector(".site-preloader");
      const bounds = (element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      };
      return {
        state: document.documentElement.dataset.preloaderState,
        layer: bounds(layer),
        title: bounds(
          layer.querySelector(
            "[data-preloader-tagline], [data-preloader-progress]",
          ),
        ),
        details: [...layer.querySelectorAll("[data-preloader-detail]")].map(
          bounds,
        ),
        paragraphs: [...layer.querySelectorAll("p")]
          .filter((element) => getComputedStyle(element).display !== "none")
          .map(bounds),
        overflow: document.documentElement.scrollWidth > innerWidth,
        heroComplete: document.querySelector(".hero-portrait-frame img")
          ?.complete,
        logoSources: [
          ...layer.querySelectorAll("[data-preloader-detail] img"),
        ].map((image) => image.getAttribute("src")),
        headers: layer.querySelectorAll("header, footer").length,
      };
    });
    assert.equal(
      geometry.state,
      "preparing",
      `${name}: delayed hero must keep cover present`,
    );
    assert.equal(
      geometry.heroComplete,
      false,
      `${name}: hero fixture is actually delayed`,
    );
    assert.equal(
      geometry.overflow,
      false,
      `${name}: no overflow while covered`,
    );
    assert.ok(
      geometry.logoSources.includes("/icon.svg"),
      `${name}: existing personal logo reused`,
    );
    assert.equal(geometry.headers, 0, `${name}: no preloader header or footer`);
    assert.ok(
      geometry.logoSources.includes(logoSource),
      `${name}: existing HackShastra logo reused`,
    );
    for (const [index, bounds] of [
      ...geometry.paragraphs,
      ...geometry.details,
    ].entries()) {
      assert.ok(
        bounds.x >= -1 && bounds.right <= viewport.width + 1,
        `${name}: paragraph ${index} fits width`,
      );
      assert.ok(
        bounds.y >= -1 && bounds.bottom <= viewport.height + 1,
        `${name}: paragraph ${index} fits height`,
      );
    }
    if (name !== "webkit")
      await test.page.screenshot({ path: `${output}/${name}-intro.png` });
    test.releaseHero();
    if (name === "desktop") {
      await test.page.waitForFunction(
        () => document.documentElement.dataset.spiderTransition === "pulling",
      );
      await test.page.screenshot({ path: `${output}/${name}-spidey.png` });
    }
    const state = await complete(test.page, name);
    if (name === "webkit")
      report.cases.push({
        name: "webkit-completion-diagnostic",
        state,
        geometry,
      });
    assertSmoothProgress(state, name);
    if (name === "desktop") {
      assert.ok(
        state.spiderPhases.some(({ state }) => state === "swinging"),
        "initial intro uses real Spidey swing",
      );
      assert.ok(
        state.spiderPhases.some(({ state }) => state === "pulling"),
        "initial intro uses real cloth pull",
      );
      assert.equal(
        new URL(test.page.url()).pathname,
        "/",
        "intro handoff must not navigate",
      );
    }
    await test.page.waitForTimeout(900);
    if (name !== "webkit")
      await test.page.screenshot({ path: `${output}/${name}-hero.png` });
    assert.deepEqual(test.errors, [], `${name}: no page errors`);
    assert.ok(
      test.heroRequests() > 0,
      `${name}: a critical image request was intercepted`,
    );
    report.cases.push({
      name,
      viewport,
      geometry,
      state,
      ...(name === "webkit"
        ? {
            screenshot:
              "Skipped because Playwright's all-font readiness wait timed out; DOM geometry and lifecycle verified separately.",
          }
        : {}),
    });
    console.log(`${name}: responsive intro and reveal passed`);
  } finally {
    await test.close();
  }
}

async function lifecycleCases(browser) {
  for (const kind of [
    "fast",
    "failed-image",
    "stalled-image",
    "noncritical-image",
  ]) {
    if (!wants("lifecycle", kind)) continue;
    const test = await makePage(browser, {
      failHero: kind === "failed-image",
      holdHero: kind === "stalled-image",
      holdNoncritical: kind === "noncritical-image",
      ...(kind === "noncritical-image" ? { reducedMotion: "reduce" } : {}),
    });
    try {
      await test.page.goto(base, { waitUntil: "domcontentloaded" });
      const state = await complete(test.page, kind);
      if (kind !== "noncritical-image") assertSmoothProgress(state, kind);
      report.cases.push({
        name: `${kind}-phase-diagnostic`,
        state,
        warnings: test.warnings,
      });
      if (kind !== "noncritical-image")
        assert.ok(
          state.spiderPhases.some(({ state }) => state === "pulling"),
          `${kind}: actual Spidey cloth handoff required; ${JSON.stringify(state.spiderPhases)}`,
        );
      if (kind !== "noncritical-image")
        assert.equal(
          state.transitionResult,
          "complete",
          `${kind}: complete Spidey handoff without fallback`,
        );
      const completion = state.events.find(
        (event) => event.name === "portfolio:preloader-complete",
      ).at;
      const duration = completion - state.lockedAt;
      assert.ok(
        duration < 13000,
        `${kind}: bounded duration including existing Spidey flight, received ${duration}ms`,
      );
      const coveredAt = state.events.find(
        (event) => event.name === "portfolio:preloader-reveal",
      )?.at;
      if (kind === "stalled-image") {
        assert.ok(
          coveredAt - state.lockedAt >= 2400,
          `${kind}: critical deadline really exercised`,
        );
        assert.equal(
          await test.page
            .locator(".hero-portrait-frame img")
            .evaluate((image) => image.complete),
          false,
        );
      }
      if (kind === "noncritical-image")
        assert.ok(
          duration < 1600,
          `${kind}: nonessential images cannot hold intro`,
        );
      assert.deepEqual(test.errors, [], `${kind}: no page errors`);
      report.cases.push({ name: kind, duration, state });
      console.log(`${kind}: ${Math.round(duration)}ms, locks cleared`);
    } finally {
      await test.close();
    }
  }

  if (wants("lifecycle", "motion")) {
    const reduced = await makePage(browser, {
      reducedMotion: "reduce",
      holdHero: true,
    });
    try {
      await reduced.page.goto(base, { waitUntil: "domcontentloaded" });
      await reduced.page.waitForFunction(
        () => document.querySelector("[data-preloader-page]")?.inert,
      );
      const motion = await reduced.page.evaluate(
        () =>
          [...document.querySelectorAll(".site-preloader *")].filter(
            (element) => getComputedStyle(element).animationName !== "none",
          ).length,
      );
      assert.equal(motion, 0, "reduced motion: no decorative CSS animation");
      await reduced.page.screenshot({ path: `${output}/reduced-intro.png` });
      reduced.releaseHero();
      const state = await complete(reduced.page, "reduced-motion");
      report.cases.push({ name: "reduced-motion", state });
      assert.deepEqual(reduced.errors, []);
      console.log("reduced motion: static composition and short fade passed");
    } finally {
      await reduced.close();
    }

    const toggled = await makePage(browser, { holdHero: true });
    try {
      await toggled.page.goto(base, { waitUntil: "domcontentloaded" });
      await toggled.page.waitForFunction(
        () => document.querySelector("[data-preloader-page]")?.inert,
      );
      await toggled.page.emulateMedia({ reducedMotion: "reduce" });
      report.cases.push({
        name: "motion-preference-change",
        state: await complete(toggled.page, "motion-preference-change"),
      });
      console.log("motion preference change: released without getting stuck");
    } finally {
      await toggled.close();
    }
  }

  if (wants("lifecycle", "nojs")) {
    const nojs = await makePage(browser, { javaScriptEnabled: false });
    try {
      await nojs.page.goto(base, { waitUntil: "domcontentloaded" });
      assert.equal(
        await nojs.page.locator(".site-preloader").isVisible(),
        false,
      );
      assert.equal(await nojs.page.locator(".hero-name").isVisible(), true);
      assert.equal(
        await nojs.page.locator("[data-preloader-page]").getAttribute("inert"),
        null,
      );
      await nojs.page.screenshot({ path: `${output}/no-javascript.png` });
      report.cases.push({ name: "no-javascript", visible: true });
      console.log(
        "no JavaScript: server-rendered portfolio remains accessible",
      );
    } finally {
      await nojs.close();
    }
  }

  if (wants("lifecycle", "admin")) {
    for (const path of ["/secret-admin", "/secret-admin/login"]) {
      const test = await makePage(browser);
      try {
        await test.page.goto(`${base}${path}`, {
          waitUntil: "domcontentloaded",
        });
        await test.page.waitForTimeout(300);
        assert.equal(await test.page.locator(".site-preloader").count(), 0);
        assert.equal(
          await test.page.evaluate(() =>
            document.documentElement.classList.contains("portfolio-loading"),
          ),
          false,
        );
        report.cases.push({ name: `admin-excluded:${path}` });
        console.log(`${path}: no preloader`);
      } finally {
        await test.close();
      }
    }
  }

  if (wants("lifecycle", "navigation")) {
    const navigation = await makePage(browser);
    try {
      await navigation.page.goto(base, { waitUntil: "domcontentloaded" });
      const initial = await complete(navigation.page, "navigation-initial");
      await navigation.page.locator(".header-contact-link").click();
      await navigation.page.waitForURL((url) => url.pathname === "/contact");
      await navigation.page.waitForFunction(
        () =>
          !document.documentElement.classList.contains(
            "portfolio-transitioning",
          ),
      );
      await navigation.page.goBack();
      await navigation.page.waitForURL((url) => url.pathname === "/");
      await navigation.page.waitForFunction(
        () =>
          !document.documentElement.classList.contains(
            "portfolio-transitioning",
          ),
      );
      await navigation.page.goForward();
      await navigation.page.waitForURL((url) => url.pathname === "/contact");
      await navigation.page.waitForFunction(
        () =>
          !document.documentElement.classList.contains(
            "portfolio-transitioning",
          ),
      );
      const after = await navigation.page.evaluate(
        () => window.__preloaderTest,
      );
      assert.equal(
        after.documentToken,
        initial.documentToken,
        "internal navigation remains same document",
      );
      assert.equal(
        after.events.filter(
          (event) => event.name === "portfolio:preloader-complete",
        ).length,
        1,
        "navigation/back never replay intro",
      );
      assert.equal(await navigation.page.locator(".site-preloader").count(), 0);
      assert.deepEqual(navigation.errors, [], "navigation has no page errors");
      report.cases.push({ name: "navigation-back", state: after });
      console.log(
        "normal navigation and Back: no repeated intro or document reload",
      );
    } finally {
      await navigation.close();
    }
  }

  if (wants("repeat", "timing")) {
    let test;
    const repeats = chosen.has("timing") && !chosen.has("repeat") ? 1 : 5;
    try {
      for (let index = 0; index < repeats; index += 1) {
        if (index < 3) {
          await test?.close();
          test = await makePage(browser);
          await test.page.goto(base, { waitUntil: "domcontentloaded" });
        } else {
          await test.page.reload({ waitUntil: "domcontentloaded" });
        }
        const name = `repeat-${index + 1}-${index < 3 ? "fresh-context" : "reload"}`;
        const state = await complete(test.page, name);
        assertSmoothProgress(state, name);
        assert.ok(
          state.spiderPhases.some(({ state }) => state === "swinging"),
          `${name}: actual Spidey swing required`,
        );
        assert.ok(
          state.spiderPhases.some(({ state }) => state === "pulling"),
          `${name}: actual cloth pull required`,
        );
        assert.equal(
          state.transitionResult,
          "complete",
          `${name}: no transition fallback`,
        );
        await verifyDither(test.page, name, index === repeats - 1);
        assert.deepEqual(test.errors, [], `${name}: no page errors`);
        const countingMs =
          state.progress.find(({ value }) => Number.parseInt(value, 10) === 100)
            .at - state.bootstrapAt;
        report.cases.push({ name, state, countingMs, warnings: test.warnings });
        console.log(
          `${name}: full Spidey handoff passed; counting ${Math.round(countingMs)}ms`,
        );
      }
    } finally {
      await test?.close();
    }
  }
}

await mkdir(output, { recursive: true });
try {
  for (const engineName of selected) {
    let browser;
    try {
      browser = await engines[engineName].launch({
        headless: true,
        timeout: 30000,
      });
      if (engineName === "chromium") {
        for (const [name, width, height] of [
          ["desktop", 1440, 900],
          ["phone", 390, 844],
          ["small-phone", 320, 568],
          ["tablet", 768, 1024],
          ["landscape", 844, 390],
          ["large", 2560, 1440],
        ])
          if (wants("responsive", name))
            await screenshotCase(browser, name, { width, height });
        await lifecycleCases(browser);
      } else {
        if (wants("responsive", engineName))
          await screenshotCase(browser, engineName, {
            width: 1440,
            height: 900,
          });
      }
    } finally {
      await browser?.close();
    }
  }
} catch (error) {
  report.errors.push(error.stack || String(error));
  throw error;
} finally {
  await writeFile(
    `${output}/report${only ? `-${only}-${selected.join("-")}` : ""}.json`,
    JSON.stringify(report, null, 2),
  );
}
