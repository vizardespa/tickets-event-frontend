import { Component, input } from '@angular/core';
import { MotionMode } from '../../shared/models/motion-mode.model';

@Component({
  selector: 'app-history',
  imports: [],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  readonly ufoMotion = input<MotionMode>('loop');
}
