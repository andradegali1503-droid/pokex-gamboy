import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GbaAudioService } from '../../services/gba-audio.service';

interface HoennStarterPreview {
  hoennNo: string;
  nationalId: number;
  name: string;
  category: string;
  type: string;
  sprite: string;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  public isLoading: boolean = false;
  public dialogueStep: number = 0;
  public selectedStarterIndex: number = 0;

  public readonly starters: HoennStarterPreview[] = [
    {
      hoennNo: 'No001',
      nationalId: 252,
      name: 'TREECKO',
      category: 'WOOD GECKO POKéMON',
      type: 'GRASS',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/252.png'
    },
    {
      hoennNo: 'No004',
      nationalId: 255,
      name: 'TORCHIC',
      category: 'CHICK POKéMON',
      type: 'FIRE',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/255.png'
    },
    {
      hoennNo: 'No007',
      nationalId: 258,
      name: 'MUDKIP',
      category: 'MUD FISH POKéMON',
      type: 'WATER',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/258.png'
    }
  ];

  public readonly dialogues: string[] = [
    'PROF. BIRCH: Welcome to the world of POKéMON! I study POKéMON habitats across the HOENN region.',
    'PROF. BIRCH: This is the HOENN POKéDEX! It automatically records data on all POKéMON you have seen or caught.',
    'PROF. BIRCH: Press START or A to boot your POKéDEX and explore all 202 HOENN & 386 NATIONAL species!'
  ];

  constructor(
    private router: Router,
    public audio: GbaAudioService
  ) {}

  ngOnInit(): void {}

  public get currentStarter(): HoennStarterPreview {
    return this.starters[this.selectedStarterIndex];
  }

  public selectStarter(index: number): void {
    this.selectedStarterIndex = (index + this.starters.length) % this.starters.length;
    const starter = this.currentStarter;
    this.audio.playPokemonCry(
      starter.nationalId,
      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${starter.nationalId}.ogg`
    );
  }

  public nextDialogueOrBoot(): void {
    if (this.dialogueStep < this.dialogues.length - 1) {
      this.dialogueStep++;
      this.audio.playSelect();
    } else {
      this.goToDashboard();
    }
  }

  public goToDashboard(): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.audio.playPcLogin();
    setTimeout(() => {
      this.router.navigate(['/dashboard']).then(() => {
        this.isLoading = false;
      });
    }, 240);
  }

  @HostListener('window:keydown', ['$event'])
  public handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        this.selectStarter(this.selectedStarterIndex - 1);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault();
        this.selectStarter(this.selectedStarterIndex + 1);
        break;
      case 'Enter':
      case ' ':
      case 'z':
      case 'Z':
        event.preventDefault();
        this.goToDashboard();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        this.nextDialogueOrBoot();
        break;
    }
  }
}
