import { Component, computed, input } from '@angular/core';

export type BandColor = 'white' | 'yellow';

export interface Band {
  name: string;
  color: BandColor;
}

/** A single rendered row of bands. Each line can hold a different number of bands. */
export type BandLine = readonly Band[];

const DEFAULT_LINES: readonly BandLine[] = [
  [
    { name: 'ALDO LADO A', color: 'white' },
    { name: 'ALLISON', color: 'yellow' },
    { name: 'ANGELINA', color: 'white' },
    { name: 'ANTENA SHOW', color: 'yellow' },
  ],
  [
    { name: 'BATOPILAS', color: 'white' },
    { name: 'CICUTA', color: 'yellow' },
    { name: 'DON', color: 'white' },
    { name: 'EL GRAN SILENCIO', color: 'yellow' },
  ],
  [
    { name: 'FERZY', color: 'white' },
    { name: 'GIULIANA', color: 'yellow' },
    { name: 'JARDIN', color: 'white' },
    { name: 'LEVACANCES', color: 'yellow' },
  ],
  [
    { name: 'LOS BLINKERS', color: 'white' },
    { name: 'LOST ACAPULCO', color: 'yellow' },
    { name: 'MARIACHI AND GUN', color: 'white' },
  ],
  [
    { name: 'MILLONARIO', color: 'yellow' },
    { name: 'MUTANT BEANS', color: 'white' },
    { name: 'ORQUESKA', color: 'yellow' },
  ],
  [
    { name: 'PAN DE MUERTO', color: 'white' },
    { name: 'REBEL CATS', color: 'yellow' },
    { name: 'RESORTE', color: 'white' },
    { name: 'SILENT LUNE', color: 'yellow' },
  ],
  [
    { name: 'SULTAN', color: 'white' },
    { name: 'VALLES', color: 'yellow' },
    { name: 'VICTIMAS DR CEREBRO', color: 'white' },
  ],
];

@Component({
  selector: 'app-line-up',
  imports: [],
  templateUrl: './line-up.html',
  styleUrl: './line-up.scss',
})
export class LineUp {
  /** The lines to render, each with its own number of bands. */
  readonly lines = input<readonly BandLine[]>(DEFAULT_LINES);

  /** How many of the configured lines to render. Defaults to all of them. */
  readonly linesToRender = input<number>();

  /** The lines actually rendered, limited by `linesToRender`. */
  readonly visibleLines = computed<readonly BandLine[]>(() => {
    const lines = this.lines();
    const limit = this.linesToRender();
    if (limit === undefined) {
      return lines;
    }
    return lines.slice(0, Math.max(0, Math.floor(limit)));
  });
}
