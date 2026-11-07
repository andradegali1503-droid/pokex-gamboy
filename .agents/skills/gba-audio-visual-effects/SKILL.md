---
name: gba-audio-visual-effects
description: >-
  Specialist in Generation III animation choreography, GBA palette fades, affine
  sprite cylinder transformations, oscilloscope/VU meter animations, and Web Audio
  API retro GBA sound effects.
---

# GBA Audio-Visual Effects Specialist

## Purpose & Role
Recreate the authentic audiovisual feedback of Pokémon Emerald (`pokedex.c` and GBA `m4a` sound engine) using hardware-accurate animations and zero-dependency Web Audio API chiptune sound synthesis + authentic Pokémon cries.

## Specific Instructions

### 1. Authentic Pokémon Emerald Animations (from `pokedex.c`)
- **Palette Fade to Black (`BeginNormalPaletteFade`)**:
  - Screen transitions (`LIST_VIEW` <-> `INFO_VIEW`, `LIST_VIEW` <-> `SEARCH_VIEW`) use a stepped 16-level black fade (`steps(4)` or `steps(8)`, 180–240ms) rather than modern smooth CSS opacity fades or `animate.css` `bounceInLeft`.
- **Sprite Movement into Info Screen (`SpriteCB_MoveMonForInfoScreen`)**:
  - When pressing `A` on a Pokémon in the List View, the center Pokémon sprite translates toward the upper-left Info Screen slot (`MON_PAGE_X = 48, MON_PAGE_Y = 56`) while the background fades to black and reveals the Info Screen!
- **3-Sprite Cylinder Drum (`SpriteCB_PokedexListMonSprite`)**:
  - In the List View center viewport (`x: 96, y: 80`), the previous (`y: -32px`) and next (`y: +32px`) Pokémon sprites are vertically foreshortened (`scaleY(0.68)`) using the GBA affine sine table effect while the selected Pokémon at `y: 0` stands at full `scaleY(1)`.
- **Rotating Poké Ball Wheel (`SpriteCB_RotatingPokeBall`)**:
  - The Poké Ball wheel on the left edge (`x: 0, y: 80`) rotates by `16` GBA angle units (`22.5°`) on every list step (`±16 * 7` on page jump).
- **Bouncing Scroll Arrows (`SpriteCB_ScrollArrow`)**:
  - Top (`x: 184, y: 4`) and bottom (`x: 184, y: 156`) magenta arrows bob vertically by `1–2px` at 8 Hz using stepped keyframes and hide automatically when at the very first or very last entry.
- **Start Menu Drawer Slide (`Task_HandlePokedexStartMenuInput`)**:
  - Slides vertically from bottom in discrete 8px per-frame steps (`steps(10)`).
- **Cry Screen Oscilloscope & VU Meter (`cry_meter.png`, `cry_meter_needle.png`)**:
  - Playing a Pokémon's cry animates a real-time pixel waveform canvas on the dark navy oscilloscope monitor and swings the red/black `VU` meter needle across the dial (`-45°` to `+35°`).

### 2. Retro GBA Sound Engine (Web Audio API)
Implement a clean `GbaAudioService` using the browser's native `AudioContext` (with mute toggle and safe user-gesture unlock) to synthesize authentic GBA sound effects:
- `SE_DEX_SCROLL`: Short crisp square-wave tick (`1200 Hz -> 1600 Hz`, 22ms) when scrolling the list by 1 row.
- `SE_DEX_PAGE`: Dual-tone fast arpeggio (`900 Hz -> 1350 Hz`, 45ms) when jumping 7 rows (`LEFT / RIGHT`).
- `SE_SELECT`: Classic GBA menu cursor/confirm beep (`1046 Hz -> 1568 Hz`, square wave + gain envelope, 55ms).
- `SE_PIN`: High metallic two-note chime (`1318 Hz -> 1975 Hz`, 90ms) when opening a Pokémon's Info Screen.
- `SE_PC_LOGIN`: Ascending 3-note electronic sequence (`523 Hz -> 659 Hz -> 1046 Hz`) when opening the Search screen or booting the Pokédex.
- `SE_PC_OFF`: Descending 3-note electronic power-down (`1046 Hz -> 659 Hz -> 392 Hz`) when closing the Search screen or Pokédex.
- `playPokemonCry(pokemon)`: Plays the authentic Pokémon cry audio (`cries.legacy` from PokeAPI) piped through an `AnalyserNode` (or synthesized fallback cry modulated by species ID/weight/height) to drive the Cry Screen's oscilloscope and VU meter in real time!

## Procedure
1. Replace all `animate.css` classes (`animate__bounceInLeft`) with stepped GBA animations (`animation-timing-function: steps(...)`).
2. Wire `GbaAudioService` into every navigation, scroll, menu, filter, and cry interaction.

## Quality Criteria & Restrictions
- **PROHIBITED**: `animate__bounceInLeft`, elastic cubic-bezier bounces, slow 2-second loading spinners, or silent/unresponsive buttons.
- **REQUIRED**: Snappy 60 FPS stepped retro animations and authentic GBA sound effects with a visible Mute/Audio indicator.
