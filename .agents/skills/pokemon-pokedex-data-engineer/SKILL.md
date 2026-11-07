---
name: pokemon-pokedex-data-engineer
description: >-
  Specialist in Generation III (Hoenn & National Dex) Pokémon data architecture,
  PokeAPI integration, caching, Hoenn-to-National ID mapping, species descriptions,
  evolutions, habitats, and seen/caught state persistence.
---

# Pokémon Pokédex Data Engineer

## Purpose & Role
Architect a fast, resilient, structured data layer for the Pokémon Emerald Pokédex that accurately models the **Hoenn Pokédex (202 Pokémon: #001 Treecko to #202 Deoxys, National #252–#386 plus native Hoenn cross-gen species)** and the **National Pokédex (#001 Bulbasaur to #386 Deoxys)** without mixing post-Gen-3 mechanics unannounced.

## Specific Instructions

### 1. Hoenn & National Dex Ordering (`pokedex_orders.h`)
- **Hoenn Mode (`DEX_MODE_HOENN`)**:
  - Contains the 202 Pokémon of the official Gen 3 Hoenn Pokédex in exact Hoenn numerical order (`No001` Treecko [Nat #252] through `No202` Deoxys [Nat #386], including native Hoenn returning Pokémon such as Marill, Zubat, Tentacool, Pikachu, Heracross, etc., or clean Hoenn/Gen-3 indexing).
  - Displays the 3-digit **Hoenn Dex Number** (`No001`–`No202`) when in Hoenn Mode, and the 3-digit **National Dex Number** (`No001`–`No386`) when in National Mode.
- **Sorting Orders (`sOrderOptions`)**:
  - `NUMERICAL`: Default Dex number order.
  - `A TO Z` (`ALPHABETICAL`): Alphabetical A–Z sorting.
  - `HEAVIEST` / `LIGHTEST`: Sorted by weight descending / ascending.
  - `TALLEST` / `SMALLEST`: Sorted by height descending / ascending.

### 2. Structured Pokémon Data Model
Each Pokémon entry must resolve and cache:
- `nationalId`: `number` (1–386 for Gen 3 authenticity)
- `hoennId`: `number | null` (1–202 for Hoenn Dex species)
- `name`: `string` (uppercase display name, e.g., `TREECKO`)
- `category`: `string` (e.g., `WOOD GECKO POKéMON` / `POKéMON GECKO BOSQUE`)
- `types`: `string[]` (Gen 3 types; pre-Gen-6 Fairy Pokémon retain their Gen 3 Normal/Psychic typing or clearly indicate Gen 3 typing)
- `heightDecimeters` / `weightHectograms`: formatted both in metric (`0.5 m`, `5.0 kg`) and imperial/GBA style (`1'08"`, `11.0 lbs.`)
- `description`: Authentic Pokémon Emerald flavor text from `pokemon-species` (`version.name === 'emerald'` or `'ruby'`/`'sapphire'`/Spanish localized fallback)
- `sprites`:
  - `emeraldFront`: Gen 3 Emerald animated/static front sprite (`versions['generation-iii'].emerald.front_default`)
  - `rsFront`: Gen 3 Ruby/Sapphire front sprite fallback
  - `defaultFront`: Standard front sprite fallback
  - `icon`: Gen 3 box/menu icon (`versions['generation-vii'].icons.front_default` or sprite fallback)
  - `footprint`: Pokémon footprint sprite or generated pixel footprint
- `cryUrl`: Authentic `.ogg` / `.mp3` cry from PokeAPI (`cries.legacy` or `cries.latest`) + Web Audio API synthesized GBA cry fallback
- `evolutions`: Structured evolution chain (`from`, `to`, `trigger`, `minLevel`, `item`) parsed from `evolution-chain`
- `hoennAreas`: Habitat / Hoenn route locations for the `AREA` screen
- `color`: Species color (`red`, `blue`, `yellow`, `green`, `black`, `brown`, `purple`, `gray`, `white`, `pink`) for the Emerald `SEARCH` filter
- `seen` & `caught`: Boolean flags persisted in `localStorage` (`emerald_pokedex_save_v1`) with a realistic default preset (all Hoenn/Gen 3 Pokémon seen, iconic Hoenn species caught, plus interactive toggle to mark any Pokémon as Seen / Caught / Unseen like a real save file!).

### 3. Performance & Offline Resilience
- Pre-populate core metadata for the Hoenn/Gen 3 roster so list scrolling, filtering (`NAME`, `COLOR`, `TYPE`, `ORDER`, `MODE`), and the 3-sprite drum wheel operate at **60 FPS with zero network lag**.
- Lazily fetch and cache detailed `pokemon` + `pokemon-species` + `evolution-chain` payloads in an in-memory `Map` and `localStorage` cache when viewing an entry.

## Procedure
1. Build a dedicated Hoenn/Gen-3 static lookup table (`hoenn-dex.data.ts`) containing the complete 202 Hoenn Dex mapping (and 386 National Dex Gen 3 roster with types, heights, weights, colors, Hoenn habitats, and fallback Emerald descriptions) so that **every single filter (`TYPE`, `COLOR`, `ORDER`, `NAME`) works instantaneously** without waiting for 386 individual HTTP requests!
2. Enrich selected Pokémon entries dynamically via `PokemonService` (`pokeapi.co/api/v2/pokemon/{id}` and `pokemon-species/{id}`) while keeping instant local fallback data.

## Quality Criteria & Restrictions
- **PROHIBITED**: Broken `filterByType` where `pokemon.types` is empty `[]` on initial load (a bug present in the original codebase!).
- **REQUIRED**: Instantaneous filtering by Type, Color, Name, and Order across the entire Pokédex list, with 100% Gen 3 data consistency.
