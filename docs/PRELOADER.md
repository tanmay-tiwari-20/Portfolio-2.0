# Portfolio introduction

The first public document opens with a central percentage and six staggered personal cards, without a header or footer. Phones and short landscape viewports keep four cards and a compact composition. The name card uses `/icon.svg`; the community card uses the same `hackshastra.logo` source as the HackShastra page. The colors, Inter/Poppins typography, tagline, name, role and location come from the portfolio.

At completion, the existing Spider scene pulls away a captured image of the intro to expose the loaded page. This entry point does not navigate, change focus, play gesture-restricted audio or change ordinary route transitions. The existing character, cloth, motion constants and navigation behavior remain in place. Reduced motion bypasses decorative motion and the Spider effect.

## Files and customization

- `components/animations/site-preloader.tsx`: card copy, supplied profile fields, counter, initial-document lifecycle. `COUNT_DURATION_MS` targets 3000ms from the bootstrap rather than hydration, with no additional display hold at 100%.
- `components/animations/site-preloader.module.css`: cards, stagger, breakpoints, colors and typography. Change the existing theme variables rather than adding another palette.
- `lib/preloader-ready.ts`: readiness and abortable listeners; unit tests run with `npm run test:preloader`.
- `lib/preloader-bootstrap.ts`: before-paint loading marker and independent fail-open watchdog.
- `components/animations/page-transition.tsx`: optional initial-intro entry point into the existing Spider scene.

## Readiness and recovery

The percentage represents completed preparation tasks, not downloaded bytes. A continuous counter targets three seconds from first appearance while following readiness, using a lightweight timer and small, time-based catch-up steps so late callbacks do not require another full counting cycle. Long main-thread stalls can still extend the target, but no artificial hold is added. It accounts for the committed DOM, the display/body fonts actually used, first-viewport eager images, intro logos and two paint opportunities. Offscreen images, lazy media, analytics and optional portrait WebGL do not hold the intro. Rejected assets settle; a shared 2400ms asset deadline releases stalled resources. The final 100% marks the completed readiness decision, including any fallback.

The bootstrap releases a document that never hydrates within eight seconds and refreshes that bound when the controller hydrates. Fonts, logo bytes and shaders warm before handoff. A late route controller gets a two-second handshake window; accepted Spider handoffs have a separate ten-second watchdog. Intro scene preparation has a three-second deadline, and the unchanged animation lasts about 4.3 seconds. These deadlines only bound failures; they do not add display time. Errors, hidden-page navigation, Escape during the flight and reduced-motion changes release cleanly. All readiness, animation and lifecycle listeners are canceled. Only the HTML element is scroll-locked, preserving sticky layouts. An independent inert wrapper avoids ownership conflicts with route transitions.

JavaScript-disabled documents show the portfolio directly. Admin pages do not run the intro. Ordinary re-renders, navigation and Back/Forward do not replay it. Home/About entrances coordinate with the reveal, and the About signature keeps its full-completion gate.

The DitherVeil enhancement starts after the cover clears, keeping the base portrait visible until the first successful render. It resumes on both loader and route completion, and recovers after WebGL context loss, tab visibility changes and viewport re-entry.

## Browser verification

Run `scripts/preloader-browser.mjs` against a local server. `PRELOADER_BASE_URL` selects its URL and `PRELOADER_PLAYWRIGHT_MODULE` can point to an existing `playwright-core/index.mjs`; no new dependency is required. Optional `PRELOADER_CASE` narrows the run; `PRELOADER_BROWSERS` selects installed browser engines. The script covers responsive viewports, readiness/failure cases, reduced motion, no JavaScript, admin exclusion and navigation.

Screenshots and reports are written to `artifacts/preloader-verification`. Remote image bytes in this deterministic suite are fixtures; local brand artwork, layout, application code, capture and Spider animation are real. `scripts/spider-capture-browser.mjs` also covers capturing a fixed intro root after its live source has been removed.
