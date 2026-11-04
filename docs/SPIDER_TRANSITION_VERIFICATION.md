# Spider-Man page transition: implementation and verification

4 November 2026

The reusable transition is implemented in the existing portfolio. Numerical tests and static checks have passed. Browser visual acceptance, real navigation acceptance, and GPU frame-rate measurements remain outstanding because automatic approval review denied local browser access. This report distinguishes implemented behavior from observed verification.

## Files

Created:

| File                                                           | Purpose                                                                                              |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `components/animations/spider-transition/capture.ts`           | Synchronous viewport freeze, asset/font embedding, SVG reference preservation, browser rasterization |
| `components/animations/spider-transition/character.ts`         | Original procedural character, 17-bone rig, suit geometry/materials, poses                           |
| `components/animations/spider-transition/character-sources.md` | Visual research, evaluated asset licenses, original asset provenance                                 |
| `components/animations/spider-transition/cloth.ts`             | Deformable page mesh, constrained simulation, fold shading                                           |
| `components/animations/spider-transition/motion.ts`            | Shared, deterministic swing trajectory and timing                                                    |
| `components/animations/spider-transition/navigation.ts`        | Pure internal-navigation eligibility and route-key helpers                                           |
| `components/animations/spider-transition/scene.ts`             | Persistent Three.js renderer, camera, lights, character/web/cloth coordination                       |
| `components/animations/spider-transition/transition.css`       | Global canvas layer, viewport coverage, scroll lock, reduced-motion rules                            |
| `components/animations/spider-transition/web.ts`               | Braided 3D web filaments, anchor attachment, vibration and release                                   |
| `scripts/spider-cloth.test.ts`                                 | Initial coverage, hand constraint, lag, folds, exit, reset, disposal tests                           |
| `scripts/spider-motion.test.ts`                                | Real rig/cloth attachment, responsive trajectory, face/chest visibility raycasts                     |
| `scripts/spider-navigation.test.ts`                            | Link eligibility, hash, query, modifier, download, target and API tests                              |
| `scripts/spider-browser.mjs`                                   | Browser acceptance harness prepared for an authorized local run; not executed                        |
| `docs/SPIDER_TRANSITION_AUDIT.md`                              | Original architecture, loading, rendering and navigation audit                                       |
| `docs/SPIDER_TRANSITION_VERIFICATION.md`                       | This implementation and verification report                                                          |

Modified:

| File                                        | Change                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `app/layout.tsx`                            | Wraps header, main and footer in the global transition; removes initial preloader          |
| `app/globals.css`                           | Removes obsolete full-screen loader styles                                                 |
| `components/animations/page-transition.tsx` | Replaces Framer fade/translation with capture, route readiness and cinematic orchestration |
| `components/animations/staggered-menu.tsx`  | Closes menu immediately at transition start                                                |
| `components/animations/dither-veil.tsx`     | Redraws the actual canvas synchronously for viewport capture                               |
| `components/hero-portrait.tsx`              | Removes the dynamic-import spinner and retains the portrait beneath the canvas             |
| `components/shell.tsx`                      | Stops/resumes Lenis around transitions, including a newly mounted destination              |
| `lib/about-signature-ready.ts`              | Delays the About signature until the global transition finishes                            |
| `scripts/about-signature-ready.test.ts`     | Covers the global transition readiness gate                                                |
| `next.config.ts`                            | Allows embedding existing display-image hosts and local font data under the CSP            |

Deleted:

- `app/loading.tsx`: the “Loading the next scene” route suspense screen.
- `components/animations/preloader.tsx`: the initial full-screen “Building the web” loading experience.

Form submission, upload, save and component data-loading indicators remain intact. `package.json` and `package-lock.json` are unchanged: **no dependencies were added**.

## Architecture and interaction

The application remains Next.js 16.4.2 with the App Router, React 19.3.1, and the existing Three.js 0.180.0 dependency. No new React Three Fiber, GSAP wrapper, physics engine or screenshot dependency was installed. The renderer operates outside React reconciliation; React manages route lifecycle and the persistent host elements.

The nominal sequence now lasts about 4.3 seconds after preparation, using 0.8x playback of the same choreography. The web reaches its upper anchor around 0.34 seconds. The character approaches the outgoing page and makes contact at about 1.31 seconds; the main pull lasts 2.5 seconds. The web releases near the right viewport edge around 2.51 seconds, with 0.30 seconds of hand opening and silk release. The animation and cloth simulation share the slowed clock; frame-rate monitoring and the navigation timeout retain real time. The actor continues along the swing tangent while the cloth finishes its exit. The sequence holds at contact when the destination is not yet ready rather than pulling away a surface over an unfinished route.

### Character and asset provenance

The actor is a real articulated 3D model generated by project code, with 17 bones, smooth skin weights, anatomical cross sections, red/blue suit panels, fabric weave, raised geometric webbing, eye lenses, fingers, and front/back spider emblems. The refined choreography uses screen-readable asymmetric knee tucks, a leading kick and delayed trailing-leg extension, loaded elbows and shoulders, hip/chest counterrotation, and head tracking. The action is timed to the visible swing; web fingers open during release. The scene follows a framed elliptical arc with velocity-matched entry, accelerates through the low point, then continues along the release tangent under gravity. This removes the former stop/restart at page contact.

Both hands are actual nodes in the posed rig. After each pose update, the scene obtains their world positions. It offsets the actor so the gripping palm lies exactly on the target trajectory, supplies that same palm to the cloth constraint, and uses the other palm as the web endpoint. Numerical tests use the actual rig and cloth together, not a separate substitute path.

Movie suit research and evaluated commercial/fan assets are documented in [character-sources.md](../components/animations/spider-transition/character-sources.md). The research includes Raimi-era suit construction, The Amazing Spider-Man production notes, and MCU design references. Editorial/IP-restricted candidates were not integrated; another candidate's license and provenance could not be fully inspected. No third-party character mesh, movie/game asset, texture pack, or reference imagery was downloaded into the project.

Three.js is an existing MIT-licensed dependency. Original procedural geometry avoids the evaluated model licenses but does not establish rights to Marvel characters or marks. This implementation claims no official affiliation or movie-asset license.

### Web

The refined web consists of 13 braided, lit tubular filaments with a shared procedural silk bump/roughness texture. The cable is approximately 7–8 pixels thick at unit scale. Its irregular, branching attachment spans about 242 pixels at unit scale and about 121 pixels on the mobile setting, with cross-linked fibers and sparse curved translucent membrane patches. These elements are batched into four meshes. It has modeled thickness, highlights and a spread of attachment strands at the upper anchor. A damped oscillation supplies the tension/vibration response after the shot; the endpoint tracks the posed hand. Release increases sag and reduces strand opacity continuously before removal.

This is a procedural elastic web animation, not a general-purpose rope dynamics solver.

### Outgoing page and cloth

The outgoing visible viewport is cloned synchronously before requesting the destination, including browser Back/Forward handling. Computed styles, current form values, visible image resources, pseudo-element appearance and canvas output are preserved where supported. Password values are excluded. The freeze preserves scroll alignment and handles fixed/sticky elements in viewport coordinates.

The temporary DOM copy lives in an inert, hidden-from-accessibility shadow-root preview, so destination animations cannot discover it through document-wide selectors. SVG IDs and local paint references are remapped for signature masks and gradients. Local fonts and eligible image resources are embedded before the browser renders the copy through SVG `foreignObject` into a canvas.

That canvas becomes the texture of a subdivided, two-sided Three.js mesh. The sheet initially matches the viewport exactly, with correct UV alignment. A fixed left-edge vertex is constrained to the actual palm. A moving rest surface supplies broad folds, curl and gathering; damped integration and distance/bending constraints supply lag, limited stretch and local puckering. The disturbance propagates outward from contact, so the far edge starts moving later. Fold shading adds depth while the initial flat sheet retains page colors.

The image is therefore a temporary high-resolution representation of the actual visible outgoing content, deformed on a real 3D mesh. It is not a live DOM surface once captured. Outgoing video, canvas animation and form interaction are frozen during the flight; the destination remains the real rendered application underneath.

### Routing, accessibility and cleanup

Next retains control of routing, history, redirects and server rendering. Ordinary same-origin links are intercepted before `router.push`. A capture-phase `popstate` listener freezes the outgoing view before the destination commit. The route observer and React transition settlement handle completion and no-op redirects, including the existing `/experience` alias for `/about`.

The destination's committed DOM is checked for visible image decoding and font readiness, with a bounded two-second asset wait and two settling frames. A 12-second navigation safeguard releases the visual layer if route preparation stalls. A failed image or expired readiness bound can still leave its normal fallback in the destination; the safeguard prioritizes continued access to the site.

There is one active flight and at most one queued destination. Current-route/hash links, external URLs, modified or non-primary clicks, downloads, alternate browsing contexts, and API exports retain native behavior. Query changes remain eligible. Direct entry and refresh show the application without requiring a flight.

The visual overlay is inert and `aria-hidden`. The live page is temporarily inert during a flight; scrolling and Lenis resume on completion or interruption. Focus moves to the destination hash target, heading or main landmark after navigation; interruption before commit can restore the previously focused control. Escape, resize, visibility changes, page exit, preference changes and WebGL context loss release the transition. Reduced-motion users receive native navigation without the swing.

## Performance measures and observations

Implemented measures:

- Lazy-load and idle-prewarm the scene; reuse the renderer, rig, web geometry and materials across navigations.
- Keep per-frame updates outside React state and reconciliation.
- Capture only the viewport and avoid walking/fetching offscreen descendant content.
- Cache embedded assets with a bounded 48-entry map and reuse embedded fonts.
- Cap capture density at 2 on desktop and 1.5 on narrow screens; cap scene rendering at 1.75 for desktop and 1.25 for the smaller quality setting.
- Use 32 cloth rows and 20–52 columns for high quality; 18 rows and 12–30 columns for low quality. The largest meshes have 1,749 and 589 vertices respectively.
- Use four or three constraint iterations, bounded substeps, and typed-array simulation buffers.
- Reduce renderer pixel ratio once sustained frame pressure is detected.
- Avoid post-processing. Redraw the existing portrait only when capture needs it rather than enabling continuous framebuffer preservation.
- Dispose the temporary cloth geometry/material and page texture after each flight. Release the persistent rig, web and renderer on unmount. Remove listeners, pending RAF work and locks during cleanup.

Measured cloth CPU timings on this workstation:

| Quality | Median update | 95th percentile update |
| ------- | ------------: | ---------------------: |
| High    |       2.78 ms |                3.65 ms |
| Low     |       0.80 ms |                1.05 ms |

These timings cover cloth CPU work only. They exclude DOM capture, asset preparation, character/web updates, GPU rendering and the destination page's own animation work. They do **not** verify a 60 FPS end-to-end frame rate.

## Verification evidence

| Check                           | Result and scope                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node test suite                 | 66 passed: 26 Spider transition tests and 40 portfolio tests                                                                                                                                                   |
| TypeScript                      | Standalone `typecheck` passed again; the webpack production build also passed its TypeScript stage in 13.3 seconds                                                                                             |
| Targeted ESLint                 | New transition modules and tests have no errors; the existing DitherVeil `<img>` optimization warning remains                                                                                                  |
| Cloth numerical tests           | Exact starting bounds/UVs and grip point; delayed far edge; finite folds; complete exit; reset and disposal behavior passed                                                                                    |
| Rig + cloth integration         | Shared real palm/cloth attachment and full exit passed across six viewport dimensions                                                                                                                          |
| Character visibility            | Sampled raycasts verify face and chest remain in front of the opaque page during the visible pull                                                                                                              |
| Navigation helper tests         | Native exclusions, relative/internal destinations, query changes, API exports and malformed inputs passed                                                                                                      |
| About signature readiness       | Existing readiness/cancellation coverage plus the new global-transition gate passed                                                                                                                            |
| Production build                | Partial: webpack compiled successfully in 22 seconds, passed TypeScript, and generated 11 static endpoints; standalone packaging failed with a filesystem permission error. This is not a complete build pass. |
| Browser harness syntax          | `scripts/spider-browser.mjs` passed syntax checking; browser execution remains pending                                                                                                                         |
| Browser visual/navigation tests | Not run: local browser access was rejected by automatic approval review                                                                                                                                        |

The six numerical viewport cases are 320 × 568, 390 × 844, 768 × 1024, 1366 × 768, 1440 × 900, and 3440 × 1440. These validate trajectory, mesh and rig math at mobile, tablet, laptop, desktop and ultrawide dimensions. They do **not** constitute browser layout, screenshot or device testing.

The default Turbopack compilation stalled and was stopped. A subsequent `next build --webpack` compiled successfully in 22 seconds, completed build-time TypeScript checking in 13.3 seconds, and generated 11 static endpoints. The final standalone packaging stage failed with `EPERM` while creating `C:\Users\hp\portfolio\.next\standalone\node_modules\next\dist\server\app-render`. A repeat webpack build again compiled successfully (10.8 seconds), passed TypeScript (10.0 seconds), and generated all 11 static endpoints, but failed packaging with EPERM at C:\Users\hp\portfolio\.next\standalone\node_modules\sharp\dist. An explicitly requested build retry outside the filesystem sandbox was then rejected because automatic approval review itself failed (content-blocked review error); it was not executed. This confirms compilation and type checking, but does not confirm a deployable standalone build. No dependency or package script changes were made to work around the packaging error.

The added `scripts/spider-character-motion.test.ts` checks projected leg motion, actual skinned-vertex/bone-palette deformation, smooth joint changes, hand release and route-hold safety. `scripts/spider-web.test.ts` checks attachment spread, cable thickness, microtexture, exact tether endpoints, resource reuse and disposal. The swing suite now checks matching velocities at contact/release and continuous airborne motion. The final refinement passed all 66 tests, TypeScript and targeted ESLint. Browser opening at `http://localhost:3000` was attempted again for this revision and automatic approval review failed before navigation; visual confirmation remains pending. No new full production build was run for this refinement; the packaging results below belong to the initial implementation.

The prepared `scripts/spider-browser.mjs` harness includes desktop 1440 × 900, tablet 820 × 1180 and mobile 390 × 844 runs. It requires an actual pulling phase so a silent native fallback cannot falsely pass, captures cloth/destination screenshots, and checks menu navigation, final focus, Back/Forward, reduced motion, WebGL unavailability and cleanup. The script passed syntax checking but was not run against a browser. Its presence is preparation, not evidence of a completed browser acceptance run.

### Why browser verification remains pending

Automatic approval review rejected `mcp__cua_repl` access to the local preview origin `127.0.0.1:3127`, citing a content-blocked network-egress authority restriction. No alternate browser route or origin was used to bypass the rejection. The production effect has therefore not been visually observed in this session.

A proposed npm library check also encountered automatic-review failure, and sandbox DNS access was unavailable. No package was installed. The implementation uses the browser-native capture module and dependencies already present in the project.

## Remaining acceptance work and limits

Before treating this as a visually accepted signature interaction, an authorized browser session should verify:

1. Menu, header, footer, project buttons and all public routes; Back/Forward, direct entry, refresh, 404 and redirects, including redirects back to the same current route.
2. Scrolled viewport alignment, canvas portrait capture, SVG signature masks, web fonts, remote images, pinned sections and pages of different heights.
3. The actual appearance and legibility of the actor, fingers, lenses, grip, web attachment and folds against both bright and dark content; final exit without flashes or residual pixels.
4. Slow server preparation and failed/slow images; repeated and rapid navigation; Escape, resize/orientation change, tab visibility changes, reduced motion and WebGL context loss.
5. Keyboard focus and native link exclusions, scroll recovery, stale overlay removal, memory stability over repeated flights, and measured frame times on representative desktop/tablet/mobile hardware.

Browser `foreignObject` capture has browser-specific behavior. Cross-origin resources, unusual CSS, protected/tainted video or canvas, and unsupported embedded resources can cause a capture to fail or differ from live rendering. Capture or WebGL failure falls back to usable native navigation; that fallback does not reproduce the character-and-cloth concept. Low-capability devices with working WebGL use the smaller mesh and lower pixel density rather than hiding the effect solely because the screen is narrow.

The cloth is an authored rest-surface plus constrained simulation, not a full finite-element fabric solver with self-collision. The swing and web are deterministic procedural animation, not motion capture or a complete physical pendulum/rope simulation. These choices support repeatable hand contact and a bounded navigation duration, but require visual acceptance before claiming cinematic realism.

The character is an original, articulated browser model. It is not a studio digital double, scanned human, or artist-sculpted production asset. A properly licensed custom artist model and authored animation are required to reach film digital-double quality. The current implementation should not be represented as having met that level of realism without the outstanding browser review and further character art work.
