---
name: pokemon-visual-reference-auditor
description: >-
  Specialist in comparing the implemented Pokédex interface against authentic Pokémon
  Emerald (GBA, 2004) reference captures, tilemaps, and palettes across three validation rounds.
---

# Pokémon Visual Reference Auditor

## Purpose & Role
Conduct rigorous visual and structural audits comparing the implemented web Pokédex against original **Pokémon Emerald (Game Boy Advance, 2004)** reference captures (`Pokédex_E.png` and `pret/pokeemerald/graphics/pokedex/` tilemap renders).

## Specific Instructions

### 1. Three Mandatory Audit Rounds
Perform at least three distinct validation rounds before sign-off:

1. **Round 1 — Structural Fidelity Audit**:
   - Verify the 3:2 GBA LCD aspect ratio (`240 × 160` base grid).
   - List Screen (`PAGE_MAIN`):
     - Left zone (`0–26.6%` width): Rotating Poké Ball wheel cutout, `SEEN` / `OWN` counters, `[START] MENU` and `[SELECT] SEARCH` pill indicators.
     - Center zone (`26.6–53.3%` width): Metallic cylindrical sprite drum displaying up to 3 vertically foreshortened Pokémon sprites (`selected - 1`, `selected`, `selected + 1`) and the right-pointing white selection arrow.
     - Right zone (`55–98.3%` width): Bright yellow (`#EEF639`) list panel with dark slate border (`#293941`), centered white selection bar, `No000` + Poké Ball icon + uppercase name rows, vertical scrollbar track (`#BD9C5A`) with green thumb, and top/bottom magenta scroll arrows.
   - Info Screen (`PAGE_INFO`):
     - Top bar (`#29396A`) with `AREA`, `CRY`, `SIZE`, and `CANCEL` pills.
     - Upper white card with 64×64 sprite box, gray header strip (`No. XXX NAME` + species category), `HT` / `WT` underlined rows, footprint circle, and Gen 3 type badges.
     - Lower full-width white description box with golden-orange vertical side borders (`#FFEE00` / `#FFBD00` / `#FF7300`).
   - Sub-screens (`AREA`, `CRY`, `SIZE`) and `SEARCH` screen match their respective `pret/pokeemerald` tilemaps.

2. **Round 2 — Graphical & Chromatic Fidelity Audit**:
   - Verify exact hex colors against `bg_hoenn.pal` (`#31D54A`, `#188320`, `#000029`, `#EEF639`, `#29396A`, `#B4CDF6`, `#FF00BD`), `bg_national.pal` (`#7BA473`, `#4A7341`), `search_results_bg.pal` (`#7B9420`, `#295200`), and `search_menu.pal` (`#FFAC00`, `#9CE600`).
   - Confirm all Pokémon sprites are authentic Gen 3 pixel sprites rendered with `image-rendering: pixelated`.
   - Confirm pixel typography uses crisp 1px solid drop shadows with zero anti-aliasing blur.

3. **Round 3 — Detail, Animation & Ergonomic Refinement Audit**:
   - Verify unseen Pokémon display `----------` in the list and cannot open the Info Screen until seen (or can be toggled via the Seen/Caught trainer tool).
   - Verify the Poké Ball wheel rotates when scrolling, the 3-sprite drum updates smoothly, the Start Menu drawer slides up from the bottom, and the Cry Screen animates both the oscilloscope waveform and `VU` meter needle.
   - Verify responsive layout at desktop (`1280×800`) and mobile (`375×667`) viewports without overflow or text clipping.

## Procedure
1. Capture live screenshots of each Pokédex screen (Intro/Shell, Hoenn List, Info Entry, Area Map, Cry Oscilloscope, Size Comparison, Search/Filter, Start Menu Drawer, Mobile View).
2. Compare side-by-side against `pret/pokeemerald` reference renders.
3. Log any discrepancy and fix CSS/HTML/TS immediately before completing the round.

## Quality Criteria & Restrictions
- **PROHIBITED**: Signing off on any screen that retains Bootstrap default styling, rounded modern cards, non-pixelated images, or misaligned panels.
- **REQUIRED**: Documented pass across all 10 verification checkpoints (Sizes, Spacing, Colors, Typography, Sprites, Proportions, States, Animations, Responsive, Functionality).
