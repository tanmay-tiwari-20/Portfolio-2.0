/** Browser-native, viewport-only DOM rasterization. The frozen DOM is made
 * synchronously, before Next can replace it (including on popstate).
 * Only the transient visual surface is rasterized; the new route stays live. */
const assets = new Map<string, Promise<string>>();
let embeddedFonts: Promise<string> | undefined;
const SVG_NS = "http://www.w3.org/2000/svg";
let captureCount = 0;
let lastAssetWarm = -Infinity;

function dataUrl(blob: Blob, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => reader.abort();
    const cleanup = () => signal?.removeEventListener("abort", abort);
    reader.onload = () => {
      cleanup();
      resolve(String(reader.result));
    };
    reader.onerror = () => {
      cleanup();
      reject(reader.error);
    };
    reader.onabort = () => {
      cleanup();
      reject(new DOMException("Capture aborted", "AbortError"));
    };
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    reader.readAsDataURL(blob);
  });
}

// Copy painted/layout values, not the hundreds of inherited custom properties,
// vendor aliases and unused animation declarations exposed by computed style.
// Values here are resolved, so the frozen tree does not need the live stylesheets.
const paintProperties = `
  display position top right bottom left z-index float clear box-sizing
  width height min-width min-height max-width max-height
  margin padding border-width border-style border-color border-radius border-image
  outline outline-offset overflow overflow-wrap overflow-clip-margin
  flex-direction flex-wrap flex order
  align-content align-items align-self justify-content justify-items justify-self
  grid-template-columns grid-template-rows grid-template-areas
  grid-auto-columns grid-auto-rows grid-auto-flow
  grid-column grid-row gap
  column-count column-width column-fill column-rule
  font-family font-size font-weight font-style font-stretch font-variant font-feature-settings
  font-variation-settings font-kerning line-height letter-spacing word-spacing
  text-align text-align-last text-indent text-transform text-decoration text-shadow text-overflow
  white-space text-wrap word-break hyphens tab-size vertical-align direction writing-mode
  box-decoration-break -webkit-box-decoration-break -webkit-line-clamp -webkit-box-orient
  color -webkit-text-fill-color -webkit-text-stroke-width -webkit-text-stroke-color
  opacity visibility background
  box-shadow transform transform-origin transform-style translate rotate scale
  perspective perspective-origin backface-visibility clip clip-path filter backdrop-filter
  mask-image mask-size mask-position mask-repeat mask-mode mask-composite
  mix-blend-mode isolation object-fit object-position aspect-ratio
  list-style-type list-style-position list-style-image
  border-collapse border-spacing table-layout caption-side empty-cells
  appearance
`
  .trim()
  .split(/\s+/);

const svgPaintProperties = `
  fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin
  stroke-dasharray stroke-dashoffset stroke-miterlimit paint-order
  stop-color stop-opacity flood-color flood-opacity dominant-baseline text-anchor
  shape-rendering vector-effect
`.trim().split(/\s+/);

// SVG geometry remains in its presentation attributes. Shapes do not take part
// in CSS box/flex/grid layout; copying those properties adds no painted detail.
// SVG text and foreignObject keep the complete typography/layout path.
const svgShapeProperties = `
  display width height color opacity visibility transform transform-origin transform-box
  translate rotate scale clip clip-path filter mix-blend-mode isolation
  mask-image mask-size mask-position mask-repeat mask-mode mask-composite
`.trim().split(/\s+/).concat(svgPaintProperties);
const svgShapeTags = new Set([
  "path", "circle", "ellipse", "line", "polyline", "polygon", "rect", "stop",
]);

// A shorthand can be empty when its longhands cannot be represented together.
// Preserve those uncommon combinations rather than silently resetting them.
const shorthandFallbacks: Record<string, readonly string[]> = {
  margin: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
  padding: ["padding-top", "padding-right", "padding-bottom", "padding-left"],
  "border-width": ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width"],
  "border-style": ["border-top-style", "border-right-style", "border-bottom-style", "border-left-style"],
  "border-color": ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
  "border-radius": ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"],
  "border-image": ["border-image-source", "border-image-slice", "border-image-width", "border-image-outset", "border-image-repeat"],
  outline: ["outline-color", "outline-style", "outline-width"],
  overflow: ["overflow-x", "overflow-y"],
  flex: ["flex-grow", "flex-shrink", "flex-basis"],
  "grid-column": ["grid-column-start", "grid-column-end"],
  "grid-row": ["grid-row-start", "grid-row-end"],
  gap: ["row-gap", "column-gap"],
  background: ["background-color", "background-image", "background-position", "background-size", "background-repeat", "background-origin", "background-clip", "background-attachment"],
};

async function inlineAsset(source: string): Promise<string> {
  if (source.startsWith("data:")) return source;
  const url = new URL(source, location.href).href;
  let cached = assets.get(url);
  if (!cached) {
    cached = (async () => {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3500),
        credentials:
          new URL(url).origin === location.origin ? "same-origin" : "omit",
      });
      if (!response.ok)
        throw new Error(`Page capture resource: ${response.status}`);
      const blob = await response.blob();
      return dataUrl(blob);
    })();
    assets.set(url, cached);
    cached.catch(() => assets.delete(url));
    if (assets.size > 48) assets.delete(assets.keys().next().value!);
  }
  return cached;
}

async function inlineUrls(css: string, base = location.href) {
  const matches = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)];
  for (const match of matches) {
    if (match[1].startsWith("#")) continue;
    css = css.replace(
      match[0],
      `url("${await inlineAsset(new URL(match[1], base).href)}")`,
    );
  }
  return css;
}

function fonts() {
  if (!embeddedFonts) {
    const rules: Array<{ css: string; base: string }> = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule instanceof CSSFontFaceRule)
            rules.push({
              css: rule.cssText,
              base: sheet.href || location.href,
            });
        }
      } catch {
        /* Cross-origin stylesheet: the computed font fallback remains valid. */
      }
    }
    embeddedFonts = Promise.all(
      rules.map(({ css, base }) => inlineUrls(css, base)),
    ).then((css) => css.join("\n"));
    embeddedFonts.catch(() => {
      embeddedFonts = undefined;
    });
  }
  return embeddedFonts;
}

export function warmCaptureAssets(
  root?: HTMLElement,
  { includePendingImages = false }: { includePendingImages?: boolean } = {},
) {
  void fonts().catch(() => {});
  if (!root || performance.now() - lastAssetWarm < 1500) return;
  lastAssetWarm = performance.now();
  let warmed = 0;
  for (const image of Array.from(root.querySelectorAll("img"))) {
    if (
      (!includePendingImages && (!image.complete || !image.naturalWidth)) ||
      (includePendingImages && image.loading === "lazy")
    )
      continue;
    const rect = image.getBoundingClientRect();
    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.bottom < 0 ||
      rect.top > innerHeight ||
      rect.right < 0 ||
      rect.left > innerWidth
    )
      continue;
    const source = image.currentSrc || image.src;
    if (source) void inlineAsset(source).catch(() => {});
    if (++warmed === 8) break;
  }
}

export interface FrozenViewport {
  width: number;
  height: number;
  preview: HTMLElement;
  render(signal: AbortSignal): Promise<HTMLCanvasElement>;
}

export function freezeViewport(
  root: HTMLElement,
  pixelRatio: number,
): FrozenViewport {
  const width = window.innerWidth,
    height = window.innerHeight;
  const offset = root.getBoundingClientRect();
  const pending: Promise<unknown>[] = [];
  const idPrefix = `spider-capture-${++captureCount}-`;
  const ids = new Map<string, string>();
  const viewport = document.createElement("div");
  viewport.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  viewport.style.cssText = `position:relative;width:${width}px;height:${height}px;overflow:hidden;background:${getComputedStyle(document.body).backgroundColor};`;

  // Read live layout in one pass. Offscreen sections retain their used box but
  // do not need thousands of styled descendants in a viewport-sized image.
  // Descendants are inspected before pruning: a fixed/sticky child can still
  // be visible even when its ancestor is outside the viewport.
  const measured = new Map<
    Element,
    {
      rect: DOMRect;
      style: CSSStyleDeclaration;
      visible: boolean;
      containsVisible: boolean;
    }
  >();
  function measure(source: Element): boolean {
    if (source.matches("script,style,link,noscript,[data-transition-ignore]"))
      return false;
    const style = getComputedStyle(source);
    if (style.display === "none") return false;
    const rect = source.getBoundingClientRect();
    const visible =
      rect.bottom >= -8 &&
      rect.top <= height + 8 &&
      rect.right >= -8 &&
      rect.left <= width + 8;
    if (
      !visible && source instanceof SVGSVGElement &&
      style.overflowX !== "visible" && style.overflowY !== "visible" &&
      !source.querySelector("[id], foreignObject")
    ) {
      // Clipped, offscreen icon paths cannot contribute pixels outside their
      // SVG viewport. Keep SVGs containing referenced defs or HTML descendants
      // on the complete path, since those can affect another visible element.
      measured.set(source, { rect, style, visible, containsVisible: false });
      return false;
    }
    let containsVisible = visible;
    for (const child of source.children)
      containsVisible = measure(child) || containsVisible;
    measured.set(source, { rect, style, visible, containsVisible });
    return containsVisible;
  }
  measure(root);

  const styleNode = (
    target: HTMLElement | SVGElement,
    style: CSSStyleDeclaration,
    embedBackground = true,
  ) => {
    // Read each declaration once and parse one style string, rather than
    // mutating the detached element's CSSOM hundreds of times per node.
    // Neutralize user-agent tag styles too (h1 margins, button borders, etc.).
    // Retain zero/default paint values: border-width, for example, depends on
    // border-style and cannot safely be omitted by comparison to a blank node.
    // SVG geometry lives in presentation attributes (d/r/cx/etc.); resetting
    // all properties would erase those paths even though their paint is copied.
    const svg = target.namespaceURI === SVG_NS;
    const properties = svg && svgShapeTags.has(target.localName)
      ? svgShapeProperties
      : paintProperties;
    let css = svg ? "" : "all:initial;";
    for (const key of properties) {
      const value = style.getPropertyValue(key);
      if (value) css += `${key}:${value};`;
      else if (shorthandFallbacks[key]) {
        for (const longhand of shorthandFallbacks[key]) {
          const resolved = style.getPropertyValue(longhand);
          if (resolved) css += `${longhand}:${resolved};`;
        }
      }
    }
    if (svg && properties === paintProperties)
      for (const key of svgPaintProperties) {
        const value = style.getPropertyValue(key);
        if (value) css += `${key}:${value};`;
      }
    target.style.cssText = css;
    target.style.setProperty("animation", "none", "important");
    target.style.setProperty("transition", "none", "important");
    target.style.setProperty("caret-color", "transparent", "important");
    const background = style.backgroundImage;
    if (embedBackground && background.includes("url(")) {
      pending.push(
        inlineUrls(background).then((value) => {
          target.style.backgroundImage = value;
        }),
      );
    }
    return style;
  };

  const clone = (source: Node): Node | null => {
    if (source.nodeType === Node.TEXT_NODE) return source.cloneNode();
    if (!(source instanceof Element)) return null;
    if (source.matches("script,style,link,noscript,[data-transition-ignore]"))
      return null;
    const measurement = measured.get(source);
    if (!measurement) return null;
    const { rect, style, containsVisible } = measurement;
    // visibility:hidden still occupies space (and can have visible children).
    // Removing it makes nearby text, flex items and grid columns move.
    if (style.display === "none") return null;
    const target =
      source instanceof HTMLCanvasElement || source instanceof HTMLVideoElement
        ? document.createElement("canvas")
        : (source.cloneNode(false) as HTMLElement | SVGElement);
    if (source.id) {
      ids.set(source.id, `${idPrefix}${source.id}`);
      target.id = `${idPrefix}${source.id}`;
    }
    target.removeAttribute("srcset");
    target.removeAttribute("sizes");
    target.removeAttribute("loading");
    target.removeAttribute("autofocus");
    if (source instanceof HTMLInputElement && source.type === "password") {
      (target as HTMLInputElement).value = "";
      target.setAttribute("value", "");
    }
    // Offscreen ancestors still participate in layout and can contain visible
    // overflow, fixed or sticky descendants. Keep their full structure: pruning
    // an earlier section can move the requested viewport into empty space.
    const offscreen = !measurement.visible;
    styleNode(target, style, !offscreen);
    if (
      !containsVisible && source.namespaceURI !== SVG_NS &&
      ["block", "flex", "grid", "flow-root"].includes(style.display)
    ) {
      // Preserve the original used layout dimensions, including padding and
      // margins, without carrying offscreen text/media into serialization.
      target.style.width = style.width;
      target.style.height = style.height;
      target.style.visibility = "hidden";
      target.style.backgroundImage = "none";
      target.removeAttribute("src");
      target.removeAttribute("poster");
      return target;
    }
    if (offscreen) {
      target.style.backgroundImage = "none";
      target.removeAttribute("src");
      target.removeAttribute("poster");
    }
    if (
      source instanceof HTMLCanvasElement ||
      source instanceof HTMLVideoElement
    ) {
      if (!offscreen) {
        const frame = target as HTMLCanvasElement;
        const sourceWidth =
          source instanceof HTMLVideoElement ? source.videoWidth : source.width;
        const sourceHeight =
          source instanceof HTMLVideoElement
            ? source.videoHeight
            : source.height;
        frame.width = Math.max(
          1,
          Math.min(sourceWidth, Math.ceil(rect.width * pixelRatio)),
        );
        frame.height = Math.max(
          1,
          Math.min(sourceHeight, Math.ceil(rect.height * pixelRatio)),
        );
        if (sourceWidth && sourceHeight)
          frame
            .getContext("2d")
            ?.drawImage(source, 0, 0, frame.width, frame.height);
        // Keep real pixels in the immediate preview. PNG compression and data
        // encoding run asynchronously, rather than blocking a navigation click
        // with WebGL canvas.toDataURL(). The SVG gets the resulting image.
        pending.push(
          new Promise<Blob>((resolve, reject) =>
            frame.toBlob(
              (blob) =>
                blob
                  ? resolve(blob)
                  : reject(new Error("Canvas capture unavailable")),
              "image/png",
            ),
          )
            .then(dataUrl)
            .then(async (url) => {
              const image = document.createElement("img");
              for (const attribute of Array.from(frame.attributes))
                image.setAttribute(attribute.name, attribute.value);
              image.src = url;
              await image.decode();
              frame.replaceWith(image);
              frame.width = frame.height = 1;
            }),
        );
      }
    } else if (source instanceof HTMLImageElement) {
      const src = source.currentSrc || source.src;
      if (!offscreen && src && source.complete && source.naturalWidth) {
        pending.push(
          inlineAsset(src).then((value) => {
            (target as HTMLImageElement).src = value;
          }),
        );
      }
    } else {
      for (const child of Array.from(source.childNodes)) {
        const copy = clone(child);
        if (copy) target.appendChild(copy);
      }
    }
    if (
      source instanceof HTMLInputElement &&
      target instanceof HTMLInputElement
    ) {
      // Passwords are never copied into a texture.
      target.value = source.type === "password" ? "" : source.value;
      target.setAttribute("value", target.value);
      target.checked = source.checked;
      target.toggleAttribute("checked", source.checked);
    }
    if (source instanceof HTMLTextAreaElement)
      target.textContent = source.value;
    if (source instanceof HTMLSelectElement) {
      Array.from(target.querySelectorAll("option")).forEach((option, index) => {
        option.toggleAttribute("selected", source.options[index].selected);
      });
    }
    if (source.namespaceURI !== SVG_NS) {
      for (const pseudo of ["::before", "::after"]) {
        const appearance = getComputedStyle(source, pseudo);
        if (
          appearance.content === "none" ||
          appearance.content === "normal" ||
          appearance.display === "none"
        )
          continue;
        const decoration = document.createElement("span");
        styleNode(decoration, appearance);
        decoration.textContent = appearance.content.replace(/^["']|["']$/g, "");
        if (pseudo === "::before") target.prepend(decoration);
        else target.append(decoration);
      }
    }
    // Extract fixed/stuck elements to viewport coordinates. Otherwise a scrolled
    // clone would move a fixed header or a GSAP pinned section a second time.
    if (style.position === "fixed" || style.position === "sticky") {
      // A sticky box remains in flow. Its placeholder must retain the original
      // margins, padding, border sizing, flex/grid placement and used size.
      // A fixed box is already out of flow and must not add a flex/grid item.
      const spacer =
        style.position === "sticky" ? document.createElement("div") : null;
      if (spacer) {
        spacer.style.cssText = target.style.cssText;
        spacer.style.position = "relative";
        spacer.style.inset = "auto";
        spacer.style.setProperty("inset-block", "auto");
        spacer.style.setProperty("inset-inline", "auto");
        spacer.style.visibility = "hidden";
        spacer.style.pointerEvents = "none";
        spacer.style.transform = "none";
        spacer.removeAttribute("id");
      }
      target.style.position = "absolute";
      target.style.left = `${rect.left}px`;
      target.style.top = `${rect.top}px`;
      target.style.right = "auto";
      target.style.bottom = "auto";
      target.style.width = `${rect.width}px`;
      target.style.height = `${rect.height}px`;
      target.style.margin = "0";
      target.style.transform = "none";
      viewport.append(target);
      return spacer;
    }
    return target;
  };

  const content = clone(root) as HTMLElement | null;
  // Move an independent crop layer, not the copied document. Its recorded
  // viewport offset already includes native/Lenis scroll and remains unchanged
  // when Next resets the live page's scroll. The same layer is serialized into
  // the cloth texture, so preview and raster use exactly the same crop.
  const documentLayer = document.createElement("div");
  // Keep z-index:auto and avoid a transform, which would flatten the document
  // into a new stacking context beneath its extracted fixed/sticky elements.
  documentLayer.style.cssText = `position:absolute;left:${offset.left}px;top:${offset.top}px;width:${offset.width}px;`;
  // A fixed root (the intro cover) was already extracted into viewport above.
  // Ordinary page roots retain their independent, scroll-offset crop layer.
  if (content) {
    content.style.margin = "0";
    documentLayer.append(content);
  }
  viewport.prepend(documentLayer);
  const bodyGrid = getComputedStyle(document.body, "::before");
  if (bodyGrid.content !== "none" && bodyGrid.content !== "normal") {
    const decoration = document.createElement("span");
    styleNode(decoration, bodyGrid);
    decoration.style.position = "absolute";
    decoration.textContent = bodyGrid.content.replace(/^["']|["']$/g, "");
    viewport.append(decoration);
  }
  // Computed SVG paint URLs may be absolute. Rebase both forms to the defs in
  // this serialized image, including masks used by the About signature.
  for (const node of Array.from(viewport.querySelectorAll("*"))) {
    for (const attribute of Array.from(node.attributes)) {
      let value = attribute.value.replace(
        /url\(["']?([^"')]+)["']?\)/g,
        (full, reference: string) => {
          if (!reference.includes("#") || reference.startsWith("data:"))
            return full;
          const url = new URL(reference, location.href);
          const mapped = ids.get(decodeURIComponent(url.hash.slice(1)));
          return mapped &&
            url.origin === location.origin &&
            url.pathname === location.pathname
            ? `url(#${mapped})`
            : full;
        },
      );
      if (
        (attribute.name === "href" || attribute.name === "xlink:href") &&
        value.startsWith("#")
      ) {
        value = `#${ids.get(value.slice(1)) || value.slice(1)}`;
      }
      if (value !== attribute.value) node.setAttribute(attribute.name, value);
    }
  }
  // Attach rejection handlers immediately; rendering may wait for the 3D import.
  const resources = Promise.all(pending);
  void resources.catch(() => {});

  return {
    width,
    height,
    preview: viewport,
    async render(signal) {
      const [, fontCss] = await Promise.all([resources, fonts()]);
      signal.throwIfAborted();
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      const foreign = document.createElementNS(SVG_NS, "foreignObject");
      foreign.setAttribute("width", "100%");
      foreign.setAttribute("height", "100%");
      const style = document.createElement("style");
      style.textContent = fontCss;
      const embedded = viewport.cloneNode(true) as HTMLElement;
      embedded.prepend(style);
      foreign.append(embedded);
      svg.append(foreign);
      // FileReader encodes away from the click task and avoids a huge percent-
      // escaped duplicate of every embedded image/font in the serialized SVG.
      const source = await dataUrl(
        new Blob([new XMLSerializer().serializeToString(svg)], {
          type: "image/svg+xml;charset=utf-8",
        }),
        signal,
      );
      const image = new Image();
      image.src = source;
      await image.decode();
      signal.throwIfAborted();
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Page capture canvas unavailable");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      // Check origin cleanliness now, before handing this to WebGL.
      context.getImageData(0, 0, 1, 1);
      return canvas;
    },
  };
}
