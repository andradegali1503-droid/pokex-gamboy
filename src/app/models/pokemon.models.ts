export type DexMode = 'HOENN' | 'NATIONAL';

export type DexOrder =
  | 'NUMERICAL'
  | 'ALPHABETICAL'
  | 'HEAVIEST'
  | 'LIGHTEST'
  | 'TALLEST'
  | 'SMALLEST';

export type PokedexScreen =
  | 'LIST'
  | 'INFO'
  | 'AREA'
  | 'CRY'
  | 'SIZE'
  | 'SEARCH';

export interface EvolutionEdge {
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  trigger: string;
}

export interface EmeraldPokemonData {
  nationalId: number;
  hoennId: number | null;
  name: string;
  slug: string;
  category: string;
  types: string[];
  color: string;
  heightDm: number;
  weightHg: number;
  description: string;
  pokemonScale: number;
  pokemonOffset: number;
  trainerScale: number;
  trainerOffset: number;
  areas: string[];
  evolutions: EvolutionEdge[];
}

export interface Pokemon extends EmeraldPokemonData {
  id: number;
  dexNumber: number;
  dexNumberFormatted: string;
  sprite: string;
  fallbackSprite: string;
  shinySprite: string;
  cryUrl: string;
  height: number;
  weight: number;
  heightFormattedImperial: string;
  weightFormattedImperial: string;
  heightFormattedMetric: string;
  weightFormattedMetric: string;
  seen: boolean;
  caught: boolean;
  stats?: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  ability?: string;
}

export interface PokedexSearchFilters {
  nameQuery: string;
  type1: string;
  type2: string;
  color: string;
  mode: DexMode;
  order: DexOrder;
}

export interface HoennMapPoint {
  name: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  isDungeon?: boolean;
}
