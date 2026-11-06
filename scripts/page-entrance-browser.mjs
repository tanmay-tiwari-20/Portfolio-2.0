/** Regression for hero entrances replaying after the route transition.
 * Run against a running app with SPIDER_BASE_URL (default http://localhost:3000).
 * SPIDER_PLAYWRIGHT_MODULE and SPIDER_BROWSER_EXECUTABLE are optional paths.
 * SPIDER_ENTRANCE_CASE=about runs initial entry, revisit, restored scroll and writing.
 */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const modulePath = process.env.SPIDER_PLAYWRIGHT_MODULE;
const { chromium } = await import(
  modulePath ? pathToFileURL(modulePath).href : "playwright-core"
);
const base = process.env.SPIDER_BASE_URL || "http://localhost:3000";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.SPIDER_BROWSER_EXECUTABLE
    ? { executablePath: process.env.SPIDER_BROWSER_EXECUTABLE }
    : {}),
});

function instrument() {
  const selectors = {
    "/": "[data-home-hero] .hero-kicker, [data-home-hero] .hero-name-line, [data-home-hero] .hero-manifesto, [data-home-hero] .hero-lede, [data-home-hero] .hero-actions, [data-home-hero] .hero-portrait-container, [data-home-hero] .hero-metrics-strip",
    "/about":
      ".about-hero [data-about-kicker], .about-hero [data-about-intro], .about-hero [data-about-visual], [data-about-details] [data-about-heading], [data-about-details] [data-about-reveal], [data-about-details] [data-about-experience]",
    "/contact": "[data-contact-line], [data-contact-intro]",
    "/hackshastra": "[data-hackshastra-intro]",
    "/hackathons": "[data-hk-intro]",
    "/projects": '[data-work-reveal="hero"]',
  };
  const data = (window.__pageEntrance = {
    documentToken: Math.random().toString(36),
    armed: null,
    report: null,
    initialEntranceObserved: false,
  });
  const read = (element) => {
    const style = getComputedStyle(element);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return {
      opacity: Number(style.opacity),
      visibility: style.visibility,
      transform: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
    };
  };
  const phase = () => document.documentElement.dataset.spiderTransition;
  const recordSignature = () => {
    const armed = data.armed;
    if (armed?.path !== "/about" || location.pathname !== "/about") return;
    const root = document.querySelector(".about-hero [data-signature-state]");
    if (!root) return;
    const signature = armed.signature;
    const state = root.dataset.signatureState;
    const covered =
      Boolean(phase()) ||
      document.documentElement.classList.contains("portfolio-transitioning") ||
      !document.querySelector(".spider-transition").hidden;
    const now = performance.now();
    if (signature.states.at(-1)?.state !== state)
      signature.states.push({ state, at: now, covered });
    const pen = root.querySelector("[data-writing-pen]");
    const transform = pen?.getAttribute("transform");
    if (
      state === "drawing" &&
      transform &&
      Number(getComputedStyle(pen).opacity) > 0
    ) {
      if (covered) signature.penMovedWhileCovered = true;
      if (
        signature.positions.length < 20 &&
        signature.positions.at(-1)?.transform !== transform
      )
        signature.positions.push({ transform, at: now, covered });
    }
  };
  const observeInitialEntrance = () => {
    if (data.armed) return;
    const title = document.querySelector(".about-hero h1");
    if (title && Number(getComputedStyle(title).opacity) < 0.99)
      data.initialEntranceObserved = true;
    requestAnimationFrame(observeInitialEntrance);
  };
  requestAnimationFrame(observeInitialEntrance);
  new MutationObserver(() => {
    if (!data.armed) return;
    const value = phase() || "idle";
    if (data.armed.phases.at(-1) !== value) data.armed.phases.push(value);
    recordSignature();
  }).observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "data-spider-transition",
      "data-signature-state",
      "transform",
    ],
  });
  window.addEventListener("portfolio:transition-end", () => {
    const armed = data.armed;
    if (!armed || armed.path !== location.pathname || data.report) return;
    const targets = [...document.querySelectorAll(selectors[armed.path])]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < innerHeight && rect.width > 0;
      })
      .map((element) => ({ element, initial: read(element) }));
    const report = (data.report = {
      path: armed.path,
      targetCount: targets.length,
      frames: 0,
      failures: [],
      signatureState: document.querySelector("[data-signature-state]")?.dataset
        .signatureState,
      transitionEndedAt: performance.now(),
      done: false,
    });
    recordSignature();
    const started = performance.now();
    const failed = new Set();
    const sample = () => {
      report.frames++;
      targets.forEach(({ element, initial }, index) => {
        const current = read(element);
        const moved = current.transform.some(
          (value, component) =>
            Math.abs(value - initial.transform[component]) > 0.1,
        );
        if (
          !failed.has(index) &&
          (!element.isConnected ||
            current.opacity < initial.opacity - 0.01 ||
            current.visibility !== "visible" ||
            moved)
        ) {
          failed.add(index);
          report.failures.push({
            target: element.textContent?.trim().slice(0, 80),
            initial,
            current,
            connected: element.isConnected,
          });
        }
      });
      if (performance.now() - started < 1800) requestAnimationFrame(sample);
      else report.done = true;
    };
    requestAnimationFrame(sample);
  });
}

async function arm(page, path) {
  await page.evaluate((destination) => {
    window.__pageEntrance.armed = {
      path: destination,
      phases: [],
      signature: { states: [], positions: [], penMovedWhileCovered: false },
    };
    window.__pageEntrance.report = null;
  }, path);
}

async function verify(page, path, documentToken, requireWriting = false) {
  await page.waitForURL((url) => url.pathname === path);
  await page.waitForFunction(() => window.__pageEntrance.report?.done);
  const result = await page.evaluate(() => ({
    ...window.__pageEntrance.report,
    phases: window.__pageEntrance.armed.phases,
    documentToken: window.__pageEntrance.documentToken,
    inert: document.querySelector("[data-transition-page]").inert,
    covered: !document.querySelector(".spider-transition").hidden,
  }));
  assert.equal(
    result.documentToken,
    documentToken,
    `${path}: document reloaded`,
  );
  assert.ok(
    result.phases.includes("pulling"),
    `${path}: real route flight required`,
  );
  assert.ok(
    result.targetCount > 0,
    `${path}: missing visible animation targets`,
  );
  assert.ok(
    result.frames > 15,
    `${path}: insufficient animation frames sampled`,
  );
  assert.equal(result.inert, false, `${path}: page remained inert`);
  assert.equal(result.covered, false, `${path}: overlay remained visible`);
  assert.deepEqual(
    result.failures,
    [],
    `${path}: visible content replayed its entrance`,
  );
  if (path === "/about") {
    const cachedComplete =
      !requireWriting && result.signatureState === "complete";
    if (!cachedComplete) {
      await page.waitForFunction(
        () =>
          document.querySelector(".about-hero [data-signature-state]")?.dataset
            .signatureState === "complete",
      );
      const signature = await page.evaluate(
        () => window.__pageEntrance.armed.signature,
      );
      assert.deepEqual(
        signature.states.map(({ state }) => state),
        ["waiting", "drawing", "complete"],
        "About signature must draw after arrival",
      );
      const drawing = signature.states.find(({ state }) => state === "drawing");
      assert.ok(
        drawing.at >= result.transitionEndedAt && !drawing.covered,
        "Signature writing must begin after the transition cover clears",
      );
      assert.ok(
        signature.positions.length > 1,
        "The writing pen must visibly move",
      );
      assert.ok(
        signature.positions[0].at >= result.transitionEndedAt,
        "The pen must remain still until the transition ends",
      );
      assert.equal(
        signature.penMovedWhileCovered,
        false,
        "The pen must never draw behind the transition cover",
      );
      console.log(
        "About signature: waiting → drawing after transition → complete; moving pen verified",
      );
    } else {
      console.log("About history restore: completed signature preserved");
    }
  }
  console.log(
    `${path}: ${result.targetCount} targets stayed visible and still across ${result.frames} frames`,
  );
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  page.setDefaultTimeout(30000);
  await page.addInitScript(instrument);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.text().includes("[Spider transition]"))
      errors.push(message.text());
  });
  // Only external image bytes are stubbed; React routing, capture, WebGL and
  // page animation code all run normally against the local app.
  await page.route(
    /^https:\/\/(res\.cloudinary\.com|images\.unsplash\.com)\//,
    (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        headers: { "access-control-allow-origin": "*" },
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#283d55"/></svg>',
      }),
  );
  await page.goto(`${base}/about`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelector(".spider-transition__freeze")?.shadowRoot,
  );
  const documentToken = await page.evaluate(
    () => window.__pageEntrance.documentToken,
  );
  await page.waitForFunction(
    () =>
      document.querySelector(".about-page")?.dataset.aboutEntranceComplete ===
      "true",
  );
  assert.equal(
    await page.evaluate(() => window.__pageEntrance.initialEntranceObserved),
    true,
    "A direct About load must retain its original entrance",
  );
  console.log("Direct About load: original hero entrance preserved");
  await page.waitForFunction(
    () =>
      document.querySelector(".about-hero [data-signature-state]")?.dataset
        .signatureState === "complete",
  );

  const destinations =
    process.env.SPIDER_ENTRANCE_CASE === "about"
      ? ["/contact"]
      : ["/contact", "/hackshastra", "/hackathons", "/", "/projects"];
  for (const path of destinations) {
    await arm(page, path);
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page
      .locator(`nav[aria-label="Primary Navigation"] a[href="${path}"]`)
      .click();
    await verify(page, path, documentToken);
  }

  // Return through history to the original document route, then move forward.
  // Matching the initial pathname must never re-enable the initial entrance.
  for (const path of [...destinations.slice(0, -1).reverse(), "/about"]) {
    await arm(page, path);
    await page.goBack();
    await verify(page, path, documentToken);
  }
  // Save a non-hero viewport before leaving again. Restoring it must not hide
  // and replay the detail text after the transition exposes the section.
  await page.locator("#community").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const heading = document.querySelector("#community-title");
    return heading && Number(getComputedStyle(heading).opacity) > 0.99;
  });
  const restoredY = await page.evaluate(() => scrollY);
  assert.ok(restoredY > 100, "A scrolled About position is required");
  await arm(page, "/contact");
  await page.goForward();
  await verify(page, "/contact", documentToken);
  await arm(page, "/about");
  await page.goBack();
  await verify(page, "/about", documentToken);
  const actualY = await page.evaluate(() => scrollY);
  assert.ok(
    Math.abs(actualY - restoredY) < 2,
    `About scroll restored from ${restoredY} to ${actualY}`,
  );
  // A fresh link arrival must run the original pen-writing animation, even
  // when returning to the document's initial route through history was cached.
  for (const path of ["/contact", "/about"]) {
    await arm(page, path);
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page
      .locator(`nav[aria-label="Primary Navigation"] a[href="${path}"]`)
      .click();
    await verify(page, path, documentToken, path === "/about");
  }
  assert.deepEqual(errors, [], "Unexpected browser or transition errors");
} finally {
  await browser.close();
}
