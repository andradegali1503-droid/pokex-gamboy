import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EMERALD_POKEMON_DATA } from './data/emerald-pokedex.data';
import {
  DexMode,
  DexOrder,
  EmeraldPokemonData,
  HoennMapPoint,
  Pokemon,
  PokedexSearchFilters
} from './models/pokemon.models';

interface SaveState {
  seenIds: number[];
  caughtIds: number[];
}

const SAVE_STORAGE_KEY = 'emerald_pokedex_save_v1';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private baseUrl = 'https://pokeapi.co/api/v2/';
  private isBrowser: boolean;
  private seenSet = new Set<number>();
  private caughtSet = new Set<number>();
  private apiCache = new Map<number, Partial<Pokemon>>();

  /** Coordinates of Hoenn routes and dungeons on the 240x160 AREA screen map */
  public readonly hoennMapCoords: Record<string, HoennMapPoint> = {
    'ROUTE101': { name: 'ROUTE 101', xPercent: 18, yPercent: 78, widthPercent: 5, heightPercent: 7 },
    'ROUTE102': { name: 'ROUTE 102', xPercent: 11, yPercent: 70, widthPercent: 7, heightPercent: 5 },
    'ROUTE103': { name: 'ROUTE 103', xPercent: 17, yPercent: 63, widthPercent: 8, heightPercent: 5 },
    'ROUTE104': { name: 'ROUTE 104', xPercent: 4, yPercent: 56, widthPercent: 5, heightPercent: 16 },
    'PETALBURG WOODS': { name: 'PETALBURG WOODS', xPercent: 5, yPercent: 60, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE105': { name: 'ROUTE 105', xPercent: 4, yPercent: 72, widthPercent: 5, heightPercent: 14 },
    'ROUTE106': { name: 'ROUTE 106', xPercent: 6, yPercent: 86, widthPercent: 10, heightPercent: 5 },
    'GRANITE CAVE': { name: 'GRANITE CAVE', xPercent: 11, yPercent: 88, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE107': { name: 'ROUTE 107', xPercent: 15, yPercent: 88, widthPercent: 10, heightPercent: 5 },
    'ROUTE108': { name: 'ROUTE 108', xPercent: 23, yPercent: 88, widthPercent: 8, heightPercent: 5 },
    'ABANDONED SHIP': { name: 'ABANDONED SHIP', xPercent: 25, yPercent: 88, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE109': { name: 'ROUTE 109', xPercent: 30, yPercent: 74, widthPercent: 5, heightPercent: 14 },
    'ROUTE110': { name: 'ROUTE 110', xPercent: 30, yPercent: 48, widthPercent: 5, heightPercent: 16 },
    'NEW MAUVILLE': { name: 'NEW MAUVILLE', xPercent: 32, yPercent: 47, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE111': { name: 'ROUTE 111', xPercent: 30, yPercent: 16, widthPercent: 5, heightPercent: 26 },
    'MIRAGE TOWER': { name: 'MIRAGE TOWER', xPercent: 31, yPercent: 26, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE112': { name: 'ROUTE 112', xPercent: 24, yPercent: 30, widthPercent: 7, heightPercent: 5 },
    'FIERY PATH': { name: 'FIERY PATH', xPercent: 26, yPercent: 28, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'JAGGED PASS': { name: 'JAGGED PASS', xPercent: 24, yPercent: 25, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'MT CHIMNEY': { name: 'MT. CHIMNEY', xPercent: 25, yPercent: 21, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE113': { name: 'ROUTE 113', xPercent: 18, yPercent: 13, widthPercent: 13, heightPercent: 5 },
    'ROUTE114': { name: 'ROUTE 114', xPercent: 7, yPercent: 14, widthPercent: 8, heightPercent: 14 },
    'METEOR FALLS': { name: 'METEOR FALLS', xPercent: 7, yPercent: 26, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'RUSTURF TUNNEL': { name: 'RUSTURF TUNNEL', xPercent: 12, yPercent: 38, widthPercent: 6, heightPercent: 5, isDungeon: true },
    'ROUTE115': { name: 'ROUTE 115', xPercent: 4, yPercent: 26, widthPercent: 5, heightPercent: 14 },
    'ROUTE116': { name: 'ROUTE 116', xPercent: 9, yPercent: 38, widthPercent: 10, heightPercent: 5 },
    'ROUTE117': { name: 'ROUTE 117', xPercent: 20, yPercent: 43, widthPercent: 10, heightPercent: 5 },
    'ROUTE118': { name: 'ROUTE 118', xPercent: 36, yPercent: 43, widthPercent: 6, heightPercent: 5 },
    'ROUTE119': { name: 'ROUTE 119', xPercent: 40, yPercent: 16, widthPercent: 5, heightPercent: 28 },
    'ROUTE120': { name: 'ROUTE 120', xPercent: 46, yPercent: 16, widthPercent: 5, heightPercent: 16 },
    'ROUTE121': { name: 'ROUTE 121', xPercent: 50, yPercent: 28, widthPercent: 12, heightPercent: 5 },
    'SAFARI ZONE': { name: 'SAFARI ZONE', xPercent: 54, yPercent: 26, widthPercent: 6, heightPercent: 6, isDungeon: true },
    'ROUTE122': { name: 'ROUTE 122', xPercent: 57, yPercent: 33, widthPercent: 5, heightPercent: 10 },
    'MT PYRE': { name: 'MT. PYRE', xPercent: 57, yPercent: 36, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE123': { name: 'ROUTE 123', xPercent: 42, yPercent: 43, widthPercent: 16, heightPercent: 5 },
    'ROUTE124': { name: 'ROUTE 124', xPercent: 70, yPercent: 28, widthPercent: 14, heightPercent: 12 },
    'ROUTE125': { name: 'ROUTE 125', xPercent: 84, yPercent: 24, widthPercent: 6, heightPercent: 8 },
    'SHOAL CAVE': { name: 'SHOAL CAVE', xPercent: 85, yPercent: 24, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE126': { name: 'ROUTE 126', xPercent: 71, yPercent: 42, widthPercent: 12, heightPercent: 12 },
    'ROUTE127': { name: 'ROUTE 127', xPercent: 84, yPercent: 40, widthPercent: 6, heightPercent: 14 },
    'ROUTE128': { name: 'ROUTE 128', xPercent: 78, yPercent: 54, widthPercent: 14, heightPercent: 6 },
    'SEAFLOOR CAVERN': { name: 'SEAFLOOR CAVERN', xPercent: 84, yPercent: 55, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'CAVE OF ORIGIN': { name: 'CAVE OF ORIGIN', xPercent: 74, yPercent: 46, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE129': { name: 'ROUTE 129', xPercent: 84, yPercent: 60, widthPercent: 6, heightPercent: 6 },
    'ROUTE130': { name: 'ROUTE 130', xPercent: 72, yPercent: 61, widthPercent: 12, heightPercent: 5 },
    'ROUTE131': { name: 'ROUTE 131', xPercent: 62, yPercent: 61, widthPercent: 10, heightPercent: 5 },
    'SKY PILLAR': { name: 'SKY PILLAR', xPercent: 68, yPercent: 58, widthPercent: 5, heightPercent: 6, isDungeon: true },
    'ROUTE132': { name: 'ROUTE 132', xPercent: 50, yPercent: 61, widthPercent: 8, heightPercent: 5 },
    'ROUTE133': { name: 'ROUTE 133', xPercent: 41, yPercent: 61, widthPercent: 9, heightPercent: 5 },
    'ROUTE134': { name: 'ROUTE 134', xPercent: 32, yPercent: 61, widthPercent: 9, heightPercent: 5 },
    'VICTORY ROAD': { name: 'VICTORY ROAD', xPercent: 93, yPercent: 52, widthPercent: 5, heightPercent: 6, isDungeon: true }
  };

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initSaveState();
  }

  private initSaveState(): void {
    if (this.isBrowser) {
      try {
        const raw = localStorage.getItem(SAVE_STORAGE_KEY);
        if (raw) {
          const parsed: SaveState = JSON.parse(raw);
          if (Array.isArray(parsed.seenIds) && Array.isArray(parsed.caughtIds)) {
            this.seenSet = new Set(parsed.seenIds);
            this.caughtSet = new Set(parsed.caughtIds);
            return;
          }
        }
      } catch {
        // Fallback to default save state
      }
    }

    // Default authentic Emerald Trainer save:
    // All 386 Gen 3 Pokémon are Seen so the user can inspect any Pokémon immediately,
    // and iconic Hoenn + Kanto/Johto Pokémon (~135 species) are marked Caught with the Poké Ball badge.
    for (const mon of EMERALD_POKEMON_DATA) {
      this.seenSet.add(mon.nationalId);
      if (
        (mon.hoennId !== null && (mon.hoennId <= 45 || mon.hoennId % 2 === 1 || mon.hoennId >= 195)) ||
        mon.nationalId <= 30 ||
        [133, 143, 149, 150, 151, 248, 249, 250, 251].includes(mon.nationalId)
      ) {
        this.caughtSet.add(mon.nationalId);
      }
    }
    this.persistSaveState();
  }

  private persistSaveState(): void {
    if (!this.isBrowser) return;
    try {
      const payload: SaveState = {
        seenIds: Array.from(this.seenSet),
        caughtIds: Array.from(this.caughtSet)
      };
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }

  /** Backward-compatible method returning the full Gen 3 roster */
  public getAllPokemon(): Observable<Pokemon[]> {
    return of(this.getEmeraldPokemonList('HOENN', 'NUMERICAL'));
  }

  /** Backward-compatible method returning a single Pokémon enriched with PokeAPI data */
  public getPokemon(nameOrId: string | number): Observable<Pokemon> {
    const query = String(nameOrId).trim().toLowerCase();
    const base = EMERALD_POKEMON_DATA.find(
      p =>
        p.nationalId === Number(query) ||
        p.hoennId === Number(query) ||
        p.name.toLowerCase() === query ||
        p.slug === query
    ) || EMERALD_POKEMON_DATA[251]; // Default Treecko

    const hydrated = this.hydratePokemon(base, 'HOENN');
    const cached = this.apiCache.get(base.nationalId);
    if (cached) {
      return of({ ...hydrated, ...cached });
    }

    return this.http.get<any>(`${this.baseUrl}pokemon/${base.nationalId}`).pipe(
      map((apiData: any) => {
        const emeraldSprite =
          apiData?.sprites?.versions?.['generation-iii']?.emerald?.front_default ||
          apiData?.sprites?.versions?.['generation-iii']?.['ruby-sapphire']?.front_default ||
          hydrated.sprite;
        const stats = apiData?.stats
          ? {
              hp: apiData.stats[0]?.base_stat || 50,
              atk: apiData.stats[1]?.base_stat || 50,
              def: apiData.stats[2]?.base_stat || 50,
              spa: apiData.stats[3]?.base_stat || 50,
              spd: apiData.stats[4]?.base_stat || 50,
              spe: apiData.stats[5]?.base_stat || 50
            }
          : undefined;
        const ability = apiData?.abilities?.[0]?.ability?.name
          ? String(apiData.abilities[0].ability.name).replace(/-/g, ' ').toUpperCase()
          : undefined;

        const extra: Partial<Pokemon> = {
          sprite: emeraldSprite,
          stats,
          ability
        };
        this.apiCache.set(base.nationalId, extra);
        return { ...hydrated, ...extra };
      }),
      catchError(() => of(hydrated))
    );
  }

  public getEmeraldPokemonList(
    mode: DexMode,
    order: DexOrder,
    filters?: Partial<PokedexSearchFilters>
  ): Pokemon[] {
    let source = EMERALD_POKEMON_DATA.slice();

    if (mode === 'HOENN') {
      source = source.filter(p => p.hoennId !== null);
    }

    let list = source.map(raw => this.hydratePokemon(raw, mode));

    if (filters) {
      if (filters.nameQuery && filters.nameQuery.trim()) {
        const q = filters.nameQuery.trim().toLowerCase();
        list = list.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            p.dexNumberFormatted.includes(q) ||
            String(p.dexNumber) === q ||
            String(p.nationalId) === q
        );
      }
      if (filters.type1 && filters.type1 !== 'NONE') {
        list = list.filter(p => p.types.includes(filters.type1!));
      }
      if (filters.type2 && filters.type2 !== 'NONE') {
        list = list.filter(p => p.types.includes(filters.type2!));
      }
      if (filters.color && filters.color !== 'NONE') {
        list = list.filter(p => p.color === filters.color);
      }
    }

    switch (order) {
      case 'NUMERICAL':
        list.sort((a, b) => a.dexNumber - b.dexNumber);
        break;
      case 'ALPHABETICAL':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'HEAVIEST':
        list.sort((a, b) => b.weightHg - a.weightHg || a.dexNumber - b.dexNumber);
        break;
      case 'LIGHTEST':
        list.sort((a, b) => a.weightHg - b.weightHg || a.dexNumber - b.dexNumber);
        break;
      case 'TALLEST':
        list.sort((a, b) => b.heightDm - a.heightDm || a.dexNumber - b.dexNumber);
        break;
      case 'SMALLEST':
        list.sort((a, b) => a.heightDm - b.heightDm || a.dexNumber - b.dexNumber);
        break;
    }

    return list;
  }

  public getPokemonByNationalId(nationalId: number, mode: DexMode = 'HOENN'): Pokemon | undefined {
    const found = EMERALD_POKEMON_DATA.find(p => p.nationalId === nationalId);
    return found ? this.hydratePokemon(found, mode) : undefined;
  }

  public cyclePokemonStatus(nationalId: number): { seen: boolean; caught: boolean } {
    const isSeen = this.seenSet.has(nationalId);
    const isCaught = this.caughtSet.has(nationalId);

    if (isCaught) {
      // Caught -> Unseen (so user can test '----------' unseen state too!)
      this.caughtSet.delete(nationalId);
      this.seenSet.delete(nationalId);
    } else if (isSeen) {
      // Seen -> Caught
      this.seenSet.add(nationalId);
      this.caughtSet.add(nationalId);
    } else {
      // Unseen -> Seen
      this.seenSet.add(nationalId);
      this.caughtSet.delete(nationalId);
    }

    this.persistSaveState();
    return {
      seen: this.seenSet.has(nationalId),
      caught: this.caughtSet.has(nationalId)
    };
  }

  public setAllHoennCaught(): void {
    for (const mon of EMERALD_POKEMON_DATA) {
      this.seenSet.add(mon.nationalId);
      this.caughtSet.add(mon.nationalId);
    }
    this.persistSaveState();
  }

  public getCounts(): {
    hoennSeen: number;
    hoennOwn: number;
    nationalSeen: number;
    nationalOwn: number;
  } {
    let hoennSeen = 0;
    let hoennOwn = 0;
    let nationalSeen = 0;
    let nationalOwn = 0;

    for (const mon of EMERALD_POKEMON_DATA) {
      const seen = this.seenSet.has(mon.nationalId);
      const caught = this.caughtSet.has(mon.nationalId);
      if (seen) nationalSeen++;
      if (caught) nationalOwn++;
      if (mon.hoennId !== null) {
        if (seen) hoennSeen++;
        if (caught) hoennOwn++;
      }
    }

    return { hoennSeen, hoennOwn, nationalSeen, nationalOwn };
  }

  public hydratePokemon(raw: EmeraldPokemonData, mode: DexMode): Pokemon {
    const dexNumber = mode === 'HOENN' && raw.hoennId !== null ? raw.hoennId : raw.nationalId;
    const dexNumberFormatted = String(dexNumber).padStart(3, '0');

    // Authentic Generation III Pokémon Emerald front sprite from PokeAPI sprite repository
    const emeraldSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/${raw.nationalId}.png`;
    const fallbackSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${raw.nationalId}.png`;
    const shinySprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/shiny/${raw.nationalId}.png`;
    const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${raw.nationalId}.ogg`;

    const heightMeters = Number((raw.heightDm / 10).toFixed(1));
    const weightKg = Number((raw.weightHg / 10).toFixed(1));

    const totalInches = Math.round((raw.heightDm * 10) / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    const heightFormattedImperial = `${feet}'${String(inches).padStart(2, '0')}"`;

    const lbs = (raw.weightHg * 0.220462).toFixed(1);
    const weightFormattedImperial = `${lbs} lbs.`;

    const heightFormattedMetric = `${heightMeters.toFixed(1)} m`;
    const weightFormattedMetric = `${weightKg.toFixed(1)} kg`;

    const cached = this.apiCache.get(raw.nationalId);

    return {
      ...raw,
      id: raw.nationalId,
      dexNumber,
      dexNumberFormatted,
      sprite: cached?.sprite || emeraldSprite,
      fallbackSprite,
      shinySprite,
      cryUrl,
      height: heightMeters,
      weight: weightKg,
      heightFormattedImperial,
      weightFormattedImperial,
      heightFormattedMetric,
      weightFormattedMetric,
      seen: this.seenSet.has(raw.nationalId),
      caught: this.caughtSet.has(raw.nationalId),
      stats: cached?.stats,
      ability: cached?.ability
    };
  }
}
