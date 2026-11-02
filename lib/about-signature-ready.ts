export type AboutSignatureReadyResult = "animate" | "static";

type AboutSignatureReadyOptions = {
  root: HTMLElement;
  signal: AbortSignal;
  imageSources?: readonly string[];
};

const READY_TIMEOUT_MS = 15_000;

/**
 * Observe the existing page lifecycle without advancing or replaying it.
 * A stalled resource results in a static signature, never an early animation.
 */
export async function waitForAboutSignatureReady({
  root,
  signal,
  imageSources = [],
}: AboutSignatureReadyOptions): Promise<AboutSignatureReadyResult> {
  if (signal.aborted || !root.isConnected) return "static";

  const pending = new AbortController();
  const abort = () => pending.abort();
  signal.addEventListener("abort", abort, { once: true });

  let timeout: number | undefined;
  let stopListeningForAbort: (() => void) | undefined;

  const fallback = new Promise<AboutSignatureReadyResult>((resolve) => {
    const finish = () => resolve("static");
    timeout = window.setTimeout(finish, READY_TIMEOUT_MS);
    pending.signal.addEventListener("abort", finish, { once: true });
    stopListeningForAbort = () =>
      pending.signal.removeEventListener("abort", finish);
  });

  const prepare = async (): Promise<AboutSignatureReadyResult> => {
    const pageImages = Array.from(
      root.querySelectorAll<HTMLImageElement>("[data-about-visual] img"),
    );
    const presentSources = new Set(
      pageImages.map((image) => image.currentSrc || image.src),
    );
    const additionalImages = [...new Set(imageSources)]
      .filter((source) => source && !presentSources.has(source))
      .map((source) => {
        // Match the gallery's detached warm-up without touching its DOM or props.
        const image = new window.Image();
        image.decoding = "async";
        image.src = source;
        return image;
      });

    await Promise.all([
      waitForCondition(
        window,
        "load",
        () => document.readyState === "complete",
        pending.signal,
      ),
      waitForCondition(
        window,
        "portfolio:preloader-complete",
        () => {
          const html = document.documentElement;
          return (
            html.dataset.preloaderComplete === "true" ||
            (!html.classList.contains("portfolio-loading") &&
              !document.querySelector(".site-preloader"))
          );
        },
        pending.signal,
      ),
      document.fonts?.ready,
      waitForCondition(
        root,
        "portfolio:about-entrance-complete",
        () => root.dataset.aboutEntranceComplete === "true",
        pending.signal,
      ),
      ...[...pageImages, ...additionalImages].map((image) =>
        waitForImage(image, pending.signal),
      ),
    ]);

    if (pending.signal.aborted || !root.isConnected) return "static";
    await waitForPageTransition(root, pending.signal);
    return pending.signal.aborted || !root.isConnected ? "static" : "animate";
  };

  try {
    return await Promise.race([
      prepare().catch(() => "static" as const),
      fallback,
    ]);
  } finally {
    if (timeout !== undefined) window.clearTimeout(timeout);
    stopListeningForAbort?.();
    signal.removeEventListener("abort", abort);
    // Releases every pending image, load, entrance, and frame listener.
    pending.abort();
  }
}

function waitForCondition(
  target: EventTarget,
  event: string,
  ready: () => boolean,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      target.removeEventListener(event, check);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const check = () => {
      if (ready()) finish();
    };

    target.addEventListener(event, check);
    signal.addEventListener("abort", finish, { once: true });
    if (signal.aborted) finish();
    else check();
  });
}

function waitForImage(
  image: HTMLImageElement,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      image.removeEventListener("load", loaded);
      image.removeEventListener("error", finish);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const loaded = () => {
      // An error is a settled image: the protected gallery supplies its fallback.
      if (!image.naturalWidth || typeof image.decode !== "function") finish();
      else void image.decode().then(finish, finish);
    };

    image.addEventListener("load", loaded);
    image.addEventListener("error", finish);
    signal.addEventListener("abort", finish, { once: true });
    if (signal.aborted) finish();
    else if (image.complete) loaded();
  });
}

function waitForPageTransition(
  root: HTMLElement,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    let frame = 0;
    let settledFrames = 0;

    const finish = () => {
      window.cancelAnimationFrame(frame);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const check = () => {
      if (signal.aborted || !root.isConnected) {
        finish();
        return;
      }

      let settled = true;
      let ancestor = root.parentElement;
      while (ancestor && ancestor !== document.body) {
        const style = window.getComputedStyle(ancestor);
        if (
          Number(style.opacity) < 1 ||
          !isIdentityTransform(style.transform)
        ) {
          settled = false;
          break;
        }
        ancestor = ancestor.parentElement;
      }

      settledFrames = settled ? settledFrames + 1 : 0;
      if (settledFrames >= 2) finish();
      else frame = window.requestAnimationFrame(check);
    };

    signal.addEventListener("abort", finish, { once: true });
    if (signal.aborted) finish();
    else frame = window.requestAnimationFrame(check);
  });
}

function isIdentityTransform(transform: string): boolean {
  const compact = transform.replace(/\s/g, "");
  return (
    !compact ||
    compact === "none" ||
    compact === "matrix(1,0,0,1,0,0)" ||
    compact === "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)"
  );
}
