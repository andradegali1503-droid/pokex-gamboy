import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PokemonService } from '../../pokemon.service';
import { GbaAudioService } from '../../services/gba-audio.service';
import {
  DexMode,
  DexOrder,
  HoennMapPoint,
  Pokemon,
  PokedexScreen
} from '../../models/pokemon.models';

export interface VisibleListRow {
  offset: number;
  index: number;
  pokemon: Pokemon | null;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public readonly Math = Math;
  public pokemonList: Pokemon[] = [];
  public filteredPokemonList: Pokemon[] = [];
  public selectedPokemon: Pokemon | null = null;
  public selectedIndex: number = 0;

  // Screen & Navigation State Machine (mirrors pret/pokeemerald src/pokedex.c)
  public currentScreen: PokedexScreen = 'LIST';
  public infoTabIndex: number = 0; // 0: AREA, 1: CRY, 2: SIZE, 3: CANCEL
  public infoSubPage: 'DESCRIPTION' | 'EVOLUTIONS' = 'DESCRIPTION';
  public useMetricUnits: boolean = true;
  public showShinySprite: boolean = false;
  public isMaximizedLcd: boolean = false;
  public isScreenFading: boolean = false;

  // List Screen Mechanics
  public pokeBallRotationDeg: number = 0;
  public scrollDirectionClass: '' | 'scroll-up' | 'scroll-down' = '';
  public isStartMenuOpen: boolean = false;
  public startMenuCursor: number = 0;
  public isSearchResultsMode: boolean = false;

  // Search & Filter State
  public dexMode: DexMode = 'HOENN';
  public dexOrder: DexOrder = 'NUMERICAL';
  public searchNameQuery: string = '';
  public selectedType1: string = 'NONE';
  public selectedType2: string = 'NONE';
  public selectedColor: string = 'NONE';
  public searchCursorRow: number = 0; // 0: NAME, 1: COLOR, 2: TYPE, 3: ORDER, 4: MODE, 5: OK

  // Cry Screen State
  public isPlayingCry: boolean = false;
  public cryWaveform: number[] = new Array(48).fill(0);
  public cryVuLevel: number = 0;

  // Seen / Own Counters
  public counts = {
    hoennSeen: 202,
    hoennOwn: 95,
    nationalSeen: 386,
    nationalOwn: 135
  };

  public readonly pokemonTypes: string[] = [
    'NONE', 'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE',
    'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG',
    'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL'
  ];

  public readonly pokemonColors: string[] = [
    'NONE', 'GREEN', 'RED', 'BLUE', 'YELLOW', 'BROWN',
    'PURPLE', 'GRAY', 'WHITE', 'PINK', 'BLACK'
  ];

  public readonly orderOptions: { value: DexOrder; label: string }[] = [
    { value: 'NUMERICAL', label: 'NUMERICAL' },
    { value: 'ALPHABETICAL', label: 'A TO Z' },
    { value: 'HEAVIEST', label: 'HEAVIEST' },
    { value: 'LIGHTEST', label: 'LIGHTEST' },
    { value: 'TALLEST', label: 'TALLEST' },
    { value: 'SMALLEST', label: 'SMALLEST' }
  ];

  constructor(
    public pokemonService: PokemonService,
    public audio: GbaAudioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshCounts();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode')?.toUpperCase();
      if (modeParam === 'NATIONAL' || modeParam === 'HOENN') {
        this.dexMode = modeParam as DexMode;
      }
      const orderParam = params.get('order')?.toUpperCase();
      if (orderParam === 'ALPHABETICAL' || orderParam === 'HEAVIEST' || orderParam === 'LIGHTEST' || orderParam === 'TALLEST' || orderParam === 'SMALLEST' || orderParam === 'NUMERICAL') {
        this.dexOrder = orderParam as DexOrder;
      }
    }
    this.loadPokemonRoster(false);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id');
      if (idParam) {
        const targetId = parseInt(idParam, 10);
        const foundIdx = this.filteredPokemonList.findIndex(
          p => (this.dexMode === 'HOENN' ? p.hoennId === targetId : p.nationalId === targetId) || p.nationalId === targetId
        );
        if (foundIdx >= 0) {
          this.setSelectedIndex(foundIdx, false);
        }
      }
      const screenParam = params.get('screen')?.toUpperCase();
      if (screenParam === 'INFO' || screenParam === 'AREA' || screenParam === 'CRY' || screenParam === 'SIZE' || screenParam === 'SEARCH' || screenParam === 'LIST') {
        this.currentScreen = screenParam as PokedexScreen;
        if (screenParam === 'AREA') this.infoTabIndex = 0;
        if (screenParam === 'CRY') this.infoTabIndex = 1;
        if (screenParam === 'SIZE') this.infoTabIndex = 2;
      }
      if (params.get('page') === '2') {
        this.infoSubPage = 'EVOLUTIONS';
      }
      if (params.get('menu') === '1') {
        this.isStartMenuOpen = true;
      }
    }
  }

  public refreshCounts(): void {
    this.counts = this.pokemonService.getCounts();
  }

  public loadPokemonRoster(preserveSelection: boolean = true): void {
    const prevNatId = preserveSelection && this.selectedPokemon ? this.selectedPokemon.nationalId : null;

    this.pokemonList = this.pokemonService.getEmeraldPokemonList(this.dexMode, this.dexOrder);
    this.filteredPokemonList = this.pokemonService.getEmeraldPokemonList(
      this.dexMode,
      this.dexOrder,
      {
        nameQuery: this.searchNameQuery,
        type1: this.selectedType1,
        type2: this.selectedType2,
        color: this.selectedColor
      }
    );

    if (this.filteredPokemonList.length > 0) {
      let nextIdx = 0;
      if (prevNatId !== null) {
        const foundIdx = this.filteredPokemonList.findIndex(p => p.nationalId === prevNatId);
        if (foundIdx >= 0) {
          nextIdx = foundIdx;
        }
      }
      this.setSelectedIndex(nextIdx, false);
    } else {
      this.selectedIndex = 0;
      this.selectedPokemon = null;
    }
  }

  /** Returns the 9 visible rows centered around selectedIndex (-4 to +4) */
  public get visibleRows(): VisibleListRow[] {
    const rows: VisibleListRow[] = [];
    for (let offset = -4; offset <= 4; offset++) {
      const idx = this.selectedIndex + offset;
      const mon =
        idx >= 0 && idx < this.filteredPokemonList.length
          ? this.filteredPokemonList[idx]
          : null;
      rows.push({ offset, index: idx, pokemon: mon });
    }
    return rows;
  }

  public get prevDrumPokemon(): Pokemon | null {
    return this.selectedIndex > 0 ? this.filteredPokemonList[this.selectedIndex - 1] : null;
  }

  public get nextDrumPokemon(): Pokemon | null {
    return this.selectedIndex < this.filteredPokemonList.length - 1
      ? this.filteredPokemonList[this.selectedIndex + 1]
      : null;
  }

  public get scrollbarThumbTopPercent(): number {
    if (this.filteredPokemonList.length <= 1) return 11;
    const ratio = this.selectedIndex / (this.filteredPokemonList.length - 1);
    return 11 + ratio * 69;
  }

  public get listBackgroundAsset(): string {
    if (this.isSearchResultsMode) {
      return 'assets/emerald/bg_list_search.png';
    }
    return this.dexMode === 'HOENN'
      ? 'assets/emerald/bg_list_hoenn.png'
      : 'assets/emerald/bg_list_national.png';
  }

  public get startMenuOptions(): string[] {
    return this.isSearchResultsMode
      ? ['BACK TO LIST', 'LIST TOP', 'LIST BOTTOM', 'BACK TO POKéDEX', 'CLOSE POKéDEX']
      : ['BACK TO LIST', 'LIST TOP', 'LIST BOTTOM', 'CLOSE POKéDEX'];
  }

  public setSelectedIndex(newIndex: number, playSound: boolean = true): void {
    if (this.filteredPokemonList.length === 0) {
      this.selectedPokemon = null;
      return;
    }
    const clamped = Math.max(0, Math.min(this.filteredPokemonList.length - 1, newIndex));
    const delta = clamped - this.selectedIndex;

    if (delta !== 0) {
      this.pokeBallRotationDeg += delta * 22.5;
      this.scrollDirectionClass = delta > 0 ? 'scroll-down' : 'scroll-up';
      setTimeout(() => {
        this.scrollDirectionClass = '';
      }, 90);
    }

    this.selectedIndex = clamped;
    const target = this.filteredPokemonList[this.selectedIndex];
    this.selectedPokemon = target;

    if (playSound && delta !== 0) {
      if (Math.abs(delta) > 1) {
        this.audio.playDexPage();
      } else {
        this.audio.playDexScroll();
      }
    }

    // Enrich from PokeAPI in background without blocking UI
    this.pokemonService.getPokemon(target.nationalId).subscribe(enriched => {
      if (this.selectedPokemon && this.selectedPokemon.nationalId === enriched.nationalId) {
        this.selectedPokemon = {
          ...this.selectedPokemon,
          stats: enriched.stats,
          ability: enriched.ability
        };
      }
    });
  }

  public scrollList(delta: number): void {
    if (this.filteredPokemonList.length === 0) return;
    this.setSelectedIndex(this.selectedIndex + delta, true);
  }

  public onRowClick(row: VisibleListRow): void {
    if (!row.pokemon) return;
    if (row.offset === 0) {
      this.openInfoScreen();
    } else {
      this.setSelectedIndex(row.index, true);
    }
  }

  public onListWheel(event: WheelEvent): void {
    if (this.currentScreen !== 'LIST' || this.isStartMenuOpen) return;
    event.preventDefault();
    const step = event.deltaY > 0 ? 1 : -1;
    this.scrollList(step);
  }

  public selectPokemon(nameOrId: string | number): void {
    const query = String(nameOrId).toLowerCase();
    const idx = this.filteredPokemonList.findIndex(
      p => p.name.toLowerCase() === query || p.slug === query || String(p.nationalId) === query
    );
    if (idx >= 0) {
      this.setSelectedIndex(idx, true);
    }
  }

  // ==========================================================================
  // SCREEN TRANSITIONS (GBA 16-Step Palette Fade Choreography)
  // ==========================================================================
  public switchScreen(target: PokedexScreen, sound: 'PIN' | 'SELECT' | 'CANCEL' | 'LOGIN' | 'OFF' = 'SELECT'): void {
    if (this.currentScreen === target) return;

    switch (sound) {
      case 'PIN':
        this.audio.playPin();
        break;
      case 'CANCEL':
        this.audio.playCancel();
        break;
      case 'LOGIN':
        this.audio.playPcLogin();
        break;
      case 'OFF':
        this.audio.playPcOff();
        break;
      default:
        this.audio.playSelect();
        break;
    }

    this.isScreenFading = true;
    setTimeout(() => {
      this.currentScreen = target;
      if (target === 'INFO') {
        this.infoTabIndex = 0;
      } else if (target === 'CRY') {
        setTimeout(() => this.triggerPokemonCry(), 120);
      }
      this.isScreenFading = false;
    }, 130);
  }

  public openInfoScreen(): void {
    if (!this.selectedPokemon) return;
    if (!this.selectedPokemon.seen) {
      this.audio.playCancel();
      return;
    }
    this.infoSubPage = 'DESCRIPTION';
    this.switchScreen('INFO', 'PIN');
  }

  public onInfoTabClick(tabIndex: number): void {
    this.infoTabIndex = tabIndex;
    this.executeInfoTabAction();
  }

  public executeInfoTabAction(): void {
    switch (this.infoTabIndex) {
      case 0:
        this.switchScreen('AREA', 'SELECT');
        break;
      case 1:
        this.switchScreen('CRY', 'SELECT');
        break;
      case 2:
        this.switchScreen('SIZE', 'SELECT');
        break;
      case 3:
      default:
        this.switchScreen('LIST', 'CANCEL');
        break;
    }
  }

  public toggleInfoSubPage(): void {
    this.infoSubPage = this.infoSubPage === 'DESCRIPTION' ? 'EVOLUTIONS' : 'DESCRIPTION';
    this.audio.playSelect();
  }

  public jumpToEvolution(nationalId: number): void {
    const idx = this.filteredPokemonList.findIndex(p => p.nationalId === nationalId);
    if (idx >= 0) {
      this.setSelectedIndex(idx, false);
      this.audio.playPin();
    } else {
      // Switch to National mode if evolution is outside Hoenn Dex
      this.dexMode = 'NATIONAL';
      this.loadPokemonRoster(false);
      const natIdx = this.filteredPokemonList.findIndex(p => p.nationalId === nationalId);
      if (natIdx >= 0) {
        this.setSelectedIndex(natIdx, false);
      }
      this.audio.playPin();
    }
  }

  // ==========================================================================
  // START MENU DRAWER (BACK TO LIST, LIST TOP, LIST BOTTOM, CLOSE POKéDEX)
  // ==========================================================================
  public toggleStartMenu(): void {
    this.isStartMenuOpen = !this.isStartMenuOpen;
    this.startMenuCursor = 0;
    this.audio.playSelect();
  }

  public selectStartMenuOption(index: number): void {
    this.startMenuCursor = index;
    const option = this.startMenuOptions[index];
    switch (option) {
      case 'BACK TO LIST':
        this.isStartMenuOpen = false;
        this.audio.playSelect();
        break;
      case 'LIST TOP':
        this.setSelectedIndex(0, false);
        this.pokeBallRotationDeg = 0;
        this.isStartMenuOpen = false;
        this.audio.playDexPage();
        break;
      case 'LIST BOTTOM':
        this.setSelectedIndex(this.filteredPokemonList.length - 1, false);
        this.isStartMenuOpen = false;
        this.audio.playDexPage();
        break;
      case 'BACK TO POKéDEX':
        this.isStartMenuOpen = false;
        this.resetSearchFilters();
        break;
      case 'CLOSE POKéDEX':
        this.isStartMenuOpen = false;
        this.audio.playPcOff();
        this.router.navigate(['/']);
        break;
    }
  }

  // ==========================================================================
  // SEARCH & FILTER SCREEN (SELECT BUTTON / QUICK FILTERS)
  // ==========================================================================
  public openSearchScreen(): void {
    this.isStartMenuOpen = false;
    this.searchCursorRow = 0;
    this.switchScreen('SEARCH', 'LOGIN');
  }

  public searchPokemon(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchNameQuery = inputElement.value;
    this.isSearchResultsMode = Boolean(
      this.searchNameQuery.trim() ||
      this.selectedType1 !== 'NONE' ||
      this.selectedType2 !== 'NONE' ||
      this.selectedColor !== 'NONE'
    );
    this.loadPokemonRoster(false);
  }

  public filterByType(type: string): void {
    const normalized = type.toUpperCase();
    if (this.selectedType1 === normalized) {
      this.selectedType1 = 'NONE';
    } else {
      this.selectedType1 = normalized;
    }
    this.isSearchResultsMode = Boolean(
      this.searchNameQuery.trim() ||
      this.selectedType1 !== 'NONE' ||
      this.selectedType2 !== 'NONE' ||
      this.selectedColor !== 'NONE'
    );
    this.audio.playSelect();
    this.loadPokemonRoster(false);
  }

  public cycleSearchField(row: number, dir: 1 | -1): void {
    this.searchCursorRow = row;
    this.audio.playDexScroll();
    switch (row) {
      case 1: { // COLOR
        const idx = this.pokemonColors.indexOf(this.selectedColor);
        const next = (idx + dir + this.pokemonColors.length) % this.pokemonColors.length;
        this.selectedColor = this.pokemonColors[next];
        break;
      }
      case 2: { // TYPE 1
        const idx = this.pokemonTypes.indexOf(this.selectedType1);
        const next = (idx + dir + this.pokemonTypes.length) % this.pokemonTypes.length;
        this.selectedType1 = this.pokemonTypes[next];
        break;
      }
      case 3: { // ORDER
        const idx = this.orderOptions.findIndex(o => o.value === this.dexOrder);
        const next = (idx + dir + this.orderOptions.length) % this.orderOptions.length;
        this.dexOrder = this.orderOptions[next].value;
        break;
      }
      case 4: { // MODE
        this.dexMode = this.dexMode === 'HOENN' ? 'NATIONAL' : 'HOENN';
        break;
      }
    }
    this.loadPokemonRoster(false);
  }

  public cycleType2(dir: 1 | -1): void {
    this.searchCursorRow = 2;
    this.audio.playDexScroll();
    const idx = this.pokemonTypes.indexOf(this.selectedType2);
    const next = (idx + dir + this.pokemonTypes.length) % this.pokemonTypes.length;
    this.selectedType2 = this.pokemonTypes[next];
    this.loadPokemonRoster(false);
  }

  public executeSearchFromMenu(): void {
    this.isSearchResultsMode = Boolean(
      this.searchNameQuery.trim() ||
      this.selectedType1 !== 'NONE' ||
      this.selectedType2 !== 'NONE' ||
      this.selectedColor !== 'NONE'
    );
    this.loadPokemonRoster(false);
    this.switchScreen('LIST', 'LOGIN');
  }

  public resetSearchFilters(): void {
    this.searchNameQuery = '';
    this.selectedType1 = 'NONE';
    this.selectedType2 = 'NONE';
    this.selectedColor = 'NONE';
    this.isSearchResultsMode = false;
    this.audio.playPcOff();
    this.loadPokemonRoster(false);
    if (this.currentScreen === 'SEARCH') {
      this.switchScreen('LIST', 'OFF');
    }
  }

  public toggleDexMode(): void {
    this.dexMode = this.dexMode === 'HOENN' ? 'NATIONAL' : 'HOENN';
    this.audio.playPcLogin();
    this.loadPokemonRoster(false);
  }

  public cycleDexOrder(): void {
    const idx = this.orderOptions.findIndex(o => o.value === this.dexOrder);
    this.dexOrder = this.orderOptions[(idx + 1) % this.orderOptions.length].value;
    this.audio.playSelect();
    this.loadPokemonRoster(false);
  }

  // ==========================================================================
  // SEEN / CAUGHT STATUS TOGGLE & CRY / SIZE HELPERS
  // ==========================================================================
  public toggleCurrentPokemonStatus(): void {
    if (!this.selectedPokemon) return;
    const updated = this.pokemonService.cyclePokemonStatus(this.selectedPokemon.nationalId);
    this.selectedPokemon.seen = updated.seen;
    this.selectedPokemon.caught = updated.caught;
    this.refreshCounts();
    if (updated.caught) {
      this.audio.playCatchChime();
    } else {
      this.audio.playSelect();
    }
  }

  public markAllCaught(): void {
    this.pokemonService.setAllHoennCaught();
    this.refreshCounts();
    this.loadPokemonRoster(true);
    this.audio.playCatchChime();
  }

  public triggerPokemonCry(): void {
    if (!this.selectedPokemon || !this.selectedPokemon.seen) return;
    this.isPlayingCry = true;
    this.audio.playPokemonCry(
      this.selectedPokemon.nationalId,
      this.selectedPokemon.cryUrl,
      (waveform, vuLevel) => {
        this.cryWaveform = waveform;
        this.cryVuLevel = vuLevel;
      },
      () => {
        this.isPlayingCry = false;
        this.cryVuLevel = 0;
      }
    );
  }

  public get vuNeedleRotationDeg(): number {
    // Sweeps from -42 deg (rest) to +38 deg (peak)
    return -42 + (this.cryVuLevel / 100) * 80;
  }

  public get activeMapPoints(): HoennMapPoint[] {
    if (!this.selectedPokemon) return [];
    const pts: HoennMapPoint[] = [];
    for (const areaKey of this.selectedPokemon.areas) {
      const pt = this.pokemonService.hoennMapCoords[areaKey];
      if (pt) pts.push(pt);
    }
    return pts;
  }

  public get sizeScreenPokemonHeightPx(): number {
    if (!this.selectedPokemon) return 48;
    // Scale proportionally relative to Brendan (15 dm = 54px on stage)
    const ratio = Math.sqrt(this.selectedPokemon.heightDm / 15);
    return Math.max(20, Math.min(72, Math.round(52 * ratio)));
  }

  public get sizeScreenTrainerHeightPx(): number {
    if (!this.selectedPokemon) return 52;
    if (this.selectedPokemon.heightDm > 22) {
      const shrink = Math.sqrt(15 / this.selectedPokemon.heightDm);
      return Math.max(24, Math.round(56 * shrink));
    }
    return 54;
  }

  public onSpriteError(event: Event, pokemon: Pokemon): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== pokemon.fallbackSprite) {
      img.src = pokemon.fallbackSprite;
    }
  }

  // ==========================================================================
  // UNIFIED GBA HARDWARE BUTTON & KEYBOARD CONTROLLER
  // ==========================================================================
  public pressDpadUp(): void {
    if (this.isStartMenuOpen) {
      this.startMenuCursor = Math.max(0, this.startMenuCursor - 1);
      this.audio.playSelect();
      return;
    }
    if (this.currentScreen === 'LIST') {
      this.scrollList(-1);
    } else if (this.currentScreen === 'INFO') {
      this.scrollList(-1);
    } else if (this.currentScreen === 'SEARCH') {
      this.searchCursorRow = Math.max(0, this.searchCursorRow - 1);
      this.audio.playSelect();
    }
  }

  public pressDpadDown(): void {
    if (this.isStartMenuOpen) {
      this.startMenuCursor = Math.min(this.startMenuOptions.length - 1, this.startMenuCursor + 1);
      this.audio.playSelect();
      return;
    }
    if (this.currentScreen === 'LIST') {
      this.scrollList(1);
    } else if (this.currentScreen === 'INFO') {
      this.scrollList(1);
    } else if (this.currentScreen === 'SEARCH') {
      this.searchCursorRow = Math.min(5, this.searchCursorRow + 1);
      this.audio.playSelect();
    }
  }

  public pressDpadLeft(): void {
    if (this.isStartMenuOpen) return;
    if (this.currentScreen === 'LIST') {
      this.scrollList(-7);
    } else if (this.currentScreen === 'INFO') {
      this.infoTabIndex = (this.infoTabIndex + 3) % 4;
      this.audio.playSelect();
    } else if (this.currentScreen === 'AREA') {
      this.switchScreen('SIZE', 'SELECT');
    } else if (this.currentScreen === 'CRY') {
      this.switchScreen('AREA', 'SELECT');
    } else if (this.currentScreen === 'SIZE') {
      this.switchScreen('CRY', 'SELECT');
    } else if (this.currentScreen === 'SEARCH') {
      this.cycleSearchField(this.searchCursorRow, -1);
    }
  }

  public pressDpadRight(): void {
    if (this.isStartMenuOpen) return;
    if (this.currentScreen === 'LIST') {
      this.scrollList(7);
    } else if (this.currentScreen === 'INFO') {
      this.infoTabIndex = (this.infoTabIndex + 1) % 4;
      this.audio.playSelect();
    } else if (this.currentScreen === 'AREA') {
      this.switchScreen('CRY', 'SELECT');
    } else if (this.currentScreen === 'CRY') {
      this.switchScreen('SIZE', 'SELECT');
    } else if (this.currentScreen === 'SIZE') {
      this.switchScreen('AREA', 'SELECT');
    } else if (this.currentScreen === 'SEARCH') {
      this.cycleSearchField(this.searchCursorRow, 1);
    }
  }

  public pressButtonA(): void {
    if (this.isStartMenuOpen) {
      this.selectStartMenuOption(this.startMenuCursor);
      return;
    }
    switch (this.currentScreen) {
      case 'LIST':
        this.openInfoScreen();
        break;
      case 'INFO':
        this.executeInfoTabAction();
        break;
      case 'CRY':
        this.triggerPokemonCry();
        break;
      case 'AREA':
      case 'SIZE':
        this.triggerPokemonCry();
        break;
      case 'SEARCH':
        if (this.searchCursorRow === 5) {
          this.executeSearchFromMenu();
        } else {
          this.cycleSearchField(this.searchCursorRow, 1);
        }
        break;
    }
  }

  public pressButtonB(): void {
    if (this.isStartMenuOpen) {
      this.isStartMenuOpen = false;
      this.audio.playCancel();
      return;
    }
    switch (this.currentScreen) {
      case 'LIST':
        if (this.isSearchResultsMode) {
          this.resetSearchFilters();
        } else {
          this.audio.playPcOff();
          this.router.navigate(['/']);
        }
        break;
      case 'INFO':
      case 'SEARCH':
        this.switchScreen('LIST', 'CANCEL');
        break;
      case 'AREA':
      case 'CRY':
      case 'SIZE':
        this.switchScreen('INFO', 'CANCEL');
        break;
    }
  }

  public pressButtonStart(): void {
    if (this.currentScreen === 'SEARCH') {
      this.executeSearchFromMenu();
      return;
    }
    if (this.currentScreen !== 'LIST') {
      this.switchScreen('LIST', 'SELECT');
      return;
    }
    this.toggleStartMenu();
  }

  public pressButtonSelect(): void {
    if (this.currentScreen === 'SEARCH') {
      this.resetSearchFilters();
    } else {
      this.openSearchScreen();
    }
  }

  @HostListener('window:keydown', ['$event'])
  public handleKeydown(event: KeyboardEvent): void {
    const activeTag = (document.activeElement?.tagName || '').toLowerCase();
    if (activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea') {
      if (event.key === 'Escape') {
        (document.activeElement as HTMLElement).blur();
      } else if (event.key === 'Enter' && this.currentScreen === 'SEARCH') {
        (document.activeElement as HTMLElement).blur();
        this.executeSearchFromMenu();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        this.pressDpadUp();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        this.pressDpadDown();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        this.pressDpadLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault();
        this.pressDpadRight();
        break;
      case 'Enter':
      case 'z':
      case 'Z':
        event.preventDefault();
        this.pressButtonA();
        break;
      case 'Escape':
      case 'Backspace':
      case 'x':
      case 'X':
        event.preventDefault();
        this.pressButtonB();
        break;
      case 'Shift':
      case 'm':
      case 'M':
        event.preventDefault();
        this.pressButtonStart();
        break;
      case 'Tab':
      case 'f':
      case 'F':
        event.preventDefault();
        this.pressButtonSelect();
        break;
      case 'l':
      case 'L':
        event.preventDefault();
        this.toggleCurrentPokemonStatus();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        if (this.currentScreen === 'INFO') {
          this.toggleInfoSubPage();
        } else {
          this.toggleDexMode();
        }
        break;
    }
  }
}
