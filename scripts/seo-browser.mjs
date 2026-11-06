/** Production-browser SEO regression. Fixtures isolate rendering from CDN access;
 * they are never suitable for Lighthouse or Core Web Vitals measurements.
 * SEO_BASE_URL defaults to http://localhost:3138.
 * SPIDER_PLAYWRIGHT_MODULE and SPIDER_BROWSER_EXECUTABLE select installed tools.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.SPIDER_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.SPIDER_PLAYWRIGHT_MODULE).href : "playwright-core");
const base = process.env.SEO_BASE_URL || "http://localhost:3138";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.SPIDER_BROWSER_EXECUTABLE
    ? { executablePath: process.env.SPIDER_BROWSER_EXECUTABLE } : {}),
});
const report = {
  base, browser: browser.version(), auditedAt: new Date().toISOString(),
  localBuildId: await readFile(".next/BUILD_ID", "utf8").then((value) => value.trim()).catch(() => null),
  environment: "Local production build, headless Chrome. CDN images replaced by SVG fixtures because live network access is unavailable. Functional checks only; no performance scores or field Core Web Vitals claims.",
  pages: [], interactive: [], errors: [],
};
const imageFixture = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#263442"/><circle cx="600" cy="450" r="250" fill="#ca5146"/></svg>';
async function fixtures(context) {
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["res.cloudinary.com", "images.unsplash.com"].includes(url.hostname) || url.pathname === "/_next/image") {
      return route.fulfill({ contentType: "image/svg+xml", headers: { "access-control-allow-origin": "*" }, body: imageFixture });
    }
    if (url.origin !== new URL(base).origin) return route.abort();
    return route.continue();
  });
}
try {
  const xml = await (await fetch(`${base}/sitemap.xml`)).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  assert.ok(paths.length >= 6);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, javaScriptEnabled: false });
    await fixtures(context);
    const page = await context.newPage();
    for (const path of paths) {
      const response = await page.goto(`${base}${path}`, { waitUntil: "load" });
      const result = await page.evaluate(() => {
        const main = document.querySelector("main");
        const h1s = [...(main?.querySelectorAll("h1") || [])];
        return {
          path: location.pathname,
          title: document.title,
          h1: h1s.map((h) => ({ text: h.textContent.trim(), visible: getComputedStyle(h).display !== "none" && getComputedStyle(h).visibility !== "hidden" && +getComputedStyle(h).opacity > 0 })),
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          textLength: main?.textContent.trim().length || 0,
          width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          missingAlt: [...document.images].filter((image) => !image.hasAttribute("alt")).length,
          links: [...(main?.querySelectorAll("a[href]") || [])].length,
        };
      });
      report.pages.push({ viewport, status: response.status(), ...result });
      assert.equal(response.status(), 200, path);
      assert.equal(result.h1.length, 1, `${path}: one primary heading`);
      assert.ok(result.h1[0].visible, `${path}: heading visible without JavaScript`);
      assert.ok(result.textLength > 150, `${path}: meaningful server-rendered content`);
      assert.equal(result.missingAlt, 0, `${path}: every image has alt`);
      assert.ok(result.scrollWidth <= result.width + 2, `${path}: horizontal overflow ${result.scrollWidth}/${result.width}`);
    }
    await context.close();

    const live = await browser.newContext({ viewport });
    await fixtures(live);
    const interactive = await live.newPage();
    interactive.on("pageerror", (error) => report.errors.push({ viewport, message: error.message }));
    await interactive.addInitScript(() => {
      window.__transitionContexts = 0;
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        if (String(kind).includes("webgl") && this.classList.contains("spider-transition__canvas")) window.__transitionContexts++;
        return original.call(this, kind, ...args);
      };
    });
    await interactive.goto(base, { waitUntil: "load" });
    await interactive.waitForFunction(() => document.querySelector(".spider-transition__freeze")?.shadowRoot);
    await interactive.waitForTimeout(2500);
    assert.equal(await interactive.evaluate(() => window.__transitionContexts), 0, "No speculative transition WebGL on page load");
    assert.equal(await interactive.locator(".site-preloader").count(), 0);
    const portrait = await interactive.locator(".hero-portrait-frame > img").evaluate((image) => ({ alt: image.alt, sizes: image.sizes, currentSrc: image.currentSrc }));
    assert.ok(portrait.alt && portrait.sizes);
    await interactive.emulateMedia({ reducedMotion: "reduce" });
    await interactive.locator('a[href="/contact"]:visible').first().click();
    await interactive.waitForURL("**/contact");
    assert.equal(await interactive.locator(".spider-transition").evaluate((node) => node.hidden), true);
    assert.equal(await interactive.locator("[data-transition-page]").evaluate((node) => node.inert), false);
    await interactive.emulateMedia({ reducedMotion: "no-preference" });
    await interactive.getByRole("button", { name: "Open navigation menu" }).click();
    await interactive.getByRole("navigation", { name: "Primary Navigation" }).getByRole("link", { name: /About/i }).click();
    await interactive.waitForFunction(() => document.documentElement.dataset.spiderTransition === "pulling", null, { timeout: 20000 });
    await interactive.waitForURL("**/about");
    await interactive.waitForFunction(() => !document.documentElement.dataset.spiderTransition);
    assert.equal(await interactive.locator(".spider-transition").evaluate((node) => node.hidden), true);
    assert.equal(await interactive.locator("[data-transition-page]").evaluate((node) => node.inert), false);
    assert.equal(await interactive.evaluate(() => document.activeElement?.tagName), "H1");
    report.interactive.push({ viewport, portrait, initialTransitionContexts: 0, reducedMotionNavigation: "passed", fullSpiderTransition: "passed", focusAfterNavigation: "H1" });
    await live.close();
  }
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  console.log(JSON.stringify({ pages: report.pages.length, interactive: report.interactive.length, errors: report.errors }));
} catch (error) {
  report.failure = error.stack || error.message;
  throw error;
} finally {
  await browser.close();
  await mkdir("artifacts/seo", { recursive: true });
  await writeFile("artifacts/seo/browser-report.json", JSON.stringify(report, null, 2));
}
