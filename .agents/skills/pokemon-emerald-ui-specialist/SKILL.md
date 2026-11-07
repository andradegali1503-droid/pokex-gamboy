---
name: pokemon-emerald-ui-specialist
description: >-
  Specialist in the exact layout, proportions, color palettes, tilemaps, window frames,
  and visual hierarchy of the Pokémon Emerald (GBA, 2004) Pokédex user interface.
---

# Pokémon Emerald UI Specialist

## Purpose & Role
Ensure that every screen of the Pokédex web application reproduces with pixel-accurate structural and chromatic fidelity the original **Pokémon Emerald Version (Game Boy Advance, 2004)** Pokédex (`pret/pokeemerald` reference implementation and `Pokédex_E.png` visual reference).

## Specific Instructions

### 1. Native Resolution & Aspect Ratio Grid
- Base all screen layouts on the Game Boy Advance native resolution of **240 × 160 pixels** (30 × 20 tiles of 8 × 8 px, 3:2 aspect ratio), scaled up cleanly by integer or responsive aspect-locked multipliers.
- Never use modern web dashboard layouts (no Bootstrap cards, no floating drop shadows, no modern glassmorphism).

### 2. Authentic GBA Color Palettes (from `graphics/pokedex/*.pal`)
Use the exact 15-bit GBA RGB colors converted to 24-bit hex:
- **Hoenn Mode Scanline Background (`bg_hoenn.pal`)**:
  - Bright Emerald Line: `#31D54A` (`rgb(49, 213, 74)`)
  - Deep Emerald Line: `#188320` (`rgb(24, 131, 32)`)
  - Left Poké Ball Cutout Ring: `#000029` (`rgb(0, 0, 41)`)
- **National Mode Scanline Background (`bg_national.pal`)**:
  - Sage Green Line: `#7BA473` (`rgb(123, 164, 115)`)
  - Forest Olive Line: `#4A7341` (`rgb(74, 115, 65)`)
  - Left Poké Ball Cutout Ring: `#293941` (`rgb(41, 57, 65)`)
- **Search Results Scanline Background (`search_results_bg.pal`)**:
  - Olive Line: `#7B9420` (`rgb(123, 148, 32)`)
  - Dark Moss Line: `#295200` (`rgb(41, 82, 0)`)
- **List Panel & Window Frames**:
  - List Panel Yellow Fill: `#EEF639` (`rgb(238, 246, 57)`)
  - List Scrollbar Track Tan: `#BD9C5A` (`rgb(189, 156, 90)`)
  - Panel Outer Border Dark Slate: `#293941` (`rgb(41, 57, 65)`)
  - Panel Mid Shadow Gray-Blue: `#626273` (`rgb(98, 98, 115)`)
  - Active Selection Row Highlight: `#FFFFFF` (white pill inside the yellow list panel)
- **Top Action Bar & Buttons (`info_screen.bin`, `interface.png`)**:
  - Top Bar Background: `#29396A` (`rgb(41, 57, 106)`)
  - Inactive Tab Pill (`AREA`, `CRY`, `SIZE`): `#B4CDF6` (`rgb(180, 205, 246)`) with `#318BFF` border accent
  - Active/Focused Tab Pill: `#31D54A` (`rgb(49, 213, 74)`)
  - Action Pill (`START`, `SELECT`, `CANCEL`, `(A)`, `(B)`): `#FF00BD` (`rgb(255, 0, 189)`)
  - Entry Description Box Side Borders: Golden-orange vertical gradient (`#FFEE00`, `#FFBD00`, `#FF7300`)
- **Search / Filter Screen (`search_menu.pal`)**:
  - Filter Pill Orange: `#FFAC00` (`rgb(255, 172, 0)`) with `#832020` shadow
  - Action Pill Lime: `#9CE600` (`rgb(156, 230, 0)`) with `#397300` border
  - Selected Filter Border: `#FF2020` (`rgb(255, 32, 32)`)

### 3. Screen-by-Screen Composition
1. **Main Pokédex List Screen (`PAGE_MAIN` / `PAGE_SEARCH_RESULTS`)**:
   - **Top-Left Header (`x: 8..128, y: 8..16`)**: White rounded banner with wide black pixel text `POKéDEX`.
   - **Left Column (`x: 0..64, y: 24..156`)**:
     - Rotating Poké Ball wheel cutout on the far-left edge (`center: (0, 80)`).
     - `SEEN` and `OWN` counters (`y: 40`, `y: 72`) with underlined labels and right-aligned pixel digits (shows `HOENN` and `NATIONAL` breakdown when National mode is unlocked).
     - Bottom-left control prompts: `[START] MENU` (`y: 120`) and `[SELECT] SEARCH` (`y: 144`).
   - **Center Sprite Drum (`x: 64..128, y: 24..136`)**:
     - Vertical cylindrical metallic viewport (gray horizontal scan-gradient at top and bottom, crisp white center, right-pointing triangle pointer at `y: 80` pointing directly at the selected row).
     - Displays up to 3 sprites simultaneously: `selected - 1` (top, vertically compressed), `selected` (center `(96, 80)`, 1:1 scale), and `selected + 1` (bottom, vertically compressed).
   - **Right Yellow List Panel (`x: 132..236, y: 12..148`)**:
     - Displays visible scrolling list rows formatted as `No001 [Ball] TREECKO` (or `----------` when unseen).
     - Center row (`y: 72..88`) rests inside the white rounded selection bar.
     - Far-right vertical scrollbar (`x: 230, y: 20..140`) with green thumb and bouncing magenta top/bottom scroll arrows at `x: 184`.
   - **Start Menu Drawer (`start_menu_main.bin`)**:
     - Slides up from bottom in emerald green (`#188320`) with options: `BACK TO LIST`, `LIST TOP`, `LIST BOTTOM`, `BACK TO POKéDEX` (in search results), `CLOSE POKéDEX`.

2. **Info / Entry Screen (`PAGE_INFO`)**:
   - **Top Tab Bar (`y: 0..16`)**: `AREA`, `CRY`, `SIZE`, `CANCEL`.
   - **Upper White Data Card (`x: 12..228, y: 20..92`)**:
     - Left gray frame (`64×64`): Front sprite of the Pokémon.
     - Right gray header band: `No. 001 TREECKO` and species category (`WOOD GECKO POKéMON`).
     - Middle-right metrics: `HT` and `WT` with horizontal underlines.
     - Bottom-right circular badge: Footprint / mini-icon.
     - Type badges rendered in authentic Gen 3 pixel style (`GRASS`, `FIRE`, `WATER`, etc.).
   - **Bottom White Text Box (`x: 0..240, y: 96..160`)**:
     - Framed by orange-gold vertical bars on left and right edges.
     - Displays the 3-line Pokémon Emerald Pokédex flavor text (and evolution chain toggle/view).

3. **Sub-Screens (`AREA`, `CRY`, `SIZE`) & Search Screen (`SEARCH`)**:
   - **AREA**: Hoenn region map (`region_map.png`) with glowing red/pink habitat markers (`area_glow.png`) or `AREA UNKNOWN`.
   - **CRY**: Sprite box, `[ (A) |> ]` play control, oscilloscope waveform display (`cry_screen_bg.png`), and `VU` needle meter (`cry_meter.png`).
   - **SIZE**: Silhouette height comparison between selected Pokémon and Trainer (Brendan/May) on the gray stage.
   - **SEARCH (`SELECT`)**: `NAME`, `COLOR`, `TYPE`, `ORDER`, `MODE` filter selectors with `SHIFT`, `CANCEL`, and `OK` buttons.

## Procedure
1. Verify every UI component against the rendered GBA tilemaps from `pret/pokeemerald`.
2. Build components using exact CSS grid/pixel coordinates derived from the 240×160 native canvas.
3. Apply authentic Gen 3 pixel borders (2px stepped corners, no smooth anti-aliased `border-radius: 15px`).

## Quality Criteria & Restrictions
- **PROHIBITED**: Modern web cards, Bootstrap `.card` / `.list-group` / `.badge.rounded-pill`, Roboto/Arial typography, drop shadows (`box-shadow: 0 4px 20px`), or non-Gen-3 backgrounds (such as Rotom Dex or HD wallpapers).
- **REQUIRED**: Instant recognition by any Pokémon Emerald player as the authentic 2004 Hoenn Pokédex.
