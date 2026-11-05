/** Browser verification against an already running local site.
 * HACKATHONS_BASE_URL=http://localhost:3000
 * HACKATHONS_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs (optional)
 * HACKATHONS_BROWSER_EXECUTABLE=/absolute/path/to/chrome (optional)
 * Screenshots and measured section sizes: .next/hackathons-verification/
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = process.env.HACKATHONS_PLAYWRIGHT_MODULE;
const { chromium } = await import(
  modulePath ? pathToFileURL(modulePath).href : "playwright"
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.HACKATHONS_BROWSER_EXECUTABLE
    ? { executablePath: process.env.HACKATHONS_BROWSER_EXECUTABLE }
    : {}),
});
const base = process.env.HACKATHONS_BASE_URL || "http://localhost:3000";
const output = path.resolve(".next/hackathons-verification");
await mkdir(output, { recursive: true });
const measurements = [];
const networkLimitations = [];
const allowBlockedImages = process.env.HACKATHONS_ALLOW_BLOCKED_IMAGES === "1";

async function settled(page) {
  await page.waitForFunction(
    () =>
      !document.documentElement.dataset.spiderTransition &&
      !document.documentElement.classList.contains("portfolio-loading") &&
      !document.documentElement.classList.contains("portfolio-transitioning"),
    { timeout: 25000 },
  );
  await page.waitForFunction(
    () =>
      document.querySelector(".hackathons-page")?.dataset.hackathonsMotion !==
      undefined,
    { timeout: 20000 },
  );
  await page.evaluate(() => document.fonts.ready);
}

async function layout(page, name) {
  const result = await page.evaluate(() => {
    const root = document.querySelector(".hackathons-page");
    const outliers = [...root.querySelectorAll("h1,h2,h3,p,button,a")]
      .filter((element) => {
        if (!element.getClientRects().length || element.closest("[hidden]"))
          return false;
        const rect = element.getBoundingClientRect();
        return (
          rect.left < -1 ||
          rect.right > innerWidth + 1 ||
          element.scrollWidth > element.clientWidth + 2
        );
      })
      .map(
        (element) =>
          `${element.tagName}.${element.className}: ${element.textContent?.trim().slice(0, 80)}`,
      );
    const sections = [...root.querySelectorAll(".hk-screen")].map(
      (element) => ({
        id: element.id,
        height: Math.round(element.getBoundingClientRect().height),
        screens: +(
          element.getBoundingClientRect().height / innerHeight
        ).toFixed(2),
      }),
    );
    const missingAnchors = [...root.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute("href"))
      .filter((href) => !document.getElementById(href.slice(1)));
    return {
      viewport: [innerWidth, innerHeight],
      width: document.documentElement.scrollWidth,
      outliers,
      sections,
      missingAnchors,
    };
  });
  measurements.push({ name, ...result });
  assert.ok(
    result.width <= result.viewport[0] + 1,
    `${name}: horizontal page overflow`,
  );
  assert.deepEqual(
    result.outliers,
    [],
    `${name}: clipped or overflowing content`,
  );
  assert.deepEqual(
    result.missingAnchors,
    [],
    `${name}: broken chapter anchors`,
  );
}

try {
  for (const [name, width, height] of [
    ["small-mobile", 320, 568],
    ["mobile", 390, 844],
    ["tablet", 768, 1024],
    ["small-laptop", 1024, 768],
    ["laptop", 1366, 768],
    ["desktop", 1440, 900],
    ["large-desktop", 1920, 1080],
    ["ultrawide", 2560, 1440],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const blockedImages = new Set();
    page.on("requestfailed", (request) => {
      if (
        request.resourceType() === "image" &&
        request.failure()?.errorText === "net::ERR_NETWORK_ACCESS_DENIED"
      )
        blockedImages.add(request.url());
    });
    await page.goto(`${base}/hackathons`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await settled(page);
    assert.equal(await page.locator(".hackathons-page h1").count(), 1);
    for (const section of await page.locator(".hk-screen").all()) {
      await section.scrollIntoViewIfNeeded();
      await section
        .locator("img")
        .evaluateAll((images) =>
          Promise.all(images.map((image) => image.decode().catch(() => {}))),
        );
    }
    await layout(page, name);
    const broken = await page
      .locator(".hackathons-page img")
      .evaluateAll((images) =>
        images
          .filter((image) => !image.complete || image.naturalWidth === 0)
          .map((image) => image.currentSrc),
      );
    if (broken.length)
      await page.screenshot({
        path: path.join(output, `${name}-image-failure.png`),
        fullPage: true,
      });
    if (
      broken.length &&
      allowBlockedImages &&
      broken.every((url) => blockedImages.has(url))
    ) {
      networkLimitations.push({
        viewport: name,
        reason: "Sandbox denied image network access",
        images: broken,
      });
    } else assert.deepEqual(broken, [], `${name}: unloaded images`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: path.join(output, `${name}-full.png`),
      fullPage: true,
    });
    if (name === "mobile" || name === "desktop") {
      for (const section of ["hk-top", "hk-judging", "hk-archive"]) {
        const target = page.locator(`#${section}`);
        await target.scrollIntoViewIfNeeded();
        await target.screenshot({
          path: path.join(output, `${name}-${section}.png`),
        });
      }
    }
    const archive = page.locator("#hk-archive");
    await archive.getByRole("button", { name: "Judging", exact: true }).click();
    assert.deepEqual(
      await archive.locator(".hk-event-role").allTextContents(),
      ["Judge", "Judge"],
    );
    await archive.locator(".hk-event-toggle").first().focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await archive
        .locator(".hk-event-toggle")
        .first()
        .getAttribute("aria-expanded"),
      "true",
    );
    await archive
      .getByRole("button", { name: "Mentoring", exact: true })
      .click();
    assert.ok(
      (await archive.locator(".hk-event-role").allTextContents()).every(
        (role) => role === "Mentor",
      ),
    );
    await archive.getByRole("button", { name: "All experiences" }).click();
    await archive
      .getByRole("button", { name: "Next events", exact: true })
      .click();
    assert.match(
      await archive.locator(".hk-archive-pagination").innerText(),
      /Page 2/i,
    );
    await archive
      .getByRole("button", { name: "Previous events", exact: true })
      .click();
    const photoBefore = await archive
      .locator(".hk-journal-photo img")
      .getAttribute("src");
    await archive
      .getByRole("button", { name: "Next journal photograph" })
      .click();
    assert.notEqual(
      await archive.locator(".hk-journal-photo img").getAttribute("src"),
      photoBefore,
    );
    await archive
      .getByRole("button", { name: "Previous journal photograph" })
      .click();
    assert.equal(
      await archive.locator(".hk-journal-photo img").getAttribute("src"),
      photoBefore,
    );
    await layout(page, `${name}-after-interaction`);
    assert.deepEqual(errors, [], `${name}: runtime errors`);
    await archive.locator(".hk-journal-thumbnail").first().focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await archive
        .locator(".hk-journal-thumbnail")
        .nth(1)
        .getAttribute("aria-pressed"),
      "true",
    );
    await archive.locator(".hk-journal-preview").click();
    assert.equal(
      await archive.locator("dialog").evaluate((dialog) => dialog.open),
      true,
    );
    const viewerImage = await archive.locator("dialog img").getAttribute("src");
    await page.keyboard.press("ArrowRight");
    assert.notEqual(
      await archive.locator("dialog img").getAttribute("src"),
      viewerImage,
    );
    const dialogBounds = await archive.locator("dialog").boundingBox();
    assert.ok(
      dialogBounds.width <= width + 1 && dialogBounds.height <= height + 1,
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await archive.locator("dialog").evaluate((dialog) => dialog.open),
      false,
    );
    assert.equal(
      await archive
        .locator(".hk-journal-preview")
        .evaluate((button) => button === document.activeElement),
      true,
    );
    await page.close();
    console.log(
      `${name}: layout, filters, keyboard, pagination, contact sheet, lightbox passed; images ${broken.length ? "BLOCKED by sandbox" : "loaded"}`,
    );
  }

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/hackathons`, { waitUntil: "networkidle" });
  await settled(page);
  assert.equal(
    await page
      .locator(".hackathons-page")
      .getAttribute("data-hackathons-motion"),
    "ready",
  );
  const hero = page.locator(".hk-hero-visual");
  const heroBounds = await hero.boundingBox();
  await page.mouse.move(
    heroBounds.x + heroBounds.width * 0.85,
    heroBounds.y + heroBounds.height * 0.25,
  );
  await page.waitForTimeout(700);
  assert.ok(
    await page
      .locator(".hk-hero-photo")
      .evaluate((photo) => photo.style.transform.includes("rotateY")),
    "Hero photo reacts with depth",
  );
  for (const section of await page.locator(".hk-screen").all()) {
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1300);
  }
  await layout(page, "desktop-motion");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () =>
      document.querySelector(".hackathons-page")?.dataset.hackathonsMotion ===
      "reduced",
  );
  await layout(page, "live-reduced-motion-toggle");
  await page.getByRole("link", { name: "Start a conversation" }).click();
  await page.waitForURL("**/contact", { timeout: 25000 });
  await page.goBack();
  await page.waitForURL("**/hackathons");
  await settled(page);
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page
    .getByRole("navigation", { name: "Primary Navigation" })
    .getByRole("link", { name: /Contact/i })
    .click();
  await page.waitForURL("**/contact", { timeout: 25000 });
  assert.deepEqual(errors, [], "motion and navigation runtime errors");
  await page.close();
  console.log(
    "Hero depth, animation, live reduced motion, contact link, Back and menu navigation passed",
  );
} finally {
  await writeFile(
    path.join(output, "measurements.json"),
    JSON.stringify(measurements, null, 2),
  );
  await writeFile(
    path.join(output, "network-limitations.json"),
    JSON.stringify(networkLimitations, null, 2),
  );
  await browser.close();
}
