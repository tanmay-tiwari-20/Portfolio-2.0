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
| `components/animations/spider-transition/audio.ts`             | Gesture activation, animation-synchronized cues, stereo swing wind and audio cleanup                |
| `components/animations/spider-transition/audio-synthesis.ts`   | Original generated web-shot, adhesive tack, release and seamless wind PCM                           |
| `components/animations/spider-transition/performance.ts`      | Capture/render pixel budgets and sustained-frame-pressure quality adjustment                        |
| `scripts/spider-audio.test.ts`                                | Audio activation, timing, holds, suspension, interruptions and reuse tests                           |
| `scripts/spider-audio-synthesis.test.ts`                      | Waveform duration, level, envelope, determinism and loop-continuity checks                           |
| `scripts/spider-performance.test.ts`                          | Pixel budgets, timing windows, late slowdowns, cooldowns and resolution bounds                       |
| `scripts/spider-scene.test.ts`                                | Hidden pre-render, cloth reuse/reset, texture disposal and resize-before-draw checks                  |
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

### Sound

Original sounds are synthesized locally with Web Audio; there are no downloaded recordings or audio dependencies. A layered web-shot “thwip” plays as the web appears, an adhesive tack plays at `WEB_ATTACH_TIME`, and a light silk flick plays at `WEB_RELEASE_TIME`. A filtered stereo wind loop follows the character's horizontal position, builds through the low part of the swing, and recedes during the exit. Cue playback uses the same 0.8 rate as the visual sequence.

The eligible navigation click creates/resumes the audio context, but playback starts only after the captured page and 3D scene are ready. Idle/navigation-intent warmup generates four cached 48 kHz PCM buffers without opening an audio device; capture preparation copies them to AudioBuffers before animation starts. Cue crossings do not synthesize or allocate PCM. Cues cross thresholds on the actual animation clock, so a route-readiness hold cannot advance the soundtrack. Holding the timeline fades the wind; resuming restores it without repeating one-shots. Audio refusal leaves navigation functional, and missed cues are not replayed later. Completion and interruption fade/stop sources, hiding the document disconnects them immediately, and unmount closes the context. Buffers are reused between flights. Reduced-motion/native fallback navigation does not start sound.

All 16 audio tests pass: twelve cover preparation, activation, timing, stereo movement, holds, suspension, interruption, disposal and reuse; four cover PCM properties across five sample rates. These are waveform and simulated Web Audio lifecycle checks, not a listening test. In-browser playback and subjective sound quality remain unverified because browser preview access is blocked by automatic approval.

### Outgoing page and cloth

The outgoing visible viewport is cloned synchronously before requesting the destination, including browser Back/Forward handling. Computed styles, current form values, visible image resources, pseudo-element appearance and canvas output are preserved where supported. Password values are excluded. The freeze preserves scroll alignment and handles fixed/sticky elements in viewport coordinates.

The temporary DOM copy lives in an inert, hidden-from-accessibility shadow-root preview, so destination animations cannot discover it through document-wide selectors. SVG IDs and local paint references are remapped for signature masks and gradients. Local fonts and eligible image resources are embedded before the browser renders the copy through SVG `foreignObject` into a canvas.

For navigation from a scrolled position, an independent document layer stores the source root's viewport offset before route changes. The copied document retains its layout inside that layer; the preview and serialized texture share the same crop. Offscreen ancestors are traversed and retained because their descendants can still be visible, and removing their content can change later layout. Offscreen image/video/canvas resources are omitted. Hidden spacing elements and sticky placeholders retain their layout styles; scroll locking begins only after the preview covers the original page.

That canvas becomes the texture of a subdivided, two-sided Three.js mesh. The sheet initially matches the viewport exactly, with correct UV alignment. A fixed left-edge vertex is constrained to the actual palm. A moving rest surface supplies broad folds, curl and gathering; damped integration and distance/bending constraints supply lag, limited stretch and local puckering. The disturbance propagates outward from contact, so the far edge starts moving later. Fold shading adds depth while the initial flat sheet retains page colors.

The image is therefore a temporary high-resolution representation of the actual visible outgoing content, deformed on a real 3D mesh. It is not a live DOM surface once captured. Outgoing video, canvas animation and form interaction are frozen during the flight; the destination remains the real rendered application underneath.

### Routing, accessibility and cleanup

Next retains control of routing, history, redirects and server rendering. Ordinary same-origin links are intercepted before `router.push`. A capture-phase `popstate` listener freezes the outgoing view before the destination commit. The route observer and React transition settlement handle completion and no-op redirects, including the existing `/experience` alias for `/about`.

The destination's committed DOM is checked for visible image decoding and font readiness, with a bounded two-second asset wait and two settling frames. A 12-second navigation safeguard releases the visual layer if route preparation stalls. A failed image or expired readiness bound can still leave its normal fallback in the destination; the safeguard prioritizes continued access to the site.

There is one active flight and at most one queued destination. Current-route/hash links, external URLs, modified or non-primary clicks, downloads, alternate browsing contexts, and API exports retain native behavior. Query changes remain eligible. Direct entry and refresh show the application without requiring a flight.

The visual overlay is inert and `aria-hidden`. The live page is temporarily inert during a flight; scrolling and Lenis resume on completion or interruption. Focus moves to the destination hash target, heading or main landmark after navigation; interruption before commit can restore the previously focused control. Escape, resize, visibility changes, page exit, preference changes and WebGL context loss release the transition. Reduced-motion users receive native navigation without the swing.

## Performance measures and observations

Implemented measures:

- Lazy-load and idle/intent-prewarm the scene, compile materials and perform one hidden draw before the first flight. Reuse renderer, rig, web and same-viewport cloth geometry/materials across navigations; release each captured page texture on completion.
- Keep per-frame updates outside React state and reconciliation.
- Rasterize only the viewport; preserve the document hierarchy while skipping offscreen media resources.
- Reuse each computed-style declaration and assign cloned styles in one CSS-text operation. Warm up to eight visible loaded images on throttled navigation intent, without caching stale layout geometry.
- Cache embedded assets with a bounded 48-entry map and reuse embedded fonts.
- Cap capture density at 2 for standard quality and 1.5 for lower quality, with additional 5/2-million-pixel budgets. Renderer caps are 1.75/1.25 with 4/1.5-million-pixel budgets. CSS dimensions, scrolling offsets and UVs remain unchanged.
- Use 32 cloth rows and 20–52 columns for high quality; 18 rows and 12–30 columns for low quality. The largest meshes have 1,749 and 589 vertices respectively.
- Use four or three constraint iterations, bounded substeps, and typed-array simulation buffers.
- Cache invariant cloth/web math, skip unchanged flat-cloth uploads and invisible web updates, and avoid redundant character matrix composition. Model, web detail and animation trajectory remain unchanged.
- Observe raw frame intervals throughout the flight. When 18 of 24 frames exceed 25 ms, reduce backing resolution in 0.8 steps with a 700 ms cooldown and a bounded floor. Resize before the next draw to avoid exposing a cleared canvas, and retain the reduced ratio for subsequent flights at the same viewport size.
- Keep physics delta clamping separate from raw frame measurements; only change the transition phase DOM attribute when its value changes.
- Avoid post-processing. Redraw the existing portrait only when capture needs it rather than enabling continuous framebuffer preservation.

### Performance revision measurements

At 1440 × 900, 14 alternating warmed Node/Three.js flights produced these mean CPU update times. The comparison sampled 13,299,104 geometry/matrix values and found a maximum difference of zero.

| Work | Before | After |
| --- | ---: | ---: |
| Character matrix path | 0.089 ms | 0.052 ms |
| Web update | 0.405 ms | 0.191 ms |
| Cloth update | 2.042 ms | 1.744 ms |

A separate local mock-audio check measured 62.4 ms for cold sound synthesis, now moved before animation. Prepared begin/attachment/release work measured 0.049 ms median and 0.208 ms p95, with no new PCM allocations during those frames. These CPU/mocked measurements exclude DOM capture, browser rendering, GPU work, network delays and device-specific audio behavior. They do not establish deployed frame rate.

At 3440 × 1440 with device pixel ratio 2, the capture budget reduces allocation from 19.8 million pixels (about 79 MB RGBA) to at most 5 million pixels (about 20 MB). Very large displays trade some temporary texture sharpness for bounded allocation and upload costs; page layout and geometry do not change.

The performance revision passed 52 targeted tests, TypeScript and targeted ESLint. A fresh webpack production build compiled successfully in 20.1 seconds and passed its TypeScript stage in 11.7 seconds, then failed prerendering `/sitemap.xml` because the configured MongoDB SRV lookup timed out. This is not a complete production-build pass; database/fallback configuration was not changed. Browser and deployed-device frame-rate verification remain blocked by the previously reported automatic approval failure.
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

The focused `scripts/spider-capture-browser.mjs` harness loads the real capture module into a synthetic long document, checks preview bounds and rasterized colors/text at the top, middle and bottom, and changes live scroll after freezing to check snapshot independence. It includes visible fixed/sticky descendants of an offscreen ancestor and preceding flex/hidden/empty spacing. Syntax checking passed; browser execution remains pending after the automatic approval service returned `content-blocked`. The scroll-capture revision passed TypeScript and targeted ESLint, but its appearance on Home and About has not been visually verified here.

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
