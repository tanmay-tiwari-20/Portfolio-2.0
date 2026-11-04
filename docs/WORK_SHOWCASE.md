# Work and project showcases

The Work section uses the portfolio's Poppins/Inter typography, serif accents,
scarlet, burgundy, cream and gold in a continuous desk-and-stationery design.
Its opening is a tactile project desk with four movable prints, independently
implemented from the public interaction description of
[Planes Desk Hero](https://useplanes.com/components/desk-hero).
The project index and individual case studies extend that language through
paper prints, tape, clips, folder tabs, ruled notes and a burgundy-backed
technology ledger. Muted violet, amber, blue and sage provide small accents
around actual project screenshots. Home, About and the Spider transition are
unchanged. Navigation uses dark text over the light desk and project heroes.

## Content and composition

- `/projects` preserves search and exact-tag filtering in a paper index, followed
  by alternating screenshot prints and project summaries on the textured desk.
- Desktop prints have restrained rotations; mobile prints remain straight.
  The closing contact link sits on a burgundy correspondence sheet.
- Every published `/projects/[slug]` uses the new case-study components.
- Cinema: Unoverse and iPhone recreation. Editorial: Spools, Baithak, Resumify.
  Studio: HackShastra and Shirt Showcaser.
- `lib/work-content.ts` supplies short editorial copy backed by the existing
  descriptions. Changed descriptions/titles fall back to current repository
  content so old feature claims cannot survive an admin edit.
- All existing descriptions, tags and actual external URLs remain available.
  New projects work without adding a custom configuration.
- Each existing project has one cover and no gallery. No fake screenshots,
  metrics, roles, challenges or results have been added. Future gallery images
  render automatically, with duplicate covers removed.

## Responsive sizing

The reference laptop is 1366 × 768. Work's desktop opening has a viewport-sized
minimum height, while type and the preview composition respond to both width
and height. Screenshot prints have explicit outer heights, including their
paper border and caption. The image well flexes within that budget and uses
contain; tape and clips sit outside the image's clipping wrapper:

- Case-study cinema opening: `clamp(220px, 40svh, 560px)`.
- Split stages: `clamp(240px, 44svh, 600px)` on desktop.
- Wide discovery stages: `clamp(240px, 55svh, 720px)` from tablet widths.

Small screens use natural image ratios and stacked case-study content. The hero
prints form a two-by-two desk on phones. The interactive desk stops at 1280px;
the project index and case-study content stop at 1440px.
Known image dimensions preserve their ratio; unknown dimensions reserve 16:9
space with contained images. Full-image links are available in case studies.

## Animation ownership

`WorkMotion` owns scoped GSAP reveal wrappers and their ScrollTriggers.
Anime.js owns separate arrow elements. Bounded screenshot stages scale from
below 1 to avoid clipping their edges. The existing MotionLayer supplies Lenis.

Motion waits for `portfolio:transition-end` before attaching scroll and hover
effects. The hero and content already in or above the viewport stay visible;
initialization never hides them to replay an entrance after arrival. Only
below-viewport content receives scroll reveals. Motion freezes its own triggers
on `portfolio:capture-frame`, cleans up on route/filter changes, respects live
reduced-motion preferences, and immediately reveals keyboard-focused content.
Server-rendered content remains visible if motion cannot initialize.

The desk controller owns each print's transform and keeps its paper visible
on arrival. Pure bounded physics lives in `lib/work-desk-physics.ts`:
velocity caps, frame-rate-independent friction, small rebounds, and rotation
settling. RAF stops when prints settle, leave view, or a transition captures
the page. Measurements defer while the global transition covers the page.

Drag surfaces are buttons so the global document capture cannot navigate on a
drag; deliberate activation clicks the existing project Link. The caption Link
keeps normal keyboard and new-tab behavior. Touch dragging uses a visible grip,
leaving vertical scrolling available on the image. Arrow keys move a focused
print, Home/Escape reset it, Enter opens the project, and Tidy desk resets all
prints. Reduced motion retains direct manipulation and disables inertia.

`app/projects/work.css` supplies reusable stationery styles in Tailwind's
components layer, allowing utilities to adjust each sheet's borders and spacing.
It also supplies theme variables and resolves unlayered legacy link/form rules
so Tailwind colors and typography work on both light and dark surfaces.
Most layout and styling stay in Tailwind utilities.

## Verification

Run `node node_modules/tsx/dist/cli.mjs --test scripts/work-content.test.ts`.
The suite covers every real case-study render, content/tag preservation,
stale-content guards, safe URLs, gallery deduplication and circular navigation.
Existing pure Spider transition suites remain unchanged.

Run `node node_modules/tsx/dist/cli.mjs --test scripts/work-desk-physics.test.ts`
for seven tests of rotated containment, throw velocity, 60/120Hz integration,
click/drag thresholds, settling, oversized prints and paused-tab behavior.

The 14 Work content/render tests and seven desk physics tests passed after the
stationery redesign, as did TypeScript, scoped ESLint and formatting checks.
The production webpack build passed with `MONGODB_URI` blanked for that process
only, using local JSON data. The configured MongoDB service was unreachable
from this environment; no `.env` or repository settings were changed.
Default Turbopack hit a subprocess initialization error here.

Live browser checks (viewport screenshots, scroll, back/forward and real image
loading) still require verification: the browser approval service failed before
granting localhost access in this session. Static render tests do not establish
browser layout or animation behavior.
