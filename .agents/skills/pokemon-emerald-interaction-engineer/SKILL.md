---
name: pokemon-emerald-interaction-engineer
description: >-
  Specialist in Game Boy Advance hardware input mapping, state machine navigation,
  Pokédex wheel scrolling physics, Start Menu drawer, and Search/Filter workflows.
---

# Pokémon Emerald Interaction Engineer

## Purpose & Role
Design and implement the interactive state machine of the Pokédex so it behaves like a genuine **Game Boy Advance cartridge ROM (`pokedex.c`)** rather than a web page or admin dashboard.

## Specific Instructions

### 1. GBA State Machine (`PokedexScreenState`)
Reproduce the exact screen states and transitions from `src/pokedex.c`:
- `BOOT_INTRO` (Route `/` or power-on sequence): Professor Birch Hoenn Pokédex presentation & GBA hardware shell -> transitions via black palette fade to `LIST_VIEW`.
- `LIST_VIEW` (`PAGE_MAIN` & `PAGE_SEARCH_RESULTS`):
  - `D-Pad UP / DOWN` (or Mouse Wheel / Click on row / Up-Down arrows): Moves selection by 1 Pokémon (`TryDoPokedexScroll`), rotating the left Poké Ball wheel by `±16` units and rotating the 3-sprite center cylinder drum.
  - `D-Pad LEFT / RIGHT`: Jumps by **7 entries** (page up/down, `SE_DEX_PAGE`), just like `pokedex.c` lines 2615–2635!
  - `A Button` (`Enter` / `Z` / Click on center sprite or double-click/re-click selected row): Opens `INFO_VIEW` (`SE_PIN`) if the Pokémon is `seen`.
  - `START Button` (`Shift` / `Space` / Click `START MENU`): Slides up the green **Start Menu Drawer** (`BACK TO LIST`, `LIST TOP`, `LIST BOTTOM`, `BACK TO POKéDEX`, `CLOSE POKéDEX`).
  - `SELECT Button` (`Tab` / `S` / Click `SELECT SEARCH`): Opens `SEARCH_VIEW` (`SE_PC_LOGIN`).
  - `B Button` (`Escape` / `X`): Exits search results back to main list, or closes the Pokédex (`SE_PC_OFF`).
- `INFO_VIEW` (`PAGE_INFO` — Ficha Individual):
  - Top bar navigation (`LEFT / RIGHT` or direct click): Cycles cursor across `AREA`, `CRY`, `SIZE`, `CANCEL`.
  - `A Button` on `AREA` -> opens `AREA_VIEW`; on `CRY` -> opens `CRY_VIEW`; on `SIZE` -> opens `SIZE_VIEW`; on `CANCEL` -> returns to `LIST_VIEW`.
  - `UP / DOWN` while in `INFO_VIEW`: Scrolls directly to the previous/next Seen Pokémon's entry (`TryDoInfoScreenScroll`) with vertical slide transition!
  - `B Button`: Returns immediately to `LIST_VIEW`.
- `AREA_VIEW`, `CRY_VIEW`, `SIZE_VIEW`:
  - `LEFT / RIGHT` switches directly between the sub-screens or `B Button` / `CANCEL` returns to `INFO_VIEW`.
  - In `CRY_VIEW`, pressing `A Button` triggers the Pokémon's cry audio, animates the oscilloscope waveform, and deflects the `VU` meter needle!
- `SEARCH_VIEW` (`LoadSearchMenu`):
  - Navigate fields (`NAME`, `COLOR`, `TYPE 1`, `TYPE 2`, `ORDER`, `MODE`, `OK`) with D-Pad or direct pointer clicks, plus instant keyboard text input for quick search.
  - Selecting `OK` / `START` executes the search (`Task_OpenSearchResults`) and switches the list screen into the olive-green **Search Results** mode (`search_results_bg.pal`)!

### 2. Dual Input Ergonomics (Keyboard + Virtual GBA Controls + Direct Touch/Mouse)
- **Keyboard Bindings**:
  - `ArrowUp` / `W`: D-Pad Up
  - `ArrowDown` / `S`: D-Pad Down
  - `ArrowLeft` / `A`: D-Pad Left
  - `ArrowRight` / `D`: D-Pad Right
  - `Enter` / `z` / `Z`: GBA **A** Button
  - `Escape` / `Backspace` / `x` / `X`: GBA **B** Button
  - `Shift` / `m` / `M`: GBA **START** Button (Menu)
  - `Tab` / `f` / `F`: GBA **SELECT** Button (Search/Filter)
  - `l` / `L` & `r` / `R`: GBA **L / R** Shoulder Buttons (quick caught/seen status toggle or evolutions tab)
- **On-Screen Interactive Controls**:
  - Every visual button inside the GBA screen (`AREA`, `CRY`, `SIZE`, `CANCEL`, `START MENU`, `SELECT SEARCH`, scroll arrows, list items, search pills) AND the physical GBA shell buttons (`D-Pad`, `A`, `B`, `START`, `SELECT`, `L`, `R`) must respond to mouse clicks and mobile touch events with tactile visual feedback.

## Procedure
1. Centralize input handling in the Pokédex component (`@HostListener('window:keydown')`) with clean separation when typing in the Search text input.
2. Ensure every keyboard action has an identical visual button action and vice versa.

## Quality Criteria & Restrictions
- **PROHIBITED**: Dead buttons, non-interactive decorative tabs, or requiring a mouse when using the keyboard (or vice versa).
- **REQUIRED**: 100% keyboard-navigable AND 100% pointer/touch-navigable video game UI.
