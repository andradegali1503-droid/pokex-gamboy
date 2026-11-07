import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PokemonService } from './pokemon.service';

describe('PokemonService', () => {
  let service: PokemonService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(PokemonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return 202 Hoenn Pokemon in Hoenn mode', () => {
    const list = service.getEmeraldPokemonList('HOENN', 'NUMERICAL');
    expect(list.length).toBe(202);
    expect(list[0].name).toBe('TREECKO');
    expect(list[201].name).toBe('DEOXYS');
  });

  it('should return 386 National Pokemon in National mode', () => {
    const list = service.getEmeraldPokemonList('NATIONAL', 'NUMERICAL');
    expect(list.length).toBe(386);
    expect(list[0].name).toBe('BULBASAUR');
    expect(list[385].name).toBe('DEOXYS');
  });
});
