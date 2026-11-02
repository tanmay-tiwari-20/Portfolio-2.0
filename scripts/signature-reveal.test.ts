import assert from "node:assert/strict";
import test from "node:test";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SignatureReveal from "../components/about/signature-reveal";
import {
  SIGNATURE_HEIGHT,
  SIGNATURE_STROKES,
  SIGNATURE_WIDTH,
} from "../lib/tanmay-signature";

test("server rendering reserves space and supplies an accessible name without running animation", () => {
  const html = renderToStaticMarkup(createElement(SignatureReveal));
  assert.match(html, /aria-label="Tanmay Tiwari, handwritten signature"/);
  assert.match(html, /data-signature-state="waiting"/);
  assert.match(html, /aspect-ratio:670 \/ 190/);
  assert.match(html, /<noscript>/);
  assert.equal(
    (html.match(/data-signature-pen/g) ?? []).length,
    SIGNATURE_STROKES.length,
  );
  assert.equal(
    (html.match(/stroke-dashoffset="1" opacity="0"/g) ?? []).length,
    SIGNATURE_STROKES.length,
  );
});

test("two signatures have isolated masks and no external asset dependencies", () => {
  const html = renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement(SignatureReveal),
      createElement(SignatureReveal),
    ),
  );
  const ids = [...html.matchAll(/<mask id="([^"]+)"/g)].map(
    (match) => match[1],
  );
  const references = [...html.matchAll(/mask="url\(#([^)]+)\)"/g)].map(
    (match) => match[1],
  );
  assert.equal(ids.length, SIGNATURE_STROKES.length * 2);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(new Set(references), new Set(ids));
  assert.doesNotMatch(html, /https?:|<image|<foreignObject/);
});

test("ink contours stay padded inside the responsive viewBox at all requested widths", () => {
  const points = SIGNATURE_STROKES.flatMap((stroke) =>
    [...stroke.ink.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((match) => [
      Number(match[1]),
      Number(match[2]),
    ]),
  );
  assert.ok(points.length > 100);
  for (const width of [
    320, 360, 375, 390, 430, 640, 768, 820, 1024, 1280, 1440, 1920,
  ]) {
    const containerWidth = Math.min(width >= 768 ? 448 : 320, width - 44);
    const scale = containerWidth / SIGNATURE_WIDTH;
    const containerHeight = SIGNATURE_HEIGHT * scale;
    for (const [x, y] of points) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      assert.ok(
        x * scale > 1 && x * scale < containerWidth - 1,
        `horizontal clipping at ${width}px`,
      );
      assert.ok(
        y * scale > 1 && y * scale < containerHeight - 1,
        `vertical clipping at ${width}px`,
      );
    }
  }
});
