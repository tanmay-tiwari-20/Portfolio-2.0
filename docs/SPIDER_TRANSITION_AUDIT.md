# Transition architecture audit

Inspected 4 November 2026. This records the existing architecture and integration constraints before the cinematic transition was implemented. It is not a claim that every proposed browser test has passed.

## Existing application

- Installed Next.js 16.4.2, React 19.3.1, and Three.js 0.180.0. The project also already uses GSAP, Framer Motion, Anime.js, Lenis, and OGL.
- Next App Router; root layout and public pages use asynchronous server rendering with dynamic MongoDB or JSON repository content.
- Public destinations are `/`, `/about`, `/projects`, `/projects/[slug]`, `/hackshastra`, `/hackathons`, and `/contact`. `/experience` permanently redirects to `/about`.
- Header, menu, homepage buttons, project cards, and cinematic footer use Next Link. Browser history remains Next-managed. Admin login currently performs a full-document navigation after authentication; protected admin routes can redirect to login.
- The root `Footer` component returns null. The substantial cinematic footer is rendered by the homepage itself.

## Loading and motion

- The root mounted `components/animations/preloader.tsx`, a red full-screen loading overlay with a document-load wait and minimum display period.
- `app/loading.tsx` supplied a route suspense screen reading “Loading the next scene.” Removing this file is preferable to returning null: a null fallback still allows a temporarily blank destination to commit.
- The previous `components/animations/page-transition.tsx` keyed Framer Motion by pathname, using an exit/enter fade and translation.
- The dynamic OGL portrait in `components/hero-portrait.tsx` used a spinner fallback. A real portrait fallback avoids revealing that spinner when the home route becomes ready.
- Upload, form submission, admin data fetch, and save indicators are unrelated to page transitions and should remain.
- About motion and signature readiness already tolerate absence of the preloader. Their guards consider the document ready when `.portfolio-loading` and `.site-preloader` are absent. Existing tests cover fonts, image decoding/errors, animation readiness, timeout, and cancellation.
- Every public page mounts `MotionLayer`, which creates and tears down Lenis and scroll animation resources. A transition should explicitly stop/resume Lenis; hiding overflow alone does not stop programmatic scrolling.

## Rendering and navigation hazards

- The header is normally absolute at z-index 100000; its open-menu state is fixed at 100005. The menu portals to the body, and admin modals reach 100020. The transition must be above these layers and must capture the full visible page, including the header.
- The menu owns an inline body overflow lock and closes over roughly half a second. Transition scroll locking must not be undone by that cleanup. Menu navigation should close the menu before the outgoing-page capture or deliberately exclude the menu surface.
- The body has a fixed decorative grid pseudo-element. Pages use modern CSS, web fonts, remote images, canvas content, varied page heights, and scroll pinning; capture needs to preserve the viewport rather than rescale the entire document into a screen-sized texture.
- Existing OGL portrait rendering does not request `preserveDrawingBuffer`. Capture must arrange a fresh render or enable preservation to avoid a blank canvas in the texture.
- No DOM rasterization dependency was installed at audit time. Browser foreignObject based rendering is preferable to a hand-built canvas CSS renderer for this site's modern CSS. Cross-origin images and fonts must be embedded before rasterization; failures should fall back to usable navigation, never a blank generic texture.
- Existing CSP permits Cloudinary and Unsplash in `img-src`, but not their display hosts in `connect-src`. DOM rasterization fetching those resources requires narrowly extending `connect-src`. Embedded font data requires `font-src 'self' data:`; blob image URLs require `blob:` in `img-src` if used.
- Capture before `router.push`, keep that outgoing representation visible while the next server tree prepares, and reveal only after the actual destination commits. Redirects mean the final pathname may differ from the requested pathname.
- Browser popstate is already a navigation event. Preserve the outgoing DOM before React replaces it; do not begin an asynchronous live-node capture after route commit and assume it still contains the previous page.
- Same route/hash clicks, external URLs, downloads, API exports, alternate targets, non-primary and modified clicks must preserve native browser behavior. Query-string changes remain navigation candidates.
- Direct entry and refresh must leave the application accessible without requiring an animation. Reduced motion, capture failures, unavailable WebGL, interruption, and timeouts must always restore interaction and scroll.

## Verification resources and coverage

Playwright Core 1.64.1 is installed at `C:\Users\hp\OMS\node_modules\playwright-core`. Chromium, Firefox, and WebKit are installed under `C:\Users\hp\AppData\Local\ms-playwright`; no browser download is needed on this workstation.

Suggested viewport coverage: desktop 1440 × 900, tablet 820 × 1180, mobile 390 × 844, plus a narrow landscape or ultrawide sample.

Meaningful navigation verification includes menu, footer, button and project-detail links; scrolled-page alignment; browser back/forward; redirected `/experience`; 404; delayed server responses; delayed/failed images; rapid/repeated requests; current route/hash/modifiers/download exclusions; reduced motion; resize or orientation changes during animation; and WebGL context loss. Check final focus, removal of inert/scroll locks, absence of duplicate overlays, and disposal of temporary textures and requestAnimationFrame callbacks.
