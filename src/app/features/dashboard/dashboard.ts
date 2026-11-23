import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MotionMode } from '../../shared/models/motion-mode.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  readonly skullMotion = input<MotionMode>('loop');
}
