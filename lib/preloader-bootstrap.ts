/** Runs before the first paint; a failed hydration must never cover the site forever. */
export const PRELOADER_BOOTSTRAP = String.raw`(() => {
  const root = document.documentElement;
  if (location.pathname.startsWith('/secret-admin') || root.dataset.preloaderComplete === 'true') return;
  root.classList.add('portfolio-loading');
  root.dataset.preloaderState = 'preparing';
  root.dataset.preloaderStartedAt = String(performance.now());
  const release = () => {
    root.classList.remove('portfolio-loading');
    root.dataset.preloaderComplete = 'true';
    root.dataset.preloaderState = 'complete';
    const page = document.querySelector('[data-preloader-page]');
    if (page) { page.inert = false; page.removeAttribute('aria-busy'); }
    window.dispatchEvent(new Event('portfolio:preloader-complete'));
  };
  let timer = window.setTimeout(release, 8000);
  const hydrated = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(release, 8000);
  };
  const handoff = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(release, 10000);
  };
  const cleanup = () => {
    window.clearTimeout(timer);
    window.removeEventListener('pagehide', release);
    window.removeEventListener('portfolio:preloader-hydrated', hydrated);
    window.removeEventListener('portfolio:preloader-handoff', handoff);
    window.removeEventListener('portfolio:preloader-complete', cleanup);
  };
  window.addEventListener('pagehide', release, { once: true });
  window.addEventListener('portfolio:preloader-hydrated', hydrated);
  window.addEventListener('portfolio:preloader-handoff', handoff, { once: true });
  window.addEventListener('portfolio:preloader-complete', cleanup, { once: true });
})();`;
