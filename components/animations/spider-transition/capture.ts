/** Browser-native, viewport-only DOM rasterization. The frozen DOM is made
 * synchronously, before Next can replace it (including on popstate).
 * Only the transient visual surface is rasterized; the new route stays live. */
const assets = new Map<string, Promise<string>>();
let embeddedFonts: Promise<string> | undefined;
const SVG_NS = "http://www.w3.org/2000/svg";
let captureCount = 0;

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
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
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

export function warmCaptureAssets() {
  void fonts().catch(() => {});
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

  const styleNode = (
    source: Element,
    target: HTMLElement | SVGElement,
    pseudo?: string,
    embedBackground = true,
  ) => {
    const style = getComputedStyle(source, pseudo);
    for (let i = 0; i < style.length; i++) {
      const key = style[i];
      target.style.setProperty(
        key,
        style.getPropertyValue(key),
        style.getPropertyPriority(key),
      );
    }
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
    const rect = source.getBoundingClientRect();
    const style = getComputedStyle(source);
    if (style.display === "none" || style.visibility === "hidden") return null;
    const target =
      source instanceof HTMLCanvasElement || source instanceof HTMLVideoElement
        ? document.createElement("img")
        : (source.cloneNode(false) as HTMLElement | SVGElement);
    if (source.id) {
      ids.set(source.id, `${idPrefix}${source.id}`);
      target.id = `${idPrefix}${source.id}`;
    }
    target.removeAttribute("srcset");
    target.removeAttribute("sizes");
    target.removeAttribute("loading");
    target.removeAttribute("autofocus");
    // Keep the off-screen element's dimensions for layout, but don't rasterize
    // or fetch its descendants. Ancestors spanning the viewport are retained.
    const offscreen =
      rect.bottom < -8 ||
      rect.top > height + 8 ||
      rect.right < -8 ||
      rect.left > width + 8;
    styleNode(source, target, undefined, !offscreen);
    if (offscreen && rect.height > 0 && style.position !== "fixed") {
      target.style.visibility = "hidden";
      target.style.backgroundImage = "none";
      target.removeAttribute("src");
      target.removeAttribute("poster");
      return target;
    }
    if (source instanceof HTMLCanvasElement && source.width && source.height) {
      (target as HTMLImageElement).src = source.toDataURL("image/png");
    } else if (source instanceof HTMLVideoElement) {
      const frame = document.createElement("canvas");
      frame.width = source.videoWidth;
      frame.height = source.videoHeight;
      frame.getContext("2d")?.drawImage(source, 0, 0);
      (target as HTMLImageElement).src = frame.toDataURL();
    } else if (source instanceof HTMLImageElement) {
      const src = source.currentSrc || source.src;
      if (src && source.complete && source.naturalWidth) {
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
        styleNode(source, decoration, pseudo);
        decoration.textContent = appearance.content.replace(/^["']|["']$/g, "");
        if (pseudo === "::before") target.prepend(decoration);
        else target.append(decoration);
      }
    }
    // Extract fixed/stuck elements to viewport coordinates. Otherwise a scrolled
    // clone would move a fixed header or a GSAP pinned section a second time.
    if (style.position === "fixed" || style.position === "sticky") {
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
      const spacer = document.createElement("div");
      spacer.style.cssText = `width:${rect.width}px;height:${style.position === "sticky" ? rect.height : 0}px;`;
      return spacer;
    }
    return target;
  };

  const content = clone(root) as HTMLElement;
  content.style.position = "absolute";
  content.style.left = `${offset.left}px`;
  content.style.top = `${offset.top}px`;
  content.style.width = `${width}px`;
  content.style.margin = "0";
  viewport.prepend(content);
  const bodyGrid = getComputedStyle(document.body, "::before");
  if (bodyGrid.content !== "none" && bodyGrid.content !== "normal") {
    const decoration = document.createElement("span");
    styleNode(document.body, decoration, "::before");
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
      const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
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
