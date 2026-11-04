/** Run after local browser access is approved. Uses an existing Playwright install.
 * SPIDER_BASE_URL=http://localhost:3000
 * SPIDER_PLAYWRIGHT_MODULE=C:/path/to/playwright-core/index.mjs (optional)
 */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = process.env.SPIDER_PLAYWRIGHT_MODULE;
const { chromium } = await import(
  modulePath ? pathToFileURL(modulePath).href : "playwright-core"
);
const base = process.env.SPIDER_BASE_URL || "http://localhost:3000";
const output = path.resolve(".next/spider-verification");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function settled(page) {
  await page.waitForFunction(
    () => !document.documentElement.dataset.spiderTransition,
    { timeout: 16000 },
  );
  assert.equal(
    await page.locator("[data-transition-page]").evaluate((node) => node.inert),
    false,
  );
  assert.equal(
    await page.locator(".spider-transition").evaluate((node) => node.hidden),
    true,
  );
  assert.equal(await page.locator(".site-preloader").count(), 0);
}

try {
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["tablet", { width: 820, height: 1180 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport });
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("console", (message) => {
      if (message.text().includes("[Spider transition]"))
        failures.push(message.text());
    });
    await page.goto(`${base}/about`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page
      .getByRole("navigation", { name: "Primary Navigation" })
      .getByRole("link", { name: /Contact/i })
      .click();
    // Require a real cloth flight: native fallback must not falsely pass this test.
    await page.waitForFunction(
      () => document.documentElement.dataset.spiderTransition === "pulling",
      { timeout: 12000 },
    );
    await page.screenshot({ path: path.join(output, `${name}-cloth.png`) });
    await page.waitForURL("**/contact");
    await settled(page);
    assert.match(await page.locator("main h1").innerText(), /mission/i);
    assert.equal(
      await page.evaluate(() => document.activeElement?.tagName),
      "H1",
    );
    await page.screenshot({
      path: path.join(output, `${name}-destination.png`),
    });
    await page.goBack();
    await page.waitForURL("**/about");
    await settled(page);
    await page.goForward();
    await page.waitForURL("**/contact");
    await settled(page);
    assert.deepEqual(failures, [], `${name} runtime failures`);
    await page.close();
    console.log(`${name}: menu, cloth, focus, Back/Forward passed`);
  }

  const reduced = await browser.newPage({ reducedMotion: "reduce" });
  await reduced.goto(`${base}/about`, { waitUntil: "networkidle" });
  await reduced.locator("a.header-contact-link").click();
  await reduced.waitForURL("**/contact");
  await settled(reduced);
  await reduced.close();

  const noGL = await browser.newPage();
  await noGL.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes("webgl") ? null : original.call(this, type, ...args);
    };
  });
  await noGL.goto(`${base}/about`, { waitUntil: "networkidle" });
  await noGL.locator("a.header-contact-link").click();
  await noGL.waitForURL("**/contact");
  await settled(noGL);
  await noGL.close();
  console.log("Reduced-motion and unavailable-WebGL navigation passed");
} finally {
  await browser.close();
}
