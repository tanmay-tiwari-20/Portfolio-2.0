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
- A red closing section provides the official website, email, Instagram,
  LinkedIn, WhatsApp invitation and campus chapter application.
- The portfolio's existing self-hosted Poppins and Inter, red `#ef463e`, dark
  `#090708`, and paper `#fffaf7` are retained. A warm paper section uses
  `#f1ede5`. These are portfolio choices, not verified brand-kit specifications.
- The existing Cloudinary `logo1_y3d5u2.svg` is used unchanged. No full wordmark
  was reconstructed or kit variant fabricated. Source images remain on the
  repository's existing permitted Cloudinary host. Its delivery transformations
  supply responsive sizes and compression without cropping event artwork.
- Below-fold photos and posters load lazily. The hero photo receives priority.
  Missing optional artwork has a stable typographic fallback. Source changes
  retry previously failed images.

## Implementation

| File | Responsibility |
| --- | --- |
| `app/hackshastra/page.tsx` | Route metadata, existing published event repository, page composition |
| `app/hackshastra/hackshastra.css` | Scoped palette, editorial typography, special treatments and responsive rules |
| `components/hackshastra/hackshastra-experience.tsx` | Hero, purpose, activities, events, people, founders and closing |
| `components/hackshastra/hackshastra-motion.tsx` | GSAP composition motion and Anime.js link feedback |
| `components/hackshastra/event-archive.tsx` | Accessible single-open event selector and contextual artwork |
| `components/hackshastra/founders-lineup.tsx` | Five supplied founder portraits in J–I–T–S–U order, with Tanmay centered |
| `components/hackshastra/founders-lineup.module.css` | Responsive portrait row, captions and curved personal annotation |
| `components/hackshastra/brand-image.tsx` | Responsive image delivery and failure recovery |
| `components/hackshastra/brand-link.tsx` | Consistent external links, focusable actions and accessible new-tab labels |
| `data/hackshastra.ts` | Verified destinations, source assets and researched event enhancements |
| `lib/hackshastra-content.ts` | Reconciles research with the live event editor without overwriting saved edits |
| `scripts/hackshastra-content.test.ts` | Behavioral coverage for that reconciliation |

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
