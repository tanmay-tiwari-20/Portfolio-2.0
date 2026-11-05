# Hackathons interaction references

Research date: 5 November 2026. The latest scope is a page solely about
hackathons. Project showcases and the community section are excluded, even
though the earlier content ledger retains that background research.

## Inspection method

The first-party web connector fetched the live pages and official explanatory
articles linked below. This was a review of accessible text, controls and
creator-written descriptions. It was **not** a visual browser inspection or a
hands-on test of rendered WebGL motion. Awwwards detail pages for Locomotive and
Lusion v3 timed out, so no visual findings are attributed to those pages.

## Three references

| Reference | What the retrieved source supports | Adaptation for this portfolio |
| --- | --- | --- |
| [Locomotive](https://locomotive.ca/en) and its [official Scroll demo](https://scroll.locomotive.ca/) | The agency page presents named work with imagery and short labels. The demo explicitly describes viewport detection, continuous progress tracking, parallax, native scrolling, sticky compatibility, touch-specific behavior and cleanup. | Give each section a distinct reveal, with a thin scroll-progress rule tying the journey together. Use small image parallax on desktop and turn it off on touch. Implement with the existing GSAP/Lenis architecture; do not add Locomotive Scroll. |
| [Oryzo by Lusion](https://oryzo.ai/) and [Lusion's UX/UI explanation](https://blog.lusion.co/oryzo-bts-part-3-7-website-ux-ui-and-illustrations) | The live document exposes a hover invitation, interactive controls and chapter navigation. The studio explains its focus on tactile imagery, seamless transitions and restrained typography/color so the content remains central. It describes occasional editorial transitions as deliberate exceptions. | Treat the authentic journal photographs as physical prints: layered frames, bounded tilt and a controlled transition when selecting another photo. Let one large photograph expand through its crop while entering view. Retain the portfolio's dark/red palette and existing typefaces. |
| [Bruno Simon's portfolio](https://bruno-simon.com/) | The live document explicitly invites visitors to drive around, includes an interaction button, and documents separate keyboard, mouse, touch and gamepad controls. It exposes quality, mute and recovery controls. These support an intentional exploration model, not evidence that this review drove through the 3D world. | Make exploration immediate and recoverable: visible previous/next photograph controls, direct thumbnail selection, clear active state, keyboard-operable event expansion. Use a small interaction surface within the journal rather than requiring visitors to learn a game to read the event history. |

## Proposed motion vocabulary

These are original implementation proposals informed by the principles above,
not claims that an identical effect was visually observed on a reference site.

1. **Hero photo deck.** Offset two journal photographs behind the main frame.
   On a fine pointer, a bounded `rotateX`/`rotateY` response can make the visible
   print feel tangible. Keep the response around 3–4 degrees and reset on exit.
   Avoid moving text or the outer layout. A visible button or thumbnail, not
   hover alone, selects another photo. Use wrapper transforms so the deck tilt
   does not collide with GSAP's entrance/parallax properties.
2. **Photograph aperture.** Reveal one large image from an inset crop to its full
   frame as its section enters the viewport, with a modest scale settling toward
   1. The section remains in document flow, with no artificial extra scroll
   distance or long pin. This gives a cinematic transition within a balanced
   screen-sized composition.
3. **Journal selection.** A brief directional slide and crop change follows
   previous/next selection; the caption updates with the same action. Reserve
   dimensions to prevent layout shift. Keep journal navigation independent of
   the event archive, since the existing photos have no verified event mapping.
4. **Archive tracking.** Move a small red active marker to the selected event,
   then reveal its details with a short clip/translation sequence. Give button
   arrows a restrained Anime.js response. Content expansion must follow click,
   tap or keyboard activation; hover may only provide an optional preview cue.
5. **Chapter continuity.** Draw a thin vertical or horizontal rule with section
   progress, then reveal headings with a masked line motion. Let the judging
   panel use a different reveal direction or contrast transition. Avoid making
   every section repeat the same fade-and-rise animation.

## Responsive and accessibility constraints

- Screen coverage comes from responsive composition and available viewport
  height, not forcing all content into a fixed-height box. A short section may
  use a minimum height; expanded content must be able to grow naturally.
- Do not pin the photo deck on narrow or short screens. Stack image and copy,
  keep controls at least 44 pixels, and avoid horizontal document overflow.
- Respect `prefers-reduced-motion` both initially and when changed. Disable
  tilt, parallax and scrub transforms; switch photographs without travel while
  retaining every control and caption.
- Preserve native scrolling, visible focus and document reading order. All
  interaction remains usable by tap and keyboard. No essential information is
  unlocked only through an animation or hover state.
- Animate transforms/opacity or bounded clipping, not page layout on every
  frame. Observe visibility, release listeners/timelines on unmount, and pause
  through the portfolio's route-transition capture lifecycle.
- Keep one animation owner per property. GSAP handles coordinated section
  motion; Anime.js handles independent button details.

The reference sites' distinctive artwork, layouts, jokes, text, 3D environments
and motion sequences should not be copied. The page's source material remains
Tanmay's actual hackathon records and supplied photographs.
