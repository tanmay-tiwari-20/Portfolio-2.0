/** Run only with scripts/admin-test-server.mjs and its disposable dataset.
 * PROJECT_PLAYWRIGHT_MODULE and PROJECT_BROWSER_EXECUTABLE can select local runtimes.
 * Cloudinary uploads are mocked; admin persistence and the public viewer are real.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const runtime = JSON.parse(
  await readFile(".next-admin-test/verification/runtime.json", "utf8"),
);
const base = new URL(runtime.baseURL);
assert.equal(base.hostname, "localhost");
assert.ok(
  path
    .resolve(runtime.dataDir)
    .startsWith(path.join(tmpdir(), "portfolio-admin-test-")),
);
const source = JSON.parse(await readFile("data/projects.json", "utf8"));
const { chromium } = await import(
  process.env.PROJECT_PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PROJECT_PLAYWRIGHT_MODULE).href
    : "playwright"
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PROJECT_BROWSER_EXECUTABLE
    ? { executablePath: process.env.PROJECT_BROWSER_EXECUTABLE }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.setDefaultNavigationTimeout(60000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const output = path.resolve(".next/project-screenshots-verification");
await mkdir(output, { recursive: true });
const checks = [];
async function check(name, action) {
  await action();
  checks.push(name);
  console.log(`PASS ${name}`);
}
async function openEditor() {
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await page
    .getByRole("dialog", { name: "Edit Project", exact: true })
    .waitFor();
}
async function settled() {
  await page.waitForFunction(
    () =>
      !document.documentElement.classList.contains("portfolio-loading") &&
      !document.documentElement.classList.contains("portfolio-transitioning") &&
      !document.documentElement.dataset.spiderTransition,
  );
}
try {
  const login = await context.request.post(`${base.origin}/api/admin/login`, {
    headers: { Origin: base.origin },
    data: { password: runtime.password },
  });
  assert.equal(login.status(), 200);
  await page.goto(`${base.origin}/secret-admin#projects`);
  await page.locator('.admin-page-content[aria-busy="false"]').waitFor();
  await openEditor();
  const gallery = page.getByRole("region", { name: "Project screenshots" });
  await check(
    "add screenshots by URL and reject invalid or duplicate URLs",
    async () => {
      await gallery.locator("summary").click();
      await gallery
        .getByLabel("Image URL", { exact: true })
        .fill("https://example.com/invalid.png");
      await gallery
        .getByRole("button", { name: "Add screenshot", exact: true })
        .click();
      await gallery
        .getByRole("alert")
        .filter({ hasText: "HTTPS image URL" })
        .waitFor();
      for (const index of [1, 2]) {
        await gallery
          .getByLabel("Image URL", { exact: true })
          .fill(source[index].cover.url);
        await gallery
          .getByLabel("Image description", { exact: true })
          .fill(`Detail ${index}`);
        await gallery
          .getByRole("button", { name: "Add screenshot", exact: true })
          .click();
      }
      assert.equal(await gallery.locator(".upload-previews > div").count(), 2);
      await gallery
        .getByLabel("Image URL", { exact: true })
        .fill(source[1].cover.url);
      await gallery
        .getByRole("button", { name: "Add screenshot", exact: true })
        .click();
      await gallery.getByRole("alert").filter({ hasText: "already" }).waitFor();
      await gallery.getByLabel("Image URL", { exact: true }).fill("");
    },
  );
  await check(
    "multiple uploads preserve concurrent edits and block saving until finished",
    async () => {
      await page.route("**/api/admin/cloudinary-sign", (route) =>
        route.fulfill({
          json: {
            cloudName: "test",
            apiKey: "test",
            timestamp: 1,
            folder: "projects",
            allowedFormats: "png",
            signature: "test",
          },
        }),
      );
      let upload = 3;
      await page.route("https://api.cloudinary.com/**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const image = source[upload++].cover;
        await route.fulfill({
          headers: { "Access-Control-Allow-Origin": "*" },
          json: {
            secure_url: image.url,
            public_id: `screenshot-test-${upload}`,
            width: 1440,
            height: 900,
          },
        });
      });
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1sAAAAASUVORK5CYII=",
        "base64",
      );
      await gallery.locator('input[type="file"]').setInputFiles([
        { name: "screen-one.png", mimeType: "image/png", buffer: png },
        { name: "screen-two.png", mimeType: "image/png", buffer: png },
      ]);
      await page
        .getByRole("button", { name: "Uploading screenshots...", exact: true })
        .waitFor();
      assert.ok(
        await page
          .getByRole("button", {
            name: "Uploading screenshots...",
            exact: true,
          })
          .isDisabled(),
      );
      await page
        .getByLabel("Project Title", { exact: true })
        .fill("Unsaved title during upload");
      await page
        .getByRole("button", { name: "Save Project", exact: true })
        .waitFor();
      assert.equal(
        await page.getByLabel("Project Title", { exact: true }).inputValue(),
        "Unsaved title during upload",
      );
      assert.equal(await gallery.locator(".upload-previews > div").count(), 4);
      await page
        .getByLabel("Project Title", { exact: true })
        .fill(source[0].title);
      await page.unroute("**/api/admin/cloudinary-sign");
      await page.unroute("https://api.cloudinary.com/**");
    },
  );
  await check(
    "reorder, describe, remove, save and reopen the project gallery",
    async () => {
      await gallery
        .getByRole("button", { name: "Move screenshot 2 earlier", exact: true })
        .click();
      await gallery
        .getByLabel("Alt text", { exact: true })
        .first()
        .fill("Meeting dashboard detail");
      // The disposable upload cleanup is mocked as well; no Cloudinary asset is deleted.
      await page.route("**/api/admin/media", (route) =>
        route.fulfill({ json: { ok: true } }),
      );
      await gallery
        .getByRole("button", {
          name: "Remove screen-two.png from draft",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Save Project", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "Edit Project", exact: true })
        .waitFor({ state: "hidden" });
      const response = await context.request.get(
        `${base.origin}/api/admin/content?collection=projects`,
      );
      const project = (await response.json()).find(
        (item) => item.id === source[0].id,
      );
      assert.deepEqual(
        project.gallery.map((image) => image.url),
        [source[2].cover.url, source[1].cover.url, source[3].cover.url],
      );
      assert.equal(project.gallery[0].alt, "Meeting dashboard detail");
      assert.deepEqual(project.cover, source[0].cover);
      await openEditor();
      assert.equal(
        await gallery
          .getByLabel("Alt text", { exact: true })
          .first()
          .inputValue(),
        "Meeting dashboard detail",
      );
      await gallery.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, "admin-desktop.png") });
      await page.setViewportSize({ width: 390, height: 844 });
      await gallery.scrollIntoViewIfNeeded();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({ path: path.join(output, "admin-mobile.png") });
    },
  );
  await page.goto(`${base.origin}/projects/${source[0].slug}`);
  await settled();
  await check(
    "the saved screenshots appear on the public project page",
    async () => {
      assert.equal(await page.locator(".project-screenshot").count(), 4);
      await page.waitForFunction(
        () => {
          const image = document.querySelector(".project-screenshot img");
          return image?.complete && image.naturalWidth > 0;
        },
        null,
        { timeout: 30000 },
      );
      assert.equal(
        await page.getByText("Open full image", { exact: false }).count(),
        0,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({ path: path.join(output, "project-mobile.png") });
    },
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(output, "project-desktop.png") });
  await check(
    "image focus stays on the page, supports navigation, zoom and keyboard focus",
    async () => {
      const trigger = page.locator(".project-screenshot-trigger").first();
      const url = page.url();
      const pages = context.pages().length;
      await trigger.click();
      const viewer = page.getByRole("dialog", {
        name: source[0].title,
        exact: true,
      });
      await viewer.waitFor();
      assert.equal(page.url(), url);
      assert.equal(context.pages().length, pages);
      await page.waitForFunction(
        () => {
          const image = document.querySelector(
            'dialog[open] [role="region"] img',
          );
          return image?.complete && image.naturalWidth > 0;
        },
        null,
        { timeout: 30000 },
      );
      await viewer
        .getByRole("button", { name: "Close screenshot viewer", exact: true })
        .waitFor();
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.getAttribute("aria-label"),
        ),
        "Close screenshot viewer",
      );
      await page.keyboard.press("ArrowRight");
      await viewer
        .getByText("Meeting dashboard detail", { exact: true })
        .waitFor();
      await viewer
        .getByRole("button", { name: "Next screenshot", exact: true })
        .click();
      await viewer.getByText("Detail 1", { exact: true }).waitFor();
      await viewer
        .getByRole("button", { name: "Previous screenshot", exact: true })
        .click();
      await viewer
        .getByRole("button", { name: "Zoom into screenshot", exact: true })
        .click();
      assert.ok(
        (await viewer
          .getByRole("button", {
            name: "Fit screenshot to viewer",
            exact: true,
          })
          .getAttribute("aria-pressed")) === "true",
      );
      await viewer
        .getByRole("button", { name: "Fit screenshot to viewer", exact: true })
        .click();
      await page.screenshot({ path: path.join(output, "viewer-desktop.png") });
      for (let index = 0; index < 15; index++) {
        await page.keyboard.press("Tab");
        assert.ok(
          await page.evaluate(() =>
            Boolean(document.activeElement?.closest("dialog[open]")),
          ),
        );
      }
      await page.keyboard.press("Escape");
      await viewer.waitFor({ state: "hidden" });
      assert.ok(
        await trigger.evaluate((element) => element === document.activeElement),
      );
      assert.equal(page.url(), url);
      await trigger.click();
      await viewer.waitFor();
      await page.mouse.click(2, 2);
      await viewer.waitFor({ state: "hidden" });
    },
  );
  await check(
    "mobile viewer fits the screen and controls remain available",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator(".project-screenshot-trigger").nth(1).click();
      const viewer = page.getByRole("dialog", {
        name: source[0].title,
        exact: true,
      });
      await viewer.waitFor();
      const box = await viewer.boundingBox();
      assert.ok(
        box.x >= 0 &&
          box.x + box.width <= 391 &&
          box.y >= 0 &&
          box.y + box.height <= 845,
      );
      await viewer
        .getByRole("button", { name: "Next screenshot", exact: true })
        .click();
      await page.screenshot({ path: path.join(output, "viewer-mobile.png") });
      await viewer
        .getByRole("button", { name: "Close screenshot viewer", exact: true })
        .click();
      await viewer.waitFor({ state: "hidden" });
    },
  );
  assert.deepEqual(errors, []);
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify(
      {
        checks,
        errors,
        note: "Cloudinary uploads mocked; persistence and viewer exercised against isolated data.",
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
