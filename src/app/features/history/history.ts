import { Component, input } from '@angular/core';

export type UfoMotion = 'loop' | 'once';

@Component({
  selector: 'app-history',
  imports: [],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  readonly ufoMotion = input<UfoMotion>('loop');
}
