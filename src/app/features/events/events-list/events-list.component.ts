import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Event } from '../../../shared/models/event.model';
import { EventService } from '../../../shared/services/event.service';
import { EventCardComponent } from '../event-card/event-card.component';

/**
 * Landing page: a responsive grid of event cards.
 */
@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [EventCardComponent, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  templateUrl: './events-list.component.html',
})
export class EventsListComponent implements OnInit {
  private readonly eventService = inject(EventService);

  readonly events = signal<Event[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.eventService.getAll().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load events. Is the backend running?');
        this.loading.set(false);
      },
    });
  }
}
