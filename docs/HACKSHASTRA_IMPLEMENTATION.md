# HackShastra redesign delivery

Implemented at `/hackshastra`. Research and implementation date: 5 November 2026.
The detailed source ledger is [HACKSHASTRA_RESEARCH.md](HACKSHASTRA_RESEARCH.md).

## Research and identity

Inspected the official Home, About, Events, Gallery and Contact responses, plus
official LinkedIn content and organizer/university event listings on Luma and
Unstop. This established the creator-led student community, its practical
engineering focus, founders, chapter expansion, event involvement, mentoring,
judging, collaborators and contact destinations. Dynamic Events/Gallery data
was not fully exposed; organizer listings supplied the event evidence.

The public brand-kit folder lists five files: summer and winter symbols, red
and blue full logos, and More Info.png. Its image previews and downloads were
blocked by an automatic approval-service failure, including after the user
explicitly approved retrying. No kit artwork or typography guidelines were
visually inspected. No official font or color hex specification is claimed.

## Design and assets

- An oversized three-line hero pairs the existing HackShastra SVG symbol with
  official-source community photography.
- A paper-colored editorial purpose section changes the pace between the dark
  hero and activity index.
- The event archive uses a sticky artwork panel on desktop and artwork inside
  the selected event on smaller screens. Event posters use `object-contain`.
- A community photo composition and founder portrait lineup communicate the
  people behind the work.
- The footer pairs a red community invitation with a dark contact and navigation
  area. WhatsApp and campus chapter actions lead; the official website, email,
  social links, case study and portfolio links sit below.
- The portfolio's existing self-hosted Poppins and Inter, red `#ef463e`, dark
  `#090708`, and paper `#fffaf7` are retained. A warm paper section uses
  `#f1ede5`. These are portfolio choices, not verified brand-kit specifications.
- The existing Cloudinary `logo1_y3d5u2.svg` is used unchanged. No full wordmark
  was reconstructed or kit variant fabricated. Source images remain on the
  repository's existing permitted Cloudinary host. Its delivery transformations
  supply responsive sizes and compression without cropping event artwork.
- Below-fold photos load lazily. The hero photo receives priority. The first
  event poster is preloaded; remaining posters warm near the archive, or load
  on selection when data saving is enabled.
  Missing optional artwork has a stable typographic fallback. Source changes
  retry previously failed images.

## Implementation

| File | Responsibility |
| --- | --- |
| `app/hackshastra/page.tsx` | Route metadata, existing published event repository, page composition |
| `app/hackshastra/hackshastra.css` | Scoped palette, editorial typography, special treatments and responsive rules |
| `components/hackshastra/hackshastra-experience.tsx` | Hero, purpose, activities, events, people, founders and closing |
| `components/hackshastra/hackshastra-footer.tsx` | Community invitation, official contact links, and portfolio navigation |
| `components/hackshastra/hackshastra-motion.tsx` | GSAP composition motion and Anime.js link feedback |
| `components/hackshastra/event-archive.tsx` | Desktop hover/focus tabs, touch accordion, GSAP artwork reveal and loading fallback |
| `components/hackshastra/founders-lineup.tsx` | Five supplied founder portraits in J–I–T–S–U order, with Tanmay centered |
| `components/hackshastra/founders-lineup.module.css` | Responsive portrait row, captions and curved personal annotation |
| `components/hackshastra/brand-image.tsx` | Responsive image delivery and failure recovery |
| `components/hackshastra/brand-link.tsx` | Consistent external links, focusable actions and accessible new-tab labels |
| `data/hackshastra.ts` | Verified destinations, source assets and researched event enhancements |
| `lib/hackshastra-content.ts` | Reconciles research with the live event editor without overwriting saved edits |
| `scripts/hackshastra-content.test.ts` | Behavioral coverage for that reconciliation |
| `scripts/hackshastra-archive.test.tsx` | Initial HTML, ARIA relationships, reusable IDs, preload and fallback checks |

The live event collection remains connected. Publication changes, additions,
titles, venues, descriptions, dates, images and links continue to flow through.
Research enriches only unchanged original fields for narrowly matched records.
New events receive no inferred partnership role. Records are chronologically
ordered; attendance totals are not repurposed as community size. The seven
existing published events are represented, including the IPEC orientation.

GSAP owns hero transforms, heading masks, photo reveals, rules and restrained
desktop parallax. Anime.js owns only arrows on hover and keyboard focus. Motion
pauses for the existing global page capture and transitions, resumes on arrival,
and cleans up listeners, observers and animation instances. Reduced-motion
preferences disable page motion; content is visible before initialization and
when imports fail. No new libraries or unrelated page redesigns were added.

## Verification

- TypeScript and scoped ESLint pass.
- Nine behavioral tests pass: publication, chronology, unchanged research
  defaults, saved edits, independent date/description guards, changed event
  identities, safe URLs, strict UTC dates, and duplicate-ID handling.
- Local HTTP checks return 200 for `/hackshastra`, `/`, `/about`, `/projects`
  and `/projects/hackshastra-website`.
- Server-rendered markup checks found no missing anchor targets, duplicate
  IDs, or images without alt attributes. The response contains all seven event
  controls with matching panels and successfully loaded stylesheets.
- Official external destinations were checked during research. Some social
  platforms and event pages restrict automated access; the source ledger
  distinguishes a verified official link from a fully readable destination.
- The default Turbopack production build encountered a subprocess/IPC failure
  in the sandbox. A webpack build compiled, then encountered a MongoDB DNS
  timeout while prerendering the existing sitemap. Local-JSON verification uses
  only a temporary build-process environment override; `.env`, production
  database settings, dependencies and build scripts are unchanged.
- The webpack production build passes with the existing local JSON content
  backend (`MONGODB_URI` blanked only for that build process).

Browser automation was blocked by the same automatic approval-service failure.
Consequently, no completed visual viewport, hover, interactive keyboard, image
loading, client navigation, browser-console or reduced-motion browser test is
claimed. Layout rules cover phone, tablet, desktop and bounded ultrawide widths,
but the requested 320–2560px visual sweep still needs a functioning browser
session. Brand-kit image inspection is also outstanding.

## Viewport and founders refinement

Following the user's layout feedback, spacing and display type now use both
viewport width and small-viewport height (`svh`). The purpose, practice and
closing sections now use a full-screen minimum (`100vh`, refined to `100svh`
where supported) at every width, expanding when content needs more room. The
event archive grows with its content. Short desktop screens get tighter hero typography, logo and
spacing. Tablets use a two-column hero from 768px, while phones keep a natural
vertical layout. Section padding is bounded between 48px and 88px. The community
gallery's main image and two supporting images now share a bounded height.
Event rows are more compact and artwork height is limited to suit the viewport.

The founders have a dedicated section. The five image URLs supplied directly by
the user are stored in `data/hackshastra.ts` in Jai, Imran, Tanmay, Sumit, Uday
order. All five portraits remain on one line at narrow widths; Tanmay occupies
the middle column with a curved “That’s me” arrow. Portraits use bottom-aligned
containment, lazy loading, and separate two-line name captions.

Follow-up source review, TypeScript, scoped lint and served-page checks pass.
The served response verifies the five names and supplied image references in
order, exactly one marked center portrait, the annotation and compiled styles.
The browser approval service still failed; neither visual viewport checks nor
successful remote portrait loading is claimed. No dependency, production
configuration or event-editor change was required for this refinement.

The user subsequently requested removal of “Connections that make room”; that
entire section and its unused styling were removed. The mobile closing section
now has a full-width community action, a full-row email/chapter area, and two
compact columns for social links and portfolio attribution. Links wrap within
their columns, keep their arrows visible, and retain at least 44px target height.

## Event hover-reveal refinement — 5 November 2026

Only section 03, “Real rooms. Real builds.”, is redesigned. Its heading and
surrounding sections remain intact. The public Planes Hover Reveal page and
its accessible preview structure were inspected: a numbered vertical index,
selected artwork, and a current-selection caption. Its Pro registry was not
accessed, and no Planes code or new animation dependency was installed.

Desktop uses a large editorial event index beside a bounded artwork stage.
Hover, click or keyboard focus selects an event; leaving the list retains it.
Direction-aware GSAP clip, opacity and small scale/translation changes reveal
persistent artwork layers. Each selection captures the current composite frame,
reverts the previous context, and continues from the captured masks and opacity
without exposing a partially revealed poster in full. Copy occupies a shared grid cell, so the
longest description reserves space. Artwork stays inside its own column.
The desktop artwork-and-details stage stays sticky until the event list's end,
including on short windows. Its height is limited to the viewport with a 24px
top/bottom inset; the artwork area shrinks when necessary while captions retain
their space. The list's grid container supplies the sticky release boundary.

Below 1024px the selection opens artwork and details directly beneath its row;
640–1023px places artwork and information beside each other. Touch selection
preserves the selected row's viewport position when an earlier panel closes.
Desktop uses a vertical tablist with a single tab stop, Up/Down/Home/End
navigation, and Tab access to the selected event link. Mobile keeps native
accordion buttons and labeled regions. Inactive desktop panels are inert.
Reduced-motion changes immediately revert GSAP styles to the selected CSS
state. Row/arrow feedback uses CSS; the existing Anime.js layer still owns
external-link arrows. Image transforms are owned only by GSAP wrappers.

All seven published records, their saved artwork and captions, source links,
and subsequent admin edits remain connected. Source-backed categories and
HI-O's IPEC chapter involvement were added. Official posters are contained,
not cropped or substituted with unattributed gallery photographs. Empty and
failed images use an event-specific typographic fallback; the placeholder
stays visible while an image loads. The default image has a deduplicated
responsive preload. Remaining images warm within 400px of the archive, except
when save-data is enabled. Both responsive renderings share image URLs/sizes.

Validation for this refinement:

- 17 passing data and server-render tests across `hackshastra-content.test.ts`
  and `hackshastra-archive.test.tsx`.
- TypeScript, scoped ESLint, Prettier for changed code, and diff whitespace checks.
- A local production HTTP check returned 200 for `/hackshastra`, with all seven
  events, exactly one initial selection, seven persistent desktop artwork
  layers, and all three linked stylesheets served successfully. This verifies
  integration and delivery, not browser interaction or visual layout.
- Static interaction/accessibility review corrected keyboard access to earlier
  event links and the placeholder being covered during image loading.
- The webpack production build passes with a process-only empty `MONGODB_URI`,
  using existing local JSON data. The configured database was unreachable during
  sitemap generation. The default Turbopack build separately hit an environment
  child-process connection panic while processing existing Poppins CSS. No
  environment file, database, or build configuration was changed.
- Browser screenshots and interactive viewport testing remain unverified:
  automatic approval review failed before those actions could run. The failure
  also affected a documentation-only retry. No alternate browser automation
  was used to bypass that approval failure.

When browser access is available, verify desktop rapid hover and pointer leave,
keyboard Tab/Up/Down/Home/End and external links; tap rows at 390px and 820px;
check 320px overflow, short desktop windows, live reduced-motion changes,
image failures/slow loads, and narrow/wide breakpoint changes mid-selection.

## Footer and admin event controls — 5 November 2026

The closing section is now a dedicated `HackShastraFooter` component. A red
invitation introduces a large WhatsApp action and a separate chapter link,
followed by a dark area for the original brand symbol, email, social links,
case study, portfolio navigation and Back to top. The layout stacks on phones,
uses two columns for tablet contact details, and a three-column desktop base.
All ten destinations were checked in the server-rendered component; external
links retain accessible new-tab labels and safe link relationships. The chapter
link keeps full contrast on hover, with arrow motion providing feedback.

The existing footer motion preferences and page anchor continue to work through
`#hs-connect` and the existing GSAP/Anime.js selectors. The official logo is
used without recolouring. Footer styling changes are scoped to this page.
Browser preview was retried, but the automatic approval service failed again
before a preview could run; no visual browser verification is claimed.

### Managing events

Open `/secret-admin` and select **Community Events**. The HackShastra archive
uses this collection directly; no source-code change is needed for event edits.

- Add or edit the title, date, location, description, event URL, category,
  HackShastra involvement, poster/photo URL, image description, and publication
  status. The separate display-date field supports a date range or month/year.
- Clear category, involvement or display date to hide that detail. The
  **Use default** actions restore the existing researched/default value.
- Use the Published/Draft control to show or hide a record without losing its
  artwork. Delete removes that record from the archive.
- Drag rows or use the up/down controls to set the public archive order.
  Existing events retain chronological order until the first explicit reorder;
  new records append after a manual order has been chosen.
- Artwork must use a public HTTPS Cloudinary image URL. The editor previews it
  and allows its alt text to be changed. A missing image has an event fallback.

Saves and reorder actions invalidate the HackShastra route. Event patch
handling preserves omitted fields, keeps explicit removals distinct from empty
strings, and prevents stale edit forms from overwriting stored ordering.

Validation for the footer/admin refinement:

- All 24 HackShastra tests and 3 MongoDB patch tests pass. Coverage includes creating, editing, reordering,
  hiding, restoring and deleting events in an isolated temporary JSON store,
  metadata overrides, safe clearing, and preservation of posters during toggles.
- TypeScript and scoped ESLint pass without warnings. The footer and event
  editor also passed server-render checks for labels, links and defaults.
- No real event records or external database were changed during testing.
- MongoDB edits now validate the full record but update only submitted fields
  and the server timestamp. Generated-payload tests cover a concurrent reorder,
  unrelated poster replacement, explicit removals, nested validation, and
  schema-stripped input; live MongoDB writes were not part of verification.
- The served production page returned 200 with the new footer and all seven
  events. The unauthenticated admin event API still returned 401.
- The final webpack production build passes using local JSON data through a
  process-only database override; saved environment configuration is unchanged.
