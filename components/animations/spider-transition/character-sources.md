# Character asset provenance and design references

The meshes, suit weave, lens outlines, spider emblems, webbing, skin weights and
animation in `character.ts` were authored procedurally for this project. There
are no imported movie/game meshes, commercial textures, downloaded fan models,
or external runtime asset requests. Three.js is already a project dependency
and is distributed under the MIT license.

Visual research, accessed 4 November 2026:

- [StudioADI / Tom Woodruff Jr. interview about the 2002 suit](https://comicbookmovie.com/spider_man/exclusive-making-of-the-spider-man-2002-suit-plus-tobey-maguires-claustrophobia-a75531)
  describes swimmer-like proportions, shaped mask shells, raised web detailing,
  fabric texturing and anatomy beneath the suit. These informed the original
  anatomical cross sections and restrained material response.
- [Sony Pictures production notes for The Amazing Spider-Man](https://www.scifijapan.com/content/the-amazing-spider-man-production-notes)
  describe the film's practical costume and acrobatic performance approach.
- [Marvel / MCU suit evolution reference](https://www.syfy.com/syfy-wire/many-looks-of-spider-man)
  informed compact lenses, controlled red/blue panel transitions and the
  smaller chest emblem. These sources are references only; no imagery is copied.

Existing asset evaluation:

- [TurboSquid Spider-Man rigged model](https://www.turbosquid.com/3d-models/spider-man-rigged-3d-model-1805920)
  explicitly lists editorial restrictions for depicted Marvel intellectual
  property. It was **not downloaded or integrated**.
- [RenderHub MCU rigged model](https://www.renderhub.com/mustafamohmmed/spider-man-mcu-suit-rigged-and-game-ready-3d-model)
  lists an IP-restricted editorial-use condition. It was **not downloaded or
  integrated**.
- [Sketchfab rigged model candidate](https://sketchfab.com/3d-models/rigged-spider-man-3d-model-free-download-a84d93e9a85d4a09ac4794532c84286c)
  surfaced in search, but its full asset/license page returned HTTP 403 during
  inspection; provenance, rig quality and usage permission could not be fully
  verified. It was **not downloaded or integrated**.

Original geometry avoids dependence on those asset licenses; it does not grant
rights to the Spider-Man character or Marvel marks. No official affiliation or
movie-asset license is represented by this implementation.

## Technical quality boundary

This is a real articulated 3D model with 17 bones, smooth skin weights,
anatomically profiled surfaces, physically based materials, individually shaped
eye lenses, raised geometric webbing, fingers and front/back emblems. It is
authored for a brief in-browser performance, with deterministic procedural
poses. It is **not** a scanned/artist-sculpted film-production digital double,
motion capture, or a studio-quality cloth suit simulation. A licensed custom
artist model and authored animation would materially raise the realism ceiling.

The actor is approximately 2 units tall, pelvis at the origin, +Y up and +Z
forward. `webHand` and `gripHand` are real palm nodes in the posed hierarchy;
call `getWorldPosition` after `pose()` and any scene transform to attach the
web and cloth. All GPU geometry, materials, the weave texture and the skeleton
are reused during navigation and released by `dispose()`.
