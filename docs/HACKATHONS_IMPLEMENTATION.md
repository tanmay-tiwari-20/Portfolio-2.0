# Hackathons page delivery

Implemented 5 November 2026 at `/hackathons`.

## Final scope

The page is focused on hackathon experiences. Per the final direction, both
the project showcase and the community section were removed, including their
page data fetches and navigation. No hackathon, team, mentorship or judging
counts are used as professional claims.

## Research and accuracy

The [research ledger](hackathons-research.md) records source provenance, roles,
official event destinations, date conflicts and missing information. The
LinkedIn integration exposed only people search and did not return this exact
profile. Public indexed profile excerpts, a directly readable personal post,
official event listings, and the existing portfolio were used instead. A full
LinkedIn profile review is not claimed.

Confirmed or corroborated context includes hackCBS 8.0, Hack4Delhi, CodePunk
v2.0, SRM Builds 7.0, VIBECODE, Matrix 3.0 and NexHack 2.0. Code 1's mentor role
remains author-supplied rather than independently corroborated. Dates remain
at month precision; the disputed NexHack 2.0 month displays only 2026 and the
unchanged disputed social link uses the official Devfolio event instead.

Mentor, Judge and Organizer stay separate roles. Research additions require
matching source identities and do not overwrite stored author content. The
existing photos remain a general hackathon journal: no unverified photo/event
association, stock imagery, award, testimonial or origin story was introduced.

## Design and interactions

1. **Hero:** lighter Poppins typography with a serif italic accent, curved
   background layers and soft organic photo masks. A staged GSAP entrance
   lets the curves settle before the headline, with restrained photo depth on
   desktop. The separate `hackathons-hero.tsx` / `.css` component keeps this
   composition responsive and independent of the other sections.
2. **Mentoring:** photo-led editorial composition and dated mentor entries.
   A connected progress rule follows the section; the smallest phones show a
   shorter selection, with all events retained in the archive.
3. **Judging:** a scarlet full-width panel with opposite-direction scroll
   movement on the headline, distinct judging records and evaluation themes.
4. **Event journal:** independent photo contact sheet and filtered event
   archive. Event entries open through click, tap or keyboard; selected rows
   gain a red marker and clipped detail reveal. Four entries per archive page
   keep the initial composition compact. The native full-screen photo dialog
   provides previous/next, thumbnail selection, Escape, focus restoration and
   contained scrolling.
5. **Closing:** hackathon-specific invitation, LinkedIn/contact links and a
   compact personal footer. A thin reading-progress rule connects the page.

The [interaction reference notes](hackathons-interaction-references.md) explain
the original adaptations from Locomotive, Lusion and Bruno Simon. Research
covered accessible official content and creator explanations, not a claimed
hands-on visual inspection of their WebGL experiences.

GSAP owns page entrances, clipping, timeline/reading progress, parallax and
pointer depth. Anime.js owns separate link arrows. CSS handles event selection
and photo replacement. Existing Lenis and route transitions are retained.
There are no new dependencies, pinned sections or artificial scroll distances.

## Files

- Modified `app/hackathons/page.tsx`: dynamic repository integration and metadata.
- Added `app/hackathons/hackathons.css`: scoped responsive art direction.
- Added `components/hackathons/hackathons-experience.tsx`: page composition.
- Added `components/hackathons/hackathons-hero.tsx` and its CSS: flowing hero composition.
- Added `components/hackathons/hackathons-archive.tsx`: filtering, expansion and pagination.
- Added `components/hackathons/hackathons-journal.tsx` and its CSS: contact sheet and modal viewer.
- Added `components/hackathons/hackathons-image.tsx`: responsive Cloudinary delivery.
- Added `components/hackathons/hackathons-motion.tsx`: scoped motion lifecycle.
- Added `lib/hackathons-content.ts`: guarded research, dates and safe source links.
- Added `scripts/hackathons-content.test.ts` and `scripts/hackathons-browser.mjs`.
- Added research, interaction references and this delivery report under `docs/`.

The previous reusable `HackathonList` is no longer used by this route. Source
JSON and admin behavior remain intact. No environment files were changed.

## Screen sizing

Sections use minimum viewport heights with natural content growth, rather than
fixed-height clipping. Typography, photos and spacing are bounded for short
laptops; tablets retain screen-height panels; phones use their own stacked
compositions. Expanded archive entries are allowed to grow.

Measured widths: 320, 390, 768, 1024, 1366, 1440, 1920 and 2560 pixels. Heights:
568, 844, 1024, 768, 768, 900, 1080 and 1440 respectively. There was no document
horizontal overflow, overflowing measured text/control block, or missing
chapter anchor in the tested states. Desktop/tablet panels are approximately
one viewport, with the journal slightly taller when needed. Small phone panels
grow for readable content and touch controls.

## Verification

- TypeScript and focused ESLint pass.
- Prettier check passes for all changed source files.
- Eight automated tests pass: safe links, date conflicts, research identity
  guards, preserved source edits, accessible accordion IDs, distinct roles,
  deferred/decorative image semantics and empty archive handling.
- Browser checks pass at all eight widths: role filters, accordion keyboard
  activation, pagination, photo switching, thumbnail keyboard controls,
  full-screen viewer bounds, Escape and focus restoration.
- Desktop pointer depth, section motion, live reduced-motion switching,
  contact link, Back navigation and menu navigation pass without page errors.
- The final production webpack build passes. Builds use `MONGODB_URI=''` only in their
  process to verify the supplied JSON data, without changing `.env`.

Run `node node_modules/tsx/dist/cli.mjs --test scripts/hackathons-content.test.ts`.
The browser script expects an already running local site and an installed
Playwright/browser runtime; its header documents runtime environment variables.
Screenshots and measurements are in `.next/hackathons-verification/`.

### Verification limitation

The test browser can reach the user-started local site but Cloudinary requests
return `net::ERR_NETWORK_ACCESS_DENIED`. Automatic approval review failed for
the external-image browser request with a `content-blocked` service error,
explicitly a review failure rather than an unsafe-action determination.

The browser script fails missing images by default. For this restricted run,
`HACKATHONS_ALLOW_BLOCKED_IMAGES=1` lets layout/control checks continue **only**
for images whose requests were explicitly denied by the network sandbox; it
records them in `network-limitations.json`. Image loading, actual photo crops,
remote transfer sizes and image-inclusive loading performance are consequently
not claimed verified. Official event destinations were researched, but social
platform login requirements can limit access to individual posts.
