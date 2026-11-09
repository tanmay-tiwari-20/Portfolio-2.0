type PreloaderReadyOptions = {
  root: HTMLElement;
  signal: AbortSignal;
  onProgress?: (progress: number) => void;
};

const ASSET_TIMEOUT_MS = 2400;
const PAINT_TIMEOUT_MS = 160;

/**
 * Wait for the committed first viewport, not every resource in the portfolio.
 * Failed assets count as settled; timed-out assets do not inflate progress.
 * Cancellation and the resource deadline always release the caller.
 */
export async function waitForPreloaderReady({
  root,
  signal,
  onProgress,
}: PreloaderReadyOptions): Promise<void> {
  if (signal.aborted || !root.isConnected) return;

  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view) return;

  const pending = new AbortController();
  const abort = () => pending.abort();
  signal.addEventListener("abort", abort, { once: true });
  const timeout = view.setTimeout(abort, ASSET_TIMEOUT_MS);

  try {
    onProgress?.(0);
    const committed = await waitForDocument(document, pending.signal);
    if (!committed || signal.aborted || !root.isConnected) return;

    const fonts = new Set<string>();
    const tasks: Promise<boolean>[] = [];
    if (document.fonts?.load) {
      const fontElements = [
        document.body,
        root.querySelector<HTMLElement>("main h1, h1"),
        document.querySelector<HTMLElement>(
          ".site-preloader [data-preloader-tagline]",
        ),
        document.querySelector<HTMLElement>(
          ".site-preloader [data-preloader-progress]",
        ),
      ];
      for (const element of fontElements) {
        if (!element) continue;
        const style = view.getComputedStyle(element);
        const font = `${style.fontStyle} ${style.fontWeight} 16px ${style.fontFamily}`;
        if (fonts.has(font)) continue;
        fonts.add(font);
        try {
          tasks.push(
            waitForPromise(
              document.fonts.load(
                font,
                element.textContent?.trim().slice(0, 128) || "Portfolio",
              ),
              pending.signal,
            ),
          );
        } catch {
          // Unsupported font descriptors use the already-painted fallback.
          tasks.push(Promise.resolve(true));
        }
      }
    }

    const preloader = document.querySelector<HTMLElement>(".site-preloader");
    const images = new Set([
      ...root.querySelectorAll<HTMLImageElement>("img"),
      ...(preloader?.querySelectorAll<HTMLImageElement>("img") ?? []),
    ]);
    for (const image of images) {
      if (image.loading === "lazy" || !(image.currentSrc || image.src))
        continue;
      const bounds = image.getBoundingClientRect();
      if (
        bounds.width <= 0 ||
        bounds.height <= 0 ||
        bounds.bottom <= 0 ||
        bounds.top >= view.innerHeight ||
        bounds.right <= 0 ||
        bounds.left >= view.innerWidth
      )
        continue;
      // The initial cover intentionally hides the content wrapper. Inherited
      // visibility must not exclude its still-laid-out critical portrait.
      // Compact detail cards removed from layout have zero image bounds above.
      tasks.push(waitForImage(image, pending.signal));
    }

    // DOM commit and the final paint are real tasks alongside selected assets.
    const total = tasks.length + 2;
    let completed = 1;
    onProgress?.(completed / total);
    await Promise.all(
      tasks.map(async (task) => {
        const settled = await task;
        if (settled && !pending.signal.aborted && !signal.aborted) {
          completed += 1;
          onProgress?.(completed / total);
        }
      }),
    );
    view.clearTimeout(timeout);
    if (signal.aborted || !root.isConnected) return;

    // A hidden tab may never run rAF; its timer fallback must still fail open.
    if ((await waitForPaint(view, signal)) && !signal.aborted) {
      completed += 1;
      onProgress?.(completed / total);
    }
  } finally {
    view.clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
    pending.abort();
  }
}

/** Start existing page motion only when its initial cover has been released. */
export function waitForPreloaderRelease(signal: AbortSignal): Promise<void> {
  return waitForPreloaderEvent(signal, false);
}

/** Begin the home entrance while the cover lifts, without unlocking scrolling. */
export function waitForPreloaderReveal(signal: AbortSignal): Promise<void> {
  return waitForPreloaderEvent(signal, true);
}

function waitForPreloaderEvent(
  signal: AbortSignal,
  includeReveal: boolean,
): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      window.removeEventListener("portfolio:preloader-complete", finish);
      window.removeEventListener("portfolio:preloader-reveal", finish);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    window.addEventListener("portfolio:preloader-complete", finish);
    if (includeReveal)
      window.addEventListener("portfolio:preloader-reveal", finish);
    signal.addEventListener("abort", finish, { once: true });
    if (
      signal.aborted ||
      (includeReveal &&
        document.documentElement.dataset.preloaderState === "revealing") ||
      !document.documentElement.classList.contains("portfolio-loading")
    )
      finish();
  });
}

function waitForDocument(
  document: Document,
  signal: AbortSignal,
): Promise<boolean> {
  return new Promise((resolve) => {
    const finish = (ready: boolean) => {
      document.removeEventListener("DOMContentLoaded", loaded);
      signal.removeEventListener("abort", aborted);
      resolve(ready);
    };
    const loaded = () => finish(true);
    const aborted = () => finish(false);
    document.addEventListener("DOMContentLoaded", loaded, { once: true });
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
    else if (document.readyState !== "loading") loaded();
  });
}

function waitForPromise(
  promise: Promise<unknown>,
  signal: AbortSignal,
): Promise<boolean> {
  return new Promise((resolve) => {
    let finished = false;
    const finish = (settled: boolean) => {
      if (finished) return;
      finished = true;
      signal.removeEventListener("abort", aborted);
      resolve(settled);
    };
    const aborted = () => finish(false);
    signal.addEventListener("abort", aborted, { once: true });
    void promise.then(
      () => finish(true),
      () => finish(true),
    );
    if (signal.aborted) aborted();
  });
}

function waitForImage(
  image: HTMLImageElement,
  signal: AbortSignal,
): Promise<boolean> {
  return new Promise((resolve) => {
    let finished = false;
    let decoding = false;
    const finish = (settled: boolean) => {
      if (finished) return;
      finished = true;
      image.removeEventListener("load", loaded);
      image.removeEventListener("error", failed);
      signal.removeEventListener("abort", aborted);
      resolve(settled);
    };
    const loaded = () => {
      if (finished || decoding) return;
      if (!image.naturalWidth || typeof image.decode !== "function") {
        finish(true);
        return;
      }
      decoding = true;
      try {
        void image.decode().then(
          () => finish(true),
          () => finish(true),
        );
      } catch {
        finish(true);
      }
    };
    const failed = () => finish(true);
    const aborted = () => finish(false);
    image.addEventListener("load", loaded);
    image.addEventListener("error", failed);
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
    else if (image.complete) loaded();
  });
}

function waitForPaint(view: Window, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    let frame = 0;
    let frames = 0;
    const finish = (painted: boolean) => {
      view.cancelAnimationFrame(frame);
      view.clearTimeout(timeout);
      signal.removeEventListener("abort", aborted);
      resolve(painted);
    };
    const aborted = () => finish(false);
    const paint = () => {
      frames += 1;
      if (frames === 2) finish(true);
      else frame = view.requestAnimationFrame(paint);
    };
    const timeout = view.setTimeout(() => finish(false), PAINT_TIMEOUT_MS);
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
    else frame = view.requestAnimationFrame(paint);
  });
}
