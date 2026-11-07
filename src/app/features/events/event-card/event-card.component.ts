import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Event } from '../../../shared/models/event.model';

/**
 * Reusable card that summarizes a single event.
 */
@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, RouterLink, DatePipe],
  templateUrl: './event-card.component.html',
})
export class EventCardComponent {
  readonly event = input.required<Event>();
}
