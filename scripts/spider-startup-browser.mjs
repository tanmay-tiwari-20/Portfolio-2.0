/** First-navigation regression against a running app, with a deliberately slow RSC response.
 * SPIDER_PLAYWRIGHT_MODULE=C:/path/to/playwright-core/index.mjs (optional)
 * SPIDER_BASE_URL=http://localhost:3000; SPIDER_BROWSER_EXECUTABLE is optional.
 * Headless frame timings describe this host, not physical mobile performance.
 */
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
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
const failures = [];
const networkFailures = [];
const selectedCase = process.env.SPIDER_STARTUP_CASE;

function instrumentation() {
  const data = (window.__spiderStartup = {
    phases: [],
    frames: [],
    events: [],
  });
  const phase = () =>
    document.documentElement?.dataset.spiderTransition || "idle";
  new MutationObserver(() => {
    const value = phase();
    if (data.phases.at(-1)?.phase !== value)
      data.phases.push({
        phase: value,
        at: performance.now(),
        path: location.pathname,
      });
  }).observe(document, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-spider-transition"],
  });
  for (const name of [
    "resize",
    "pagehide",
    "portfolio:transition-start",
    "portfolio:transition-end",
  ])
    window.addEventListener(name, () =>
      data.events.push({
        name,
        at: performance.now(),
        phase: phase(),
        width: innerWidth,
        height: innerHeight,
      }),
    );
  document.addEventListener("visibilitychange", () =>
    data.events.push({
      name: "visibilitychange",
      at: performance.now(),
      phase: phase(),
      hidden: document.hidden,
    }),
  );
  let previous;
  function sample(now) {
    const visible = ["swinging", "holding", "pulling"].includes(phase());
    if (visible && previous !== undefined) data.frames.push(now - previous);
    previous = visible ? now : undefined;
    requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
}

async function makePage(viewport) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(25000);
  await page.addInitScript(instrumentation);
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("requestfailed", (request) =>
    networkFailures.push({
      viewport,
      url: request.url(),
      error: request.failure()?.errorText,
    }),
  );
  page.on("console", (message) => {
    if (message.text().includes("[Spider transition]")) {
      failures.push(message.text());
      console.error(message.text());
    }
  });
  // Keep this routing/animation regression independent of third-party image
  // availability (sandboxed hosts can block Cloudinary's capture fetch). The
  // actual DOM freeze, rasterization, WebGL scene and local RSC requests run.
  await page.route(
    /^https:\/\/(res\.cloudinary\.com|images\.unsplash\.com)\//,
    (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        headers: { "access-control-allow-origin": "*" },
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#283d55"/><circle cx="600" cy="400" r="240" fill="#b12836"/></svg>',
      }),
  );
  // Install before loading the source so automatic Next prefetches are gated too.
  // No pointerover or fixed idle warmup precedes the first navigation.
  let release;
  let intercepted = false;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/contact?*", async (route) => {
    if (route.request().headers().rsc !== "1") return route.continue();
    intercepted = true;
    await gate;
    if (!page.isClosed()) await route.continue();
  });
  await page.goto(`${base}/about`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelector(".spider-transition__freeze")?.shadowRoot,
  );
  return { page, release, intercepted: () => intercepted };
}

async function click(page, target) {
  await page.evaluate((href) => {
    const anchor = [...document.querySelectorAll("a[href]")].find(
      (node) => node.getAttribute("href") === href,
    );
    if (!anchor) throw new Error(`Missing existing navigation link: ${href}`);
    anchor.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true,
      }),
    );
  }, target);
}

async function assertPreparing(page) {
  await page.waitForFunction(
    () => document.documentElement.dataset.spiderTransition === "capturing",
  );
  assert.deepEqual(
    await page.evaluate(() => ({
      hidden: document.querySelector(".spider-transition").hidden,
      canvas: getComputedStyle(
        document.querySelector(".spider-transition__canvas"),
      ).visibility,
      preview:
        document.querySelector(".spider-transition__freeze").shadowRoot
          .childNodes.length > 0,
      inert: document.querySelector("[data-transition-page]").inert,
      began: window.__spiderStartup.phases.some((entry) =>
        ["swinging", "holding", "pulling"].includes(entry.phase),
      ),
    })),
    {
      hidden: false,
      canvas: "hidden",
      preview: true,
      inert: true,
      began: false,
    },
  );
}

async function settled(page) {
  await page.waitForFunction(
    () => !document.documentElement.dataset.spiderTransition,
  );
  assert.deepEqual(
    await page.evaluate(() => ({
      hidden: document.querySelector(".spider-transition").hidden,
      inert: document.querySelector("[data-transition-page]").inert,
      preview: document.querySelector(".spider-transition__freeze").shadowRoot
        .childNodes.length,
    })),
    { hidden: true, inert: false, preview: 0 },
  );
}

async function diagnose(page, name) {
  const data = await page
    .evaluate(() => ({
      ...window.__spiderStartup,
      frames: {
        count: window.__spiderStartup.frames.length,
        max: Math.max(0, ...window.__spiderStartup.frames),
      },
      current: document.documentElement.dataset.spiderTransition || "idle",
      path: location.pathname,
      hidden: document.querySelector(".spider-transition").hidden,
      inert: document.querySelector("[data-transition-page]").inert,
      visibility: document.visibilityState,
    }))
    .catch((error) => ({ unavailable: error.message }));
  console.error(
    JSON.stringify({ name, failures, networkFailures, diagnostics: data }),
  );
}

try {
  for (const { name, viewport, delayMs } of [
    {
      name: "cold-desktop",
      viewport: { width: 1440, height: 900 },
      delayMs: 0,
    },
    {
      name: "delayed-desktop",
      viewport: { width: 1440, height: 900 },
      delayMs: 4000,
    },
    {
      name: "delayed-mobile",
      viewport: { width: 390, height: 844 },
      delayMs: 4000,
    },
  ]) {
    if (selectedCase && selectedCase !== name) continue;
    const test = await makePage(viewport);
    try {
      if (!delayMs) test.release();
      await click(test.page, "/contact");
      let releasedAt = 0;
      if (delayMs) {
        await assertPreparing(test.page);
        // Intentional network latency reproduces the old 4–5 second left-edge hold.
        await delay(delayMs);
        assert.ok(
          test.intercepted(),
          "The destination RSC response must be blocked",
        );
        await assertPreparing(test.page);
        releasedAt = await test.page.evaluate(() => performance.now());
        test.release();
      }
      await test.page.waitForFunction(() =>
        window.__spiderStartup.phases.some(
          (entry) => entry.phase === "pulling",
        ),
      );
      await test.page.waitForURL("**/contact");
      await settled(test.page);
      const { phases, frames } = await test.page.evaluate(
        () => window.__spiderStartup,
      );
      assert.deepEqual(
        phases.map((entry) => entry.phase),
        ["capturing", "swinging", "pulling", "idle"],
      );
      const start = phases[1],
        end = phases[3];
      assert.ok(
        start.at >= releasedAt,
        "Visible flight must wait for the destination",
      );
      assert.equal(
        start.path,
        "/contact",
        "Destination commit precedes the swing",
      );
      const duration = end.at - start.at;
      assert.ok(
        duration >= 4000 && duration < 5500,
        `Uninterrupted flight took ${duration.toFixed(0)} ms`,
      );
      assert.ok(frames.length > 30, "A real rendered flight is required");
      assert.ok(
        Math.max(...frames) < 1000,
        "Visible flight must not freeze for a second",
      );
      console.log(
        JSON.stringify({
          name,
          viewport,
          delayMs,
          flightMs: Math.round(duration),
          maxFrameMs: Math.round(Math.max(...frames)),
          phases: phases.map((entry) => entry.phase),
        }),
      );
    } catch (error) {
      await diagnose(test.page, name);
      throw error;
    } finally {
      test.release();
      await test.page.close();
    }
  }

  for (const action of ["Escape", "replacement navigation"]) {
    if (selectedCase && selectedCase !== action) continue;
    const test = await makePage({ width: 1440, height: 900 });
    try {
      await click(test.page, "/contact");
      await assertPreparing(test.page);
      if (action === "Escape") await test.page.keyboard.press("Escape");
      else await click(test.page, "/projects");
      await settled(test.page);
      test.release();
      await test.page.waitForURL(
        action === "Escape" ? "**/contact" : "**/projects",
      );
      await settled(test.page);
      // Let queued readiness callbacks run; they must not revive the aborted flight.
      await test.page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const phases = await test.page.evaluate(() =>
        window.__spiderStartup.phases.map((entry) => entry.phase),
      );
      assert.deepEqual(
        phases,
        ["capturing", "idle"],
        `${action} revived an aborted flight`,
      );
      console.log(
        `${action}: preparation canceled, destination retained, overlay released`,
      );
    } catch (error) {
      await diagnose(test.page, action);
      throw error;
    } finally {
      test.release();
      await test.page.close();
    }
  }
  assert.deepEqual(failures, [], "Unexpected transition or browser errors");
} finally {
  await browser.close();
}
