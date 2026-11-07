---
name: pokedex-quality-assurance
description: >-
  Specialist in end-to-end functional testing, edge-case validation, build verification,
  and interactive QA of the Pokémon Emerald Pokédex web application.
---

# Pokédex Quality Assurance

## Purpose & Role
Validate that every feature, interaction, filter, keyboard shortcut, audio effect, data state, and responsive breakpoint of the Pokémon Emerald Pokédex works reliably with zero console or build errors.

## Specific Instructions

### 1. Functional Test Matrix
1. **Navigation & State Machine**:
   - Boot / Intro screen (`/`) transitions cleanly into the Pokédex (`/dashboard`) and `CLOSE POKéDEX` returns to `/`.
   - Up/Down navigation (`ArrowUp`/`ArrowDown`, D-Pad Up/Down, scroll wheel, or clicking rows) increments/decrements the selected Pokémon accurately from the first to the last entry.
   - Left/Right navigation in List View jumps by ±7 entries (`Page Up` / `Page Down` behavior from `pokedex.c`).
   - Pressing `A` / `Enter` on a Seen Pokémon opens its individual Entry (`INFO_VIEW`); pressing `B` / `Escape` / `CANCEL` returns to `LIST_VIEW` at the exact same scroll position.
   - Pressing `Up` / `Down` inside `INFO_VIEW` navigates directly to the previous / next Seen Pokémon's entry.
2. **Sub-Screens (`AREA`, `CRY`, `SIZE`) & Evolutions**:
   - `AREA` highlights the Pokémon's Hoenn routes/habitats on the authentic Hoenn region map (or displays `AREA UNKNOWN` for non-wild species).
   - `CRY` plays the Pokémon's cry when pressing `A` or clicking Play, animating both the oscilloscope waveform and the `VU` meter needle.
   - `SIZE` displays the proportional height/weight comparison between the Pokémon silhouette and the Trainer silhouette, plus evolution chain details.
3. **Search, Filters & Sorting (`SELECT` / `SEARCH` & `START` / `MENU`)**:
   - Search by **Name or Number** works both from the Search Menu (`SELECT`) and via quick keyboard filter.
   - Filter by **Type 1 / Type 2** (`GRASS`, `FIRE`, `WATER`, `DRAGON`, etc.) and **Color** (`GREEN`, `RED`, `BLUE`, etc.) works immediately across the entire Pokédex without requiring prior manual clicks on each Pokémon.
   - Sort by **Order** (`NUMERICAL`, `A TO Z`, `HEAVIEST`, `LIGHTEST`, `TALLEST`, `SMALLEST`) and switch **Mode** (`HOENN DEX` 202 vs `NATIONAL DEX` 386).
   - **Start Menu Drawer (`START`)**: `BACK TO LIST`, `LIST TOP`, `LIST BOTTOM`, `BACK TO POKéDEX` (when viewing search results), and `CLOSE POKéDEX` all execute accurately.
4. **Seen & Caught States**:
   - Caught Pokémon display the `caught_ball.png` icon in the list and increment `OWN`.
   - Seen (but uncaught) Pokémon display their name and sprite without the Poké Ball icon and increment `SEEN`.
   - Unseen Pokémon display `----------` and a blank/question slot, preventing entry inspection until marked Seen.
   - Interactive Caught/Seen toggle (`L`/`R` or status button) updates `SEEN`/`OWN` counters in real time and persists to `localStorage`.

### 2. Technical & Build Verification
- Run `npm run build` (`ng build`) and verify zero TypeScript, template, or CSS budget errors.
- Verify zero runtime errors in browser console during live testing.

## Procedure
1. Execute the build verification command (`npm run build`).
2. Start the development server and test all user flows across desktop and mobile viewports.
3. Record QA results in the validation report.

## Quality Criteria & Restrictions
- **PROHIBITED**: Broken filters, runtime `TypeError` exceptions, broken image URLs, or Angular build failures.
- **REQUIRED**: 100% pass rate across all functional, visual, and build checks.
