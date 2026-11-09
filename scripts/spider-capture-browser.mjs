/** Run only after browser execution is approved; no server or network is needed.
 * Uses the project's TypeScript and an existing Playwright installation.
 * SPIDER_PLAYWRIGHT_MODULE=C:/path/to/playwright-core/index.mjs (optional)
 * Syntax only: node --check scripts/spider-capture-browser.mjs
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const source = await readFile(
  new URL(
    "../components/animations/spider-transition/capture.ts",
    import.meta.url,
  ),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
const modulePath = process.env.SPIDER_PLAYWRIGHT_MODULE;
const { chromium } = await import(
  modulePath ? pathToFileURL(modulePath).href : "playwright-core"
);
const browser = await chromium.launch({ headless: true, ...(process.env.SPIDER_BROWSER_EXECUTABLE ? { executablePath: process.env.SPIDER_BROWSER_EXECUTABLE } : {}) });

try {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  await page.route("**/*", (route) => route.abort());
  await page.setContent(`<!doctype html><style>
    * { box-sizing: border-box; scrollbar-width: none; }
    body { margin: 0; background: rgb(9, 7, 8); font: 18px Arial, sans-serif; }
    .prefix { display: flex; gap: 17px; align-items: center; padding: 18px; }
    .empty { width: 80px; height: 42px; margin: 9px 21px; }
    .hidden { visibility: hidden; width: 93px; height: 24px; }
    .gap { height: 31px; margin: 19px 0 27px; }
    .band { height: 900px; display: grid; grid-template-rows: repeat(5, 180px); }
    .row { display: flex; align-items: center; padding-left: 24px; }
    .label { margin: 0; width: max-content; color: white; font: bold 26px/34px monospace; }
    .anchor { position: absolute; top: 0; left: 0; width: 100%; height: 1px; }
    .track { position: absolute; right: 20px; top: 0; width: 150px; }
    .chip { width: 150px; height: 36px; color: black; background: rgb(245, 204, 40); line-height: 36px; }
    .fixed { position: fixed; right: 20px; top: 20px; }
    .sticky { position: sticky; top: 80px; }
  </style><div id="fixture">
    <div class="prefix"><div class="empty"></div><div class="hidden"></div>
      <span class="label" data-probe="prefix">Before the sections</span></div>
    <div class="gap"></div>
    ${["rgb(191, 58, 42)", "rgb(32, 113, 86)", "rgb(47, 82, 165)"]
      .map(
        (
          color,
          band,
        ) => `<section class="band" data-band="${band}" style="background:${color}">
          ${Array.from({ length: 5 }, (_, row) => `<div class="row"><h2 class="label" data-text data-probe="label-${band}-${row}">SECTION ${band + 1} / ROW ${row + 1}</h2></div>`).join("")}
        </section>`,
      )
      .join("")}
    <div class="anchor"><div class="chip fixed" data-probe="fixed">Fixed marker</div>
      <div class="track"><div class="chip sticky" data-probe="sticky">Sticky marker</div></div></div>
  </div>`);
  await page.evaluate(async (url) => {
    window.captureViewport = (await import(url)).freezeViewport;
    document.querySelector(".track").style.height =
      `${document.querySelector("#fixture").getBoundingClientRect().height}px`;
  }, moduleUrl);

  for (const position of ["top", "middle", "bottom"]) {
    const result = await page.evaluate(async (position) => {
      const errors = [];
      const check = (condition, message) => {
        if (!condition) errors.push(message);
      };
      const frame = () => new Promise(requestAnimationFrame);
      const root = document.querySelector("#fixture");
      const maxScroll = document.documentElement.scrollHeight - innerHeight;
      scrollTo(
        0,
        position === "top"
          ? 0
          : position === "middle"
            ? maxScroll / 2
            : maxScroll,
      );
      await frame();
      await frame();
      const clickedScroll = scrollY;
      if (position !== "top") {
        check(
          root.querySelector(".anchor").getBoundingClientRect().bottom < 0,
          "The fixed/sticky ancestor must be offscreen in this fixture",
        );
      }
      const probes = [...root.querySelectorAll("[data-probe]")]
        .map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return {
            key: node.dataset.probe,
            x,
            y,
            width,
            height,
            text: node.hasAttribute("data-text"),
          };
        })
        .filter((rect) => rect.y >= 0 && rect.y + rect.height <= innerHeight);
      const swatches = [...root.querySelectorAll("[data-band]")]
        .map((node) => {
          const rect = node.getBoundingClientRect();
          const top = Math.max(0, rect.top),
            bottom = Math.min(innerHeight, rect.bottom);
          return {
            top,
            bottom,
            rgb: getComputedStyle(node)
              .backgroundColor.match(/\d+/g)
              .map(Number),
          };
        })
        .filter(({ top, bottom }) => bottom - top > 8);
      check(
        swatches.length > 0 && probes.some((probe) => probe.text),
        "Fixture needs visible color and text",
      );
      const captureStarted = performance.now();
      const snapshot = window.captureViewport(root, 1);
      const freezeMs = performance.now() - captureStarted;
      const host = document.createElement("div");
      host.style.cssText =
        "position:fixed;inset:0;z-index:999999;pointer-events:none";
      host.attachShadow({ mode: "open" }).append(snapshot.preview);
      document.body.append(host);
      const verifyRects = (phase) => {
        for (const expected of probes) {
          const node = snapshot.preview.querySelector(
            `[data-probe="${expected.key}"]`,
          );
          check(Boolean(node), `${phase}: missing ${expected.key}`);
          if (!node) continue;
          const actual = node.getBoundingClientRect();
          for (const key of ["x", "y", "width", "height"])
            check(
              Math.abs(actual[key] - expected[key]) < 1,
              `${phase}: ${expected.key}.${key} expected ${expected[key]}, got ${actual[key]}`,
            );
        }
      };
      verifyRects("preview");
      // Simulate Next changing the live scroll before asynchronous rasterization.
      scrollTo(0, position === "top" ? maxScroll : 0);
      await frame();
      check(
        scrollY !== clickedScroll,
        "Live scroll must change after freezing",
      );
      verifyRects("after live scroll");
      const canvas = await snapshot.render(new AbortController().signal);
      const context = canvas.getContext("2d");
      for (const { top, bottom, rgb } of swatches) {
        const pixel = context.getImageData(
          8,
          Math.floor((top + bottom) / 2),
          1,
          1,
        ).data;
        check(
          rgb.every(
            (value, channel) => Math.abs(pixel[channel] - value) <= 2,
          ) && pixel[3] === 255,
          `Wrong viewport color: expected ${rgb}, got ${[...pixel]}`,
        );
      }
      for (const probe of probes.filter((probe) => probe.text)) {
        const pixels = context.getImageData(
          Math.floor(probe.x),
          Math.floor(probe.y),
          Math.ceil(probe.width),
          Math.ceil(probe.height),
        ).data;
        let white = 0;
        for (let i = 0; i < pixels.length; i += 4)
          if (
            pixels[i] > 230 &&
            pixels[i + 1] > 230 &&
            pixels[i + 2] > 230 &&
            pixels[i + 3] > 240
          )
            white++;
        check(white > 20, `Missing rasterized text: ${probe.key}`);
      }
      host.remove();
      return { errors, scroll: clickedScroll, probes: probes.length, freezeMs, renderMs: performance.now()-captureStarted-freezeMs };
    }, position);
    assert.deepEqual(result.errors, [], `${position} capture regression`);
    console.log(
      `${position}: scroll ${result.scroll}, ${result.probes} preview bounds, viewport colors and text passed; freeze ${result.freezeMs.toFixed(1)} ms, render ${result.renderMs.toFixed(1)} ms`,
    );
  }

  // A route can add a stylesheet after warmup. Freeze values, canvas content,
  // pseudo elements and SVG paint servers, then change the live source.
  const dynamic = await page.evaluate(async () => {
    document.body.replaceChildren();
    scrollTo(0, 0);
    const style = document.createElement("style");
    style.textContent = `
      :root { --capture-swatch: rgb(40, 170, 90); }
      #dynamic-capture { position: relative; width: 960px; height: 640px; background: white; }
      .capture-swatch { width: 120px; height: 80px; background: var(--capture-swatch); }
      .capture-pseudo { position: absolute; left: 140px; top: 0; width: 80px; height: 80px; }
      .capture-pseudo::before { content: ""; display: block; width: 80px; height: 80px; background: rgb(210, 40, 60); }
      .capture-canvas { position: absolute; left: 240px; top: 0; width: 80px; height: 80px; }
      .capture-svg { position: absolute; left: 340px; top: 0; width: 80px; height: 80px; }
    `;
    document.head.append(style);
    const root = document.createElement("div");
    root.id = "dynamic-capture";
    root.innerHTML = `<div class="capture-swatch"></div><div class="capture-pseudo"></div>
      <canvas class="capture-canvas" width="80" height="80"></canvas>
      <svg class="capture-svg" viewBox="0 0 80 80"><defs><mask id="capture-mask"><rect width="80" height="80" fill="white"/></mask></defs><rect width="80" height="80" fill="rgb(150,70,200)" mask="url(#capture-mask)"/></svg>
      <input type="password" value="do-not-capture"/>`;
    document.body.append(root);
    const context = root.querySelector("canvas").getContext("2d");
    context.fillStyle = "rgb(30,100,220)"; context.fillRect(0,0,80,80);
    const snapshot = window.captureViewport(root, 1);
    const host = document.createElement("div"); host.attachShadow({mode:"open"}).append(snapshot.preview); document.body.append(host);
    const password = snapshot.preview.querySelector('input[type="password"]');
    const errors = [];
    if (password?.value || password?.getAttribute("value")) errors.push("Password was copied");
    // Change CSSOM and canvas after the synchronous freeze. The old frame must
    // remain immutable while the new route or a live widget updates beneath it.
    style.sheet.cssRules[0].style.setProperty("--capture-swatch", "rgb(230,180,20)");
    context.fillStyle="black";context.fillRect(0,0,80,80);
    const canvas = await snapshot.render(new AbortController().signal);
    const pixels = canvas.getContext("2d");
    for (const [name,x,rgb] of [["CSS variable",20,[40,170,90]],["pseudo",160,[210,40,60]],["canvas",260,[30,100,220]],["SVG mask",360,[150,70,200]]]) {
      const actual=[...pixels.getImageData(x,20,1,1).data];
      if(!rgb.every((n,i)=>Math.abs(n-actual[i])<=2)||actual[3]!==255) errors.push(`${name}: expected ${rgb}, got ${actual}`);
    }
    host.remove();
    const next = window.captureViewport(root, 1);
    const nextCanvas = await next.render(new AbortController().signal);
    const updated = [...nextCanvas.getContext("2d").getImageData(20,20,1,1).data];
    if (![230,180,20].every((n,i)=>Math.abs(n-updated[i])<=2)) errors.push(`Changed stylesheet was stale: ${updated}`);
    const controller=new AbortController();controller.abort();
    try { await next.render(controller.signal); errors.push("Aborted snapshot rendered"); } catch(error) { if(error.name!=="AbortError") errors.push(`Abort error: ${error}`); }
    root.remove();style.remove();
    return errors;
  });
  assert.deepEqual(dynamic, [], "dynamic capture regression");
  console.log("Dynamic CSS, pseudo-element, canvas, SVG mask, password and cancellation passed");

  // The introduction is itself a fixed viewport surface, rather than a normal
  // page containing fixed children. It must survive extraction and later removal.
  const fixedRoot = await page.evaluate(async () => {
    const root = document.createElement("div");
    root.dataset.fixedRoot = "true";
    root.style.cssText = "position:fixed;inset:0;background:rgb(22,30,40);color:white";
    root.innerHTML = '<div style="position:absolute;left:80px;top:80px;width:100px;height:100px;background:rgb(239,70,62)"></div><p style="position:absolute;left:220px;top:80px;margin:0;font:700 80px/1 Arial">100%</p>';
    document.body.append(root);
    const snapshot = window.captureViewport(root, 1);
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;inset:0;z-index:2147483000";
    host.attachShadow({ mode: "open" }).append(snapshot.preview);
    document.body.append(host);
    const copy = snapshot.preview.querySelector("[data-fixed-root]");
    const bounds = copy?.getBoundingClientRect();
    const errors = [];
    if (!bounds || bounds.x !== 0 || bounds.y !== 0 || bounds.width !== innerWidth || bounds.height !== innerHeight)
      errors.push("Fixed root did not preserve its viewport bounds");
    root.remove();
    const canvas = await snapshot.render(new AbortController().signal);
    const context = canvas.getContext("2d");
    for (const [x, y, rgb] of [[8, 8, [22, 30, 40]], [100, 100, [239, 70, 62]]]) {
      const actual = [...context.getImageData(x, y, 1, 1).data];
      if (!rgb.every((value, index) => Math.abs(value - actual[index]) <= 2) || actual[3] !== 255)
        errors.push(`Fixed root raster at ${x},${y}: expected ${rgb}, got ${actual}`);
    }
    host.remove();
    return errors;
  });
  assert.deepEqual(fixedRoot, [], "fixed introduction root capture regression");
  console.log("Fixed introduction viewport preview and raster survive source removal");
} finally {
  await browser.close();
}
